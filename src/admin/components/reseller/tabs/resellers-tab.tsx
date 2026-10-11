import { Badge, Button, Container, Heading, Table, Text, toast } from "@medusajs/ui"
import {
  ArrowPath,
  Cash,
  CheckCircleSolid,
  CircleXmarkSolid,
  Eye,
  Key,
  Plus,
  Trash,
  Users,
} from "@medusajs/icons"
import { ResellerData } from "../types"

interface ResellersTabProps {
  resellers: ResellerData[]
  loading: boolean
  onAddClick: () => void
  onViewClick: (reseller: ResellerData) => void
  onPayoutClick: (reseller: ResellerData) => void
  onRefresh: () => void
}

export const ResellersTab = ({
  resellers,
  loading,
  onAddClick,
  onViewClick,
  onPayoutClick,
  onRefresh,
}: ResellersTabProps) => {
  const handleDelete = async (reseller: ResellerData) => {
    if (!confirm(`Da li ste sigurni da želite obrisati preprodavača '${reseller.name}'?`)) return
    try {
      const res = await fetch(`/admin/resellers/${reseller.id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success(`Preprodavač '${reseller.name}' je obrisan.`)
        onRefresh()
      } else {
        toast.error("Greška pri brisanju.")
      }
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  if (loading) {
    return (
      <Container className="p-12 text-center flex flex-col items-center justify-center text-ui-fg-subtle">
        <ArrowPath className="animate-spin mb-2 text-ui-fg-muted" />
        <Text>Učitavanje preprodavača...</Text>
      </Container>
    )
  }

  if (resellers.length === 0) {
    return (
      <Container className="p-8 sm:p-12 text-center flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-ui-bg-subtle-pressed flex items-center justify-center mb-4 text-ui-fg-subtle">
          <Users />
        </div>
        <Heading level="h2" className="text-base font-semibold text-ui-fg-base mb-1">
          Nema registrovanih preprodavača
        </Heading>
        <Text className="text-sm text-ui-fg-subtle mb-4 max-w-md mx-auto">
          Dodajte partnere koji će prodavati vaše artikle i slati narudžbe direktno u vaš Medusa sistem.
        </Text>
        <Button variant="primary" size="small" onClick={onAddClick}>
          <Plus /> Dodaj Prvog Preprodavača
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
              <Table.HeaderCell className="whitespace-nowrap">Preprodavač</Table.HeaderCell>
              <Table.HeaderCell className="whitespace-nowrap">Kanal Prodaje</Table.HeaderCell>
              <Table.HeaderCell className="whitespace-nowrap">Kontakt</Table.HeaderCell>
              <Table.HeaderCell className="whitespace-nowrap">Provizija / Popust</Table.HeaderCell>
              <Table.HeaderCell className="whitespace-nowrap">Ukupan Promet</Table.HeaderCell>
              <Table.HeaderCell className="whitespace-nowrap">Spremno za Isplatu</Table.HeaderCell>
              <Table.HeaderCell className="whitespace-nowrap">Status</Table.HeaderCell>
              <Table.HeaderCell className="text-right whitespace-nowrap">Akcije</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {resellers.map((r) => (
              <Table.Row key={r.id}>
                <Table.Cell className="font-medium text-ui-fg-base whitespace-nowrap">
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <Users className="text-ui-fg-muted shrink-0" />
                    <button
                      type="button"
                      onClick={() => onViewClick(r)}
                      className="font-semibold text-ui-fg-base hover:text-ui-fg-interactive hover:underline cursor-pointer text-left"
                    >
                      {r.name}
                    </button>
                  </div>
                </Table.Cell>
                <Table.Cell className="whitespace-nowrap">
                  {r.sales_channel?.name ? (
                    <Badge color="purple" className="font-medium whitespace-nowrap">
                      {r.sales_channel.name}
                    </Badge>
                  ) : (
                    <Badge color="grey" className="font-normal whitespace-nowrap text-ui-fg-muted">
                      Svi kanali
                    </Badge>
                  )}
                </Table.Cell>
                <Table.Cell className="text-xs text-ui-fg-subtle whitespace-nowrap">
                  <div>{r.email}</div>
                  <div className="text-ui-fg-muted">{r.phone}</div>
                </Table.Cell>
                <Table.Cell className="whitespace-nowrap">
                  <Badge color="blue" className="font-medium whitespace-nowrap">
                    {r.commission_rate} {r.commission_type === "percentage" ? "% od MPC" : "KM / narudžba"}
                  </Badge>
                </Table.Cell>
                <Table.Cell className="font-semibold text-ui-fg-base whitespace-nowrap">
                  {r.stats?.total_retail || 0} KM
                </Table.Cell>
                <Table.Cell className="whitespace-nowrap">
                  {(r.stats?.eligible_unpaid || 0) > 0 ? (
                    <Badge color="green" className="font-bold whitespace-nowrap">
                      {r.stats?.eligible_unpaid} KM
                    </Badge>
                  ) : (
                    <span className="text-xs text-ui-fg-muted">0 KM</span>
                  )}
                </Table.Cell>
                <Table.Cell className="whitespace-nowrap">
                  {r.status === "active" ? (
                    <Badge color="green" className="inline-flex items-center gap-1 whitespace-nowrap">
                      <CheckCircleSolid /> Aktivan
                    </Badge>
                  ) : (
                    <Badge color="grey" className="inline-flex items-center gap-1 whitespace-nowrap">
                      <CircleXmarkSolid /> Neaktivan
                    </Badge>
                  )}
                </Table.Cell>
                <Table.Cell className="text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                    {(r.stats?.eligible_unpaid || 0) > 0 && (
                      <Button
                        variant="secondary"
                        size="small"
                        className="text-xs text-ui-fg-interactive whitespace-nowrap"
                        onClick={() => onPayoutClick(r)}
                      >
                        <Cash className="mr-1" /> Isplati
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      size="small"
                      className="whitespace-nowrap"
                      onClick={() => onViewClick(r)}
                    >
                      <Eye className="mr-1" /> Detalji & API
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
