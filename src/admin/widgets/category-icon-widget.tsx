import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { DetailWidgetProps, AdminProductCategory } from "@medusajs/framework/types"
import {
  Container,
  Heading,
  Text,
  Input,
  Button,
  StatusBadge,
  toast,
} from "@medusajs/ui"
import {
  Photo,
  ArrowUpTray,
  Trash,
  Sparkles,
} from "@medusajs/icons"
import { useState, useMemo, useEffect, useRef } from "react"
import * as Icons from "lucide-react"

import { getAllCategoryIconsMap } from "../../config/shops"

// Helper to strictly validate if a string is an exact Lucide icon name
const isExactLucideIcon = (name: string): boolean => {
  if (!name || typeof name !== "string") return false
  const trimmed = name.trim()
  if (trimmed.length < 2) return false
  const candidate = (Icons as Record<string, unknown>)[trimmed]
  return (
    typeof candidate === "function" ||
    (typeof candidate === "object" && candidate !== null && "$$typeof" in candidate)
  )
}

interface ImageValidation {
  checked: boolean
  valid: boolean
  width: number
  height: number
  error?: string
}

// Strict dimension check: minimum 512x512px and exact 1:1 aspect ratio
const checkImageDimensions = (src: string): Promise<ImageValidation> => {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = "anonymous"

    img.onload = () => {
      const width = img.naturalWidth
      const height = img.naturalHeight

      if (width < 512 || height < 512) {
        resolve({
          checked: true,
          valid: false,
          width,
          height,
          error: `Slika je ${width}×${height} px. Zahtijeva se minimalno 512×512 px.`,
        })
        return
      }

      if (Math.abs(width - height) > 1) {
        resolve({
          checked: true,
          valid: false,
          width,
          height,
          error: `Omjer je ${width}×${height} px. Slika mora biti tačan 1:1 kvadrat.`,
        })
        return
      }

      resolve({
        checked: true,
        valid: true,
        width,
        height,
      })
    }

    img.onerror = () => {
      resolve({
        checked: true,
        valid: false,
        width: 0,
        height: 0,
        error: "Neispravan format slike ili nedostupan URL.",
      })
    }

    img.src = src
  })
}

