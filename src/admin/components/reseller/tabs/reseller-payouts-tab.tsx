import { Badge, Button, Container, Table, Text, toast } from "@medusajs/ui"
import { ArrowPath, Cash, CheckCircleSolid } from "@medusajs/icons"
import { useEffect, useState } from "react"
import { ResellerPayoutData } from "../types"

export const ResellerPayoutsTab = () => {
  const [payouts, setPayouts] = useState<ResellerPayoutData[]>([])
  const [loading, setLoading] = useState(false)

  const loadPayouts = () => {
    setLoading(true)
    fetch("/admin/resellers/payouts")
      .then((r) => r.json())
      .then((d) => setPayouts(d.payouts || []))
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadPayouts()
  }, [])

  if (loading) {
    return (
      <Container className="p-12 text-center flex flex-col items-center justify-center text-ui-fg-subtle">
        <ArrowPath className="animate-spin mb-2 text-ui-fg-muted" />
        <Text>Učitavanje isplata...</Text>
      </Container>
    )
  }

  if (payouts.length === 0) {
    return (
      <Container className="p-12 text-center flex flex-col items-center justify-center text-ui-fg-subtle">
        <Cash className="mb-2 text-ui-fg-muted" />
        <Text>Do sada nema evidentiranih isplata provizija.</Text>
      </Container>
    )
  }

  return (
    <div className="space-y-4 w-full">
      <div className="flex items-center justify-end">
        <Button variant="secondary" size="small" onClick={loadPayouts}>
          <ArrowPath className="mr-1" /> Osvježi
        </Button>
      </div>

      <Container className="p-0 overflow-hidden shadow-sm w-full">
        <div className="overflow-x-auto w-full">
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell className="whitespace-nowrap">ID Isplate</Table.HeaderCell>
                <Table.HeaderCell className="whitespace-nowrap">Preprodavač</Table.HeaderCell>
                <Table.HeaderCell className="whitespace-nowrap">Isplaćeni Iznos</Table.HeaderCell>
                <Table.HeaderCell className="whitespace-nowrap">Način Plaćanja</Table.HeaderCell>
                <Table.HeaderCell className="whitespace-nowrap">Broj Uplatnice / Ref.</Table.HeaderCell>
                <Table.HeaderCell className="whitespace-nowrap">Status</Table.HeaderCell>
                <Table.HeaderCell className="whitespace-nowrap">Datum Isplate</Table.HeaderCell>
                <Table.HeaderCell className="whitespace-nowrap">Napomena</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {payouts.map((p) => (
                <Table.Row key={p.id}>
                  <Table.Cell className="font-mono text-xs font-semibold whitespace-nowrap">
                    {p.id}
                  </Table.Cell>
                  <Table.Cell className="font-medium text-ui-fg-base whitespace-nowrap">
                    {p.reseller?.name || p.reseller_id}
                  </Table.Cell>
                  <Table.Cell className="font-bold text-ui-fg-interactive text-sm whitespace-nowrap">
                    {p.amount} KM
                  </Table.Cell>
                  <Table.Cell className="text-xs whitespace-nowrap capitalize">
                    {p.payment_method === "bank_transfer" ? "Bankovna Doznaka" : p.payment_method}
                  </Table.Cell>
                  <Table.Cell className="text-xs font-mono text-ui-fg-muted whitespace-nowrap">
                    {p.reference_number || "—"}
                  </Table.Cell>
                  <Table.Cell className="whitespace-nowrap">
                    <Badge color="green" className="inline-flex items-center gap-1 whitespace-nowrap">
                      <CheckCircleSolid /> Završeno
                    </Badge>
                  </Table.Cell>
                  <Table.Cell className="text-xs text-ui-fg-subtle whitespace-nowrap">
                    {p.paid_at
                      ? new Date(p.paid_at).toLocaleString("bs-BA")
                      : new Date(p.created_at).toLocaleString("bs-BA")}
                  </Table.Cell>
                  <Table.Cell className="text-xs text-ui-fg-subtle whitespace-nowrap truncate max-w-xs">
                    {p.notes || "—"}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </div>
      </Container>
    </div>
  )
}
