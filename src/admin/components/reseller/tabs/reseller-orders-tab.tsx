import { Badge, Button, Container, Select, Table, Text, toast } from "@medusajs/ui"
import { ArrowPath, CheckCircleSolid, Clock, ShoppingBag } from "@medusajs/icons"
import { useEffect, useState } from "react"
import { ResellerData, ResellerOrderData } from "../types"

interface ResellerOrdersTabProps {
  resellers: ResellerData[]
}

export const ResellerOrdersTab = ({ resellers }: ResellerOrdersTabProps) => {
  const [orders, setOrders] = useState<ResellerOrderData[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedResellerId, setSelectedResellerId] = useState<string>("all")
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const loadOrders = () => {
    setLoading(true)
    const url =
      selectedResellerId && selectedResellerId !== "all"
        ? `/admin/resellers/orders?reseller_id=${selectedResellerId}`
        : "/admin/resellers/orders"

    fetch(url)
      .then((r) => r.json())
      .then((d) => setOrders(d.orders || []))
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadOrders()
  }, [selectedResellerId])

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId)
    try {
      const res = await fetch(`/admin/resellers/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_status: newStatus }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message || "Status narudžbe je ažuriran.")
        loadOrders()
      } else {
        toast.error(data.message || "Greška pri ažuriranju.")
      }
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setUpdatingId(null)
    }
  }

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case "delivered":
        return <Badge color="green" className="whitespace-nowrap"><CheckCircleSolid /> Isporučeno</Badge>
      case "shipped":
        return <Badge color="blue" className="whitespace-nowrap">Poslano (Na putu)</Badge>
      case "processing":
        return <Badge color="purple" className="whitespace-nowrap">U obradi</Badge>
      case "returned":
        return <Badge color="red" className="whitespace-nowrap">Vraćeno</Badge>
      case "canceled":
        return <Badge color="grey" className="whitespace-nowrap">Otkazano</Badge>
      default:
        return <Badge color="orange" className="whitespace-nowrap"><Clock /> Na čekanju</Badge>
    }
  }

  const getPayoutBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge color="green" className="whitespace-nowrap">Isplaćeno</Badge>
      case "eligible":
        return <Badge color="blue" className="font-semibold whitespace-nowrap">Spremno za Isplatu</Badge>
      default:
        return <Badge color="grey" className="whitespace-nowrap">Na Čekanju</Badge>
    }
  }

  return (
    <div className="space-y-4 w-full">
      {/* Filter po preprodavaču */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Text className="text-sm font-medium">Filter Preprodavača:</Text>
          <div className="w-56">
            <Select value={selectedResellerId} onValueChange={setSelectedResellerId}>
              <Select.Trigger>
                <Select.Value />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="all">Svi Preprodavači</Select.Item>
                {resellers.map((r) => (
                  <Select.Item key={r.id} value={r.id}>
                    {r.name}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select>
          </div>
        </div>

        <Button variant="secondary" size="small" onClick={loadOrders} isLoading={loading}>
          <ArrowPath className="mr-1" /> Osvježi
        </Button>
      </div>

      {loading ? (
        <Container className="p-12 text-center flex flex-col items-center justify-center text-ui-fg-subtle">
          <ArrowPath className="animate-spin mb-2 text-ui-fg-muted" />
          <Text>Učitavanje narudžbi...</Text>
        </Container>
      ) : orders.length === 0 ? (
        <Container className="p-12 text-center flex flex-col items-center justify-center text-ui-fg-subtle">
          <ShoppingBag className="mb-2 text-ui-fg-muted" />
          <Text>Nema narudžbi za prikaz.</Text>
        </Container>
      ) : (
        <Container className="p-0 overflow-hidden shadow-sm w-full">
          <div className="overflow-x-auto w-full">
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell className="whitespace-nowrap">ID Narudžbe</Table.HeaderCell>
                  <Table.HeaderCell className="whitespace-nowrap">Preprodavač</Table.HeaderCell>
                  <Table.HeaderCell className="whitespace-nowrap">Krajnji Kupac & Grad</Table.HeaderCell>
                  <Table.HeaderCell className="whitespace-nowrap">Cijena (MPC)</Table.HeaderCell>
                  <Table.HeaderCell className="whitespace-nowrap">Zarada Preprodavača</Table.HeaderCell>
                  <Table.HeaderCell className="whitespace-nowrap">Status Paketa</Table.HeaderCell>
                  <Table.HeaderCell className="whitespace-nowrap">Status Isplate</Table.HeaderCell>
                  <Table.HeaderCell className="whitespace-nowrap">Datum</Table.HeaderCell>
                  <Table.HeaderCell className="text-right whitespace-nowrap">Promijeni Status</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {orders.map((o) => (
                  <Table.Row key={o.id}>
                    <Table.Cell className="font-mono text-xs font-semibold whitespace-nowrap">
                      <a
                        href={`/app/orders/${o.order_id}`}
                        className="text-ui-fg-interactive hover:underline cursor-pointer"
                        title="Otvori standardnu Medusa narudžbu"
                      >
                        {o.order_id}
                      </a>
                    </Table.Cell>
                    <Table.Cell className="font-medium text-ui-fg-base whitespace-nowrap">
                      {o.reseller?.name || o.reseller_id}
                    </Table.Cell>
                    <Table.Cell className="whitespace-nowrap text-xs">
                      <div className="font-medium text-ui-fg-base">{o.customer_name}</div>
                      <div className="text-ui-fg-subtle">
                        {o.customer_city} ({o.customer_phone})
                      </div>
                    </Table.Cell>
                    <Table.Cell className="font-bold text-ui-fg-base whitespace-nowrap">
                      {o.retail_total} KM
                    </Table.Cell>
                    <Table.Cell className="font-semibold text-ui-fg-interactive whitespace-nowrap">
                      {o.commission_earned} KM
                    </Table.Cell>
                    <Table.Cell className="whitespace-nowrap">
                      {getOrderStatusBadge(o.order_status)}
                    </Table.Cell>
                    <Table.Cell className="whitespace-nowrap">
                      {getPayoutBadge(o.payout_status)}
                    </Table.Cell>
                    <Table.Cell className="text-xs text-ui-fg-subtle whitespace-nowrap">
                      {new Date(o.created_at).toLocaleDateString("bs-BA")}
                    </Table.Cell>
                    <Table.Cell className="text-right whitespace-nowrap">
                      <div className="w-36 inline-block">
                        <Select
                          value={o.order_status}
                          onValueChange={(val) => handleUpdateStatus(o.id, val)}
                        >
                          <Select.Trigger className="h-7 text-xs">
                            <Select.Value />
                          </Select.Trigger>
                          <Select.Content>
                            <Select.Item value="pending">Na čekanju</Select.Item>
                            <Select.Item value="shipped">Poslano</Select.Item>
                            <Select.Item value="delivered">Isporučeno</Select.Item>
                            <Select.Item value="returned">Vraćeno</Select.Item>
                            <Select.Item value="canceled">Otkazano</Select.Item>
                          </Select.Content>
                        </Select>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>
        </Container>
      )}
    </div>
  )
}
