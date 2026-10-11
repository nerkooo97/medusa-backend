# 📦 Robno-Materijalno Knjigovodstvo (Warehouse Management Modul)
### MedusaJS v2 Implementaciona Dokumentacija

---

## 1. Uvod i Pregled
Ovaj modul uvodi strogo robno-materijalno poslovanje u MedusaJS v2 platformu. Glavni cilj je osigurati da **nijedan artikal ne može ući u magacin, izaći iz njega, niti preći u drugi magacin bez formalnog, odobrenog robnog dokumenta**. 

Sistem garantuje:
- **Prijem robe isključivo preko Prijemnica (Goods Receipts)** sa podacima o dobavljaču, broju računa/fakture, cijenama i količinama.
- **Međuskladišni transfer (Stock Transfers)** sa praćenjem statusa (*Draft* → *Na putu / In Transit* → *Zaprimljeno na odredištu*).
- **Nepromjenjivi karton artikla (Stock Movement Audit Ledger)** koji u realnom vremenu bilježi svaku promjenu zaliha vezanu za broj dokumenta i ID operatera.
- **Integritet zaliha**: Prijemnice u `draft` statusu ne mijenjaju zalihe; tek formalnim knjiženjem (`/post`) zalihe se automatski ažuriraju u Medusa Core Inventory modulu.

---

## 2. Arhitektura Baze Podataka (DML Modeli)

Modul se nalazi u `src/modules/warehouse/` i sastoji se od 5 povezanih modela:

### 2.1. `GoodsReceipt` (Prijemnica robe)
Tabela: `goods_receipt`
| Polje | Tip | Opis |
|---|---|---|
| `id` | `text` (PK) | Jedinstveni identifikator prijemnice |
| `receipt_number` | `text` (Unique) | Sekvencijalni broj formata `PRIJ-YYYY-XXXX` (npr. `PRIJ-2026-0001`) |
| `supplier_name` | `text` | Naziv dobavljača od koga je roba stigla |
| `invoice_number` | `text` | Broj fakture ili otpremnice dobavljača |
| `invoice_date` | `timestamptz` (Nullable) | Datum izdavanja fakture od strane dobavljača |
| `received_at` | `timestamptz` (Nullable) | Datum i vrijeme kada je roba fizički proknjižena na stanje |
| `stock_location_id` | `text` (FK) | ID skladišta u koje roba ulazi (Medusa `StockLocation`) |
| `status` | `enum` | `'draft'` (u pripremi), `'posted'` (proknjiženo), `'cancelled'` (otkazano) |
| `notes` | `text` (Nullable) | Interna napomena skladištara |
| `created_by` | `text` (Nullable) | ID korisnika koji je unio dokument |

### 2.2. `GoodsReceiptItem` (Stavka prijemnice)
Tabela: `goods_receipt_item`
| Polje | Tip | Opis |
|---|---|---|
| `id` | `text` (PK) | Identifikator stavke |
| `goods_receipt_id` | `text` (FK) | Veza ka zaglavlju prijemnice |
| `inventory_item_id` | `text` (FK) | Veza ka artiklu u Medusa Inventory modulu |
| `sku` | `text` | Šifra / SKU artikla |
| `title` | `text` (Nullable) | Naziv artikla |
| `quantity` | `integer` | Zaprimljena količina (mora biti > 0) |
| `unit_cost` | `numeric` (Nullable) | Nabavna cijena po komadu bez PDV-a |
| `total_cost` | `numeric` (Nullable) | Ukupna nabavna vrijednost stavke (`quantity * unit_cost`) |
| `batch_number` | `text` (Nullable) | LOT broj ili serijski broj (opcionalno) |

