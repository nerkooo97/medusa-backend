import { MedusaService } from "@medusajs/framework/utils"
import { GoodsReceipt } from "./models/goods-receipt"
import { GoodsReceiptItem } from "./models/goods-receipt-item"
import { StockTransfer } from "./models/stock-transfer"
import { StockTransferItem } from "./models/stock-transfer-item"
import { StockMovement } from "./models/stock-movement"
import { StockWriteOff } from "./models/stock-write-off"
import { StockWriteOffItem } from "./models/stock-write-off-item"

class WarehouseModuleService extends MedusaService({
  GoodsReceipt,
  GoodsReceiptItem,
  StockTransfer,
  StockTransferItem,
  StockMovement,
  StockWriteOff,
  StockWriteOffItem,
}) {
  /**
   * Generiše sekvencijalni broj prijemnice u formatu: PRIJ-YYYY-XXXX (npr. PRIJ-2026-0001)
   */
  async generateReceiptNumber(): Promise<string> {
    const year = new Date().getFullYear()
    const prefix = `PRIJ-${year}-`
    
    // Brojimo postojeće prijemnice za tekuću godinu
    const [, count] = await this.listAndCountGoodsReceipts()
    const nextNumber = (count + 1).toString().padStart(4, "0")
    
    return `${prefix}${nextNumber}`
  }

  /**
   * Generiše sekvencijalni broj međuskladišnice u formatu: MSK-YYYY-XXXX (npr. MSK-2026-0001)
   */
  async generateTransferNumber(): Promise<string> {
    const year = new Date().getFullYear()
    const prefix = `MSK-${year}-`
    
    const [, count] = await this.listAndCountStockTransfers()
    const nextNumber = (count + 1).toString().padStart(4, "0")
    
    return `${prefix}${nextNumber}`
  }

  /**
   * Generiše sekvencijalni broj zapisnika o otpisu u formatu: RASH-YYYY-XXXX (npr. RASH-2026-0001)
   */
  async generateWriteOffNumber(): Promise<string> {
    const year = new Date().getFullYear()
    const prefix = `RASH-${year}-`
    
    const [, count] = await this.listAndCountStockWriteOffs()
    const nextNumber = (count + 1).toString().padStart(4, "0")
    
    return `${prefix}${nextNumber}`
  }
}

export default WarehouseModuleService
