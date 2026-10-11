import { Input, Select } from "@medusajs/ui"
import { ExternalAttributeItem } from "../types"
import { useState, useEffect } from "react"

interface SourceKeySelectorProps {
  sourceType: string
  sourceKey: string
  onSourceKeyChange: (val: string) => void
  attribute: ExternalAttributeItem
  productOptions: string[]
  metadataKeys: string[]
}

const STANDARD_PRODUCT_FIELDS = [
  { value: "title", label: "Naziv proizvoda (title)" },
  { value: "subtitle", label: "Podnaslov (subtitle)" },
  { value: "description", label: "Opis proizvoda (description)" },
  { value: "material", label: "Materijal (material)" },
  { value: "weight", label: "Težina (weight)" },
  { value: "origin_country", label: "Zemlja porijekla (origin_country)" },
  { value: "handle", label: "URL Handle (handle)" },
  { value: "hs_code", label: "Carinski HS kod (hs_code)" },
  { value: "mid_code", label: "MID kod (mid_code)" },
]

const STANDARD_VARIANT_FIELDS = [
  { value: "title", label: "Naziv varijante (title)" },
  { value: "sku", label: "SKU šifra (sku)" },
  { value: "barcode", label: "Barkod / EAN (barcode)" },
  { value: "material", label: "Materijal varijante (material)" },
  { value: "weight", label: "Težina varijante (weight)" },
]

const STANDARD_METADATA_KEYS = [
  { value: "brand", label: "Brend / Proizvođač (brand)" },
  { value: "color", label: "Boja (color)" },
  { value: "size", label: "Veličina (size)" },
  { value: "gender", label: "Spol / Pol (gender)" },
  { value: "condition", label: "Stanje (condition)" },
  { value: "season", label: "Sezona (season)" },
  { value: "material", label: "Materijal (material)" },
]

