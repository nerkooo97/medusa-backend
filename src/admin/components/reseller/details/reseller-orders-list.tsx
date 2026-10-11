import { Badge, Button, Container, Select, Table, Text, toast } from "@medusajs/ui"
import { ArrowPath, ShoppingBag } from "@medusajs/icons"
import { useState } from "react"
import { ResellerOrderData } from "../types"

interface ResellerOrdersListProps {
  orders: ResellerOrderData[]
  onOrderUpdated: () => void
}

export const ResellerOrdersList = ({ orders, onOrderUpdated }: ResellerOrdersListProps) => {
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const filteredOrders = orders.filter((o) => {
    if (filterStatus === "all") return true
    return o.order_status === filterStatus
  })

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId)
    try {
      const res = await fetch(`/admin/resellers/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_status: newStatus }),
      })
      if (res.ok) {
        toast.success("Status narudžbe je uspješno promijenjen.")
        onOrderUpdated()
      } else {
        const d = await res.json()
        toast.error(d.message || "Greška pri ažuriranju statusa.")
      }
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setUpdatingId(null)
    }
  }

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge color="grey">Na čekanju</Badge>
      case "processing":
        return <Badge color="blue">U obradi</Badge>
      case "shipped":
        return <Badge color="purple">Poslano</Badge>
      case "delivered":
        return <Badge color="green">Isporučeno</Badge>
      case "returned":
        return <Badge color="orange">Vraćeno</Badge>
      case "canceled":
        return <Badge color="red">Otkazano</Badge>
      default:
        return <Badge color="grey">{status}</Badge>
    }
  }

  const getPayoutStatusBadge = (status: string) => {
    switch (status) {
      case "unearned":
        return <Badge color="grey">Na čekanju</Badge>
      case "eligible":
        return <Badge color="green">Spremno za isplatu</Badge>
      case "paid":
        return <Badge color="blue">Isplaćeno</Badge>
      default:
        return <Badge color="grey">{status}</Badge>
    }
  }

  const statusCounts = {
    all: orders.length,
    pending: orders.filter((o) => o.order_status === "pending").length,
    processing: orders.filter((o) => o.order_status === "processing").length,
    shipped: orders.filter((o) => o.order_status === "shipped").length,
    delivered: orders.filter((o) => o.order_status === "delivered").length,
    returned: orders.filter((o) => o.order_status === "returned").length,
    canceled: orders.filter((o) => o.order_status === "canceled").length,
  }

  return (
    <div className="space-y-3 w-full">
      {/* Filter tabovi po statusu */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 w-full text-xs">
        <Button
          variant={filterStatus === "all" ? "primary" : "secondary"}
          size="small"
          onClick={() => setFilterStatus("all")}
          className="whitespace-nowrap"
        >
          Sve ({statusCounts.all})
        </Button>
        <Button
          variant={filterStatus === "pending" ? "primary" : "secondary"}
          size="small"
          onClick={() => setFilterStatus("pending")}
          className="whitespace-nowrap"
        >
          Na čekanju ({statusCounts.pending})
        </Button>
        <Button
          variant={filterStatus === "shipped" ? "primary" : "secondary"}
          size="small"
          onClick={() => setFilterStatus("shipped")}
          className="whitespace-nowrap"
        >
          Poslano ({statusCounts.shipped})
        </Button>
        <Button
          variant={filterStatus === "delivered" ? "primary" : "secondary"}
          size="small"
          onClick={() => setFilterStatus("delivered")}
          className="whitespace-nowrap"
        >
          Isporučeno ({statusCounts.delivered})
        </Button>
        <Button
          variant={filterStatus === "returned" ? "primary" : "secondary"}
          size="small"
          onClick={() => setFilterStatus("returned")}
          className="whitespace-nowrap"
        >
          Vraćeno ({statusCounts.returned})
        </Button>
        <Button
          variant={filterStatus === "canceled" ? "primary" : "secondary"}
          size="small"
          onClick={() => setFilterStatus("canceled")}
          className="whitespace-nowrap"
        >
          Otkazano ({statusCounts.canceled})
        </Button>
      </div>

      {filteredOrders.length === 0 ? (
        <Container className="p-8 text-center text-ui-fg-subtle">
          <ShoppingBag className="mx-auto mb-2 text-ui-fg-muted" />
          <Text>Nema pronađenih narudžbi za odabrani status.</Text>
        </Container>
      ) : (
        <Container className="p-0 overflow-hidden shadow-sm w-full">
          <div className="overflow-x-auto w-full">
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell className="whitespace-nowrap">ID Narudžbe</Table.HeaderCell>
                  <Table.HeaderCell className="whitespace-nowrap">Datum</Table.HeaderCell>
                  <Table.HeaderCell className="whitespace-nowrap">Krajnji Kupac</Table.HeaderCell>
                  <Table.HeaderCell className="whitespace-nowrap">Telefon & Lokacija</Table.HeaderCell>
                  <Table.HeaderCell className="whitespace-nowrap">MPC Iznos</Table.HeaderCell>
                  <Table.HeaderCell className="whitespace-nowrap">Nabavna Cijena</Table.HeaderCell>
                  <Table.HeaderCell className="whitespace-nowrap">Provizija (Zarada)</Table.HeaderCell>
                  <Table.HeaderCell className="whitespace-nowrap">Status Narudžbe</Table.HeaderCell>
                  <Table.HeaderCell className="whitespace-nowrap">Status Provizije</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {filteredOrders.map((o) => (
                  <Table.Row key={o.id} className="hover:bg-ui-bg-subtle/50">
                    <Table.Cell className="whitespace-nowrap font-mono text-xs font-medium">
                      <a
                        href={`/app/orders/${o.order_id}`}
                        className="text-ui-fg-interactive hover:underline cursor-pointer"
                        title="Otvori standardnu Medusa narudžbu"
                      >
                        {o.order_id}
                      </a>
                    </Table.Cell>
                    <Table.Cell className="whitespace-nowrap text-xs text-ui-fg-subtle">
                      {new Date(o.created_at).toLocaleString("bs-BA", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Table.Cell>
                    <Table.Cell className="whitespace-nowrap text-sm font-medium">
                      {o.customer_name}
                    </Table.Cell>
                    <Table.Cell className="whitespace-nowrap text-xs text-ui-fg-subtle">
                      <div>{o.customer_phone}</div>
                      <div className="text-[11px] text-ui-fg-muted">{o.customer_city}, {o.customer_address}</div>
                    </Table.Cell>
                    <Table.Cell className="whitespace-nowrap text-xs font-semibold">
                      {Number(o.retail_total)} KM
                    </Table.Cell>
                    <Table.Cell className="whitespace-nowrap text-xs text-ui-fg-muted">
                      {Number(o.reseller_cost)} KM
                    </Table.Cell>
                    <Table.Cell className="whitespace-nowrap text-xs font-bold text-ui-fg-interactive">
                      +{Number(o.commission_earned)} KM
                    </Table.Cell>
                    <Table.Cell className="whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {getOrderStatusBadge(o.order_status)}
                        <select
                          className="text-xs bg-ui-bg-base border border-ui-border-base rounded px-1 py-0.5"
                          value={o.order_status}
                          disabled={updatingId === o.id}
                          onChange={(e) => handleStatusChange(o.id, e.target.value)}
                        >
                          <option value="pending">Na čekanju</option>
                          <option value="processing">U obradi</option>
                          <option value="shipped">Poslano</option>
                          <option value="delivered">Isporučeno</option>
                          <option value="returned">Vraćeno</option>
                          <option value="canceled">Otkazano</option>
                        </select>
                      </div>
                    </Table.Cell>
                    <Table.Cell className="whitespace-nowrap">
                      {getPayoutStatusBadge(o.payout_status)}
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
