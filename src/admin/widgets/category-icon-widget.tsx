import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { DetailWidgetProps, AdminProductCategory } from "@medusajs/framework/types"
import { Container, Heading, Text, Input, Button, Badge, toast } from "@medusajs/ui"
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

interface ImageValidationResult {
  checked: boolean
  valid: boolean
  width: number
  height: number
  error?: string
}

// Strict dimension check: minimum 512x512px and exact 1:1 aspect ratio
const checkImageDimensions = (src: string): Promise<ImageValidationResult> => {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = "anonymous"

    img.onload = () => {
      const width = img.naturalWidth
      const height = img.naturalHeight

      // Requirement 1: Minimal 512x512px
      if (width < 512 || height < 512) {
        resolve({
          checked: true,
          valid: false,
          width,
          height,
          error: `Slika je premala (${width}x${height}px). Minimalne dozvoljene dimenzije su 512x512px.`,
        })
        return
      }

      // Requirement 2: Strict 1:1 aspect ratio (allowing max 1px rounding difference)
      if (Math.abs(width - height) > 1) {
        resolve({
          checked: true,
          valid: false,
          width,
          height,
          error: `Omjer slike nije 1:1 kvadrat (${width}x${height}px). Širina i visina moraju biti identične (kvadrat).`,
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
        error: "Nije moguće učitati sliku. Provjerite format datoteke ili ispravnost URL-a.",
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

  // --- Category Image State ---
  const initialImage =
    (category.metadata?.image_url as string) ||
    (category.metadata?.image as string) ||
    ""
  const [currentImageUrl, setCurrentImageUrl] = useState(initialImage)
  const [imageInput, setImageInput] = useState(initialImage)
  const [imagePreviewUrl, setImagePreviewUrl] = useState(initialImage)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isSavingImage, setIsSavingImage] = useState(false)
  const [imageValidation, setImageValidation] = useState<ImageValidationResult>({
    checked: false,
    valid: false,
    width: 0,
    height: 0,
  })

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Validate existing category image on mount
  useEffect(() => {
    if (initialImage) {
      checkImageDimensions(initialImage).then((res) => {
        setImageValidation(res)
      })
    }
  }, [initialImage])

  // --- Icon Handlers ---
  const handleSaveIcon = async () => {
    if (!isIconValid) {
      toast.error("Nevažeći naziv ikonice", {
        description: "Morate unijeti tačan naziv iz biblioteke lucide-react (npr. Wrench, Hammer, Scissors).",
      })
      return
    }

    setIsSavingIcon(true)
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
            icon: trimmedIcon,
          },
        }),
      })

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`Greška ${res.status}: ${errorText || "Neuspješno spremanje"}`)
      }

      toast.success("Ikonica sačuvana!", {
        description: `Kategorija '${category.name}' sada ima ikonicu '${trimmedIcon}'.`,
      })
    } catch (err: any) {
      toast.error("Greška pri spremanju ikonice", {
        description: err.message || "Došlo je do greške.",
      })
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
      setIsSavingIcon(false)
    }
  }

  // --- Image Handlers ---
  const handleFileChange = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Nevažeći format", {
        description: "Odabrana datoteka mora biti slika (PNG, JPG, WebP, SVG).",
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
      toast.error("Slika ne ispunjava uslove!", {
        description: res.error,
      })
    } else {
      toast.success("Slika je validna!", {
        description: `Dimenzije: ${res.width}x${res.height}px (1:1 omjer). Možete je sačuvati.`,
      })
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
      toast.error("Slika nije validna", {
        description:
          imageValidation.error ||
          "Slika mora imati minimalne dimenzije 512x512px i tačan omjer 1:1.",
      })
      return
    }

    setIsSavingImage(true)
    try {
      let finalUrl = imageInput.trim()

      // If user selected a local file, try uploading via /admin/uploads
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
            if (uploadJson.files && uploadJson.files.length > 0) {
              finalUrl = uploadJson.files[0].url
            }
          } else {
            // Fallback to data URL if /admin/uploads has no file provider configured
            finalUrl = await fileToDataUrl(selectedFile)
          }
        } catch {
          finalUrl = await fileToDataUrl(selectedFile)
        }
      }

      if (!finalUrl) {
        throw new Error("URL slike nije validan ili dostupan.")
      }

      const res = await fetch(`/admin/product-categories/${category.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          metadata: {
            ...(category.metadata || {}),
            image_url: finalUrl,
            image: finalUrl,
          },
        }),
      })

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`Greška ${res.status}: ${errorText || "Neuspješno spremanje"}`)
      }

      setCurrentImageUrl(finalUrl)
      setImageInput(finalUrl)
      setSelectedFile(null)

      toast.success("Slika kategorije sačuvana!", {
        description: `Kategorija '${category.name}' uspješno ažurirana (${imageValidation.width}x${imageValidation.height}px, 1:1).`,
      })
    } catch (err: any) {
      toast.error("Greška pri spremanju slike", {
        description: err.message || "Došlo je do greške.",
      })
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
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          metadata: currentMeta,
        }),
      })

      if (!res.ok) throw new Error("Neuspješno brisanje slike")

      setCurrentImageUrl("")
      setImageInput("")
      setImagePreviewUrl("")
      setSelectedFile(null)
      setImageValidation({ checked: false, valid: false, width: 0, height: 0 })

      toast.success("Slika uklonjena", {
        description: "Kategorija više nema definisanu sliku.",
      })
    } catch (err: any) {
      toast.error("Greška", { description: err.message })
    } finally {
      setIsSavingImage(false)
    }
  }

  // Preporučeni primjeri iz centralne konfiguracije shopova
  const examples = useMemo(() => {
    const configuredIcons = Object.values(getAllCategoryIconsMap())
    return Array.from(new Set(configuredIcons)).slice(0, 12)
  }, [])

  return (
    <Container className="p-6 space-y-8 divide-y divide-neutral-200">
      {/* ================= SECTION 1: Category Image (512x512px, 1:1) ================= */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Heading level="h2" className="text-base font-semibold text-neutral-900">
                Slika Kategorije
              </Heading>
              <Badge color="blue" size="small" className="font-medium">
                Min. 512x512px • Omjer 1:1
              </Badge>
            </div>
            <Text className="text-xs text-neutral-500 mt-1 max-w-xl">
              Postavite kvadratnu sliku kategorije za prikaz na storefront karticama i navigaciji.
              Slika <span className="font-semibold text-neutral-800">mora biti u omjeru 1:1 (kvadrat)</span> i imati <span className="font-semibold text-neutral-800">minimalno 512x512 piksela</span>.
            </Text>
          </div>

          {/* Quick status badge */}
          {Boolean(currentImageUrl) && (
            <Badge color="green" size="small" className="self-start sm:self-auto shrink-0">
              ✓ Slika je aktivna
            </Badge>
          )}
        </div>

        {/* Image Selection Area: Upload & Preview */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Left Column: Upload box & URL input (2 cols) */}
          <div className="md:col-span-2 space-y-4">
            {/* Drag & Drop File Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setIsDragging(false)
                const file = e.dataTransfer.files?.[0]
                if (file) handleFileChange(file)
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2 ${
                isDragging
                  ? "border-blue-500 bg-blue-50/50 scale-[0.99]"
                  : "border-neutral-300 hover:border-neutral-400 bg-neutral-50/40 hover:bg-neutral-50"
              }`}
            >
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
              <div className="p-2.5 rounded-full bg-blue-50 text-blue-600">
                <Icons.UploadCloud className="size-6 stroke-[1.75]" />
              </div>
              <div className="text-xs">
                <span className="font-semibold text-blue-600 hover:underline">
                  Kliknite za odabir slike
                </span>{" "}
                <span className="text-neutral-500">ili je prevucite ovdje</span>
              </div>
              <div className="text-[11px] text-neutral-400">
                PNG, JPG, WebP • Minimalno 512x512px • Omjer 1:1
              </div>
              {selectedFile && (
                <div className="mt-1 px-2.5 py-1 rounded bg-neutral-100 text-neutral-800 text-[11px] font-mono flex items-center gap-1.5">
                  <Icons.FileImage className="size-3.5 text-neutral-500" />
                  {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </div>
              )}
            </div>

            {/* Direct URL input alternative */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-700 flex items-center justify-between">
                <span>Ili unesite direktan URL slike:</span>
                <span className="text-[11px] text-neutral-400">https://...</span>
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://example.com/kategorija-512x512.jpg"
                  value={imageInput}
                  onChange={(e) => handleUrlInputChange(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>
            </div>

            {/* Validation Message & Save / Remove actions */}
            <div className="space-y-3 pt-1">
              {/* Validation Status Feedback */}
              {imageValidation.checked && (
                <div>
                  {imageValidation.valid ? (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                      <Icons.CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                      <span>
                        <strong>Slika ispunjava sve uslove:</strong> {imageValidation.width}x{imageValidation.height}px (kvadrat 1:1).
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                      <Icons.AlertCircle className="size-4 text-rose-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>Nevažeća slika:</strong> {imageValidation.error}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  onClick={handleSaveImage}
                  isLoading={isSavingImage}
                  disabled={!imageValidation.valid || isSavingImage}
                >
                  Sačuvaj sliku kategorije
                </Button>

                {Boolean(currentImageUrl) && (
                  <Button
                    variant="danger"
                    onClick={handleRemoveImage}
                    isLoading={isSavingImage}
                    disabled={isSavingImage}
                  >
                    Ukloni sliku
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Live 1:1 Preview Box (1 col) */}
          <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-neutral-200 bg-neutral-50/70">
            <div className="text-[11px] font-medium text-neutral-500 mb-2 uppercase tracking-wide">
              Pregled (1:1 kvadrat)
            </div>

            <div className="relative w-40 h-40 rounded-xl overflow-hidden border border-neutral-200 bg-white flex items-center justify-center shadow-inner">
              {imagePreviewUrl ? (
                <img
                  src={imagePreviewUrl}
                  alt="Pregled kategorije"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-neutral-400 p-4 text-center">
                  <Icons.Image className="size-10 stroke-[1.25] text-neutral-300 mb-1" />
                  <span className="text-[11px]">Nema odabrane slike</span>
                </div>
              )}

              {/* Resolution Overlay badge */}
              {imageValidation.checked && imageValidation.width > 0 && (
                <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur text-white text-[10px] font-mono">
                  {imageValidation.width}x{imageValidation.height}
                </div>
              )}
            </div>

            <div className="mt-2.5 text-center">
              {imageValidation.checked && imageValidation.valid ? (
                <Badge color="green" size="small" className="font-mono text-[11px]">
                  ✓ {imageValidation.width}x{imageValidation.height}px (1:1)
                </Badge>
              ) : (
                <span className="text-[11px] text-neutral-400">
                  {Boolean(currentImageUrl) ? "Trenutno sačuvana slika" : "Preporučeno: 512x512px ili veće"}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ================= SECTION 2: Lucide Icon ================= */}
      <div className="pt-6">
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
              {isIconValid ? trimmedIcon : "Nema"}
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
                placeholder="npr. Wrench, Hammer, Drill, Sparkles..."
                value={iconInput}
                onChange={(e) => setIconInput(e.target.value)}
                className={`font-mono text-sm ${
                  trimmedIcon.length > 0 && !isIconValid
                    ? "!border-rose-400 !focus:border-rose-500"
                    : trimmedIcon.length > 0 && isIconValid
                    ? "!border-emerald-500"
                    : ""
                }`}
              />
              <Button
                variant="primary"
                onClick={handleSaveIcon}
                isLoading={isSavingIcon}
                disabled={!isIconValid || isSavingIcon}
                className="shrink-0"
              >
                Sačuvaj ikonicu
              </Button>
              {Boolean(category.metadata?.icon) && (
                <Button
                  variant="danger"
                  onClick={handleRemoveIcon}
                  isLoading={isSavingIcon}
                  disabled={isSavingIcon}
                  className="shrink-0"
                >
                  Ukloni ikonicu
                </Button>
              )}
            </div>
          </div>

          {/* Validation Feedback status */}
          <div className="flex items-center gap-2 text-xs">
            {trimmedIcon.length === 0 ? (
              <Text className="text-neutral-400 text-xs">
                Polje je prazno. Unesite naziv ikonice da biste je pregledali i sačuvali.
              </Text>
            ) : isIconValid ? (
              <Badge color="green" size="small" className="font-medium">
                ✓ Validna Lucide ikonica: {trimmedIcon}
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

export default CategoryMediaWidget