const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const CategoryMediaWidget = ({
  data: category,
}: DetailWidgetProps<AdminProductCategory>) => {
  // --- Icon State ---
  const initialIcon = (category.metadata?.icon as string) || ""
  const [iconInput, setIconInput] = useState(initialIcon)
  const [isSavingIcon, setIsSavingIcon] = useState(false)

  const trimmedIcon = iconInput.trim()
  const isIconValid = useMemo(() => isExactLucideIcon(trimmedIcon), [trimmedIcon])

  const IconComponent = useMemo(() => {
    if (!isIconValid) return null
    return (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[trimmedIcon]
  }, [isIconValid, trimmedIcon])

  // --- Image State ---
  const initialImage =
    (category.metadata?.image_url as string) ||
    (category.metadata?.image as string) ||
    ""
  const [currentImageUrl, setCurrentImageUrl] = useState(initialImage)
  const [imageInput, setImageInput] = useState(initialImage)
  const [imagePreviewUrl, setImagePreviewUrl] = useState(initialImage)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isSavingImage, setIsSavingImage] = useState(false)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [imageValidation, setImageValidation] = useState<ImageValidation>({
    checked: false,
    valid: false,
    width: 0,
    height: 0,
  })

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (initialImage) {
      checkImageDimensions(initialImage).then((res) => {
        setImageValidation(res)
      })
    }
  }, [initialImage])

  // --- Handlers: Icon ---
  const handleSaveIcon = async () => {
    if (!isIconValid) {
      toast.error("Nevažeći naziv ikonice", {
        description: "Unesite validan naziv iz biblioteke lucide-react.",
      })
      return
    }

    setIsSavingIcon(true)
    try {
      const res = await fetch(`/admin/product-categories/${category.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          metadata: {
            ...(category.metadata || {}),
            icon: trimmedIcon,
          },
        }),
      })

      if (!res.ok) throw new Error("Neuspješno spremanje")

      toast.success("Ikonica sačuvana", {
        description: `Kategorija koristi ikonicu '${trimmedIcon}'.`,
      })
    } catch (err: any) {
      toast.error("Greška", { description: err.message })
    } finally {
      setIsSavingIcon(false)
    }
  }

  const handleRemoveIcon = async () => {
    setIsSavingIcon(true)
    try {
      const currentMeta = { ...(category.metadata || {}) }
      delete currentMeta.icon

      const res = await fetch(`/admin/product-categories/${category.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ metadata: currentMeta }),
      })

      if (!res.ok) throw new Error("Neuspješno brisanje")

      setIconInput("")
      toast.success("Ikonica uklonjena")
    } catch (err: any) {
      toast.error("Greška", { description: err.message })
    } finally {
      setIsSavingIcon(false)
    }
  }

  // --- Handlers: Image ---
  const handleFileChange = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Nevažeći format", {
        description: "Datoteka mora biti slika (PNG, JPG, WebP).",
      })
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setSelectedFile(file)
    setImagePreviewUrl(objectUrl)
    setImageInput("")

    const res = await checkImageDimensions(objectUrl)
    setImageValidation(res)

    if (!res.valid) {
      toast.error("Validacija neuspješna", { description: res.error })
    }
  }

  const handleUrlInputChange = async (val: string) => {
    setImageInput(val)
    setSelectedFile(null)
    const trimmed = val.trim()

    if (!trimmed) {
      setImagePreviewUrl(currentImageUrl)
      if (currentImageUrl) {
        const res = await checkImageDimensions(currentImageUrl)
        setImageValidation(res)
      } else {
        setImageValidation({ checked: false, valid: false, width: 0, height: 0 })
      }
      return
    }

    setImagePreviewUrl(trimmed)
    const res = await checkImageDimensions(trimmed)
    setImageValidation(res)
  }

  const handleSaveImage = async () => {
    if (!imageValidation.valid) {
      toast.error("Validacija neuspješna", {
        description: imageValidation.error || "Minimalno 512×512 px i omjer 1:1.",
      })
      return
    }

    setIsSavingImage(true)
    try {
      let finalUrl = imageInput.trim()

      if (selectedFile) {
        try {
          const formData = new FormData()
          formData.append("files", selectedFile)

          const uploadRes = await fetch("/admin/uploads", {
            method: "POST",
            credentials: "include",
            body: formData,
          })

          if (uploadRes.ok) {
            const uploadJson = await uploadRes.json()
            if (uploadJson.files?.[0]?.url) {
              finalUrl = uploadJson.files[0].url
            }
          } else {
            finalUrl = await fileToDataUrl(selectedFile)
          }
        } catch {
          finalUrl = await fileToDataUrl(selectedFile)
        }
      }

      if (!finalUrl) {
        throw new Error("URL slike nije dostupan.")
      }

      const res = await fetch(`/admin/product-categories/${category.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          metadata: {
            ...(category.metadata || {}),
            image_url: finalUrl,
            image: finalUrl,
          },
        }),
      })

      if (!res.ok) throw new Error("Neuspješno spremanje slike")

      setCurrentImageUrl(finalUrl)
      setImageInput(finalUrl)
      setSelectedFile(null)
      setShowUrlInput(false)

      toast.success("Slika kategorije sačuvana", {
        description: `${imageValidation.width}×${imageValidation.height} px (1:1)`,
      })
    } catch (err: any) {
      toast.error("Greška pri spremanju slike", { description: err.message })
    } finally {
      setIsSavingImage(false)
    }
  }

  const handleRemoveImage = async () => {
    setIsSavingImage(true)
    try {
      const currentMeta = { ...(category.metadata || {}) }
      delete currentMeta.image_url
      delete currentMeta.image

      const res = await fetch(`/admin/product-categories/${category.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ metadata: currentMeta }),
      })

      if (!res.ok) throw new Error("Neuspješno uklanjanje")

      setCurrentImageUrl("")
      setImageInput("")
      setImagePreviewUrl("")
      setSelectedFile(null)
      setShowUrlInput(false)
      setImageValidation({ checked: false, valid: false, width: 0, height: 0 })

      toast.success("Slika uklonjena")
    } catch (err: any) {
      toast.error("Greška", { description: err.message })
    } finally {
      setIsSavingImage(false)
    }
  }

  // Preporučene ikonice
  const suggestedIcons = useMemo(() => {
    const list = Object.values(getAllCategoryIconsMap())
    return Array.from(new Set(list)).slice(0, 8)
  }, [])

  const hasImageChanges =
    Boolean(selectedFile) ||
    (imageInput.trim() !== currentImageUrl && Boolean(imageInput.trim()))

  return (
    <Container className="p-0 divide-y divide-ui-border-base overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2" className="text-base font-semibold text-ui-fg-base">
            Vizuelni identitet
          </Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Prilagodite ikonicu i sliku kategorije za storefront
          </Text>
        </div>
      </div>

      {/* Row 1: Category Image (512x512, 1:1) */}
      <div className="px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-start gap-5">
          {/* Square Thumbnail Preview */}
          <div className="relative size-20 rounded-md border border-ui-border-base bg-ui-bg-subtle shrink-0 overflow-hidden flex items-center justify-center">
            {imagePreviewUrl ? (
              <img
                src={imagePreviewUrl}
                alt={category.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Photo className="text-ui-fg-muted size-6" />
            )}
            {imageValidation.checked && imageValidation.width > 0 && (
              <span className="absolute bottom-1 right-1 text-[9px] font-mono bg-ui-bg-base/90 text-ui-fg-subtle px-1 rounded border border-ui-border-base">
                {imageValidation.width}×{imageValidation.height}
              </span>
            )}
          </div>

          {/* Controls & Details */}
          <div className="flex-1 space-y-2.5 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <Text size="small" weight="plus" className="text-ui-fg-base">
                  Slika kategorije
                </Text>
                <Text size="xsmall" className="text-ui-fg-subtle">
                  Minimalno 512×512 px • Omjer 1:1 (kvadrat)
                </Text>
              </div>

              {/* Status Indicator */}
              {imageValidation.checked && (
                imageValidation.valid ? (
                  <StatusBadge color="green">
                    {imageValidation.width}×{imageValidation.height} px (1:1)
                  </StatusBadge>
                ) : (
                  <StatusBadge color="red">
                    {imageValidation.error}
                  </StatusBadge>
                )
              )}
            </div>

            {/* Upload or URL Bar */}
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileChange(file)
                }}
              />

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="small"
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                  type="button"
                >
                  <ArrowUpTray className="size-4" />
                  {selectedFile ? selectedFile.name : "Odaberi datoteku"}
                </Button>

                <Button
                  size="small"
                  variant="transparent"
                  className="text-ui-fg-muted hover:text-ui-fg-base text-xs"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  type="button"
                >
                  {showUrlInput ? "Sakrij URL" : "Unesi URL"}
                </Button>

                {hasImageChanges && (
                  <Button
                    size="small"
                    variant="primary"
                    onClick={handleSaveImage}
                    isLoading={isSavingImage}
                    disabled={!imageValidation.valid || isSavingImage}
                  >
                    Sačuvaj sliku
                  </Button>
                )}

                {Boolean(currentImageUrl) && !hasImageChanges && (
                  <Button
                    size="small"
                    variant="transparent"
                    className="text-ui-fg-muted hover:text-ui-fg-error"
                    onClick={handleRemoveImage}
                    isLoading={isSavingImage}
                    disabled={isSavingImage}
                  >
                    <Trash className="size-4" />
                  </Button>
                )}
              </div>

              {showUrlInput && (
                <div className="pt-1">
                  <Input
                    size="small"
                    placeholder="https://example.com/kategorija.webp"
                    value={imageInput}
                    onChange={(e) => handleUrlInputChange(e.target.value)}
                    className="font-mono text-xs max-w-md"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Category Icon (Lucide) */}
      <div className="px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-start gap-5">
          {/* Small Icon Preview Box */}
          <div className="size-10 rounded-md border border-ui-border-base bg-ui-bg-subtle shrink-0 flex items-center justify-center text-ui-fg-base">
            {IconComponent ? (
              <IconComponent className="size-5 text-ui-fg-base" />
            ) : (
              <Sparkles className="size-4 text-ui-fg-muted" />
            )}
          </div>

          {/* Controls & Input */}
          <div className="flex-1 space-y-2.5 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <Text size="small" weight="plus" className="text-ui-fg-base">
                  Ikonica
                </Text>
                <Text size="xsmall" className="text-ui-fg-subtle">
                  Naziv ikonice iz biblioteke lucide-react (npr. Wrench, Hammer, Sparkles)
                </Text>
              </div>

              {trimmedIcon.length > 0 && (
                isIconValid ? (
                  <StatusBadge color="green">Važeća ikonica</StatusBadge>
                ) : (
                  <StatusBadge color="red">Nepostojeća ikonica</StatusBadge>
                )
              )}
            </div>

            <div className="flex items-center gap-2 max-w-md">
              <Input
                size="small"
                placeholder="npr. Wrench, Sparkles..."
                value={iconInput}
                onChange={(e) => setIconInput(e.target.value)}
                className="font-mono text-xs"
              />

              <Button
                size="small"
                variant="secondary"
                onClick={handleSaveIcon}
                isLoading={isSavingIcon}
                disabled={!isIconValid || isSavingIcon || trimmedIcon === initialIcon}
              >
                Sačuvaj
              </Button>

              {Boolean(category.metadata?.icon) && (
                <Button
                  size="small"
                  variant="transparent"
                  className="text-ui-fg-muted hover:text-ui-fg-error"
                  onClick={handleRemoveIcon}
                  isLoading={isSavingIcon}
                  disabled={isSavingIcon}
                >
                  <Trash className="size-4" />
                </Button>
              )}
            </div>

            {/* Clean, subtle suggestion tags */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <Text size="xsmall" className="text-ui-fg-muted mr-1">
                Primjeri:
              </Text>
              {suggestedIcons.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setIconInput(name)}
                  className="px-2 py-0.5 rounded text-[11px] font-mono text-ui-fg-subtle bg-ui-bg-subtle hover:bg-ui-bg-base hover:text-ui-fg-base border border-ui-border-base transition-colors"
                >
                  {name}
                </button>
              ))}
              <a
                href="https://lucide.dev/icons"
                target="_blank"
                rel="noreferrer"
                className="text-ui-fg-interactive hover:underline text-[11px] ml-1"
              >
                Pregled svih &rarr;
              </a>
            </div>
          </div>
        </div>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product_category.details.after",
})

export default CategoryMediaWidget
