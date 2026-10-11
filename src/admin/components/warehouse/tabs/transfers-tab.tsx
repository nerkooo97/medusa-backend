import React from "react"
import { Container, Table, Badge, StatusBadge, Button } from "@medusajs/ui"
import { Eye, ArrowDownTray, TruckFast, CheckCircleSolid } from "@medusajs/icons"
import { TransfersTabProps } from "../types"

export const TransfersTab: React.FC<TransfersTabProps> = ({
  transfers,
  locationMap,
  onSelectTransfer,
  onDispatchTransfer,
  onReceiveTransfer,
  onPrintTransfer,
}) => {
  return (
    <Container className="p-0 overflow-hidden shadow-sm w-full">
      <div className="overflow-x-auto w-full">
        <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Broj Dokumenta</Table.HeaderCell>
            <Table.HeaderCell>Izvorni Magacin</Table.HeaderCell>
            <Table.HeaderCell>Odredišni Magacin</Table.HeaderCell>
            <Table.HeaderCell>Stavke</Table.HeaderCell>
            <Table.HeaderCell>Status</Table.HeaderCell>
            <Table.HeaderCell className="text-right">Akcije</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {transfers.length === 0 ? (
            <Table.Row>
              <td className="text-center py-8 text-ui-fg-muted" colSpan={6}>
                Nema evidentiranih međuskladišnica.
              </td>
            </Table.Row>
          ) : (
            transfers.map((t) => (
              <Table.Row key={t.id}>
                <Table.Cell className="font-semibold text-ui-fg-base">
                  <button
                    onClick={() => onSelectTransfer(t)}
                    className="hover:underline text-ui-fg-interactive font-mono cursor-pointer"
                  >
                    {t.transfer_number}
                  </button>
                </Table.Cell>
                <Table.Cell>{locationMap[t.source_location_id] || t.source_location_id}</Table.Cell>
                <Table.Cell>{locationMap[t.destination_location_id] || t.destination_location_id}</Table.Cell>
                <Table.Cell>
                  <Badge size="small" color="grey">
                    {t.items?.length || 0} stavki
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  {t.status === "completed" ? (
                    <StatusBadge color="green">Završeno (Zaprimljeno)</StatusBadge>
                  ) : t.status === "in_transit" ? (
                    <StatusBadge color="blue">U tranzitu (Poslato)</StatusBadge>
                  ) : (
                    <StatusBadge color="orange">U pripremi (Draft)</StatusBadge>
                  )}
                </Table.Cell>
                <Table.Cell className="text-right">
                  <div className="flex items-center justify-end gap-x-1.5">
                    <Button
                      size="small"
                      variant="secondary"
                      title="Pregledaj detalje"
                      onClick={() => onSelectTransfer(t)}
                    >
                      <Eye className="text-ui-fg-subtle" />
                    </Button>
                    <Button
                      size="small"
                      variant="secondary"
                      title="Štampaj / Preuzmi PDF (Otpremnica)"
                      onClick={() => onPrintTransfer(t)}
                    >
                      <ArrowDownTray className="text-ui-fg-subtle" />
                    </Button>
                    {t.status === "draft" && (
                      <Button
                        size="small"
                        variant="secondary"
                        onClick={() => onDispatchTransfer(t.id, t.transfer_number)}
                      >
                        <TruckFast className="mr-1 text-ui-fg-interactive" />
                        Otpremi
                      </Button>
                    )}
                    {t.status === "in_transit" && (
                      <Button
                        size="small"
                        variant="secondary"
                        onClick={() => onReceiveTransfer(t.id, t.transfer_number)}
                      >
                        <CheckCircleSolid className="mr-1 text-emerald-600" />
                        Zaprimi
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
