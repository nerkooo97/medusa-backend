import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Badge, Button, Container, Heading, Text, toast } from "@medusajs/ui"
import {
  ArrowPath,
  Cash,
  Plus,
  ShoppingBag,
  Users,
} from "@medusajs/icons"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ResellerData, SalesChannelOption } from "../../components/reseller/types"
import { ResellersTab } from "../../components/reseller/tabs/resellers-tab"
import { ResellerOrdersTab } from "../../components/reseller/tabs/reseller-orders-tab"
import { ResellerPayoutsTab } from "../../components/reseller/tabs/reseller-payouts-tab"
import { CreateResellerModal } from "../../components/reseller/modals/create-reseller-modal"
import { CreatePayoutModal } from "../../components/reseller/modals/create-payout-modal"

const ResellersPage = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<"resellers" | "orders" | "payouts">("resellers")
  const [resellers, setResellers] = useState<ResellerData[]>([])
  const [salesChannels, setSalesChannels] = useState<SalesChannelOption[]>([])
  const [loading, setLoading] = useState(false)

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [payoutReseller, setPayoutReseller] = useState<ResellerData | null>(null)

  const loadResellers = () => {
    setLoading(true)
    fetch("/admin/resellers")
      .then((r) => r.json())
      .then((d) => {
        setResellers(d.resellers || [])
        if (d.sales_channels) {
          setSalesChannels(d.sales_channels)
        }
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadResellers()
  }, [])

  // Agregirane metrike za kartice na vrhu
  const totalSales = resellers.reduce((sum, r) => sum + (r.stats?.total_retail || 0), 0)
  const totalCommission = resellers.reduce((sum, r) => sum + (r.stats?.total_commission || 0), 0)
  const totalUnpaid = resellers.reduce((sum, r) => sum + (r.stats?.eligible_unpaid || 0), 0)

  return (
    <div className="flex flex-col gap-y-4 p-4 sm:p-8 max-w-7xl mx-auto w-full">
      {/* Zaglavlje stranice */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Heading level="h1" className="text-xl sm:text-2xl font-bold tracking-tight text-ui-fg-base">
            Preprodavači & Agenti
          </Heading>
          <Text className="text-ui-fg-subtle text-xs sm:text-sm mt-0.5">
            Upravljanje partnerskom prodajnom mrežom, provizijama, narudžbama i isplatama.
          </Text>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="small" onClick={loadResellers} isLoading={loading}>
            <ArrowPath className="mr-1" /> Osvježi
          </Button>
          <Button variant="primary" size="small" onClick={() => setCreateModalOpen(true)}>
            <Plus className="mr-1" /> Novi Preprodavač
          </Button>
        </div>
      </div>

      {/* Kartice sa zbirnom statistikom */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Container className="p-4 shadow-sm">
          <div className="flex items-center gap-2 text-ui-fg-muted mb-1">
            <Users className="w-4 h-4" />
            <Text className="text-xs">Aktivni Preprodavači</Text>
          </div>
          <Heading level="h2" className="text-xl font-bold text-ui-fg-base">
            {resellers.filter((r) => r.status === "active").length}
          </Heading>
        </Container>

        <Container className="p-4 shadow-sm">
          <div className="flex items-center gap-2 text-ui-fg-muted mb-1">
            <ShoppingBag className="w-4 h-4" />
            <Text className="text-xs">Ukupan Promet</Text>
          </div>
          <Heading level="h2" className="text-xl font-bold text-ui-fg-base">
            {Math.round(totalSales * 100) / 100} KM
          </Heading>
        </Container>

        <Container className="p-4 shadow-sm">
          <div className="flex items-center gap-2 text-ui-fg-muted mb-1">
            <Cash className="w-4 h-4" />
            <Text className="text-xs">Zarađena Provizija</Text>
          </div>
          <Heading level="h2" className="text-xl font-bold text-ui-fg-base">
            {Math.round(totalCommission * 100) / 100} KM
          </Heading>
        </Container>

        <Container className="p-4 shadow-sm bg-ui-bg-highlight/30 border-ui-border-interactive/30">
          <div className="flex items-center gap-2 text-ui-fg-interactive mb-1">
            <Cash className="w-4 h-4" />
            <Text className="text-xs font-medium text-ui-fg-interactive">Spremno za Isplatu</Text>
          </div>
          <Heading level="h2" className="text-xl font-bold text-ui-fg-interactive">
            {Math.round(totalUnpaid * 100) / 100} KM
          </Heading>
        </Container>
      </div>

      {/* Navigacijski tabovi */}
      <div className="flex items-center gap-2 border-b pb-2">
        <Button
          variant={activeTab === "resellers" ? "primary" : "secondary"}
          size="small"
          onClick={() => setActiveTab("resellers")}
        >
          <Users className="mr-1" /> Preprodavači ({resellers.length})
        </Button>
        <Button
          variant={activeTab === "orders" ? "primary" : "secondary"}
          size="small"
          onClick={() => setActiveTab("orders")}
        >
          <ShoppingBag className="mr-1" /> Sve Narudžbe Preprodavača
        </Button>
        <Button
          variant={activeTab === "payouts" ? "primary" : "secondary"}
          size="small"
          onClick={() => setActiveTab("payouts")}
        >
          <Cash className="mr-1" /> Isplate Provizija
        </Button>
      </div>

      {/* Sadržaj aktivnog taba */}
      {activeTab === "resellers" && (
        <ResellersTab
          resellers={resellers}
          loading={loading}
          onAddClick={() => setCreateModalOpen(true)}
          onViewClick={(r) => navigate(`/resellers/${r.id}`)}
          onPayoutClick={(r) => setPayoutReseller(r)}
          onRefresh={loadResellers}
        />
      )}

      {activeTab === "orders" && <ResellerOrdersTab resellers={resellers} />}

      {activeTab === "payouts" && <ResellerPayoutsTab />}

      {/* Modali */}
      <CreateResellerModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={loadResellers}
        salesChannels={salesChannels}
      />

      <CreatePayoutModal
        open={!!payoutReseller}
        onOpenChange={(isOpen) => {
          if (!isOpen) setPayoutReseller(null)
        }}
        reseller={payoutReseller}
        onSuccess={loadResellers}
      />
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Preprodavači",
  icon: Users,
})

export default ResellersPage
