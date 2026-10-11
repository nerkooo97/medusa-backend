import { Badge, Container, Table, Text } from "@medusajs/ui"
import { Cash, CheckCircleSolid } from "@medusajs/icons"
import { ResellerPayoutData } from "../types"

interface ResellerPayoutsListProps {
  payouts: ResellerPayoutData[]
}

export const ResellerPayoutsList = ({ payouts }: ResellerPayoutsListProps) => {
  if (payouts.length === 0) {
    return (
      <Container className="p-8 text-center text-ui-fg-subtle">
        <Cash className="mx-auto mb-2 text-ui-fg-muted" />
        <Text>Za ovog preprodavača još nema evidentiranih isplata.</Text>
      </Container>
    )
  }

  return (
    <Container className="p-0 overflow-hidden shadow-sm w-full">
      <div className="overflow-x-auto w-full">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell className="whitespace-nowrap">ID Isplate</Table.HeaderCell>
              <Table.HeaderCell className="whitespace-nowrap">Datum Isplate</Table.HeaderCell>
              <Table.HeaderCell className="whitespace-nowrap">Isplaćeni Iznos</Table.HeaderCell>
              <Table.HeaderCell className="whitespace-nowrap">Način Plaćanja</Table.HeaderCell>
              <Table.HeaderCell className="whitespace-nowrap">Broj Uplatnice / Ref.</Table.HeaderCell>
              <Table.HeaderCell className="whitespace-nowrap">Status</Table.HeaderCell>
              <Table.HeaderCell className="whitespace-nowrap">Napomena</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {payouts.map((p) => (
              <Table.Row key={p.id} className="hover:bg-ui-bg-subtle/50">
                <Table.Cell className="whitespace-nowrap font-mono text-xs">
                  {p.id}
                </Table.Cell>
                <Table.Cell className="whitespace-nowrap text-xs text-ui-fg-subtle">
                  {p.paid_at
                    ? new Date(p.paid_at).toLocaleString("bs-BA", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : new Date(p.created_at).toLocaleDateString("bs-BA")}
                </Table.Cell>
                <Table.Cell className="whitespace-nowrap text-sm font-bold text-ui-fg-interactive">
                  {Number(p.amount)} KM
                </Table.Cell>
                <Table.Cell className="whitespace-nowrap text-xs">
                  {p.payment_method === "bank_transfer"
                    ? "Žiro račun (Banka)"
                    : p.payment_method === "cash"
                    ? "Gotovina"
                    : p.payment_method}
                </Table.Cell>
                <Table.Cell className="whitespace-nowrap font-mono text-xs">
                  {p.reference_number || "-"}
                </Table.Cell>
                <Table.Cell className="whitespace-nowrap">
                  <Badge color="green" className="inline-flex items-center gap-1">
                    <CheckCircleSolid /> Isplaćeno
                  </Badge>
                </Table.Cell>
                <Table.Cell className="whitespace-nowrap text-xs text-ui-fg-muted">
                  {p.notes || "-"}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </div>
    </Container>
  )
}