### 2.3. `StockTransfer` (Međuskladišnica)
Tabela: `stock_transfer`
| Polje | Tip | Opis |
|---|---|---|
| `id` | `text` (PK) | Identifikator transfera |
| `transfer_number` | `text` (Unique) | Sekvencijalni broj formata `MSK-YYYY-XXXX` |
| `source_location_id` | `text` (FK) | Skladište iz kojeg roba izlazi |
| `destination_location_id` | `text` (FK) | Skladište u koje roba ulazi |
| `status` | `enum` | `'draft'`, `'in_transit'`, `'completed'`, `'cancelled'` |
| `dispatched_at` | `timestamptz` (Nullable) | Datum i vrijeme otpreme sa izvorišta |
| `received_at` | `timestamptz` (Nullable) | Datum i vrijeme potvrde prijema na odredištu |
| `notes` | `text` (Nullable) | Napomena uz prevoz |
| `created_by` | `text` (Nullable) | Korisnik koji je kreirao nalog za transfer |

### 2.4. `StockTransferItem` (Stavka međuskladišnice)
Tabela: `stock_transfer_item`
| Polje | Tip | Opis |
|---|---|---|
| `id` | `text` (PK) | Identifikator stavke |
| `stock_transfer_id` | `text` (FK) | Veza ka transferu |
| `inventory_item_id` | `text` (FK) | ID artikla |
| `sku` | `text` | Šifra artikla |
| `quantity` | `integer` | Količina koja se prebacuje |

### 2.5. `StockMovement` (Karton artikla / Dnevnik kretanja)
Tabela: `stock_movement`
| Polje | Tip | Opis |
|---|---|---|
| `id` | `text` (PK) | ID zapisa |
| `inventory_item_id` | `text` (FK) | Artikal na koji se promjena odnosi |
| `stock_location_id` | `text` (FK) | Magacin u kojem se promjena desila |
| `sku` | `text` (Nullable) | SKU artikla |
| `quantity_change` | `integer` | Promjena stanja: pozitivan broj za ulaz (`+25`), negativan za izlaz (`-10`) |
| `document_type` | `enum` | `'receipt'`, `'transfer_dispatch'`, `'transfer_receive'`, `'order_fulfillment'`, `'adjustment'` |
| `document_id` | `text` | ID pratećeg dokumenta (ID prijemnice, ID transfera, itd.) |
| `reference_number` | `text` (Nullable) | Ljudski čitljiv broj dokumenta (npr. `PRIJ-2026-0001`) |
| `notes` | `text` (Nullable) | Automatski generisan opis |
| `created_by` | `text` (Nullable) | Korisnik koji je izazvao promjenu |
| `created_at` | `timestamptz` | Vremenski žig knjiženja |

---

## 3. Tranzakcioni Workflows (Poslovna Pravila)

Smješteni u `src/workflows/warehouse/`:

### 3.1. `createGoodsReceiptWorkflow`
- Validira ulazne podatke.
- Generiše novi broj prijemnice (`PRIJ-YYYY-XXXX`).
- Kreira zapis prijemnice i njenih stavki u statusu `draft`.
- **Zalihe se u ovoj fazi ne diraju.**

### 3.2. `postGoodsReceiptWorkflow` (Knjiženje prijemnice)
1. **Validacija**: Provjerava da prijemnica postoji i da je u statusu `draft` (odbija duplo knjiženje).
2. **Ažuriranje zaliha**: Poziva Medusa Core korak `adjustInventoryLevelsStep` sa pozitivnom količinom za svaku stavku na ciljnom magacinu.
3. **Audit trag**: Za svaku stavku kreira zapis u tabeli `stock_movement` sa tipom `'receipt'`.
4. **Zaključavanje**: Postavlja status dokumenta na `posted` i bilježi vrijeme knjiženja `received_at`.
5. **Rollback**: U slučaju bilo kakve greške, transakcija se automatski poništava.

### 3.3. `createStockTransferWorkflow`
- Provjerava da polazni i odredišni magacin nisu isti.
- Generiše broj međuskladišnice (`MSK-YYYY-XXXX`).
- Kreira dokument u statusu `draft`.

### 3.4. `dispatchStockTransferWorkflow` (Otprema)
- Validira `draft` status.
- Poziva `adjustInventoryLevelsStep` sa **negativnom količinom** na polaznom skladištu (`source_location_id`).
- Upisuje audit zapis tipa `'transfer_dispatch'`.
- Mijenja status u `in_transit` i postavlja `dispatched_at`.

