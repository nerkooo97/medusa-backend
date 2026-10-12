import { Badge, Button, Container, Heading, Table, Text, toast } from "@medusajs/ui"
import {
  ArrowPath,
  Buildings,
  CheckCircleSolid,
  CircleXmarkSolid,
  DocumentText,
  Key,
  PencilSquare,
  Plus,
  Trash,
  Users,
} from "@medusajs/icons"
import { PosRegister } from "../types"

interface RegistersTabProps {
  registers: PosRegister[]
  loading: boolean
  onAddClick: () => void
  onConfigureClick: (register: PosRegister) => void
  onRefresh: () => void
}

export const RegistersTab = ({
  registers,
  loading,
  onAddClick,
  onConfigureClick,
  onRefresh,
}: RegistersTabProps) => {
  const handleDelete = async (reg: PosRegister) => {
    if (!confirm(`Da li ste sigurni da želite obrisati POS kasu '${reg.name}'?`)) return

    try {
      const res = await fetch(`/admin/pos/registers/${reg.id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success(`POS kasa '${reg.name}' je obrisana.`)
        onRefresh()
      } else {
        toast.error("Greška pri brisanju kase.")
      }
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const handleCopyKey = (key: string, e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(key)
    toast.success("Sigurnosni ključ kase (device_key) je kopiran!")
  }

  if (loading) {
    return (
      <Container className="p-12 text-center flex flex-col items-center justify-center text-ui-fg-subtle">
        <ArrowPath className="animate-spin mb-2 text-ui-fg-muted" />
        <Text>Učitavanje POS kasa...</Text>
      </Container>
    )
  }

  if (registers.length === 0) {
    return (
      <Container className="p-8 sm:p-12 text-center flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-ui-bg-subtle-pressed flex items-center justify-center mb-4 text-ui-fg-subtle">
          <Buildings />
        </div>
        <Heading level="h2" className="text-base font-semibold text-ui-fg-base mb-1">
          Nema konfigurisanih POS kasa
        </Heading>
        <Text className="text-sm text-ui-fg-subtle mb-4 max-w-md mx-auto">
          Dodajte registar kase po vašim maloprodajnim objektima, povežite ih sa skladištem i dodijelite kasire za rad u Expo aplikaciji.
        </Text>
        <Button variant="primary" size="small" onClick={onAddClick}>
          <Plus /> Dodaj Prvu POS Kasu
        </Button>
      </Container>
    )
  }

  return (
    <Container className="p-0 overflow-hidden shadow-sm w-full">
      <div className="overflow-x-auto w-full">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell className="whitespace-nowrap">Kasa & Šifra</Table.HeaderCell>
              <Table.HeaderCell className="whitespace-nowrap">Status</Table.HeaderCell>
              <Table.HeaderCell className="whitespace-nowrap">Poslovna Jedinica</Table.HeaderCell>
              <Table.HeaderCell className="whitespace-nowrap">Prodajni Kanal</Table.HeaderCell>
              <Table.HeaderCell className="whitespace-nowrap">Magacin (Skladište)</Table.HeaderCell>
              <Table.HeaderCell className="whitespace-nowrap">Fiskalni Uređaj</Table.HeaderCell>
              <Table.HeaderCell className="whitespace-nowrap">Smjena</Table.HeaderCell>
              <Table.HeaderCell className="whitespace-nowrap">Kasiri</Table.HeaderCell>
              <Table.HeaderCell className="text-right whitespace-nowrap">Akcije</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {registers.map((r) => (
              <Table.Row
                key={r.id}
                className="hover:bg-ui-bg-subtle-hover transition-colors cursor-pointer"
                onClick={() => onConfigureClick(r)}
              >
                {/* Kasa & Šifra */}
                <Table.Cell className="font-medium text-ui-fg-base whitespace-nowrap">
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <Buildings className="text-ui-fg-muted shrink-0" />
                    <div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onConfigureClick(r)
                        }}
                        className="font-semibold text-ui-fg-base hover:text-ui-fg-interactive hover:underline cursor-pointer text-left block"
                      >
                        {r.name}
                      </button>
                      <div className="text-[11px] text-ui-fg-muted font-mono">{r.code}</div>
                    </div>
                  </div>
                </Table.Cell>

                {/* Status */}
                <Table.Cell className="whitespace-nowrap">
                  {r.status === "active" ? (
                    <Badge color="green" className="inline-flex items-center gap-1 whitespace-nowrap">
                      <CheckCircleSolid /> Aktivna
                    </Badge>
                  ) : r.status === "maintenance" ? (
                    <Badge color="orange" className="inline-flex items-center gap-1 whitespace-nowrap">
                      Održavanje
                    </Badge>
                  ) : (
                    <Badge color="grey" className="inline-flex items-center gap-1 whitespace-nowrap">
                      <CircleXmarkSolid /> Neaktivna
                    </Badge>
                  )}
                </Table.Cell>

                {/* Poslovna Jedinica */}
                <Table.Cell className="whitespace-nowrap text-xs">
                  <div className="font-semibold text-ui-fg-base">{r.store_name}</div>
                  <div className="text-ui-fg-subtle">{r.store_address}, {r.store_city}</div>
                  {r.tax_id && (
                    <div className="text-[10px] text-ui-fg-muted font-mono">JIB: {r.tax_id}</div>
                  )}
                </Table.Cell>

                {/* Prodajni Kanal */}
                <Table.Cell className="whitespace-nowrap">
                  {r.sales_channel?.name ? (
                    <Badge color="blue" className="font-medium whitespace-nowrap">
                      {r.sales_channel.name}
                    </Badge>
                  ) : (
                    <span className="text-xs text-ui-fg-muted">Svi kanali</span>
                  )}
                </Table.Cell>

                {/* Magacin / Skladište */}
                <Table.Cell className="whitespace-nowrap">
                  {r.stock_location?.name ? (
                    <Badge color="purple" className="font-medium whitespace-nowrap">
                      {r.stock_location.name}
                    </Badge>
                  ) : (
                    <span className="text-xs text-ui-fg-muted">Nije odabrano</span>
                  )}
                </Table.Cell>

                {/* Fiskalni printer */}
                <Table.Cell className="whitespace-nowrap">
                  <Badge
                    color={r.fiscal_printer_type && r.fiscal_printer_type !== "none" ? "green" : "grey"}
                    className="font-medium whitespace-nowrap"
                  >
                    {r.fiscal_printer_type && r.fiscal_printer_type !== "none"
                      ? r.fiscal_printer_type.toUpperCase()
                      : "BEZ FISKALA"}
                  </Badge>
                </Table.Cell>

                {/* Smjena */}
                <Table.Cell className="whitespace-nowrap">
                  {r.active_session ? (
                    <Badge color="green" className="font-bold whitespace-nowrap">
                      Otvorena ({r.active_session.opening_cash} KM)
                    </Badge>
                  ) : (
                    <Badge color="grey" className="whitespace-nowrap">
                      Zatvorena
                    </Badge>
                  )}
                </Table.Cell>

                {/* Kasiri */}
                <Table.Cell className="whitespace-nowrap text-xs text-ui-fg-subtle">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-ui-fg-muted" />
                    <span>{r.operators_count ?? r.operators?.length ?? 0}</span>
                  </div>
                </Table.Cell>

                {/* Akcije */}
                <Table.Cell className="text-right whitespace-nowrap">
                  <div
                    className="flex items-center justify-end gap-1.5 whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="secondary"
                      size="small"
                      className="text-xs whitespace-nowrap"
                      onClick={() => onConfigureClick(r)}
                    >
                      <PencilSquare className="mr-1" /> Konfiguriši
                    </Button>
                    <Button
                      variant="secondary"
                      size="small"
                      title="Kopiraj Device Key za Expo aplikaciju"
                      onClick={(e) => handleCopyKey(r.device_key, e)}
                    >
                      <Key />
                    </Button>
                    <Button
                      variant="danger"
                      size="small"
                      onClick={() => handleDelete(r)}
                    >
                      <Trash />
                    </Button>
                  </div>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </div>
    </Container>
  )
}
