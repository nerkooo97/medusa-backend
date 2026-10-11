import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Button, Heading, Tabs, Text, toast } from "@medusajs/ui"
import {
  ArrowPath,
  BuildingStorefront,
  FlyingBox,
  GlobeEurope,
  Plus,
  SquareTwoStack,
} from "@medusajs/icons"
import { useEffect, useState } from "react"

import { ConnectionsTab } from "../../components/marketplace/tabs/connections-tab"
import { ListingsTab } from "../../components/marketplace/tabs/listings-tab"
import { MappingsTab } from "../../components/marketplace/tabs/mappings-tab"
import { CreateConnectionModal } from "../../components/marketplace/modals/create-connection-modal"
import { PublishProductModal } from "../../components/marketplace/modals/publish-product-modal"
import {
  MarketplaceConnectionData,
  MarketplaceListingData,
} from "../../components/marketplace/types"

export const config = defineRouteConfig({
  label: "Marketplaces",
  icon: BuildingStorefront,
  rank: 4,
})

const MarketplacesPage = () => {
  const [activeTab, setActiveTab] = useState("connections")

  // Podaci
  const [connections, setConnections] = useState<MarketplaceConnectionData[]>([])
  const [listings, setListings] = useState<MarketplaceListingData[]>([])
  const [loadingConnections, setLoadingConnections] = useState(true)
  const [loadingListings, setLoadingListings] = useState(true)

  // Modali
  const [createConnectionModalOpen, setCreateConnectionModalOpen] = useState(false)
  const [publishModalOpen, setPublishModalOpen] = useState(false)

  const fetchConnections = async () => {
    setLoadingConnections(true)
    try {
      const res = await fetch("/admin/marketplace/connections")
      const data = await res.json()
      setConnections(data.connections || [])
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoadingConnections(false)
    }
  }

  const fetchListings = async () => {
    setLoadingListings(true)
    try {
      const res = await fetch("/admin/marketplace/listings")
      const data = await res.json()
      setListings(data.listings || [])
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoadingListings(false)
    }
  }

  useEffect(() => {
    fetchConnections()
    fetchListings()
  }, [])

  return (
    <div className="flex flex-col gap-y-6 p-4 sm:p-6 w-full">
      {/* Zaglavlje stranice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Heading level="h1" className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <BuildingStorefront className="text-ui-fg-interactive" />
            Marketplace Integracije
          </Heading>
          <Text className="text-ui-fg-subtle text-sm mt-1">
            Povežite vaše proizvode sa eksternim oglasnicima (OLX.ba) i automatizujte objave,
            cijene i sinhronizaciju zaliha.
          </Text>
        </div>

        <div className="flex items-center gap-x-2 shrink-0">
          <Button
            variant="secondary"
            size="small"
            onClick={() => {
              fetchConnections()
              fetchListings()
              toast.info("Podaci su osvježeni.")
            }}
          >
            <ArrowPath /> Osvježi
          </Button>

          <Button
            variant="secondary"
            size="small"
            onClick={() => setPublishModalOpen(true)}
            disabled={connections.length === 0}
          >
            <FlyingBox /> Objavi Proizvod
          </Button>

          <Button
            variant="primary"
            size="small"
            onClick={() => setCreateConnectionModalOpen(true)}
          >
            <Plus /> Novi Nalog
          </Button>
        </div>
      </div>

      {/* Tabovi sa standardnim Medusa UI dizajnom */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List className="overflow-x-auto flex-nowrap">
          <Tabs.Trigger value="connections">
            <GlobeEurope className="mr-2" />
            Povezani Nalozi ({connections.length})
          </Tabs.Trigger>

          <Tabs.Trigger value="mappings">
            <SquareTwoStack className="mr-2" />
            Mapiranje Polja & Kategorija
          </Tabs.Trigger>

          <Tabs.Trigger value="listings">
            <BuildingStorefront className="mr-2" />
            Objavljeni Oglasi ({listings.length})
          </Tabs.Trigger>
        </Tabs.List>

        <div className="mt-4">
          <Tabs.Content value="connections">
            <ConnectionsTab
              connections={connections}
              loading={loadingConnections}
              onRefresh={fetchConnections}
              onAddClick={() => setCreateConnectionModalOpen(true)}
            />
          </Tabs.Content>

          <Tabs.Content value="mappings">
            <MappingsTab connections={connections} />
          </Tabs.Content>

          <Tabs.Content value="listings">
            <ListingsTab
              listings={listings}
              loading={loadingListings}
              onRefresh={fetchListings}
              onPublishClick={() => setPublishModalOpen(true)}
            />
          </Tabs.Content>
        </div>
      </Tabs>

      {/* Modali */}
      <CreateConnectionModal
        open={createConnectionModalOpen}
        onOpenChange={setCreateConnectionModalOpen}
        onSuccess={() => {
          fetchConnections()
        }}
      />

      <PublishProductModal
        open={publishModalOpen}
        onOpenChange={setPublishModalOpen}
        connections={connections}
        onSuccess={() => {
          fetchListings()
          setActiveTab("listings")
        }}
      />
    </div>
  )
}

export default MarketplacesPage
