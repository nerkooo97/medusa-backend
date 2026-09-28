import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { DetailWidgetProps, AdminProductCategory } from "@medusajs/framework/types"
import { Container, Heading, Text, Input, Button, Badge, toast } from "@medusajs/ui"
import { useState, useMemo } from "react"
import * as Icons from "lucide-react"

import { getAllCategoryIconsMap } from "../../config/shops"

// Helper to strictly validate if a string is an exact Lucide icon name
const isExactLucideIcon = (name: string): boolean => {
  if (!name || typeof name !== "string") return false
  const trimmed = name.trim()
  if (trimmed.length < 2) return false
  const candidate = (Icons as Record<string, unknown>)[trimmed]
  // Must be a valid React icon component exported by lucide-react
  return (
    typeof candidate === "function" ||
    (typeof candidate === "object" && candidate !== null && "$$typeof" in candidate)
  )
}

const CategoryIconWidget = ({
  data: category,
}: DetailWidgetProps<AdminProductCategory>) => {
  const initialIcon = (category.metadata?.icon as string) || ""
  const [iconInput, setIconInput] = useState(initialIcon)
  const [isSaving, setIsSaving] = useState(false)

  const trimmed = iconInput.trim()
  const isValid = useMemo(() => isExactLucideIcon(trimmed), [trimmed])

  // Get exact Icon component if valid
  const IconComponent = useMemo(() => {
    if (!isValid) return null
    return (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[trimmed]
  }, [isValid, trimmed])

  const handleSave = async () => {
    if (!isValid) {
      toast.error("Nevažeći naziv ikonice", {
        description: "Morate unijeti tačan naziv iz biblioteke lucide-react (npr. Wrench, Hammer, Scissors).",
      })
      return
    }

    setIsSaving(true)
    try {
      const res = await fetch(`/admin/product-categories/${category.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          metadata: {
            ...(category.metadata || {}),
            icon: trimmed,
          },
        }),
      })

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`Greška ${res.status}: ${errorText || "Neuspješno spremanje"}`)
      }

      toast.success("Ikonica sačuvana!", {
        description: `Kategorija '${category.name}' sada ima ikonicu '${trimmed}'.`,
      })
    } catch (err: any) {
      toast.error("Greška pri spremanju", {
        description: err.message || "Došlo je do greške.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleRemove = async () => {
    setIsSaving(true)
    try {
      const currentMeta = { ...(category.metadata || {}) }
      delete currentMeta.icon

      const res = await fetch(`/admin/product-categories/${category.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          metadata: currentMeta,
        }),
      })

      if (!res.ok) throw new Error("Neuspješno brisanje ikonice")

      setIconInput("")
      toast.success("Ikonica uklonjena", {
        description: "Kategorija više nema definisanu ikonicu.",
      })
    } catch (err: any) {
      toast.error("Greška", { description: err.message })
    } finally {
      setIsSaving(false)
    }
  }

  // Preporučeni primjeri iz centralne konfiguracije shopova
  const examples = useMemo(() => {
    const configuredIcons = Object.values(getAllCategoryIconsMap())
    return Array.from(new Set(configuredIcons)).slice(0, 12)
  }, [])

  return (
    <Container className="p-6 divide-y divide-neutral-100">
      <div className="pb-5">
        <div className="flex items-center justify-between">
          <div>
            <Heading level="h2" className="text-base font-semibold text-neutral-900">
              Ikonica Kategorije (lucide-react)
            </Heading>
            <Text className="text-xs text-neutral-500 mt-1">
              Unesite tačan naziv ikonice iz biblioteke <span className="font-semibold text-neutral-800">lucide-react</span> (npr. <code className="bg-neutral-100 px-1 py-0.5 rounded text-neutral-700">Wrench</code>, <code className="bg-neutral-100 px-1 py-0.5 rounded text-neutral-700">Hammer</code>, <code className="bg-neutral-100 px-1 py-0.5 rounded text-neutral-700">Sparkles</code>).
            </Text>
          </div>

          {/* Live Icon Preview Box */}
          <div className="flex flex-col items-center justify-center p-3 rounded-xl border border-neutral-200 bg-neutral-50/70 min-w-16 min-h-16 text-neutral-800">
            {IconComponent ? (
              <IconComponent className="size-8 text-blue-600 stroke-[2]" />
            ) : (
              <Icons.HelpCircle className="size-8 text-neutral-300 stroke-[1.5]" />
            )}
            <span className="text-[10px] text-neutral-400 mt-1 font-mono">
              {isValid ? trimmed : "Nema"}
            </span>
          </div>
        </div>

        {/* Input & Action Form */}
        <div className="mt-5 space-y-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-neutral-700">
              Tačan naziv Lucide ikonice:
            </label>
            <div className="flex items-center gap-2">
              <Input
                placeholder="npr. Wrench, Hammer, Drill..."
                value={iconInput}
                onChange={(e) => setIconInput(e.target.value)}
                className={`font-mono text-sm ${
                  trimmed.length > 0 && !isValid
                    ? "!border-rose-400 !focus:border-rose-500"
                    : trimmed.length > 0 && isValid
                    ? "!border-emerald-500"
                    : ""
                }`}
              />
              <Button
                variant="primary"
                onClick={handleSave}
                isLoading={isSaving}
                disabled={!isValid || isSaving}
                className="shrink-0"
              >
                Sačuvaj ikonicu
              </Button>
              {Boolean(category.metadata?.icon) && (
                <Button
                  variant="danger"
                  onClick={handleRemove}
                  isLoading={isSaving}
                  disabled={isSaving}
                  className="shrink-0"
                >
                  Ukloni
                </Button>
              )}
            </div>
          </div>

          {/* Validation Feedback status */}
          <div className="flex items-center gap-2 text-xs">
            {trimmed.length === 0 ? (
              <Text className="text-neutral-400 text-xs">
                Polje je prazno. Unesite naziv ikonice da biste je pregledali i sačuvali.
              </Text>
            ) : isValid ? (
              <Badge color="green" size="small" className="font-medium">
                ✓ Validna Lucide ikonica: {trimmed}
              </Badge>
            ) : (
              <Badge color="red" size="small" className="font-medium">
                ✕ Netačan naziv. Tačan naziv mora odgovarati postojećoj Lucide ikonici (pazite na velika/mala slova).
              </Badge>
            )}
          </div>

          {/* Quick link & suggestions */}
          <div className="pt-2 text-xs text-neutral-500 flex flex-wrap items-center gap-1.5">
            <span>Brzi primjeri (kliknite za unos):</span>
            {examples.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => setIconInput(ex)}
                className="px-2 py-0.5 rounded border border-neutral-200 bg-white hover:bg-neutral-100 text-neutral-700 font-mono text-[11px] transition-colors"
              >
                {ex}
              </button>
            ))}
            <a
              href="https://lucide.dev/icons"
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 underline ml-2 font-medium hover:text-blue-700"
            >
              Pregled svih 1400+ ikonica &rarr;
            </a>
          </div>
        </div>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product_category.details.after",
})

export default CategoryIconWidget
