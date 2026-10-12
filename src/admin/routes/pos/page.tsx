import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Badge, Button, Container, Heading, Text, toast } from "@medusajs/ui"
import {
  ArrowPath,
  Buildings,
  Cash,
  CreditCard,
  Plus,
  ShoppingBag,
} from "@medusajs/icons"
import { useEffect, useState } from "react"
import { PosOptions, PosRegister } from "../../components/pos/types"
import { RegistersTab } from "../../components/pos/tabs/registers-tab"
import { CreateRegisterModal } from "../../components/pos/modals/create-register-modal"
import { ConfigureRegisterModal } from "../../components/pos/modals/configure-register-modal"

const PosPage = () => {
  const [registers, setRegisters] = useState<PosRegister[]>([])
  const [loading, setLoading] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [selectedRegister, setSelectedRegister] = useState<PosRegister | null>(null)
  const [options, setOptions] = useState<PosOptions>({
    sales_channels: [],
    stock_locations: [],
    users: [],
    payment_methods: [
      { id: "cash", name: "Gotovina" },
      { id: "card", name: "Platna kartica" },
      { id: "wire_transfer", name: "Virman" },
      { id: "voucher", name: "Vaučer" },
    ],
    fiscal_printer_types: [
      { id: "none", name: "Bez fiskalnog uređaja" },
      { id: "tring", name: "Tring (FBiH)" },
      { id: "hcp", name: "HCP (FBiH/RS)" },
      { id: "tremol", name: "Tremol" },
      { id: "generic_escpos", name: "Generički ESC/POS termalni printer" },
    ],
  })

  const loadData = () => {
    setLoading(true)
    Promise.all([
      fetch("/admin/pos/registers").then((r) => r.json()),
      fetch("/admin/pos/options").then((r) => r.json()),
    ])
      .then(([regData, optData]) => {
        setRegisters(regData.registers || [])
        if (optData) {
          setOptions({
            sales_channels: optData.sales_channels || [],
            stock_locations: optData.stock_locations || [],
            users: optData.users || [],
            payment_methods: optData.payment_methods || options.payment_methods,
            fiscal_printer_types: optData.fiscal_printer_types || options.fiscal_printer_types,
          })
        }
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [])

  // KPI statistika
  const activeCount = registers.filter((r) => r.status === "active").length
  const openSessionsCount = registers.filter((r) => !!r.active_session).length
  const uniqueLocationsCount = new Set(registers.map((r) => r.stock_location_id).filter(Boolean)).size

  return (
    <div className="flex flex-col gap-y-4 p-4 sm:p-8 max-w-7xl mx-auto w-full">
      {/* Zaglavlje ekrana */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Heading level="h1" className="text-xl sm:text-2xl font-bold tracking-tight text-ui-fg-base">
            POS Terminali & Registar Kase
          </Heading>
          <Text className="text-ui-fg-subtle text-xs sm:text-sm mt-0.5">
            Upravljanje POS kasama, prodajnim kanalima, skladištima, kasirima i fiskalnim printerima (Expo POS & Fiskalizacija BiH).
          </Text>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="small" onClick={loadData} isLoading={loading}>
            <ArrowPath className="mr-1" /> Osvježi
          </Button>
          <Button variant="primary" size="small" onClick={() => setCreateModalOpen(true)}>
            <Plus className="mr-1" /> Nova POS Kasa
          </Button>
        </div>
      </div>

      {/* KPI Kartice */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Container className="p-4 shadow-sm">
          <div className="flex items-center gap-2 text-ui-fg-muted mb-1">
            <Cash className="w-4 h-4" />
            <Text className="text-xs">Ukupno Kasa</Text>
          </div>
          <Heading level="h2" className="text-xl font-bold text-ui-fg-base">
            {registers.length}
          </Heading>
        </Container>

        <Container className="p-4 shadow-sm">
          <div className="flex items-center gap-2 text-ui-fg-muted mb-1">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <Text className="text-xs">Aktivne Kase</Text>
          </div>
          <Heading level="h2" className="text-xl font-bold text-ui-fg-base">
            {activeCount}
          </Heading>
        </Container>

        <Container className="p-4 shadow-sm bg-ui-bg-highlight/30 border-ui-border-interactive/30">
          <div className="flex items-center gap-2 text-ui-fg-interactive mb-1">
            <ArrowPath className="w-4 h-4" />
            <Text className="text-xs font-medium text-ui-fg-interactive">Otvorene Smjene</Text>
          </div>
          <Heading level="h2" className="text-xl font-bold text-ui-fg-interactive">
            {openSessionsCount}
          </Heading>
        </Container>

        <Container className="p-4 shadow-sm">
          <div className="flex items-center gap-2 text-ui-fg-muted mb-1">
            <Buildings className="w-4 h-4 text-blue-600" />
            <Text className="text-xs">Povezani Magacini</Text>
          </div>
          <Heading level="h2" className="text-xl font-bold text-ui-fg-base">
            {uniqueLocationsCount}
          </Heading>
        </Container>
      </div>

      {/* Glavna tabela registar kasa */}
      <RegistersTab
        registers={registers}
        loading={loading}
        onAddClick={() => setCreateModalOpen(true)}
        onConfigureClick={(reg) => setSelectedRegister(reg)}
        onRefresh={loadData}
      />

      {/* Modal za kreiranje nove POS kase */}
      <CreateRegisterModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={loadData}
        options={options}
      />

      {/* Modal za rekonfiguraciju i detalje odabrane POS kase */}
      <ConfigureRegisterModal
        open={!!selectedRegister}
        onOpenChange={(isOpen) => {
          if (!isOpen) setSelectedRegister(null)
        }}
        register={selectedRegister}
        onSuccess={loadData}
        options={options}
      />
    </div>
  )
}

export const config = defineRouteConfig({
  label: "POS Kase",
  icon: Cash,
})

export default PosPage
