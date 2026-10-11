import React from "react"
import { Container, Table, Badge, StatusBadge, Button } from "@medusajs/ui"
import { Eye, ArrowDownTray, CheckCircleSolid } from "@medusajs/icons"
import { ReceiptsTabProps } from "../types"

export const ReceiptsTab: React.FC<ReceiptsTabProps> = ({
  receipts,
  locationMap,
  onSelectReceipt,
  onPostReceipt,
  onPrintReceipt,
}) => {
  return (
    <Container className="p-0 overflow-hidden shadow-sm w-full">
      <div className="overflow-x-auto w-full">
        <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Broj Dokumenta</Table.HeaderCell>
            <Table.HeaderCell>Dobavljač</Table.HeaderCell>
            <Table.HeaderCell>Broj Fakture</Table.HeaderCell>
            <Table.HeaderCell>Ciljni Magacin</Table.HeaderCell>
            <Table.HeaderCell>Stavke</Table.HeaderCell>
            <Table.HeaderCell>Status</Table.HeaderCell>
            <Table.HeaderCell className="text-right">Akcije</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {receipts.length === 0 ? (
            <Table.Row>
              <td className="text-center py-8 text-ui-fg-muted" colSpan={7}>
                Nema evidentiranih prijemnica robe.
              </td>
            </Table.Row>
          ) : (
            receipts.map((r) => (
              <Table.Row key={r.id}>
                <Table.Cell className="font-semibold text-ui-fg-base">
                  <button
                    onClick={() => onSelectReceipt(r)}
                    className="hover:underline text-ui-fg-interactive font-mono cursor-pointer"
                  >
                    {r.receipt_number}
                  </button>
                </Table.Cell>
                <Table.Cell>{r.supplier_name}</Table.Cell>
                <Table.Cell>{r.invoice_number}</Table.Cell>
                <Table.Cell>{locationMap[r.stock_location_id] || r.stock_location_id}</Table.Cell>
                <Table.Cell>
                  <Badge size="small" color="grey">
                    {r.items?.length || 0} stavki
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  {r.status === "posted" ? (
                    <StatusBadge color="green">Proknjiženo</StatusBadge>
                  ) : r.status === "draft" ? (
                    <StatusBadge color="orange">U pripremi (Draft)</StatusBadge>
                  ) : (
                    <StatusBadge color="red">Otkazano</StatusBadge>
                  )}
                </Table.Cell>
                <Table.Cell className="text-right">
                  <div className="flex items-center justify-end gap-x-1.5">
                    <Button
                      size="small"
                      variant="secondary"
                      title="Pregledaj detalje"
                      onClick={() => onSelectReceipt(r)}
                    >
                      <Eye className="text-ui-fg-subtle" />
                    </Button>
                    <Button
                      size="small"
                      variant="secondary"
                      title="Štampaj / Preuzmi PDF"
                      onClick={() => onPrintReceipt(r)}
                    >
                      <ArrowDownTray className="text-ui-fg-subtle" />
                    </Button>
                    {r.status === "draft" && (
                      <Button
                        size="small"
                        variant="secondary"
                        onClick={() => onPostReceipt(r.id, r.receipt_number)}
                      >
                        <CheckCircleSolid className="mr-1 text-emerald-600" />
                        Proknjiži
                      </Button>
                    )}
                  </div>
                </Table.Cell>
              </Table.Row>
            ))
          )}
        </Table.Body>
      </Table>
      </div>
    </Container>
  )
}
