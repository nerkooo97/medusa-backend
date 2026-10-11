import { Badge, Button, Container, Heading, Table, Text, toast } from "@medusajs/ui"
import {
  ArrowPath,
  BadgeCheck,
  Channels,
  CheckCircleSolid,
  CircleXmarkSolid,
  GlobeEurope,
  Plus,
  Trash,
} from "@medusajs/icons"
import { useState } from "react"
import { MarketplaceConnectionData } from "../types"

interface ConnectionsTabProps {
  connections: MarketplaceConnectionData[]
  loading: boolean
  onRefresh: () => void
  onAddClick: () => void
}

export const ConnectionsTab = ({
  connections,
  loading,
  onRefresh,
  onAddClick,
}: ConnectionsTabProps) => {
  const [testingId, setTestingId] = useState<string | null>(null)

  const handleTestConnection = async (conn: MarketplaceConnectionData) => {
    setTestingId(conn.id)
    try {
      const res = await fetch(`/admin/marketplace/connections/${conn.id}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (data.result?.success) {
        toast.success(
          `Uspješna konekcija sa ${conn.name}! Nalog: ${data.result.accountName || data.result.accountIdentifier}`
        )
      } else {
        toast.error(`Konekcija nije uspjela: ${data.result?.errorMessage || "Nepoznata greška"}`)
      }
    } catch (err: any) {
      toast.error(`Greška pri testiranju: ${err.message}`)
    } finally {
      setTestingId(null)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Da li ste sigurni da želite obrisati konekciju '${name}'?`)) return
    try {
      const res = await fetch(`/admin/marketplace/connections/${id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success(`Konekcija '${name}' je obrisana.`)
        onRefresh()
      } else {
        toast.error("Greška pri brisanju konekcije.")
      }
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  if (loading) {
    return (
      <Container className="p-12 text-center flex flex-col items-center justify-center text-ui-fg-subtle">
        <ArrowPath className="animate-spin mb-2 text-ui-fg-muted" />
        <Text>Učitavanje marketplace naloga...</Text>
      </Container>
    )
  }

  if (connections.length === 0) {
    return (
      <Container className="p-8 sm:p-12 text-center flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-ui-bg-subtle-pressed flex items-center justify-center mb-4 text-ui-fg-subtle">
          <GlobeEurope />
        </div>
        <Heading level="h2" className="text-base font-semibold text-ui-fg-base mb-1">
          Nema povezanih marketplace naloga
        </Heading>
        <Text className="text-sm text-ui-fg-subtle mb-4 max-w-md mx-auto">
          Dodajte svoj prvi nalog (poput OLX.ba) kako biste automatski objavljivali proizvode i
          sinhronizovali zalihe.
        </Text>
        <Button variant="primary" size="small" onClick={onAddClick}>
          <Plus /> Dodaj Marketplace Nalog
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
              <Table.HeaderCell className="whitespace-nowrap">Naziv Naloga</Table.HeaderCell>
              <Table.HeaderCell className="whitespace-nowrap">Provajder</Table.HeaderCell>
              <Table.HeaderCell className="whitespace-nowrap">Prodajni Kanal</Table.HeaderCell>
              <Table.HeaderCell className="whitespace-nowrap">Status</Table.HeaderCell>
              <Table.HeaderCell className="whitespace-nowrap">Sinhronizacija Zaliha</Table.HeaderCell>
              <Table.HeaderCell className="whitespace-nowrap">Sinhronizacija Cijena</Table.HeaderCell>
              <Table.HeaderCell className="whitespace-nowrap">Datum Dodavanja</Table.HeaderCell>
              <Table.HeaderCell className="text-right whitespace-nowrap">Akcije</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {connections.map((conn) => (
              <Table.Row key={conn.id}>
                <Table.Cell className="font-medium text-ui-fg-base whitespace-nowrap">
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <GlobeEurope className="text-ui-fg-muted shrink-0" />
                    <span className="font-medium">{conn.name}</span>
                  </div>
                </Table.Cell>
                <Table.Cell className="whitespace-nowrap">
                  <Badge color="orange" className="font-semibold uppercase tracking-wider text-xs whitespace-nowrap">
                    {conn.provider_id.toUpperCase()}
                  </Badge>
                </Table.Cell>
                <Table.Cell className="whitespace-nowrap">
                  <div className="flex items-center gap-1.5 whitespace-nowrap">
                    <Channels className="text-ui-fg-muted shrink-0" />
                    <span className="text-xs font-medium text-ui-fg-base">
                      {conn.sales_channel_name || conn.sales_channel_id}
                    </span>
                  </div>
                </Table.Cell>
                <Table.Cell className="whitespace-nowrap">
                  {conn.is_active ? (
                    <Badge color="green" className="inline-flex items-center gap-1 whitespace-nowrap">
                      <CheckCircleSolid /> Aktivan
                    </Badge>
                  ) : (
                    <Badge color="grey" className="inline-flex items-center gap-1 whitespace-nowrap">
                      <CircleXmarkSolid /> Isključen
                    </Badge>
                  )}
                </Table.Cell>
                <Table.Cell className="whitespace-nowrap">
                  {conn.auto_sync_stock ? (
                    <Badge color="blue" className="whitespace-nowrap">Uključeno (Auto)</Badge>
                  ) : (
                    <Badge color="grey" className="whitespace-nowrap">Isključeno</Badge>
                  )}
                </Table.Cell>
                <Table.Cell className="whitespace-nowrap">
                  {conn.auto_sync_prices ? (
                    <Badge color="blue" className="whitespace-nowrap">Uključeno (Auto)</Badge>
                  ) : (
                    <Badge color="grey" className="whitespace-nowrap">Isključeno</Badge>
                  )}
                </Table.Cell>
                <Table.Cell className="text-ui-fg-subtle text-xs whitespace-nowrap">
                  {new Date(conn.created_at).toLocaleDateString("bs-BA")}
                </Table.Cell>
                <Table.Cell className="text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                    <Button
                      variant="secondary"
                      size="small"
                      className="whitespace-nowrap"
                      isLoading={testingId === conn.id}
                      onClick={() => handleTestConnection(conn)}
                    >
                      <BadgeCheck className="mr-1" />
                      Test Konekcije
                    </Button>
                    <Button
                      variant="danger"
                      size="small"
                      onClick={() => handleDelete(conn.id, conn.name)}
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
