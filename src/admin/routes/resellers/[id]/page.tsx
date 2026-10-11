import { Badge, Button, Container, Heading, Text, toast } from "@medusajs/ui"
import {
  ArrowLeft,
  ArrowPath,
  Cash,
  Key,
  ShoppingBag,
  Users,
} from "@medusajs/icons"
import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ResellerData, SalesChannelOption } from "../../../components/reseller/types"
import { ResellerProfileCard } from "../../../components/reseller/details/reseller-profile-card"
import { ResellerOrdersList } from "../../../components/reseller/details/reseller-orders-list"
import { ResellerPayoutsList } from "../../../components/reseller/details/reseller-payouts-list"
import { CreatePayoutModal } from "../../../components/reseller/modals/create-payout-modal"

const ResellerDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [reseller, setReseller] = useState<ResellerData | null>(null)
  const [salesChannels, setSalesChannels] = useState<SalesChannelOption[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"orders" | "profile" | "payouts">("orders")
  const [payoutModalOpen, setPayoutModalOpen] = useState(false)

  const loadReseller = () => {
    if (!id) return
    setLoading(true)
    fetch(`/admin/resellers/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.reseller) {
          setReseller(d.reseller)
          if (d.sales_channels) {
            setSalesChannels(d.sales_channels)
          }
        } else {
          toast.error(d.message || "Preprodavač nije pronađen.")
        }
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadReseller()
  }, [id])

  if (loading && !reseller) {
    return (
      <Container className="p-12 text-center flex flex-col items-center justify-center text-ui-fg-subtle">
        <ArrowPath className="animate-spin mb-2 text-ui-fg-muted" />
        <Text>Učitavanje detalja preprodavača...</Text>
      </Container>
    )
  }

  if (!reseller) {
    return (
      <div className="p-8 max-w-5xl mx-auto space-y-4">
        <Button variant="secondary" size="small" onClick={() => navigate("/resellers")}>
          <ArrowLeft className="mr-1" /> Nazad na listu
        </Button>
        <Container className="p-8 text-center text-ui-fg-subtle">
          <Text>Preprodavač nije pronađen ili je obrisan.</Text>
        </Container>
      </div>
    )
  }

  const stats = reseller.stats || {
    total_orders: 0,
    delivered_orders: 0,
    returned_orders: 0,
    total_retail: 0,
    total_commission: 0,
    eligible_unpaid: 0,
    paid_commission: 0,
  }

  return (
    <div className="flex flex-col gap-y-4 p-4 sm:p-8 max-w-7xl mx-auto w-full">
      {/* Dugme za povratak */}
      <div>
        <Button
          variant="secondary"
          size="small"
          onClick={() => navigate("/resellers")}
          className="text-xs text-ui-fg-subtle hover:text-ui-fg-base"
        >
          <ArrowLeft className="mr-1.5" /> Svi Preprodavači
        </Button>
      </div>

      {/* Zaglavlje ekrana */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Heading level="h1" className="text-xl sm:text-2xl font-bold tracking-tight text-ui-fg-base">
              {reseller.name}
            </Heading>
            <Badge color={reseller.status === "active" ? "green" : "grey"} size="small">
              {reseller.status === "active" ? "Aktivan" : "Neaktivan"}
            </Badge>
          </div>
          <Text className="text-ui-fg-subtle text-xs sm:text-sm mt-0.5">
            {reseller.email} • {reseller.phone} {reseller.contact_person ? `• Kontakt: ${reseller.contact_person}` : ""}
          </Text>
        </div>

        <div className="flex items-center gap-2">
          {stats.eligible_unpaid > 0 && (
            <Button
              variant="primary"
              size="small"
              onClick={() => setPayoutModalOpen(true)}
              className="whitespace-nowrap"
            >
              <Cash className="mr-1" /> Isplati Proviziju ({stats.eligible_unpaid} KM)
            </Button>
          )}
          <Button variant="secondary" size="small" onClick={loadReseller} isLoading={loading}>
            <ArrowPath className="mr-1" /> Osvježi
          </Button>
        </div>
      </div>

      {/* Zbirne KPI statistike samo za ovog preprodavača */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Container className="p-4 shadow-sm">
          <div className="flex items-center gap-2 text-ui-fg-muted mb-1">
            <ShoppingBag className="w-4 h-4" />
            <Text className="text-xs">Ukupan Promet</Text>
          </div>
          <Heading level="h2" className="text-xl font-bold text-ui-fg-base">
            {stats.total_retail} KM
          </Heading>
        </Container>

        <Container className="p-4 shadow-sm">
          <div className="flex items-center gap-2 text-ui-fg-muted mb-1">
            <Users className="w-4 h-4" />
            <Text className="text-xs">Ukupno Narudžbi</Text>
          </div>
          <Heading level="h2" className="text-xl font-bold text-ui-fg-base">
            {stats.total_orders}
          </Heading>
          <Text className="text-[10px] text-ui-fg-muted mt-0.5">
            {stats.delivered_orders} isporučeno • {stats.returned_orders} vraćeno
          </Text>
        </Container>

        <Container className="p-4 shadow-sm">
          <div className="flex items-center gap-2 text-ui-fg-muted mb-1">
            <Cash className="w-4 h-4" />
            <Text className="text-xs">Zarađena Provizija</Text>
          </div>
          <Heading level="h2" className="text-xl font-bold text-ui-fg-base">
            {stats.total_commission} KM
          </Heading>
          <Text className="text-[10px] text-ui-fg-muted mt-0.5">
            Model: {reseller.commission_type === "percentage" ? `${reseller.commission_rate}%` : `${reseller.commission_rate} KM`}
          </Text>
        </Container>

        <Container className="p-4 shadow-sm bg-ui-bg-highlight/30 border-ui-border-interactive/30">
          <div className="flex items-center gap-2 text-ui-fg-interactive mb-1">
            <Cash className="w-4 h-4" />
            <Text className="text-xs font-medium text-ui-fg-interactive">Spremno za Isplatu</Text>
          </div>
          <Heading level="h2" className="text-xl font-bold text-ui-fg-interactive">
            {stats.eligible_unpaid} KM
          </Heading>
        </Container>

        <Container className="p-4 shadow-sm">
          <div className="flex items-center gap-2 text-ui-fg-muted mb-1">
            <Cash className="w-4 h-4" />
            <Text className="text-xs">Do Sada Isplaćeno</Text>
          </div>
          <Heading level="h2" className="text-xl font-bold text-ui-fg-base">
            {stats.paid_commission} KM
          </Heading>
        </Container>
      </div>

      {/* Navigacijski tabovi za detaljni ekran */}
      <div className="flex items-center gap-2 border-b pb-2">
        <Button
          variant={activeTab === "orders" ? "primary" : "secondary"}
          size="small"
          onClick={() => setActiveTab("orders")}
        >
          <ShoppingBag className="mr-1" /> Narudžbe ({reseller.orders?.length || 0})
        </Button>
        <Button
          variant={activeTab === "profile" ? "primary" : "secondary"}
          size="small"
          onClick={() => setActiveTab("profile")}
        >
          <Key className="mr-1" /> Profil & API Podaci
        </Button>
        <Button
          variant={activeTab === "payouts" ? "primary" : "secondary"}
          size="small"
          onClick={() => setActiveTab("payouts")}
        >
          <Cash className="mr-1" /> Isplate Provizija ({reseller.payouts?.length || 0})
        </Button>
      </div>

      {/* Sadržaj aktivnog taba */}
      {activeTab === "orders" && (
        <ResellerOrdersList
          orders={reseller.orders || []}
          onOrderUpdated={loadReseller}
        />
      )}

      {activeTab === "profile" && (
        <ResellerProfileCard
          reseller={reseller}
          salesChannels={salesChannels}
          onUpdated={loadReseller}
        />
      )}

      {activeTab === "payouts" && (
        <ResellerPayoutsList
          payouts={reseller.payouts || []}
        />
      )}

      {/* Modal za isplatu provizije */}
      {payoutModalOpen && (
        <CreatePayoutModal
          open={payoutModalOpen}
          reseller={reseller}
          onOpenChange={(isOpen) => setPayoutModalOpen(isOpen)}
          onSuccess={() => {
            setPayoutModalOpen(false)
            loadReseller()
          }}
        />
      )}
    </div>
  )
}

export default ResellerDetailPage
