import { ReactNode } from "react"

export type LocationMap = Record<string, string>

export interface StockLocation {
  id: string
  name: string
}

export interface InventoryItemOption {
  id: string
  sku: string
  title?: string | null
}

export interface ReceiptsTabProps {
  receipts: any[]
  locationMap: LocationMap
  onSelectReceipt: (receipt: any) => void
  onPostReceipt: (id: string, receiptNumber: string) => void
  onPrintReceipt: (receipt: any) => void
}

export interface TransfersTabProps {
  transfers: any[]
  locationMap: LocationMap
  onSelectTransfer: (transfer: any) => void
  onDispatchTransfer: (id: string, transferNumber: string) => void
  onReceiveTransfer: (id: string, transferNumber: string) => void
  onPrintTransfer: (transfer: any) => void
}

export interface WriteOffsTabProps {
  writeOffs: any[]
  locationMap: LocationMap
  onSelectWriteOff: (writeOff: any) => void
  onPostWriteOff: (id: string, writeOffNumber: string) => void
  onPrintWriteOff: (writeOff: any) => void
  getReasonBadge: (reason: string) => ReactNode
}

export interface MovementsTabProps {
  movements: any[]
  locationMap: LocationMap
}

export interface CreateReceiptModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  locations: StockLocation[]
  inventoryItems: InventoryItemOption[]
}

export interface ViewReceiptModalProps {
  receipt: any | null
  onClose: () => void
  onPost: (id: string, receiptNumber: string) => void
  onPrint: (receipt: any) => void
  locationMap: LocationMap
}

export interface CreateTransferModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  locations: StockLocation[]
  inventoryItems: InventoryItemOption[]
}

export interface ViewTransferModalProps {
  transfer: any | null
  onClose: () => void
  onDispatch: (id: string, transferNumber: string) => void
  onReceive: (id: string, transferNumber: string) => void
  onPrint: (transfer: any) => void
  locationMap: LocationMap
}

export interface CreateWriteOffModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  locations: StockLocation[]
  inventoryItems: InventoryItemOption[]
}

export interface ViewWriteOffModalProps {
  writeOff: any | null
  onClose: () => void
  onPost: (id: string, writeOffNumber: string) => void
  onPrint: (writeOff: any) => void
  locationMap: LocationMap
  getReasonBadge: (reason: string) => ReactNode
}
