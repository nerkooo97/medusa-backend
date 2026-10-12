import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Badge, Button, Container, Heading, Input, Select, Text, toast } from "@medusajs/ui"
import {
  ArrowPath,
  Cash,
  CreditCard,
  Plus,
  Trash,
  Buildings,
} from "@medusajs/icons"
import { useEffect, useState } from "react"

interface Operator {
  id: string
  user_id: string
  role: string
  is_active: boolean
  user?: {
    email: string
    first_name: string
    last_name: string
  }
}

interface PosRegister {
  id: string
  name: string
  code: string
  status: "active" | "inactive" | "maintenance"
  store_name: string
  store_address: string
  store_city: string
  store_postal_code?: string
  tax_id?: string
  sales_channel_id?: string
  sales_channel?: { id: string; name: string }
  stock_location_id?: string
  stock_location?: { id: string; name: string }
  supported_payment_methods: string[]
  fiscal_printer_type?: string
  fiscal_printer_ip?: string
  device_key: string
  operators?: Operator[]
  active_session?: {
    id: string
    opened_at: string
    opening_cash: number
  }
}

const PosPage = () => {
  const [registers, setRegisters] = useState<PosRegister[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [options, setOptions] = useState<{
    sales_channels: any[]
    stock_locations: any[]
    users: any[]
  }>({ sales_channels: [], stock_locations: [], users: [] })

  // Form state
  const [name, setName] = useState("")
  const [storeName, setStoreName] = useState("")
  const [storeAddress, setStoreAddress] = useState("")
  const [storeCity, setStoreCity] = useState("")
  const [taxId, setTaxId] = useState("")
  const [selectedChannel, setSelectedChannel] = useState("")
  const [selectedLocation, setSelectedLocation] = useState("")
  const [fiscalType, setFiscalType] = useState("none")
  const [saving, setSaving] = useState(false)

  const loadData = () => {
    setLoading(true)
    Promise.all([
      fetch("/admin/pos/registers").then((r) => r.json()),
      fetch("/admin/pos/options").then((r) => r.json()),
    ])
      .then(([regData, optData]) => {
        setRegisters(regData.registers || [])
        setOptions(optData)
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !storeName || !storeAddress || !storeCity) {
      toast.error("Molimo popunite sva obavezna polja (Naziv kase, Naziv PJ, Adresa, Grad).")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/admin/pos/registers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          store_name: storeName,
          store_address: storeAddress,
          store_city: storeCity,
          tax_id: taxId || null,
          sales_channel_id: selectedChannel || null,
          stock_location_id: selectedLocation || null,
          fiscal_printer_type: fiscalType,
          supported_payment_methods: ["cash", "card", "wire_transfer"],
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || "Greška pri kreiranju kase")
      }

      toast.success("POS kasa uspješno kreirana!")
      setModalOpen(false)
      setName("")
      setStoreName("")
      setStoreAddress("")
      setStoreCity("")
      setTaxId("")
      loadData()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Jeste li sigurni da želite obrisati ovu POS kasu?")) return

    try {
      const res = await fetch(`/admin/pos/registers/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Greška pri brisanju")
      toast.success("Kasa je obrisana.")
      loadData()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  return (
    <div className="flex flex-col gap-y-4 p-4 sm:p-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Heading level="h1" className="text-xl sm:text-2xl font-bold tracking-tight text-ui-fg-base">
            POS Terminali & Registar Kase
          </Heading>
          <Text className="text-ui-fg-subtle text-xs sm:text-sm mt-0.5">
            Upravljanje POS kasama po poslovnim jedinicama, prodajnim kanalima, skladištima i kasirima (Expo & Fiskalizacija BiH)
          </Text>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="small" onClick={loadData} disabled={loading}>
            <ArrowPath className={loading ? "animate-spin" : ""} />
            Osvježi
          </Button>
          <Button variant="primary" size="small" onClick={() => setModalOpen(true)}>
            <Plus />
            Nova POS Kasa
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Container className="p-4 flex items-center gap-4">
          <div className="p-3 bg-ui-bg-subtle rounded-lg text-ui-fg-interactive">
            <Cash />
          </div>
          <div>
            <Text className="text-xs text-ui-fg-subtle">Ukupno Kasa</Text>
            <Heading level="h2" className="text-xl font-bold">{registers.length}</Heading>
          </div>
        </Container>
        <Container className="p-4 flex items-center gap-4">
          <div className="p-3 bg-ui-bg-subtle rounded-lg text-emerald-600">
            <CreditCard />
          </div>
          <div>
            <Text className="text-xs text-ui-fg-subtle">Aktivne Kase</Text>
            <Heading level="h2" className="text-xl font-bold">
              {registers.filter((r) => r.status === "active").length}
            </Heading>
          </div>
        </Container>
        <Container className="p-4 flex items-center gap-4">
          <div className="p-3 bg-ui-bg-subtle rounded-lg text-blue-600">
            <Buildings />
          </div>
          <div>
            <Text className="text-xs text-ui-fg-subtle">Otvorene Smjene</Text>
            <Heading level="h2" className="text-xl font-bold">
              {registers.filter((r) => !!r.active_session).length}
            </Heading>
          </div>
        </Container>
      </div>

      {/* Tabela kasa */}
      <Container className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b bg-ui-bg-subtle/50 text-ui-fg-muted font-medium text-xs uppercase">
                <th className="p-4">Kasa & Šifra</th>
                <th className="p-4">Poslovna Jedinica</th>
                <th className="p-4">Prodajni Kanal</th>
                <th className="p-4">Magacin (Skladište)</th>
                <th className="p-4">Načini Plaćanja</th>
                <th className="p-4">Fiskalni Uređaj</th>
                <th className="p-4">Smjena</th>
                <th className="p-4 text-right">Akcije</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ui-border-base">
              {registers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-ui-fg-muted">
                    Nema kreiranih POS kasa. Kliknite na "Nova POS Kasa" za dodavanje prve kase.
                  </td>
                </tr>
              ) : (
                registers.map((r) => (
                  <tr key={r.id} className="hover:bg-ui-bg-subtle-hover transition-colors">
                    <td className="p-4">
                      <div className="font-semibold text-ui-fg-base">{r.name}</div>
                      <div className="text-xs text-ui-fg-subtle font-mono">{r.code}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-ui-fg-base">{r.store_name}</div>
                      <div className="text-xs text-ui-fg-subtle">{r.store_address}, {r.store_city}</div>
                      {r.tax_id && (
                        <div className="text-[11px] text-ui-fg-muted">JIB: {r.tax_id}</div>
                      )}
                    </td>
                    <td className="p-4">
                      {r.sales_channel ? (
                        <Badge color="blue">{r.sales_channel.name}</Badge>
                      ) : (
                        <span className="text-ui-fg-muted text-xs">Nije povezano</span>
                      )}
                    </td>
                    <td className="p-4">
                      {r.stock_location ? (
                        <Badge color="purple">{r.stock_location.name}</Badge>
                      ) : (
                        <span className="text-ui-fg-muted text-xs">Nije povezano</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {(r.supported_payment_methods || []).map((m) => (
                          <Badge key={m} color="grey" size="small">
                            {m === "cash" ? "Gotovina" : m === "card" ? "Kartica" : m === "wire_transfer" ? "Virman" : m}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge color={r.fiscal_printer_type && r.fiscal_printer_type !== "none" ? "green" : "grey"}>
                        {r.fiscal_printer_type?.toUpperCase() || "NONE"}
                      </Badge>
                    </td>
                    <td className="p-4">
                      {r.active_session ? (
                        <Badge color="green">Otvorena</Badge>
                      ) : (
                        <Badge color="grey">Zatvorena</Badge>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        variant="transparent"
                        size="small"
                        className="text-ui-fg-error hover:bg-ui-bg-error"
                        onClick={() => handleDelete(r.id)}
                      >
                        <Trash />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Container>

      {/* Modal za kreiranje nove POS kase */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Container className="max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <Heading level="h2" className="text-lg font-bold">Kreiranje Nove POS Kase</Heading>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1">
                <Text className="text-xs font-medium">Naziv POS kase *</Text>
                <Input
                  placeholder="npr. Glavna Kasa 1"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="border-t pt-3 space-y-3">
                <Text className="text-xs font-semibold text-ui-fg-muted uppercase tracking-wider">
                  Podaci o poslovnoj jedinici (Objektu)
                </Text>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Text className="text-xs font-medium">Naziv objekta/PJ *</Text>
                    <Input
                      placeholder="npr. Poslovna jedinica Sarajevo 1"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Text className="text-xs font-medium">JIB / PIB (BiH) *</Text>
                    <Input
                      placeholder="npr. 4200000000000"
                      value={taxId}
                      onChange={(e) => setTaxId(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Text className="text-xs font-medium">Adresa *</Text>
                    <Input
                      placeholder="npr. Džemala Bijedića 160"
                      value={storeAddress}
                      onChange={(e) => setStoreAddress(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Text className="text-xs font-medium">Grad *</Text>
                    <Input
                      placeholder="npr. Sarajevo"
                      value={storeCity}
                      onChange={(e) => setStoreCity(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-3 space-y-3">
                <Text className="text-xs font-semibold text-ui-fg-muted uppercase tracking-wider">
                  Povezivanje sa Medusa resursima
                </Text>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Text className="text-xs font-medium">Prodajni Kanal</Text>
                    <select
                      className="w-full h-8 px-2 rounded-md border text-xs bg-ui-bg-base"
                      value={selectedChannel}
                      onChange={(e) => setSelectedChannel(e.target.value)}
                    >
                      <option value="">-- Odaberite kanal --</option>
                      {options.sales_channels.map((sc) => (
                        <option key={sc.id} value={sc.id}>{sc.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Text className="text-xs font-medium">Magacin (Skladište)</Text>
                    <select
                      className="w-full h-8 px-2 rounded-md border text-xs bg-ui-bg-base"
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                    >
                      <option value="">-- Odaberite magacin --</option>
                      {options.stock_locations.map((sl) => (
                        <option key={sl.id} value={sl.id}>{sl.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="border-t pt-3 space-y-3">
                <Text className="text-xs font-semibold text-ui-fg-muted uppercase tracking-wider">
                  Fiskalni printer (BiH)
                </Text>
                <div className="space-y-1">
                  <Text className="text-xs font-medium">Tip fiskalnog uređaja</Text>
                  <select
                    className="w-full h-8 px-2 rounded-md border text-xs bg-ui-bg-base"
                    value={fiscalType}
                    onChange={(e) => setFiscalType(e.target.value)}
                  >
                    <option value="none">Bez fiskalnog uređaja</option>
                    <option value="tring">Tring (FBiH)</option>
                    <option value="hcp">HCP (FBiH/RS)</option>
                    <option value="tremol">Tremol</option>
                    <option value="generic_escpos">Generički termalni printer</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>
                  Odustani
                </Button>
                <Button variant="primary" type="submit" disabled={saving}>
                  {saving ? "Spremanje..." : "Kreiraj Kasu"}
                </Button>
              </div>
            </form>
          </Container>
        </div>
      )}
    </div>
  )
}

export const config = defineRouteConfig({
  label: "POS Kase",
  icon: Cash,
})

export default PosPage
