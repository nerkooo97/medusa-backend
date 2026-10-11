import {
  Button,
  FocusModal,
  Heading,
  Input,
  Label,
  Select,
  Switch,
  Text,
  toast,
} from "@medusajs/ui"
import { BadgeCheck } from "@medusajs/icons"
import { useEffect, useState } from "react"
import { MarketplaceProviderInfo } from "../types"

interface CreateConnectionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export const CreateConnectionModal = ({
  open,
  onOpenChange,
  onSuccess,
}: CreateConnectionModalProps) => {
  const [providers, setProviders] = useState<MarketplaceProviderInfo[]>([])
  const [selectedProviderId, setSelectedProviderId] = useState<string>("olx")
  const [name, setName] = useState("")
  const [credentials, setCredentials] = useState<Record<string, any>>({
    auth_mode: "credentials",
    device_name: "medusa_integration",
    country_id: "49",
    city_id: "133",
  })
  const [autoSyncStock, setAutoSyncStock] = useState(true)
  const [autoSyncPrices, setAutoSyncPrices] = useState(false)
  const [stockLocations, setStockLocations] = useState<any[]>([])
  const [selectedStockLocationId, setSelectedStockLocationId] = useState<string>("")
  const [salesChannels, setSalesChannels] = useState<any[]>([])
  const [selectedSalesChannelId, setSelectedSalesChannelId] = useState<string>("")
  const [testing, setTesting] = useState(false)
  const [saving, setSaving] = useState(false)

  // Učitaj podržane provajdere, prodajne kanale i lokacije
  useEffect(() => {
    if (open) {
      fetch("/admin/marketplace/providers")
        .then((r) => r.json())
        .then((data) => {
          setProviders(data.providers || [])
          if (data.providers?.[0]) {
            setSelectedProviderId(data.providers[0].providerId)
            setName(`${data.providers[0].displayName} Glavna Trgovina`)
          }
        })
        .catch(() => {})

      fetch("/admin/sales-channels")
        .then((r) => r.json())
        .then((data) => {
          const scs = data.sales_channels || []
          setSalesChannels(scs)
          if (scs[0]) {
            setSelectedSalesChannelId(scs[0].id)
          }
        })
        .catch(() => {})

      fetch("/admin/stock-locations")
        .then((r) => r.json())
        .then((data) => {
          const locs = data.stock_locations || []
          setStockLocations(locs)
          if (locs[0]) {
            setSelectedStockLocationId(locs[0].id)
          }
        })
        .catch(() => {})
    }
  }, [open])

  const activeProvider = providers.find((p) => p.providerId === selectedProviderId)

  const handleTestConnection = async () => {
    setTesting(true)
    try {
      const res = await fetch("/admin/marketplace/connections/new/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider_id: selectedProviderId,
          credentials,
        }),
      })
      const data = await res.json()
      if (data.result?.success) {
        toast.success(
          `Konekcija uspješna! Prijavljeni ste kao: ${data.result.accountName || data.result.accountIdentifier}`
        )
      } else {
        toast.error(`Konekcija nije uspjela: ${data.result?.errorMessage || "Provjerite unesene podatke."}`)
      }
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Unesite naziv konekcije.")
      return
    }
    if (!selectedSalesChannelId) {
      toast.error("Odaberite prodajni kanal za ovaj marketplace nalog.")
      return
    }

    let normalizedAuthType = credentials.auth_mode || "credentials_login"
    if (normalizedAuthType === "credentials") normalizedAuthType = "credentials_login"

    setSaving(true)
    try {
      const res = await fetch("/admin/marketplace/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          provider_id: selectedProviderId,
          sales_channel_id: selectedSalesChannelId,
          auth_type: normalizedAuthType,
          credentials,
          auto_sync_stock: autoSyncStock,
          auto_sync_prices: autoSyncPrices,
          default_stock_location_id: selectedStockLocationId || null,
        }),
      })

      if (res.ok) {
        toast.success(`Marketplace nalog '${name}' je uspješno kreiran!`)
        onOpenChange(false)
        onSuccess()
      } else {
        const data = await res.json()
        toast.error(data.message || "Greška pri kreiranju naloga.")
      }
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <FocusModal open={open} onOpenChange={onOpenChange}>
      <FocusModal.Content>
        <FocusModal.Header>
          <div className="flex items-center justify-between w-full px-6">
            <Heading level="h2">Dodaj Novi Marketplace Nalog</Heading>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="small"
                isLoading={testing}
                onClick={handleTestConnection}
              >
                <BadgeCheck className="mr-1 text-ui-fg-interactive" /> Testiraj Konekciju
              </Button>
              <Button
                variant="primary"
                size="small"
                isLoading={saving}
                onClick={handleSave}
              >
                Snimi Nalog
              </Button>
            </div>
          </div>
        </FocusModal.Header>

        <FocusModal.Body className="overflow-y-auto p-8 max-w-2xl w-full mx-auto space-y-6">
          {/* Odabir provajdera */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Odaberite Marketplace Platformu</Label>
            <Select
              value={selectedProviderId}
              onValueChange={(val) => {
                setSelectedProviderId(val)
                const prov = providers.find((p) => p.providerId === val)
                if (prov) setName(`${prov.displayName} Nalog`)
              }}
            >
              <Select.Trigger>
                <Select.Value />
              </Select.Trigger>
              <Select.Content>
                {providers.map((p) => (
                  <Select.Item key={p.providerId} value={p.providerId}>
                    {p.displayName} ({p.providerId.toUpperCase()})
                  </Select.Item>
                ))}
              </Select.Content>
            </Select>
          </div>

          {/* Naziv naloga */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Naziv Naloga (Interno ime)</Label>
            <Input
              placeholder="npr. OLX Glavna Prodavnica Sarajevo"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Odabir prodajnog kanala */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">
              Prodajni Kanal (Sales Channel) <span className="text-ui-fg-error">*</span>
            </Label>
            <Select
              value={selectedSalesChannelId}
              onValueChange={setSelectedSalesChannelId}
            >
              <Select.Trigger>
                <Select.Value placeholder="-- Odaberite prodajni kanal --" />
              </Select.Trigger>
              <Select.Content>
                {salesChannels.map((sc) => (
                  <Select.Item key={sc.id} value={sc.id}>
                    {sc.name} {sc.description ? `(${sc.description})` : ""}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select>
            <Text className="text-xs text-ui-fg-subtle">
              Samo proizvodi dodijeljeni ovom prodajnom kanalu moći će se objaviti i sinhronizovati na ovaj marketplace.
            </Text>
          </div>

          {/* Dinamička autentifikacijska polja provajdera */}
          {activeProvider && (
            <div className="border rounded-lg p-5 space-y-4 bg-ui-bg-subtle/30">
              <Heading level="h3" className="text-sm font-semibold">
                Autentifikacija & Pristupni Podaci ({activeProvider.displayName})
              </Heading>

              {activeProvider.authSchema.map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <Label className="text-sm font-medium">
                    {field.label} {field.required && <span className="text-ui-fg-error">*</span>}
                  </Label>
                  {field.type === "select" && field.options ? (
                    <Select
                      value={credentials[field.key] || field.defaultValue || ""}
                      onValueChange={(val) =>
                        setCredentials((prev) => ({ ...prev, [field.key]: val }))
                      }
                    >
                      <Select.Trigger>
                        <Select.Value />
                      </Select.Trigger>
                      <Select.Content>
                        {field.options.map((opt) => (
                          <Select.Item key={opt.value} value={opt.value}>
                            {opt.label}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select>
                  ) : (
                    <Input
                      type={field.type === "password" ? "password" : "text"}
                      placeholder={field.description || ""}
                      value={credentials[field.key] || ""}
                      onChange={(e) =>
                        setCredentials((prev) => ({
                          ...prev,
                          [field.key]: e.target.value,
                        }))
                      }
                    />
                  )}
                  {field.description && (
                    <Text className="text-xs text-ui-fg-subtle">{field.description}</Text>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Postavke zaliha & lokacije */}
          <div className="border rounded-lg p-5 space-y-4 bg-ui-bg-base">
            <Heading level="h3" className="text-sm font-semibold">
              Skladište & Sinhronizacija
            </Heading>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Izvorno Skladište za Zalihe</Label>
              <Select
                value={selectedStockLocationId}
                onValueChange={setSelectedStockLocationId}
              >
                <Select.Trigger>
                  <Select.Value placeholder="-- Odaberite lokaciju --" />
                </Select.Trigger>
                <Select.Content>
                  {stockLocations.map((loc) => (
                    <Select.Item key={loc.id} value={loc.id}>
                      {loc.name}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </div>

            <div className="flex items-center justify-between py-2 border-t">
              <div>
                <Text className="font-medium text-sm">Automatska Sinhronizacija Zaliha</Text>
                <Text className="text-xs text-ui-fg-subtle">
                  Ažuriraj dostupnost i sakrij oglas na oglasniku ako stanje padne na 0.
                </Text>
              </div>
              <Switch checked={autoSyncStock} onCheckedChange={setAutoSyncStock} />
            </div>

            <div className="flex items-center justify-between py-2 border-t">
              <div>
                <Text className="font-medium text-sm">Automatska Sinhronizacija Cijena</Text>
                <Text className="text-xs text-ui-fg-subtle">
                  Ažuriraj cijenu na oglasniku kada se promijeni cjenovnik u Medusi.
                </Text>
              </div>
              <Switch checked={autoSyncPrices} onCheckedChange={setAutoSyncPrices} />
            </div>
          </div>
        </FocusModal.Body>
      </FocusModal.Content>
    </FocusModal>
  )
}
