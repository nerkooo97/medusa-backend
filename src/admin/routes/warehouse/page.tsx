import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Heading, Text, Button, Tabs, Badge, toast } from "@medusajs/ui"
import {
  ArchiveBox,
  ArrowUpDown,
  Buildings,
  DocumentText,
  Plus,
  Trash,
  TruckFast,
} from "@medusajs/icons"
import { useEffect, useState, useMemo } from "react"
import { printWarehouseDocument } from "../../utils/print-document"

// Modularne tab komponente
import { ReceiptsTab } from "../../components/warehouse/tabs/receipts-tab"
import { TransfersTab } from "../../components/warehouse/tabs/transfers-tab"
import { WriteOffsTab } from "../../components/warehouse/tabs/write-offs-tab"
import { MovementsTab } from "../../components/warehouse/tabs/movements-tab"

// Modularne modal komponente
import { CreateReceiptModal } from "../../components/warehouse/modals/create-receipt-modal"
import { ViewReceiptModal } from "../../components/warehouse/modals/view-receipt-modal"
import { CreateTransferModal } from "../../components/warehouse/modals/create-transfer-modal"
import { ViewTransferModal } from "../../components/warehouse/modals/view-transfer-modal"
import { CreateWriteOffModal } from "../../components/warehouse/modals/create-write-off-modal"
import { ViewWriteOffModal } from "../../components/warehouse/modals/view-write-off-modal"

export const config = defineRouteConfig({
  label: "Robno Poslovanje",
  icon: Buildings,
  rank: 3,
})

