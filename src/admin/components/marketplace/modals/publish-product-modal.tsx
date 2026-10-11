import {
  Button,
  FocusModal,
  Heading,
  Input,
  Label,
  Select,
  Text,
  toast,
} from "@medusajs/ui"
import { FlyingBox } from "@medusajs/icons"
import { useEffect, useState } from "react"
import { MarketplaceConnectionData } from "../types"

interface PublishProductModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  connections: MarketplaceConnectionData[]
  onSuccess: () => void
}

export const PublishProductModal = ({
  open,
  onOpenChange,
  connections,
  onSuccess,
}: PublishProductModalProps) => {
  const [products, setProducts] = useState<any[]>([])
  const [selectedProductId, setSelectedProductId] = useState<string>("")
  const [selectedConnectionId, setSelectedConnectionId] = useState<string>(
    connections[0]?.id || ""
  )
  const [priceOverride, setPriceOverride] = useState<string>("")
  const [publishing, setPublishing] = useState(false)

  const selectedConnection = connections.find((c) => c.id === selectedConnectionId)

  useEffect(() => {
    if (open && selectedConnectionId) {
      const conn = connections.find((c) => c.id === selectedConnectionId)
      const url = conn?.sales_channel_id
        ? `/admin/products?sales_channel_id[]=${conn.sales_channel_id}&limit=100`
        : `/admin/products?limit=100`

      fetch(url)
        .then((r) => r.json())
        .then((data) => {
          const prods = data.products || []
          setProducts(prods)
          if (prods[0]) setSelectedProductId(prods[0].id)
          else setSelectedProductId("")
        })
        .catch(() => {})
    }
  }, [open, selectedConnectionId, connections])

  const selectedProduct = products.find((p) => p.id === selectedProductId)

  const handlePublish = async () => {
    if (!selectedProductId || !selectedConnectionId) {
      toast.error("Odaberite proizvod i marketplace nalog.")
      return
    }

    setPublishing(true)
    try {
      const res = await fetch("/admin/marketplace/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connection_id: selectedConnectionId,
          product_id: selectedProductId,
          override_price: priceOverride ? parseFloat(priceOverride) : undefined,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        toast.success(
          `Proizvod '${selectedProduct?.title}' je uspješno objavljen na oglasnik (ID: #${data.listing?.external_id})!`
        )
        onOpenChange(false)
        onSuccess()
      } else {
        toast.error(data.message || "Greška pri objavi proizvoda.")
      }
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setPublishing(false)
    }
  }

  return (
    <FocusModal open={open} onOpenChange={onOpenChange}>
      <FocusModal.Content>
        <FocusModal.Header>
          <div className="flex items-center justify-between w-full px-6">
            <Heading level="h2">Objavi Proizvod na Marketplace</Heading>
            <Button
              variant="primary"
              size="small"
              disabled={products.length === 0 || !selectedProductId}
              isLoading={publishing}
              onClick={handlePublish}
            >
              <FlyingBox className="mr-1" /> Objavi Odmah
            </Button>
          </div>
        </FocusModal.Header>

        <FocusModal.Body className="overflow-y-auto p-8 max-w-xl w-full mx-auto space-y-6">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Marketplace Nalog</Label>
            <Select value={selectedConnectionId} onValueChange={setSelectedConnectionId}>
              <Select.Trigger>
                <Select.Value placeholder="-- Odaberite nalog --" />
              </Select.Trigger>
              <Select.Content>
                {connections.map((c) => (
                  <Select.Item key={c.id} value={c.id}>
                    {c.name} ({c.provider_id.toUpperCase()}) — Kanal: {c.sales_channel_name || c.sales_channel_id}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select>
            <Text className="text-xs text-ui-fg-subtle">
              Prikazuju se isključivo artikli dodijeljeni prodajnom kanalu ovog naloga.
            </Text>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">
              Odaberite Proizvod iz Prodajnog Kanala ({selectedConnection?.sales_channel_name || selectedConnection?.sales_channel_id || "Kanal"})
            </Label>
            {products.length === 0 ? (
              <div className="p-3 border rounded-lg bg-ui-bg-subtle/50 text-xs text-ui-fg-error">
                U prodajnom kanalu ovog naloga trenutno nema dodijeljenih proizvoda. Dodijelite proizvode ovom kanalu u sekciji 'Proizvodi'.
              </div>
            ) : (
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <Select.Trigger>
                  <Select.Value placeholder="-- Odaberite proizvod --" />
                </Select.Trigger>
                <Select.Content>
                  {products.map((p) => (
                    <Select.Item key={p.id} value={p.id}>
                      {p.title} {p.variants?.[0]?.sku ? `(SKU: ${p.variants[0].sku})` : ""}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">
              Cijena na Oglasniku (KM) <span className="text-xs text-ui-fg-subtle">(Opcionalno)</span>
            </Label>
            <Input
              type="number"
              placeholder="Ostavite prazno za standardnu cijenu iz cjenovnika"
              value={priceOverride}
              onChange={(e) => setPriceOverride(e.target.value)}
            />
          </div>

          {selectedProduct && (
            <div className="border rounded-lg p-4 bg-ui-bg-subtle/40 space-y-2">
              <Text className="text-xs font-semibold text-ui-fg-muted uppercase tracking-wider">
                Pregled Proizvoda
              </Text>
              <div className="flex items-center gap-3">
                {selectedProduct.thumbnail ? (
                  <img
                    src={selectedProduct.thumbnail}
                    alt=""
                    className="w-12 h-12 object-cover rounded border"
                  />
                ) : (
                  <div className="w-12 h-12 rounded bg-ui-bg-base border flex items-center justify-center text-xs text-ui-fg-muted">
                    No img
                  </div>
                )}
                <div>
                  <Text className="font-medium text-sm text-ui-fg-base">{selectedProduct.title}</Text>
                  <Text className="text-xs text-ui-fg-subtle">
                    Kategorije:{" "}
                    {selectedProduct.categories?.map((c: any) => c.name).join(", ") || "Nema"}
                  </Text>
                </div>
              </div>
            </div>
          )}
        </FocusModal.Body>
      </FocusModal.Content>
    </FocusModal>
  )
}
