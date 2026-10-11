import { Badge, Button, Container, Heading, Input, Select, Table, Text, toast } from "@medusajs/ui"
import { Adjustments, ArrowPath, ArrowRight, Check, SquareTwoStack, Tag } from "@medusajs/icons"
import { useEffect, useState } from "react"
import { CategoryPickerModal } from "../modals/category-picker-modal"
import { SourceKeySelector } from "../mappings/source-key-selector"
import {
  ExternalAttributeItem,
  ExternalCategoryItem,
  MarketplaceCategoryMappingData,
  MarketplaceConnectionData,
  MarketplaceFieldMappingData,
} from "../types"

interface MappingsTabProps {
  connections: MarketplaceConnectionData[]
}

export const MappingsTab = ({ connections }: MappingsTabProps) => {
  const [selectedConnectionId, setSelectedConnectionId] = useState<string>(
    connections[0]?.id || ""
  )
  const [medusaCategories, setMedusaCategories] = useState<any[]>([])
  const [externalCategories, setExternalCategories] = useState<ExternalCategoryItem[]>([])
  const [categoryMappings, setCategoryMappings] = useState<MarketplaceCategoryMappingData[]>([])
  const [loading, setLoading] = useState(false)

  // Odabrano mapiranje za pregled atributa
  const [activeCategoryMapping, setActiveCategoryMapping] =
    useState<MarketplaceCategoryMappingData | null>(null)
  const [categoryAttributes, setCategoryAttributes] = useState<ExternalAttributeItem[]>([])
  const [fieldMappings, setFieldMappings] = useState<Record<string, Partial<MarketplaceFieldMappingData>>>({})
  const [savingField, setSavingField] = useState<string | null>(null)
  const [pickingForCategory, setPickingForCategory] = useState<any | null>(null)
  const [productOptions, setProductOptions] = useState<string[]>([])
  const [sampleMetadataKeys, setSampleMetadataKeys] = useState<string[]>([])

  // Učitaj Medusa kategorije i uzorak proizvoda za polja
  useEffect(() => {
    fetch("/admin/product-categories?limit=100")
      .then((res) => res.json())
      .then((data) => setMedusaCategories(data.product_categories || []))
      .catch(() => {})

    fetch("/admin/products?limit=25")
      .then((res) => res.json())
      .then((data) => {
        const prods = data.products || []
        const optionsSet = new Set<string>()
        const metaSet = new Set<string>()
        for (const p of prods) {
          if (Array.isArray(p.options)) {
            for (const o of p.options) {
              if (o.title) optionsSet.add(o.title)
            }
          }
          if (p.metadata && typeof p.metadata === "object") {
            for (const k of Object.keys(p.metadata)) {
              metaSet.add(k)
            }
          }
        }
        setProductOptions(Array.from(optionsSet))
        setSampleMetadataKeys(Array.from(metaSet))
      })
      .catch(() => {})
  }, [])

  // Učitaj mapiranja i eksterne kategorije kada se promijeni konekcija
  useEffect(() => {
    if (!selectedConnectionId) return
    setLoading(true)

    Promise.all([
      fetch(`/admin/marketplace/mappings/categories?connection_id=${selectedConnectionId}`).then((r) =>
        r.json()
      ),
      fetch(`/admin/marketplace/categories?connection_id=${selectedConnectionId}`).then((r) =>
        r.json()
      ),
    ])
      .then(([mappingsData, categoriesData]) => {
        setCategoryMappings(mappingsData.mappings || [])
        setExternalCategories(categoriesData.categories || [])
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false))
  }, [selectedConnectionId])

  // Učitaj atribute kada se odabere kategorija
  const handleSelectCategoryForAttributes = async (mapping: MarketplaceCategoryMappingData) => {
    setActiveCategoryMapping(mapping)
    try {
      const [attrRes, fieldRes] = await Promise.all([
        fetch(
          `/admin/marketplace/categories/${mapping.external_category_id}/attributes?connection_id=${selectedConnectionId}`
        ).then((r) => r.json()),
        fetch(
          `/admin/marketplace/mappings/fields?connection_id=${selectedConnectionId}&external_category_id=${mapping.external_category_id}`
        ).then((r) => r.json()),
      ])

      const attrs: ExternalAttributeItem[] = attrRes.attributes || []
      setCategoryAttributes(attrs)

      const mapObj: Record<string, Partial<MarketplaceFieldMappingData>> = {}
      for (const m of fieldRes.mappings || []) {
        mapObj[m.external_attribute_id] = m
      }
      setFieldMappings(mapObj)
    } catch (err: any) {
      toast.error(`Greška pri učitavanju atributa: ${err.message}`)
    }
  }

  const handleSaveCategoryMapping = async (
    medusaCatId: string,
    extCatId: string,
    extCatName: string
  ) => {
    try {
      const res = await fetch("/admin/marketplace/mappings/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connection_id: selectedConnectionId,
          medusa_category_id: medusaCatId,
          external_category_id: extCatId,
          external_category_name: extCatName,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success("Mapiranje kategorije je uspješno spremljeno.")
        // Osvježi listu mapiranja
        const updated = categoryMappings.filter((m) => m.medusa_category_id !== medusaCatId)
        setCategoryMappings([...updated, data.mapping])
        if (data.mapping) {
          handleSelectCategoryForAttributes(data.mapping)
        }
      } else {
        toast.error(data.message || "Greška pri spremanju.")
      }
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const handleSaveFieldMapping = async (attr: ExternalAttributeItem) => {
    const fieldData = fieldMappings[attr.id]
    if (!fieldData?.source_key) {
      toast.error("Unesite izvorno polje ili vrijednost.")
      return
    }

    setSavingField(attr.id)
    try {
      const res = await fetch("/admin/marketplace/mappings/fields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connection_id: selectedConnectionId,
          external_category_id: activeCategoryMapping?.external_category_id,
          external_attribute_id: attr.id,
          external_attribute_name: attr.displayName,
          source_type: fieldData.source_type || "metadata",
          source_key: fieldData.source_key,
          default_value: fieldData.default_value || null,
        }),
      })
      if (res.ok) {
        toast.success(`Atribut '${attr.displayName}' je uspješno mapiran.`)
      } else {
        toast.error("Greška pri spremanju mapiranja atributa.")
      }
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSavingField(null)
    }
  }

  if (connections.length === 0) {
    return (
      <Container className="p-8 sm:p-12 text-center flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-ui-bg-subtle-pressed flex items-center justify-center mb-4 text-ui-fg-subtle">
          <SquareTwoStack />
        </div>
        <Heading level="h2" className="text-base font-semibold text-ui-fg-base mb-1">
          Nema dostupnih marketplace naloga
        </Heading>
        <Text className="text-sm text-ui-fg-subtle max-w-md mx-auto">
          Prvo dodajte marketplace nalog u tabu 'Povezani Nalozi' kako biste mogli konfigurisati mapiranje kategorija i atributa.
        </Text>
      </Container>
    )
  }

  return (
    <div className="space-y-6 w-full">
      {/* Izbor konekcije */}
      <Container className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Adjustments className="text-ui-fg-muted" />
          <Text className="font-medium text-sm">Aktivni Marketplace Nalog:</Text>
        </div>
        <div className="w-full sm:w-72">
          <Select
            value={selectedConnectionId}
            onValueChange={(val) => {
              setSelectedConnectionId(val)
              setActiveCategoryMapping(null)
            }}
          >
            <Select.Trigger>
              <Select.Value />
            </Select.Trigger>
            <Select.Content>
              {connections.map((c) => (
                <Select.Item key={c.id} value={c.id}>
                  {c.name} ({c.provider_id.toUpperCase()})
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
        </div>
      </Container>

      {/* Tabela mapiranja kategorija */}
      <Container className="p-0 overflow-hidden shadow-sm w-full">
        <div className="p-4 border-b border-ui-border-base flex items-center justify-between">
          <div>
            <Text className="font-semibold text-sm flex items-center gap-2">
              <SquareTwoStack className="text-ui-fg-muted" />
              1. Mapiranje Medusa Kategorija na Marketplace Kategorije
            </Text>
            <Text className="text-xs text-ui-fg-subtle">
              Povežite vaše webshop kategorije sa odgovarajućim kategorijama na odabranom oglasniku.
            </Text>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-ui-fg-subtle">
            <ArrowPath className="animate-spin mx-auto mb-2 text-ui-fg-muted" />
            <Text>Učitavanje kategorija...</Text>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Medusa Kategorija</Table.HeaderCell>
                <Table.HeaderCell>Povezana Kategorija na Marketplace-u</Table.HeaderCell>
                <Table.HeaderCell className="text-right">Akcije</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {medusaCategories.map((mCat) => {
                const currentMapping = categoryMappings.find(
                  (m) => m.medusa_category_id === mCat.id
                )
                const isSelectedForAttrs = activeCategoryMapping?.medusa_category_id === mCat.id

                return (
                  <Table.Row
                    key={mCat.id}
                    className={isSelectedForAttrs ? "bg-ui-bg-highlight/40" : ""}
                  >
                    <Table.Cell className="font-medium text-ui-fg-base">
                      {mCat.name}
                    </Table.Cell>
                    <Table.Cell>
                      {currentMapping ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge color="green" size="small">
                            #{currentMapping.external_category_id}
                          </Badge>
                          <span className="text-sm font-medium text-ui-fg-base">
                            {currentMapping.external_category_name || `Kategorija #${currentMapping.external_category_id}`}
                          </span>
                          <Button
                            variant="transparent"
                            size="small"
                            className="text-xs text-ui-fg-interactive underline p-0 ml-1 h-auto"
                            onClick={() => setPickingForCategory(mCat)}
                          >
                            Promijeni
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="secondary"
                          size="small"
                          onClick={() => setPickingForCategory(mCat)}
                        >
                          <Tag className="mr-1" /> Odaberi OLX Kategoriju
                        </Button>
                      )}
                    </Table.Cell>
                    <Table.Cell className="text-right">
                      {currentMapping && (
                        <Button
                          variant={isSelectedForAttrs ? "primary" : "secondary"}
                          size="small"
                          onClick={() => handleSelectCategoryForAttributes(currentMapping)}
                        >
                          Podesi Atribute & Polja <ArrowRight className="ml-1" />
                        </Button>
                      )}
                    </Table.Cell>
                  </Table.Row>
                )
              })}
            </Table.Body>
          </Table>
        </div>
        )}
      </Container>

      {/* Tabela dinamičkih atributa za odabranu kategoriju */}
      {activeCategoryMapping && (
        <Container className="p-0 overflow-hidden shadow-sm w-full">
          <div className="p-4 border-b border-ui-border-base flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <Text className="font-semibold text-sm flex items-center gap-2">
                <Adjustments className="text-ui-fg-interactive" />
                2. Dinamički Atributi za: {activeCategoryMapping.external_category_name} (ID:{" "}
                {activeCategoryMapping.external_category_id})
              </Text>
              <Text className="text-xs text-ui-fg-subtle">
                Povežite specifična polja koja traži oglasnik sa Medusa poljima ili unosite fiksne
                vrijednosti.
              </Text>
            </div>
            <Badge color="orange">OLX Dinamički Atributi</Badge>
          </div>

          <div className="overflow-x-auto w-full">
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Naziv Atributa na Oglasniku</Table.HeaderCell>
                  <Table.HeaderCell>Tip & Obaveznost</Table.HeaderCell>
                  <Table.HeaderCell>Izvor Podatka u Medusi</Table.HeaderCell>
                  <Table.HeaderCell>Ključ Polja / Fiksna Vrijednost</Table.HeaderCell>
                  <Table.HeaderCell className="text-right">Snimi</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {categoryAttributes.map((attr) => {
                  const currentField = fieldMappings[attr.id] || {}

                  return (
                    <Table.Row key={attr.id}>
                      <Table.Cell className="font-medium text-ui-fg-base">
                        {attr.displayName}
                        <Text className="text-xs text-ui-fg-subtle">ID: {attr.id}</Text>
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex items-center gap-1.5">
                          <Badge color="grey" className="text-xs">
                            {attr.inputType}
                          </Badge>
                          {attr.required ? (
                            <Badge color="red" className="text-xs">
                              Obavezno
                            </Badge>
                          ) : (
                            <Badge color="grey" className="text-xs">
                              Opcionalno
                            </Badge>
                          )}
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <div className="w-44">
                          <Select
                            value={currentField.source_type || "metadata"}
                            onValueChange={(val: any) => {
                              setFieldMappings((prev) => ({
                                ...prev,
                                [attr.id]: {
                                  ...prev[attr.id],
                                  source_type: val,
                                  source_key: "",
                                },
                              }))
                            }}
                          >
                            <Select.Trigger>
                              <Select.Value />
                            </Select.Trigger>
                            <Select.Content>
                              <Select.Item value="metadata">Metadata Proizvoda</Select.Item>
                              <Select.Item value="product_field">Polje Proizvoda</Select.Item>
                              <Select.Item value="variant_field">Polje Varijante</Select.Item>
                              <Select.Item value="fixed_value">Fiksna Vrijednost</Select.Item>
                            </Select.Content>
                          </Select>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <div className="w-full sm:w-72">
                          <SourceKeySelector
                            sourceType={currentField.source_type || "metadata"}
                            sourceKey={currentField.source_key || ""}
                            onSourceKeyChange={(val) => {
                              setFieldMappings((prev) => ({
                                ...prev,
                                [attr.id]: {
                                  ...prev[attr.id],
                                  source_key: val,
                                },
                              }))
                            }}
                            attribute={attr}
                            productOptions={productOptions}
                            metadataKeys={sampleMetadataKeys}
                          />
                        </div>
                      </Table.Cell>
                      <Table.Cell className="text-right">
                        <Button
                          variant="secondary"
                          size="small"
                          isLoading={savingField === attr.id}
                          onClick={() => handleSaveFieldMapping(attr)}
                        >
                          <Check className="mr-1" /> Snimi
                        </Button>
                      </Table.Cell>
                    </Table.Row>
                  )
                })}
              </Table.Body>
            </Table>
          </div>
        </Container>
      )}

      {pickingForCategory && (
        <CategoryPickerModal
          open={!!pickingForCategory}
          onOpenChange={(isOpen) => {
            if (!isOpen) setPickingForCategory(null)
          }}
          connectionId={selectedConnectionId}
          medusaCategoryName={pickingForCategory.name}
          onSelectCategory={(extId, extName) => {
            handleSaveCategoryMapping(pickingForCategory.id, extId, extName)
            setPickingForCategory(null)
          }}
        />
      )}
    </div>
  )
}