const WarehousePage = () => {
  const [activeTab, setActiveTab] = useState("receipts")

  // Podaci
  const [receipts, setReceipts] = useState<any[]>([])
  const [transfers, setTransfers] = useState<any[]>([])
  const [writeOffs, setWriteOffs] = useState<any[]>([])
  const [movements, setMovements] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [inventoryItems, setInventoryItems] = useState<any[]>([])

  // Modal stanja
  const [isNewReceiptOpen, setIsNewReceiptOpen] = useState(false)
  const [isNewTransferOpen, setIsNewTransferOpen] = useState(false)
  const [isNewWriteOffOpen, setIsNewWriteOffOpen] = useState(false)

  const [viewingReceipt, setViewingReceipt] = useState<any | null>(null)
  const [viewingTransfer, setViewingTransfer] = useState<any | null>(null)
  const [viewingWriteOff, setViewingWriteOff] = useState<any | null>(null)

  // Učitavanje lokacija i artikala
  const fetchMetadata = async () => {
    try {
      const [locRes, invRes] = await Promise.all([
        fetch("/admin/stock-locations", { credentials: "include" }),
        fetch("/admin/inventory-items?limit=100", { credentials: "include" }),
      ])
      const locData = await locRes.json()
      const invData = await invRes.json()
      setLocations(locData.stock_locations || [])
      setInventoryItems(invData.inventory_items || [])
    } catch (e) {
      console.error("Greška pri učitavanju metapodataka", e)
    }
  }

  // Učitavanje podataka
  const fetchReceipts = async () => {
    try {
      const res = await fetch("/admin/warehouse/receipts", { credentials: "include" })
      const data = await res.json()
      setReceipts(data.goods_receipts || [])
    } catch (e) {
      toast.error("Greška pri učitavanju prijemnica")
    }
  }

  const fetchTransfers = async () => {
    try {
      const res = await fetch("/admin/warehouse/transfers", { credentials: "include" })
      const data = await res.json()
      setTransfers(data.stock_transfers || [])
    } catch (e) {
      toast.error("Greška pri učitavanju transfera")
    }
  }

  const fetchWriteOffs = async () => {
    try {
      const res = await fetch("/admin/warehouse/write-offs", { credentials: "include" })
      const data = await res.json()
      setWriteOffs(data.stock_write_offs || [])
    } catch (e) {
      toast.error("Greška pri učitavanju zapisnika o otpisu")
    }
  }

  const fetchMovements = async () => {
    try {
      const res = await fetch("/admin/warehouse/movements", { credentials: "include" })
      const data = await res.json()
      setMovements(data.stock_movements || [])
    } catch (e) {
      toast.error("Greška pri učitavanju dnevnika")
    }
  }

  useEffect(() => {
    fetchMetadata()
    fetchReceipts()
    fetchTransfers()
    fetchWriteOffs()
    fetchMovements()
  }, [])

  // Mapa imena magacina
  const locationMap = useMemo(() => {
    const map: Record<string, string> = {}
    locations.forEach((l) => {
      map[l.id] = l.name
    })
    return map
  }, [locations])

  // Akcije: Prijemnice
  const handlePostReceipt = async (id: string, receiptNumber: string) => {
    if (!confirm(`Da li ste sigurni da želite proknjižiti prijemnicu ${receiptNumber}? Ovo će uvećati zalihe.`)) return
    try {
      const res = await fetch(`/admin/warehouse/receipts/${id}/post`, { method: "POST", credentials: "include" })
      if (!res.ok) throw new Error("Neuspješno knjiženje")
      toast.success(`Prijemnica ${receiptNumber} uspješno proknjižena!`)
      if (viewingReceipt?.id === id) setViewingReceipt(null)
      fetchReceipts()
      fetchMovements()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  // Akcije: Transferi
  const handleDispatchTransfer = async (id: string, number: string) => {
    if (!confirm(`Otpremi robu za transfer ${number}? Ovo će skinuti robu sa polaznog magacina.`)) return
    try {
      const res = await fetch(`/admin/warehouse/transfers/${id}/dispatch`, { method: "POST", credentials: "include" })
      if (!res.ok) throw new Error("Neuspješna otprema")
      toast.success(`Transfer ${number} je uspješno otpremljen (U tranzitu)!`)
      if (viewingTransfer?.id === id) setViewingTransfer(null)
      fetchTransfers()
      fetchMovements()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const handleReceiveTransfer = async (id: string, number: string) => {
    if (!confirm(`Potvrdi prijem robe za transfer ${number}? Ovo će dodati robu na odredišni magacin.`)) return
    try {
      const res = await fetch(`/admin/warehouse/transfers/${id}/receive`, { method: "POST", credentials: "include" })
      if (!res.ok) throw new Error("Neuspješan prijem")
      toast.success(`Transfer ${number} je uspješno zaprimljen i završen!`)
      if (viewingTransfer?.id === id) setViewingTransfer(null)
      fetchTransfers()
      fetchMovements()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  // Akcije: Otpisi
  const handlePostWriteOff = async (id: string, writeOffNumber: string) => {
    if (!confirm(`Da li ste sigurni da želite proknjižiti rashod ${writeOffNumber}? Ovo će trajno skinuti robu sa stanja.`)) return
    try {
      const res = await fetch(`/admin/warehouse/write-offs/${id}/post`, { method: "POST", credentials: "include" })
      if (!res.ok) throw new Error("Neuspješno knjiženje rashoda")
      toast.success(`Zapisnik ${writeOffNumber} je uspješno proknjižen!`)
      if (viewingWriteOff?.id === id) setViewingWriteOff(null)
      fetchWriteOffs()
      fetchMovements()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  // Bedž razloga rashoda
  const getReasonBadge = (reason: string) => {
    switch (reason) {
      case "damaged":
        return <Badge size="small" color="red">Oštećenje / Lom</Badge>
      case "expired":
        return <Badge size="small" color="orange">Istekao rok</Badge>
      case "lost":
        return <Badge size="small" color="grey">Kalo / Manjak</Badge>
      case "internal_use":
        return <Badge size="small" color="blue">Interna potrošnja</Badge>
      default:
        return <Badge size="small" color="grey">Ostalo</Badge>
    }
  }

  return (
    <div className="flex flex-col gap-y-6 p-4 sm:p-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Heading className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
            <Buildings className="text-ui-fg-interactive" />
            Robno-Materijalno Knjigovodstvo
          </Heading>
          <Text className="text-ui-fg-subtle text-sm">
            Evidencija ulaza, međuskladišnog kretanja robe, otpisa i rashoda, štampa PDF dokumenata i audit karton artikala.
          </Text>
        </div>
        <div className="flex flex-wrap gap-2">
          {activeTab === "receipts" && (
            <Button variant="primary" onClick={() => setIsNewReceiptOpen(true)}>
              <Plus className="mr-2" />
              Nova Prijemnica
            </Button>
          )}
          {activeTab === "transfers" && (
            <Button variant="primary" onClick={() => setIsNewTransferOpen(true)}>
              <ArrowUpDown className="mr-2" />
              Novi Transfer
            </Button>
          )}
          {activeTab === "write_offs" && (
            <Button variant="primary" onClick={() => setIsNewWriteOffOpen(true)}>
              <Trash className="mr-2" />
              Novi Zapisnik o Otpisu
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List className="overflow-x-auto flex-nowrap">
          <Tabs.Trigger value="receipts">
            <DocumentText className="mr-2" />
            Prijemnice Robe ({receipts.length})
          </Tabs.Trigger>
          <Tabs.Trigger value="transfers">
            <TruckFast className="mr-2" />
            Međuskladišnice ({transfers.length})
          </Tabs.Trigger>
          <Tabs.Trigger value="write_offs">
            <Trash className="mr-2 text-rose-500" />
            Otpisi i Rashod ({writeOffs.length})
          </Tabs.Trigger>
          <Tabs.Trigger value="movements">
            <ArchiveBox className="mr-2" />
            Karton Artikala / Dnevnik Zaliha ({movements.length})
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="receipts" className="mt-4">
          <ReceiptsTab
            receipts={receipts}
            locationMap={locationMap}
            onSelectReceipt={setViewingReceipt}
            onPostReceipt={handlePostReceipt}
            onPrintReceipt={(r) => printWarehouseDocument({ type: "receipt", data: r, locationMap })}
          />
        </Tabs.Content>

        <Tabs.Content value="transfers" className="mt-4">
          <TransfersTab
            transfers={transfers}
            locationMap={locationMap}
            onSelectTransfer={setViewingTransfer}
            onDispatchTransfer={handleDispatchTransfer}
            onReceiveTransfer={handleReceiveTransfer}
            onPrintTransfer={(t) => printWarehouseDocument({ type: "transfer", data: t, locationMap })}
          />
        </Tabs.Content>

        <Tabs.Content value="write_offs" className="mt-4">
          <WriteOffsTab
            writeOffs={writeOffs}
            locationMap={locationMap}
            onSelectWriteOff={setViewingWriteOff}
            onPostWriteOff={handlePostWriteOff}
            onPrintWriteOff={(w) => printWarehouseDocument({ type: "write_off", data: w, locationMap })}
            getReasonBadge={getReasonBadge}
          />
        </Tabs.Content>

        <Tabs.Content value="movements" className="mt-4">
          <MovementsTab movements={movements} locationMap={locationMap} />
        </Tabs.Content>
      </Tabs>

      {/* Modali */}
      <CreateReceiptModal
        isOpen={isNewReceiptOpen}
        onClose={() => setIsNewReceiptOpen(false)}
        onSuccess={() => {
          setIsNewReceiptOpen(false)
          fetchReceipts()
        }}
        locations={locations}
        inventoryItems={inventoryItems}
      />

      <ViewReceiptModal
        receipt={viewingReceipt}
        onClose={() => setViewingReceipt(null)}
        onPost={handlePostReceipt}
        onPrint={(r) => printWarehouseDocument({ type: "receipt", data: r, locationMap })}
        locationMap={locationMap}
      />

      <CreateTransferModal
        isOpen={isNewTransferOpen}
        onClose={() => setIsNewTransferOpen(false)}
        onSuccess={() => {
          setIsNewTransferOpen(false)
          fetchTransfers()
        }}
        locations={locations}
        inventoryItems={inventoryItems}
      />

      <ViewTransferModal
        transfer={viewingTransfer}
        onClose={() => setViewingTransfer(null)}
        onDispatch={handleDispatchTransfer}
        onReceive={handleReceiveTransfer}
        onPrint={(t) => printWarehouseDocument({ type: "transfer", data: t, locationMap })}
        locationMap={locationMap}
      />

      <CreateWriteOffModal
        isOpen={isNewWriteOffOpen}
        onClose={() => setIsNewWriteOffOpen(false)}
        onSuccess={() => {
          setIsNewWriteOffOpen(false)
          fetchWriteOffs()
        }}
        locations={locations}
        inventoryItems={inventoryItems}
      />

      <ViewWriteOffModal
        writeOff={viewingWriteOff}
        onClose={() => setViewingWriteOff(null)}
        onPost={handlePostWriteOff}
        onPrint={(w) => printWarehouseDocument({ type: "write_off", data: w, locationMap })}
        locationMap={locationMap}
        getReasonBadge={getReasonBadge}
      />
    </div>
  )
}

export default WarehousePage
