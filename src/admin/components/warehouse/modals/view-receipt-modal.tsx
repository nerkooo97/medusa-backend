import React from "react"
import { Heading, Text, Button, StatusBadge, Table } from "@medusajs/ui"
import { XMark, ArrowDownTray, CheckCircleSolid } from "@medusajs/icons"
import { ViewReceiptModalProps } from "../types"

export const ViewReceiptModal: React.FC<ViewReceiptModalProps> = ({
  receipt,
  onClose,
  onPost,
  onPrint,
  locationMap,
}) => {
  if (!receipt) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-ui-bg-base border border-ui-border-base rounded-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto flex flex-col gap-y-4 shadow-2xl">
        <div className="flex justify-between items-center pb-3 border-b">
          <Heading className="text-lg font-semibold">
            Prijemnica: {receipt.receipt_number}
          </Heading>
          <Button size="small" variant="transparent" onClick={onClose}>
            <XMark />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4 bg-ui-bg-subtle p-3 rounded-lg text-xs">
          <div>
            <span className="text-ui-fg-muted block">Dobavljač:</span>
            <span className="font-semibold text-sm">{receipt.supplier_name}</span>
          </div>
          <div>
            <span className="text-ui-fg-muted block">Broj Fakture:</span>
            <span className="font-semibold text-sm">{receipt.invoice_number}</span>
          </div>
          <div>
            <span className="text-ui-fg-muted block">Ciljni Magacin:</span>
            <span className="font-semibold">
              {locationMap[receipt.stock_location_id] || receipt.stock_location_id}
            </span>
          </div>
          <div>
            <span className="text-ui-fg-muted block">Datum Računa:</span>
            <span className="font-semibold">
              {receipt.invoice_date
                ? new Date(receipt.invoice_date).toLocaleDateString("bs-BA")
                : "-"}
            </span>
          </div>
          <div>
            <span className="text-ui-fg-muted block">Status:</span>
            <span className="font-semibold">
              {receipt.status === "posted" ? (
                <StatusBadge color="green">Proknjiženo na stanje</StatusBadge>
              ) : receipt.status === "draft" ? (
                <StatusBadge color="orange">U pripremi (Draft)</StatusBadge>
              ) : (
                <StatusBadge color="red">Otkazano</StatusBadge>
              )}
            </span>
          </div>
          <div>
            <span className="text-ui-fg-muted block">Datum Knjiženja:</span>
            <span className="font-semibold">
              {receipt.received_at
                ? new Date(receipt.received_at).toLocaleString("bs-BA")
                : "Nije proknjiženo"}
            </span>
          </div>
          {receipt.notes && (
            <div className="col-span-2">
              <span className="text-ui-fg-muted block">Napomena:</span>
              <span className="italic">{receipt.notes}</span>
            </div>
          )}
        </div>

        <div>
          <Text className="text-sm font-semibold mb-2">Zaprimljene Stavke</Text>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>#</Table.HeaderCell>
                  <Table.HeaderCell>SKU</Table.HeaderCell>
                  <Table.HeaderCell>Naziv Artikla</Table.HeaderCell>
                  <Table.HeaderCell className="text-right">Količina</Table.HeaderCell>
                  <Table.HeaderCell className="text-right">Nabavna Cijena</Table.HeaderCell>
                  <Table.HeaderCell className="text-right">Ukupno</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {(receipt.items || []).map((item: any, idx: number) => (
                  <Table.Row key={item.id}>
                    <Table.Cell className="text-xs">{idx + 1}.</Table.Cell>
                    <Table.Cell className="font-mono text-xs font-semibold">{item.sku}</Table.Cell>
                    <Table.Cell className="text-xs">{item.title || item.sku}</Table.Cell>
                    <Table.Cell className="text-right font-semibold text-xs">{item.quantity}</Table.Cell>
                    <Table.Cell className="text-right text-xs">
                      {item.unit_cost ? Number(item.unit_cost).toFixed(2) + " KM" : "-"}
                    </Table.Cell>
                    <Table.Cell className="text-right font-bold text-xs">
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
          <Button variant="secondary" onClick={() => onPrint(receipt)}>
            <ArrowDownTray className="mr-2" />
            Štampaj / Preuzmi PDF
          </Button>
          <div className="flex gap-x-2">
            {receipt.status === "draft" && (
              <Button
                variant="primary"
                onClick={() => onPost(receipt.id, receipt.receipt_number)}
              >
                <CheckCircleSolid className="mr-2" />
                Proknjiži na Zalihe
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
