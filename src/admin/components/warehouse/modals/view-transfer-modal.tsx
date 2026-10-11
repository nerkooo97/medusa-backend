import React from "react"
import { Heading, Text, Button, StatusBadge, Table } from "@medusajs/ui"
import { XMark, ArrowDownTray, TruckFast, CheckCircleSolid } from "@medusajs/icons"
import { ViewTransferModalProps } from "../types"

export const ViewTransferModal: React.FC<ViewTransferModalProps> = ({
  transfer,
  onClose,
  onDispatch,
  onReceive,
  onPrint,
  locationMap,
}) => {
  if (!transfer) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-ui-bg-base border border-ui-border-base rounded-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto flex flex-col gap-y-4 shadow-2xl">
        <div className="flex justify-between items-center pb-3 border-b">
          <Heading className="text-lg font-semibold">
            Međuskladišnica: {transfer.transfer_number}
          </Heading>
          <Button size="small" variant="transparent" onClick={onClose}>
            <XMark />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4 bg-ui-bg-subtle p-3 rounded-lg text-xs">
          <div>
            <span className="text-ui-fg-muted block">Izvorni Magacin (Šalje):</span>
            <span className="font-semibold text-sm">
              {locationMap[transfer.source_location_id] || transfer.source_location_id}
            </span>
          </div>
          <div>
            <span className="text-ui-fg-muted block">Odredišni Magacin (Prima):</span>
            <span className="font-semibold text-sm">
              {locationMap[transfer.destination_location_id] || transfer.destination_location_id}
            </span>
          </div>
          <div>
            <span className="text-ui-fg-muted block">Status Transfera:</span>
            <span className="font-semibold">
              {transfer.status === "completed" ? (
                <StatusBadge color="green">Završeno (Robu zaprimio odredišni magacin)</StatusBadge>
              ) : transfer.status === "in_transit" ? (
                <StatusBadge color="blue">U tranzitu (Na putu ka odredištu)</StatusBadge>
              ) : (
                <StatusBadge color="orange">U pripremi (Draft)</StatusBadge>
              )}
            </span>
          </div>
          <div>
            <span className="text-ui-fg-muted block">Otpremljeno:</span>
            <span className="font-semibold">
              {transfer.dispatched_at
                ? new Date(transfer.dispatched_at).toLocaleString("bs-BA")
                : "Nije otpremljeno"}
            </span>
          </div>
          {transfer.received_at && (
            <div>
              <span className="text-ui-fg-muted block">Zaprimljeno:</span>
              <span className="font-semibold">
                {new Date(transfer.received_at).toLocaleString("bs-BA")}
              </span>
            </div>
          )}
          {transfer.notes && (
            <div className="col-span-2">
              <span className="text-ui-fg-muted block">Napomena uz prevoz:</span>
              <span className="italic">{transfer.notes}</span>
            </div>
          )}
        </div>

        <div>
          <Text className="text-sm font-semibold mb-2">Stavke za Prenos</Text>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>#</Table.HeaderCell>
                  <Table.HeaderCell>SKU</Table.HeaderCell>
                  <Table.HeaderCell>Naziv Artikla</Table.HeaderCell>
                  <Table.HeaderCell className="text-right">Količina za prenos</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {(transfer.items || []).map((item: any, idx: number) => (
                  <Table.Row key={item.id}>
                    <Table.Cell className="text-xs">{idx + 1}.</Table.Cell>
                    <Table.Cell className="font-mono text-xs font-semibold">{item.sku}</Table.Cell>
                    <Table.Cell className="text-xs">{item.title || item.sku}</Table.Cell>
                    <Table.Cell className="text-right font-semibold text-xs">{item.quantity}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <Button variant="secondary" onClick={() => onPrint(transfer)}>
            <ArrowDownTray className="mr-2" />
            Štampaj Otpremnicu (PDF)
          </Button>
          <div className="flex gap-x-2">
            {transfer.status === "draft" && (
              <Button
                variant="primary"
                onClick={() => onDispatch(transfer.id, transfer.transfer_number)}
              >
                <TruckFast className="mr-2" />
                Otpremi Robu
              </Button>
            )}
            {transfer.status === "in_transit" && (
              <Button
                variant="primary"
                onClick={() => onReceive(transfer.id, transfer.transfer_number)}
              >
                <CheckCircleSolid className="mr-2 text-emerald-400" />
                Potvrdi Prijem
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