export const SourceKeySelector = ({
  sourceType,
  sourceKey,
  onSourceKeyChange,
  attribute,
  productOptions,
  metadataKeys,
}: SourceKeySelectorProps) => {
  const [isCustomMode, setIsCustomMode] = useState(false)

  // Provjeri da li je trenutna vrijednost custom (nije u standardnim opcijama)
  useEffect(() => {
    if (!sourceKey) {
      setIsCustomMode(false)
      return
    }

    if (sourceType === "product_field") {
      const exists = STANDARD_PRODUCT_FIELDS.some((f) => f.value === sourceKey)
      setIsCustomMode(!exists)
    } else if (sourceType === "variant_field") {
      const isStd = STANDARD_VARIANT_FIELDS.some((f) => f.value === sourceKey)
      const isOpt = sourceKey.startsWith("options.")
      setIsCustomMode(!isStd && !isOpt)
    } else if (sourceType === "metadata") {
      const cleanKey = sourceKey.replace(/^metadata\./, "")
      const isStd = STANDARD_METADATA_KEYS.some((m) => m.value === cleanKey)
      const isKnown = metadataKeys.includes(cleanKey)
      setIsCustomMode(!isStd && !isKnown)
    } else if (sourceType === "fixed_value") {
      const hasOptions = Array.isArray(attribute.options) && attribute.options.length > 0
      if (hasOptions) {
        const inOptions = attribute.options!.includes(sourceKey)
        setIsCustomMode(!inOptions)
      } else {
        setIsCustomMode(true)
      }
    }
  }, [sourceType, sourceKey, attribute.options, metadataKeys])

  // 1. Fiksna vrijednost
  if (sourceType === "fixed_value") {
    const hasOptions = Array.isArray(attribute.options) && attribute.options.length > 0

    if (hasOptions && !isCustomMode) {
      return (
        <div className="flex flex-col gap-1 w-full">
          <Select
            value={sourceKey}
            onValueChange={(val) => {
              if (val === "__custom__") {
                setIsCustomMode(true)
              } else {
                onSourceKeyChange(val)
              }
            }}
          >
            <Select.Trigger>
              <Select.Value placeholder="-- Odaberite opciju sa oglasnika --" />
            </Select.Trigger>
            <Select.Content>
              {attribute.options!.map((opt) => (
                <Select.Item key={opt} value={opt}>
                  {opt}
                </Select.Item>
              ))}
              <Select.Item value="__custom__">-- Ručni unos fiksne vrijednosti --</Select.Item>
            </Select.Content>
          </Select>
        </div>
      )
    }

    return (
      <div className="flex items-center gap-2 w-full">
        <Input
          placeholder="Unesite fiksnu vrijednost..."
          value={sourceKey}
          onChange={(e) => onSourceKeyChange(e.target.value)}
        />
        {hasOptions && (
          <button
            type="button"
            className="text-xs text-ui-fg-interactive hover:underline shrink-0"
            onClick={() => setIsCustomMode(false)}
          >
            Prikaži listu
          </button>
        )}
      </div>
    )
  }

  // 2. Polje proizvoda
  if (sourceType === "product_field") {
    if (!isCustomMode) {
      return (
        <div className="flex flex-col gap-1 w-full">
          <Select
            value={sourceKey}
            onValueChange={(val) => {
              if (val === "__custom__") {
                setIsCustomMode(true)
              } else {
                onSourceKeyChange(val)
              }
            }}
          >
            <Select.Trigger>
              <Select.Value placeholder="-- Odaberite polje proizvoda --" />
            </Select.Trigger>
            <Select.Content>
              {STANDARD_PRODUCT_FIELDS.map((f) => (
                <Select.Item key={f.value} value={f.value}>
                  {f.label}
                </Select.Item>
              ))}
              <Select.Item value="__custom__">-- Ručni unos polja --</Select.Item>
            </Select.Content>
          </Select>
        </div>
      )
    }

    return (
      <div className="flex items-center gap-2 w-full">
        <Input
          placeholder="npr. custom_attribute_name"
          value={sourceKey}
          onChange={(e) => onSourceKeyChange(e.target.value)}
        />
        <button
          type="button"
          className="text-xs text-ui-fg-interactive hover:underline shrink-0"
          onClick={() => setIsCustomMode(false)}
        >
          Prikaži listu
        </button>
      </div>
    )
  }

  // 3. Polje varijante
  if (sourceType === "variant_field") {
    // Spoji standardna polja i opcije varijanti
    const combinedOptions = Array.from(new Set([...(productOptions.length > 0 ? productOptions : ["Size", "Color"])]))
    const optItems = combinedOptions.map((opt) => {
      let label = `Opcija: ${opt}`
      if (opt.toLowerCase() === "size") label = "Opcija Varijante: Veličina (Size)"
      if (opt.toLowerCase() === "color") label = "Opcija Varijante: Boja (Color)"
      return {
        value: `options.${opt}`,
        label,
      }
    })

    if (!isCustomMode) {
      return (
        <div className="flex flex-col gap-1 w-full">
          <Select
            value={sourceKey}
            onValueChange={(val) => {
              if (val === "__custom__") {
                setIsCustomMode(true)
              } else {
                onSourceKeyChange(val)
              }
            }}
          >
            <Select.Trigger>
              <Select.Value placeholder="-- Odaberite polje ili opciju varijante --" />
            </Select.Trigger>
            <Select.Content>
              {optItems.map((o) => (
                <Select.Item key={o.value} value={o.value}>
                  {o.label}
                </Select.Item>
              ))}
              {STANDARD_VARIANT_FIELDS.map((f) => (
                <Select.Item key={f.value} value={f.value}>
                  {f.label}
                </Select.Item>
              ))}
              <Select.Item value="__custom__">-- Ručni unos polja/opcije --</Select.Item>
            </Select.Content>
          </Select>
        </div>
      )
    }

    return (
      <div className="flex items-center gap-2 w-full">
        <Input
          placeholder="npr. options.Veličina ili sku"
          value={sourceKey}
          onChange={(e) => onSourceKeyChange(e.target.value)}
        />
        <button
          type="button"
          className="text-xs text-ui-fg-interactive hover:underline shrink-0"
          onClick={() => setIsCustomMode(false)}
        >
          Prikaži listu
        </button>
      </div>
    )
  }

  // 4. Metadata proizvoda
  const uniqueMetaKeys = Array.from(new Set([...STANDARD_METADATA_KEYS.map((m) => m.value), ...metadataKeys]))

  if (!isCustomMode) {
    return (
      <div className="flex flex-col gap-1 w-full">
        <Select
          value={sourceKey}
          onValueChange={(val) => {
            if (val === "__custom__") {
              setIsCustomMode(true)
            } else {
              onSourceKeyChange(val)
            }
          }}
        >
          <Select.Trigger>
            <Select.Value placeholder="-- Odaberite metadata polje --" />
          </Select.Trigger>
          <Select.Content>
            {uniqueMetaKeys.map((k) => {
              const label =
                STANDARD_METADATA_KEYS.find((m) => m.value === k)?.label || `Metadata: ${k}`
              return (
                <Select.Item key={k} value={k}>
                  {label}
                </Select.Item>
              )
            })}
            <Select.Item value="__custom__">-- Ručni unos metadata ključa --</Select.Item>
          </Select.Content>
        </Select>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 w-full">
      <Input
        placeholder="npr. brand, color, season..."
        value={sourceKey}
        onChange={(e) => onSourceKeyChange(e.target.value)}
      />
      <button
        type="button"
        className="text-xs text-ui-fg-interactive hover:underline shrink-0"
        onClick={() => setIsCustomMode(false)}
      >
        Prikaži listu
      </button>
    </div>
  )
}
