import React from "react"
import { Container, Table, Badge } from "@medusajs/ui"
import { MovementsTabProps } from "../types"

export const MovementsTab: React.FC<MovementsTabProps> = ({
  movements,
  locationMap,
}) => {
  return (
    <Container className="p-0 overflow-hidden shadow-sm">
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Datum i Vrijeme</Table.HeaderCell>
            <Table.HeaderCell>SKU</Table.HeaderCell>
            <Table.HeaderCell>Magacin</Table.HeaderCell>
            <Table.HeaderCell>Promjena Količine</Table.HeaderCell>
            <Table.HeaderCell>Tip Događaja</Table.HeaderCell>
            <Table.HeaderCell>Dokument / Referenca</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {movements.length === 0 ? (
            <Table.Row>
              <td className="text-center py-8 text-ui-fg-muted" colSpan={6}>
                Nema zabilježenih kretanja zaliha.
              </td>
            </Table.Row>
          ) : (
            movements.map((m) => (
              <Table.Row key={m.id}>
                <Table.Cell className="text-xs text-ui-fg-subtle">
                  {new Date(m.created_at).toLocaleString("bs-BA")}
                </Table.Cell>
                <Table.Cell className="font-mono font-medium">{m.sku || "-"}</Table.Cell>
                <Table.Cell>{locationMap[m.stock_location_id] || m.stock_location_id}</Table.Cell>
                <Table.Cell>
                  <span
                    className={`font-semibold ${
                      m.quantity_change > 0 ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {m.quantity_change > 0 ? `+${m.quantity_change}` : m.quantity_change}
                  </span>
                </Table.Cell>
                <Table.Cell>
                  <Badge size="small" color={m.quantity_change > 0 ? "green" : "red"}>
                    {m.document_type === "receipt"
                      ? "Prijemnica (Ulaz)"
                      : m.document_type === "transfer_dispatch"
                      ? "Transfer (Otprema)"
                      : m.document_type === "transfer_receive"
                      ? "Transfer (Prijem)"
                      : m.document_type === "order_fulfillment"
                      ? "Otprema Narudžbe (Izlaz)"
                      : m.document_type === "adjustment"
                      ? (m.quantity_change > 0 ? "Storno / Povrat" : "Korekcija / Otpis")
                      : m.document_type}
                  </Badge>
                </Table.Cell>
                <Table.Cell className="font-semibold text-ui-fg-base">
                  {m.document_type === "order_fulfillment" || m.reference_number?.startsWith("ORD-") ? (
                    <span className="inline-flex items-center gap-1 font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded text-xs font-semibold border border-purple-200">
                      🛒 {m.reference_number || m.document_id}
                    </span>
                  ) : (
                    <span className="font-mono text-xs">{m.reference_number || m.document_id}</span>
                  )}
                </Table.Cell>
              </Table.Row>
            ))
          )}
        </Table.Body>
      </Table>
    </Container>
  )
}
