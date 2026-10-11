import React from "react"
import { Container, Table, Badge, StatusBadge, Button } from "@medusajs/ui"
import { Eye, ArrowDownTray, CheckCircleSolid } from "@medusajs/icons"
import { WriteOffsTabProps } from "../types"

export const WriteOffsTab: React.FC<WriteOffsTabProps> = ({
  writeOffs,
  locationMap,
  onSelectWriteOff,
  onPostWriteOff,
  onPrintWriteOff,
  getReasonBadge,
}) => {
  return (
    <Container className="p-0 overflow-hidden shadow-sm w-full">
      <div className="overflow-x-auto w-full">
        <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Broj Zapisnika</Table.HeaderCell>
            <Table.HeaderCell>Magacin</Table.HeaderCell>
            <Table.HeaderCell>Razlog Rashoda</Table.HeaderCell>
            <Table.HeaderCell>Komisija / Obrazloženje</Table.HeaderCell>
            <Table.HeaderCell>Stavke</Table.HeaderCell>
            <Table.HeaderCell>Status</Table.HeaderCell>
            <Table.HeaderCell className="text-right">Akcije</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {writeOffs.length === 0 ? (
            <Table.Row>
              <td className="text-center py-8 text-ui-fg-muted" colSpan={7}>
                Nema evidentiranih zapisnika o otpisu robe.
              </td>
            </Table.Row>
          ) : (
            writeOffs.map((w) => (
              <Table.Row key={w.id}>
                <Table.Cell className="font-semibold text-ui-fg-base">
                  <button
                    onClick={() => onSelectWriteOff(w)}
                    className="hover:underline text-ui-fg-interactive font-mono cursor-pointer"
                  >
                    {w.write_off_number}
                  </button>
                </Table.Cell>
                <Table.Cell>{locationMap[w.stock_location_id] || w.stock_location_id}</Table.Cell>
                <Table.Cell>{getReasonBadge(w.reason)}</Table.Cell>
                <Table.Cell className="text-xs text-ui-fg-subtle truncate max-w-xs">
                  {w.commission_members || w.notes || "-"}
                </Table.Cell>
                <Table.Cell>
                  <Badge size="small" color="grey">
                    {w.items?.length || 0} stavki
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  {w.status === "posted" ? (
                    <StatusBadge color="red">Proknjižen Rashod</StatusBadge>
                  ) : w.status === "draft" ? (
                    <StatusBadge color="orange">U pripremi (Draft)</StatusBadge>
                  ) : (
                    <StatusBadge color="grey">Otkazano</StatusBadge>
                  )}
                </Table.Cell>
                <Table.Cell className="text-right">
                  <div className="flex items-center justify-end gap-x-1.5">
                    <Button
                      size="small"
                      variant="secondary"
                      title="Pregledaj detalje"
                      onClick={() => onSelectWriteOff(w)}
                    >
                      <Eye className="text-ui-fg-subtle" />
                    </Button>
                    <Button
                      size="small"
                      variant="secondary"
                      title="Štampaj / Preuzmi PDF (Zapisnik o otpisu)"
                      onClick={() => onPrintWriteOff(w)}
                    >
                      <ArrowDownTray className="text-ui-fg-subtle" />
                    </Button>
                    {w.status === "draft" && (
                      <Button
                        size="small"
                        variant="secondary"
                        onClick={() => onPostWriteOff(w.id, w.write_off_number)}
                      >
                        <CheckCircleSolid className="mr-1 text-rose-600" />
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
