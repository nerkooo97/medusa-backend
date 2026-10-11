import React from "react"
import { Heading, Text, Button, StatusBadge, Table } from "@medusajs/ui"
import { XMark, ArrowDownTray, CheckCircleSolid, Trash } from "@medusajs/icons"
import { ViewWriteOffModalProps } from "../types"

export const ViewWriteOffModal: React.FC<ViewWriteOffModalProps> = ({
  writeOff,
  onClose,
  onPost,
  onPrint,
  locationMap,
  getReasonBadge,
}) => {
  if (!writeOff) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-ui-bg-base border border-ui-border-base rounded-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto flex flex-col gap-y-4 shadow-2xl">
        <div className="flex justify-between items-center pb-3 border-b">
          <div className="flex items-center gap-x-2">
            <Trash className="text-rose-500" />
            <Heading className="text-lg font-semibold">
              Zapisnik o Otpisu: {writeOff.write_off_number}
            </Heading>
          </div>
          <Button size="small" variant="transparent" onClick={onClose}>
            <XMark />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4 bg-ui-bg-subtle p-3 rounded-lg text-xs">
          <div>
            <span className="text-ui-fg-muted block">Magacin / Skladište:</span>
            <span className="font-semibold text-sm">
              {locationMap[writeOff.stock_location_id] || writeOff.stock_location_id}
            </span>
          </div>
          <div>
            <span className="text-ui-fg-muted block">Razlog Rashoda:</span>
            <div className="mt-1">{getReasonBadge(writeOff.reason)}</div>
          </div>
          <div>
            <span className="text-ui-fg-muted block">Status:</span>
            <span className="font-semibold">
              {writeOff.status === "posted" ? (
                <StatusBadge color="red">Proknjižen Rashod</StatusBadge>
              ) : writeOff.status === "draft" ? (
                <StatusBadge color="orange">U pripremi (Draft)</StatusBadge>
              ) : (
                <StatusBadge color="grey">Otkazano</StatusBadge>
              )}
            </span>
          </div>
          <div>
            <span className="text-ui-fg-muted block">Datum Knjiženja:</span>
            <span className="font-semibold">
              {writeOff.posted_at
                ? new Date(writeOff.posted_at).toLocaleString("bs-BA")
                : "Nije proknjiženo"}
            </span>
          </div>
          {writeOff.commission_members && (
            <div className="col-span-2">
              <span className="text-ui-fg-muted block">Članovi Komisije:</span>
              <span className="font-semibold">{writeOff.commission_members}</span>
            </div>
          )}
          {writeOff.notes && (
            <div className="col-span-2">
              <span className="text-ui-fg-muted block">Napomena / Obrazloženje:</span>
              <span className="italic">{writeOff.notes}</span>
            </div>
          )}
        </div>

        <div>
          <Text className="text-sm font-semibold mb-2">Rashodovani Artikli na Zapisniku</Text>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>#</Table.HeaderCell>
                  <Table.HeaderCell>SKU</Table.HeaderCell>
                  <Table.HeaderCell>Naziv Artikla</Table.HeaderCell>
                  <Table.HeaderCell>Opis Kvara / Oštećenja</Table.HeaderCell>
                  <Table.HeaderCell className="text-right">Količina</Table.HeaderCell>
                  <Table.HeaderCell className="text-right">Nabavna Cijena</Table.HeaderCell>
                  <Table.HeaderCell className="text-right">Ukupan Rashod</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {(writeOff.items || []).map((item: any, idx: number) => (
                  <Table.Row key={item.id}>
                    <Table.Cell className="text-xs">{idx + 1}.</Table.Cell>
                    <Table.Cell className="font-mono text-xs font-semibold">{item.sku}</Table.Cell>
                    <Table.Cell className="text-xs">{item.title || item.sku}</Table.Cell>
                    <Table.Cell className="text-xs text-ui-fg-subtle">{item.item_notes || "-"}</Table.Cell>
                    <Table.Cell className="text-right font-semibold text-xs text-rose-600">
                      {item.quantity} kom.
                    </Table.Cell>
                    <Table.Cell className="text-right text-xs">
                      {item.unit_cost ? Number(item.unit_cost).toFixed(2) + " KM" : "-"}
                    </Table.Cell>
                    <Table.Cell className="text-right font-bold text-xs text-rose-700">
                      {item.total_cost
                        ? Number(item.total_cost).toFixed(2) + " KM"
                        : item.unit_cost
                        ? (Number(item.unit_cost) * item.quantity).toFixed(2) + " KM"
                        : "-"}
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <Button variant="secondary" onClick={() => onPrint(writeOff)}>
            <ArrowDownTray className="mr-2" />
            Štampaj Zapisnik (PDF)
          </Button>
          <div className="flex gap-x-2">
            {writeOff.status === "draft" && (
              <Button
                variant="primary"
                onClick={() => onPost(writeOff.id, writeOff.write_off_number)}
              >
                <CheckCircleSolid className="mr-2 text-rose-200" />
                Proknjiži Rashod (Skini sa zaliha)
              </Button>
            )}
            <Button variant="secondary" onClick={onClose}>
              Zatvori
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
