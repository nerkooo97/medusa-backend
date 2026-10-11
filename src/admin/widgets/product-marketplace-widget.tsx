import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { DetailWidgetProps, AdminProduct } from "@medusajs/framework/types"
import { Badge, Button, Container, Heading, Text, toast } from "@medusajs/ui"
import {
  ArrowPath,
  ArrowUpRightOnBox,
  BuildingStorefront,
  FlyingBox,
} from "@medusajs/icons"
import { useEffect, useState } from "react"
import { MarketplaceConnectionData, MarketplaceListingData } from "../components/marketplace/types"

const ProductMarketplaceWidget = ({ data: product }: DetailWidgetProps<AdminProduct>) => {
  const [connections, setConnections] = useState<MarketplaceConnectionData[]>([])
  const [listings, setListings] = useState<MarketplaceListingData[]>([])
  const [loading, setLoading] = useState(true)
  const [publishing, setPublishing] = useState<string | null>(null)
  const [syncing, setSyncing] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const [connRes, listRes] = await Promise.all([
        fetch("/admin/marketplace/connections").then((r) => r.json()),
        fetch(`/admin/marketplace/listings?product_id=${product.id}`).then((r) => r.json()),
      ])
      setConnections(connRes.connections || [])
      setListings(listRes.listings || [])
    } catch {
      // Ignoriši greške ako je offline
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [product.id])

  const handlePublish = async (connectionId: string) => {
    setPublishing(connectionId)
    try {
      const res = await fetch("/admin/marketplace/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connection_id: connectionId,
          product_id: product.id,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Proizvod je uspješno objavljen na oglasnik (ID: #${data.listing?.external_id})!`)
        loadData()
      } else {
        toast.error(data.message || "Greška pri objavi.")
      }
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setPublishing(null)
    }
  }

  const handleSync = async (listingId: string) => {
    setSyncing(listingId)
    try {
      const res = await fetch(`/admin/marketplace/listings/${listingId}/sync`, {
        method: "POST",
      })
      if (res.ok) {
        toast.success("Zalihe su uspješno sinhronizovane.")
        loadData()
      } else {
        toast.error("Greška pri sinhronizaciji.")
      }
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSyncing(null)
    }
  }

  if (connections.length === 0 && !loading) {
    return null
  }

  return (
    <Container className="p-4 sm:p-6 bg-ui-bg-base border rounded-lg shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-2">
          <BuildingStorefront className="text-ui-fg-interactive" />
          <Heading level="h2" className="text-base font-semibold">
            Marketplace Integracije (OLX.ba)
          </Heading>
        </div>
        <Button variant="secondary" size="small" onClick={loadData}>
          <ArrowPath />
        </Button>
      </div>

      <div className="space-y-3">
        {connections.map((conn) => {
          const currentListing = listings.find(
            (l) => l.marketplace_connection_id === conn.id
          )

          return (
            <div
              key={conn.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 border rounded-lg bg-ui-bg-subtle/30"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Text className="font-semibold text-sm">{conn.name}</Text>
                  <Badge color="orange" className="text-xs uppercase">
                    {conn.provider_id.toUpperCase()}
                  </Badge>
                </div>

                {currentListing ? (
                  <div className="flex flex-wrap items-center gap-2 text-xs text-ui-fg-subtle">
                    <Badge color="green" className="text-xs">
                      Objavljeno
                    </Badge>
                    <span className="font-mono">#{currentListing.external_id}</span>
                    <span>• Stanje: {currentListing.last_synced_quantity} kom</span>
                    {currentListing.external_url && (
                      <a
                        href={currentListing.external_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-ui-fg-interactive hover:underline inline-flex items-center gap-1 ml-1"
                      >
                        Pogledaj oglas <ArrowUpRightOnBox />
                      </a>
                    )}
                  </div>
                ) : (
                  <Text className="text-xs text-ui-fg-muted">
                    Proizvod još uvijek nije objavljen na ovom oglasniku.
                  </Text>
                )}
              </div>

              <div>
                {currentListing ? (
                  <Button
                    variant="secondary"
                    size="small"
                    isLoading={syncing === currentListing.id}
                    onClick={() => handleSync(currentListing.id)}
                  >
                    <ArrowPath className="mr-1" /> Sinhronizuj
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="small"
                    isLoading={publishing === conn.id}
                    onClick={() => handlePublish(conn.id)}
                  >
                    <FlyingBox className="mr-1" /> Objavi na {conn.provider_id.toUpperCase()}
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default ProductMarketplaceWidget