### 3.5. `receiveStockTransferWorkflow` (Prijem)
- Validira `in_transit` status.
- Poziva `adjustInventoryLevelsStep` sa **pozitivnom količinom** na odredišnom skladištu (`destination_location_id`).
- Upisuje audit zapis tipa `'transfer_receive'`.
- Mijenja status u `completed` i postavlja `received_at`.

---

## 4. Module Links (Povezivanje sa Medusa Core)

U `src/links/` definisani su zvanični Medusa v2 linkovi:
1. `receipt-stock-location.ts`: Povezuje `StockLocationModule.linkable.stockLocation` sa `WarehouseModule.linkable.goodsReceipt`.
2. `receipt-item-inventory-item.ts`: Povezuje `InventoryModule.linkable.inventoryItem` sa `WarehouseModule.linkable.goodsReceiptItem`.
3. `movement-inventory-item.ts`: Povezuje `InventoryModule.linkable.inventoryItem` sa `WarehouseModule.linkable.stockMovement`.

---

## 5. REST API Referenca

Svi endpointi su zaštićeni autentifikacijom i dostupni pod `/admin/warehouse/`:

### Prijemnice
- **`GET /admin/warehouse/receipts`**
  - Query parametri: `status` (`draft`|`posted`), `stock_location_id`, `supplier_name`, `limit`, `offset`.
  - Vraća: `{ goods_receipts: [...], count, limit, offset }`
- **`POST /admin/warehouse/receipts`**
  - Body:
    ```json
    {
      "supplier_name": "Nike Distribution B.V.",
      "invoice_number": "INV-2026-9901",
      "invoice_date": "2026-10-11",
      "stock_location_id": "sloc_01...",
      "notes": "Prva isporuka zimske sezone",
      "items": [
        {
          "inventory_item_id": "iitem_01...",
          "sku": "SWEATPANTS-L",
          "title": "Nike Sweatpants L",
          "quantity": 25,
          "unit_cost": 45.50
        }
      ]
    }
    ```
- **`GET /admin/warehouse/receipts/:id`**
  - Vraća detalje prijemnice sa stavkama.
- **`POST /admin/warehouse/receipts/:id/post`**
  - Knjiži prijemnicu i uvećava stanje zaliha.

### Međuskladišnice
- **`GET /admin/warehouse/transfers`**: Lista transfera.
- **`POST /admin/warehouse/transfers`**: Kreiranje novog transfera (Draft).
- **`GET /admin/warehouse/transfers/:id`**: Detalji transfera sa stavkama.
- **`POST /admin/warehouse/transfers/:id/dispatch`**: Otprema (skida sa stanja na izvoru).
- **`POST /admin/warehouse/transfers/:id/receive`**: Prijem (dodaje na stanje na odredištu).

### Karton Artikala (Audit Dnevnik)
- **`GET /admin/warehouse/movements`**
  - Query parametri: `inventory_item_id`, `stock_location_id`, `document_type`, `limit`, `offset`.
  - Vraća hronološku listu svih ulaza i izlaza.

---

## 6. Korisnički Interfejs (Admin Dashboard)

1. **Glavna navigacija (`Robno Poslovanje`)**:
   - Pristup: `/app/warehouse`
   - **Tab 1: Prijemnice Robe**: Tabela, pretraga, status bedževi, dugme za kreiranje novog dokumenta i dugme za knjiženje (`Proknjiži`).
   - **Tab 2: Međuskladišnice**: Upravljanje prenosom robe između magacina uz statusne akcije (`Otpremi` i `Zaprimi`).
   - **Tab 3: Karton Artikala**: Globalni pregled svih promjena zaliha po magacinima i datumima.
2. **Karton Artikla Widget**:
   - Automatski se prikazuje na dnu ekrana detalja svakog artikla u admin panelu (`inventory_item.details.after`). Prikazuje tačnu historiju nabavki i transfera za taj specifični artikal.
