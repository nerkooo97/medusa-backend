import { Badge, Button, FocusModal, Heading, Text } from "@medusajs/ui"
import {
  ArrowPath,
  Check,
  ChevronRight,
  Folder,
  Tag,
} from "@medusajs/icons"
import { useEffect, useState } from "react"
import { ExternalCategoryItem } from "../types"

interface CategoryPickerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  connectionId: string
  medusaCategoryName: string
  onSelectCategory: (externalCategoryId: string, externalCategoryName: string) => void
}

interface Crumb {
  id?: string
  name: string
}

export const CategoryPickerModal = ({
  open,
  onOpenChange,
  connectionId,
  medusaCategoryName,
  onSelectCategory,
}: CategoryPickerModalProps) => {
  const [categories, setCategories] = useState<ExternalCategoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [breadcrumbs, setBreadcrumbs] = useState<Crumb[]>([
    { name: "Sve Kategorije" },
  ])

  const currentParentId = breadcrumbs[breadcrumbs.length - 1]?.id

  useEffect(() => {
    if (!open || !connectionId) return

    setLoading(true)
    const url = currentParentId
      ? `/admin/marketplace/categories?connection_id=${connectionId}&parent_id=${currentParentId}`
      : `/admin/marketplace/categories?connection_id=${connectionId}`

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        setCategories(data.categories || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [open, connectionId, currentParentId])

  const handleDrillDown = (cat: ExternalCategoryItem) => {
    setBreadcrumbs((prev) => [...prev, { id: cat.id, name: cat.name }])
  }

  const handleCrumbClick = (index: number) => {
    setBreadcrumbs((prev) => prev.slice(0, index + 1))
  }

  const handlePickLeaf = (cat: ExternalCategoryItem) => {
    const pathParts = breadcrumbs.slice(1).map((b) => b.name)
    const fullPath = [...pathParts, cat.name].join(" > ")
    onSelectCategory(cat.id, fullPath)
    onOpenChange(false)
  }

  return (
    <FocusModal open={open} onOpenChange={onOpenChange}>
      <FocusModal.Content>
        <FocusModal.Header>
          <div className="flex items-center justify-between w-full px-6">
            <div>
              <Heading level="h2">Odabir Kategorije na Oglasniku</Heading>
              <Text className="text-xs text-ui-fg-subtle">
                Za Medusa kategoriju: <span className="font-semibold text-ui-fg-base">{medusaCategoryName}</span>
              </Text>
            </div>
            <Button variant="secondary" size="small" onClick={() => onOpenChange(false)}>
              Zatvori
            </Button>
          </div>
        </FocusModal.Header>

        <FocusModal.Body className="overflow-y-auto p-6 max-w-3xl w-full mx-auto space-y-4">
          {/* Breadcrumbs traka */}
          <div className="flex items-center gap-2 flex-wrap p-3 rounded-lg bg-ui-bg-subtle/60 border border-ui-border-base text-xs">
            {breadcrumbs.map((crumb, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleCrumbClick(idx)}
                  className={`hover:underline font-medium ${
                    idx === breadcrumbs.length - 1
                      ? "text-ui-fg-interactive font-semibold"
                      : "text-ui-fg-muted"
                  }`}
                >
                  {crumb.name}
                </button>
                {idx < breadcrumbs.length - 1 && (
                  <ChevronRight className="text-ui-fg-muted w-3.5 h-3.5" />
                )}
              </div>
            ))}
          </div>

          <Text className="text-xs text-ui-fg-subtle">
            Napomena: Oglasi na OLX.ba se mogu objavljivati isključivo u <strong>završnim (leaf)</strong> kategorijama.
            Kliknite na mapu da otvorite podkategorije dok ne dođete do završne kategorije.
          </Text>

          {/* Lista kategorija */}
          {loading ? (
            <div className="p-12 text-center text-ui-fg-subtle flex flex-col items-center justify-center">
              <ArrowPath className="animate-spin mb-2 text-ui-fg-muted" />
              <Text>Učitavanje kategorija sa oglasnika...</Text>
            </div>
          ) : categories.length === 0 ? (
            <div className="p-8 text-center text-ui-fg-subtle border rounded-lg bg-ui-bg-subtle/30">
              <Text>Nema podkategorija na ovom nivou.</Text>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="p-3 rounded-lg border border-ui-border-base bg-ui-bg-base hover:border-ui-border-interactive transition-colors flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {cat.hasChildren ? (
                      <Folder className="text-ui-fg-muted shrink-0" />
                    ) : (
                      <Tag className="text-ui-fg-interactive shrink-0" />
                    )}
                    <div className="truncate">
                      <span className="font-medium text-sm text-ui-fg-base block truncate">
                        {cat.name}
                      </span>
                      <span className="text-xs text-ui-fg-subtle block">ID: #{cat.id}</span>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {cat.hasChildren ? (
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={() => handleDrillDown(cat)}
                      >
                        Otvori <ChevronRight className="ml-1" />
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        size="small"
                        onClick={() => handlePickLeaf(cat)}
                      >
                        Odaberi <Check className="ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </FocusModal.Body>
      </FocusModal.Content>
    </FocusModal>
  )
}
