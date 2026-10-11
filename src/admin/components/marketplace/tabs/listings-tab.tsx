import { Badge, Button, Container, Heading, Table, Text, toast } from "@medusajs/ui"
import {
  ArchiveBox,
  ArrowPath,
  ArrowUpRightOnBox,
  BuildingStorefront,
  Plus,
  Sparkles,
  Trash,
} from "@medusajs/icons"
import { useState } from "react"
import { MarketplaceListingData } from "../types"

interface ListingsTabProps {
  listings: MarketplaceListingData[]
  loading: boolean
  onRefresh: () => void
  onPublishClick: () => void
}

export const ListingsTab = ({
  listings,
  loading,
  onRefresh,
  onPublishClick,
}: ListingsTabProps) => {
  const [syncingId, setSyncingId] = useState<string | null>(null)
  const [refreshingId, setRefreshingId] = useState<string | null>(null)

  const handleManualSync = async (listing: MarketplaceListingData) => {
    setSyncingId(listing.id)
    try {
      const res = await fetch(`/admin/marketplace/listings/${listing.id}/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      if (res.ok) {
        toast.success(`Zalihe za oglas #${listing.external_id} su uspješno usklađene.`)
        onRefresh()
      } else {
        const data = await res.json()
        toast.error(data.message || "Greška pri sinhronizaciji.")
      }
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSyncingId(null)
    }
  }

  const handleBoostRank = async (listing: MarketplaceListingData) => {
    setRefreshingId(listing.id)
    try {
      const res = await fetch(`/admin/marketplace/listings/${listing.id}/refresh`, {
        method: "POST",
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.result?.message || "Oglas je uspješno obnovljen na oglasniku!")
      } else {
        toast.error(data.message || "Greška pri obnovi oglasa.")
      }
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setRefreshingId(null)
    }
  }

  const handleDelete = async (listing: MarketplaceListingData) => {
    if (!confirm(`Da li ste sigurni da želite ukloniti oglas #${listing.external_id}?`)) return
    try {
      const res = await fetch(`/admin/marketplace/listings/${listing.id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        toast.success("Oglas je uklonjen.")
        onRefresh()
      }
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge color="green">Aktivan na Oglasniku</Badge>
      case "hidden":
        return <Badge color="orange">Sakriven (Nema Zalihe)</Badge>
      case "draft":
        return <Badge color="blue">Skica (Draft)</Badge>
      case "finished":
        return <Badge color="grey">Završen</Badge>
      case "failed":
        return <Badge color="red">Greška</Badge>
      default:
        return <Badge color="grey">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <Container className="p-12 text-center flex flex-col items-center justify-center text-ui-fg-subtle">
        <ArrowPath className="animate-spin mb-2 text-ui-fg-muted" />
        <Text>Učitavanje objavljenih oglasa...</Text>
      </Container>
    )
  }

  if (listings.length === 0) {
    return (
      <Container className="p-8 sm:p-12 text-center flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-ui-bg-subtle-pressed flex items-center justify-center mb-4 text-ui-fg-subtle">
          <BuildingStorefront />
        </div>
        <Heading level="h2" className="text-base font-semibold text-ui-fg-base mb-1">
          Nema objavljenih oglasa
        </Heading>
        <Text className="text-sm text-ui-fg-subtle mb-4 max-w-md mx-auto">
          Objavite artikle iz svog Medusa kataloga na OLX.ba ili druge povezane marketplace platforme.
        </Text>
        <Button variant="primary" size="small" onClick={onPublishClick}>
          <Plus /> Objavi Prvi Proizvod
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
            <Table.HeaderCell className="whitespace-nowrap">Marketplace</Table.HeaderCell>
            <Table.HeaderCell className="whitespace-nowrap">Vanjski ID & Link</Table.HeaderCell>
            <Table.HeaderCell className="whitespace-nowrap">Status Oglasa</Table.HeaderCell>
            <Table.HeaderCell className="whitespace-nowrap">Sinhronizovana Cijena</Table.HeaderCell>
            <Table.HeaderCell className="whitespace-nowrap">Sinhronizovano Stanje</Table.HeaderCell>
            <Table.HeaderCell className="whitespace-nowrap">Zadnja Sinhronizacija</Table.HeaderCell>
            <Table.HeaderCell className="text-right whitespace-nowrap">Akcije</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {listings.map((l) => (
            <Table.Row key={l.id}>
              <Table.Cell className="whitespace-nowrap">
                <div className="flex items-center gap-1.5 whitespace-nowrap">
                  <Badge color="orange" className="text-xs uppercase font-semibold whitespace-nowrap">
                    {l.connection?.provider_id?.toUpperCase() || "MARKETPLACE"}
                  </Badge>
                  <Text className="text-xs text-ui-fg-subtle font-medium whitespace-nowrap">
                    {l.connection?.name}
                  </Text>
                </div>
              </Table.Cell>
              <Table.Cell className="whitespace-nowrap">
                <div className="flex items-center gap-2 font-medium whitespace-nowrap">
                  <Text className="font-mono text-xs">#{l.external_id}</Text>
                  {l.external_url && (
                    <a
                      href={l.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ui-fg-interactive hover:underline inline-flex items-center gap-1 text-xs whitespace-nowrap"
                    >
                      Otvori oglas <ArrowUpRightOnBox />
                    </a>
                  )}
                </div>
              </Table.Cell>
              <Table.Cell className="whitespace-nowrap">{getStatusBadge(l.status)}</Table.Cell>
              <Table.Cell className="font-semibold whitespace-nowrap">
                {l.last_synced_price !== undefined && l.last_synced_price !== null
                  ? `${l.last_synced_price} KM`
                  : "—"}
              </Table.Cell>
              <Table.Cell className="whitespace-nowrap">
                <div className="flex items-center gap-1.5 font-medium whitespace-nowrap">
                  <ArchiveBox className="text-ui-fg-muted" />
                  <span>{l.last_synced_quantity} kom</span>
                </div>
              </Table.Cell>
              <Table.Cell className="text-xs text-ui-fg-subtle whitespace-nowrap">
                {l.last_synced_at
                  ? new Date(l.last_synced_at).toLocaleString("bs-BA")
                  : "Nije sinhronizovano"}
                {l.last_sync_error && (
                  <Text className="text-xs text-ui-fg-error block truncate max-w-xs">
                    {l.last_sync_error}
                  </Text>
                )}
              </Table.Cell>
              <Table.Cell className="text-right whitespace-nowrap">
                <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                  <Button
                    variant="secondary"
                    size="small"
                    className="whitespace-nowrap"
                    isLoading={syncingId === l.id}
                    onClick={() => handleManualSync(l)}
                  >
                    <ArrowPath className="mr-1" /> Sinhronizuj
                  </Button>
                  <Button
                    variant="secondary"
                    size="small"
                    isLoading={refreshingId === l.id}
                    onClick={() => handleBoostRank(l)}
                    title="Obnovi oglas i podigni ga na vrh pretrage na OLX"
                  >
                    <Sparkles className="mr-1 text-orange-500" /> Obnovi
                  </Button>
                  <Button
                    variant="danger"
                    size="small"
                    onClick={() => handleDelete(l)}
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
