import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { DetailWidgetProps } from "@medusajs/framework/types"
import { Container, Heading, Text, Table, Badge } from "@medusajs/ui"
import { ArchiveBox, ArrowDownLeft, ArrowUpRightMini } from "@medusajs/icons"
import { useEffect, useState } from "react"

const InventoryMovementWidget = ({
  data: inventoryItem,
}: DetailWidgetProps<any>) => {
  const [movements, setMovements] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchMovements = async () => {
    if (!inventoryItem?.id) return
    try {
      setIsLoading(true)
      const res = await fetch(
        `/admin/warehouse/movements?inventory_item_id=${inventoryItem.id}&limit=10`,
        { credentials: "include" }
      )
      const data = await res.json()
      setMovements(data.stock_movements || [])
    } catch (e) {
      console.error("Greška pri učitavanju kretanja artikla", e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMovements()
  }, [inventoryItem?.id])

  return (
    <Container className="p-4 sm:p-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-ui-border-base mb-4 gap-2">
        <div className="flex items-center gap-x-2">
          <ArchiveBox className="text-ui-fg-interactive" />
          <Heading level="h2" className="text-base font-semibold">
            Karton Artikla & Dnevnik Promjena
          </Heading>
        </div>
        <Badge size="small" color="grey">
          Zadnjih {movements.length} promjena
        </Badge>
      </div>

      <div className="overflow-x-auto w-full">
        <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Datum</Table.HeaderCell>
            <Table.HeaderCell>Količina</Table.HeaderCell>
            <Table.HeaderCell>Događaj</Table.HeaderCell>
            <Table.HeaderCell>Referenca / Dokument</Table.HeaderCell>
            <Table.HeaderCell>Napomena</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {movements.length === 0 ? (
            <Table.Row>
              <Table.Cell className="text-center py-6 text-ui-fg-muted">
                Nema zabilježenih robnih dokumenata za ovaj artikal.
              </Table.Cell>
            </Table.Row>
          ) : (
            movements.map((m) => (
              <Table.Row key={m.id}>
                <Table.Cell className="text-xs text-ui-fg-subtle">
                  {new Date(m.created_at).toLocaleString("bs-BA")}
                </Table.Cell>
                <Table.Cell>
                  <div className="flex items-center gap-x-1">
                    {m.quantity_change > 0 ? (
                      <ArrowDownLeft className="text-emerald-600" />
                    ) : (
                      <ArrowUpRightMini className="text-rose-600" />
                    )}
                    <span
                      className={`font-semibold ${
                        m.quantity_change > 0 ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {m.quantity_change > 0 ? `+${m.quantity_change}` : m.quantity_change}
                    </span>
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <Badge size="small" color={m.quantity_change > 0 ? "green" : "red"}>
                    {m.document_type === "receipt"
                      ? "Prijemnica"
                      : m.document_type === "transfer_dispatch"
                      ? "Transfer (Otprema)"
                      : m.document_type === "transfer_receive"
                      ? "Transfer (Prijem)"
                      : m.document_type === "order_fulfillment"
                      ? "Otprema Narudžbe"
                      : m.document_type === "adjustment"
                      ? (m.quantity_change > 0 ? "Storno / Povrat" : "Korekcija")
                      : m.document_type}
                  </Badge>
                </Table.Cell>
                <Table.Cell className="font-semibold text-ui-fg-base">
                  {m.document_type === "order_fulfillment" || m.reference_number?.startsWith("ORD-") ? (
                    <span className="font-mono text-xs text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                      🛒 {m.reference_number || m.document_id}
                    </span>
                  ) : (
                    <span className="font-mono text-xs">{m.reference_number || m.document_id}</span>
                  )}
                </Table.Cell>
                <Table.Cell className="text-xs text-ui-fg-subtle">
                  {m.notes || "-"}
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

export const config = defineWidgetConfig({
  zone: "inventory_item.details.after",
})

export default InventoryMovementWidget
