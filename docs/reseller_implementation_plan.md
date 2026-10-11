# Plan Implementacije: Modul Preprodavači (Reseller / Agent Management) za Medusa.js v2

## 1. Pregled i Poslovna Logika

Cilj ovog modula je omogućiti saradnju sa **preprodavačima (dropshipperi, terenski agenti, affiliate partneri)** koji narudžbe unose putem vlastite/eksterne aplikacije direktno u vaš Medusa.js backend.

### Ključni zahtjevi:
1. **Unos narudžbi za krajnje kupce**: Preprodavač unosi podatke o svom kupcu (ime, prezime, adresa, grad, broj telefona) i artikle koje je prodao.
2. **Individualni popusti / provizije**: Za svakog preprodavača moguće je definisati:
   - Postotak popusta (npr. 15% na maloprodajne cijene)
   - Fiksnu proviziju po komadu ili narudžbi
   - Ili namjenski B2B cjenovnik
3. **Povezivanje i praćenje u Medusi**: Svaka narudžba u sistemu nosi trajnu vezu sa preprodavačem koji ju je kreirao.
4. **Analitika i finansije u Medusa Adminu**:
   - Koliko je pojedini preprodavač prodao (ukupni promet)
   - Koliko je narudžbi isporučeno, a koliko otkazano / vraćeno
   - Koliko mu je provizije zarađeno, koliko isplaćeno i koliko je trenutno na čekanju
   - Evidencija isplata (payouts)

---

## 2. Arhitektura Sistema (Medusa v2)

```
┌──────────────────────────────────────────────┐
│  Eksterna Aplikacija Preprodavača            │
│  (React Native / Flutter / Web Portal)       │
└──────────────────────┬───────────────────────┘
                       │ REST API (API Ključ / Token)
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│  Medusa.js v2 Backend                                            │
│                                                                  │
│  ┌────────────────────────┐      ┌────────────────────────────┐  │
│  │ Reseller API Rute      │      │ Reseller Modul             │  │
│  │ /reseller/orders       │◄────►│ - Reseller Model           │  │
│  │ /reseller/products     │      │ - ResellerOrder Model      │  │
│  │ /reseller/analytics    │      │ - ResellerPayout Model     │  │
│  └────────────────────────┘      └─────────────┬──────────────┘  │
│                                                │ Link            │
│                                                ▼                 │
│                                  ┌────────────────────────────┐  │
│                                  │ Medusa Core Order          │  │
│                                  │ Fulfillment & Inventory    │  │
│                                  └────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
                       ▲
                       │ Pregled, podešavanje popusta, isplate
┌──────────────────────┴───────────────────────┐
│  Medusa Admin Panel (/app/resellers)          │
└──────────────────────────────────────────────┘
```

---

## 3. Modeli Baze Podataka (`src/modules/reseller/models`)

### 3.1. `Reseller` (Preprodavač)
| Polje | Tip | Opis |
| :--- | :--- | :--- |
| `id` | `text` (PK) | Jedinstveni identifikator (`reseller_...`) |
| `name` | `text` | Naziv preprodavača ili ime firme/obrta |
| `contact_person` | `text` | Ime i prezime odgovorne osobe |
| `email` | `text` (Unique) | Email za prijavu i obavijesti |
| `phone` | `text` | Broj telefona |
| `status` | `enum` | `'active'`, `'inactive'`, `'blocked'` |
| `commission_type` | `enum` | `'percentage'` (postotak) ili `'fixed_amount'` (fiksno po narudžbi) |
| `commission_rate` | `numeric` | Vrijednost provizije/popusta (npr. `20` za 20% ili `10.00` za 10 KM) |
| `sales_channel_id` | `text` (Nullable) | Opcionalno vezivanje za specifičan prodajni kanal |
| `api_key` | `text` (Unique) | Tajni ključ za integraciju njihove eksterne aplikacije |
| `payout_info` | `jsonb` | Bankovni podaci (Broj računa, Banka, IBAN) |
| `metadata` | `jsonb` | Dodatna prilagođena polja |

### 3.2. `ResellerOrder` (Veza Preprodavača i Narudžbe)
| Polje | Tip | Opis |
| :--- | :--- | :--- |
| `id` | `text` (PK) | Jedinstveni ID zapisa |
| `reseller_id` | `text` (FK) | Veza na `Reseller` |
| `order_id` | `text` (FK) | Veza na glavnu Medusa `Order` |
| `customer_name` | `text` | Ime i prezime krajnjeg kupca |
| `customer_phone` | `text` | Broj telefona kupca |
| `customer_address` | `text` | Adresa dostave |
| `customer_city` | `text` | Grad dostave |
| `retail_total` | `numeric` | Ukupan iznos koji kupac plaća kuriru (MPC) |
| `reseller_cost` | `numeric` | Nabavna cijena preprodavača (MPC umanjen za popust) |
| `commission_earned` | `numeric` | Zarada preprodavača na ovoj narudžbi |
| `order_status` | `enum` | `'pending'`, `'processing'`, `'shipped'`, `'delivered'`, `'returned'`, `'canceled'` |
| `payout_status` | `enum` | `'unearned'` (dok nije isporučeno), `'eligible'` (spremno za isplatu), `'paid'` (isplaćeno) |
| `payout_id` | `text` (Nullable) | ID isplate ako je već obračunato |

### 3.3. `ResellerPayout` (Evidencija Isplata)
| Polje | Tip | Opis |
| :--- | :--- | :--- |
| `id` | `text` (PK) | ID isplate |
| `reseller_id` | `text` (FK) | Preprodavač kojem se isplaćuje |
| `amount` | `numeric` | Ukupan isplaćeni iznos |
| `payment_method` | `text` | `'bank_transfer'`, `'cash'`, `'crypto'`, itd. |
| `reference_number` | `text` | Broj uplatnice / transakcije |
| `status` | `enum` | `'completed'`, `'pending'`, `'canceled'` |
| `paid_at` | `timestamptz` | Vrijeme isplate |
| `notes` | `text` | Napomena |

---

## 4. API Specifikacija

### 4.1. Eksterni API za Aplikaciju Preprodavača (`/reseller-api`)

Autentifikacija se vrši putem zaglavlja: `x-reseller-api-key: res_key_xxxxxxxx` ili Bearer JWT tokena.

1. **`GET /reseller-api/products`**
   - Vraća katalog dostupnih artikala, stanje na skladištu, standardnu maloprodajnu cijenu i **njihovu povlaštenu cijenu** (sa uračunatim popustom).
2. **`POST /reseller-api/orders`**
   - Kreiranje nove narudžbe za krajnjeg kupca.
   - **Payload**:
     ```json
     {
       "customer": {
         "first_name": "Marko",
         "last_name": "Marković",
         "phone": "061123456",
         "address": "Bulevar Mira 12",
         "city": "Sarajevo",
         "postal_code": "71000"
       },
       "items": [
         { "variant_id": "variant_01...", "quantity": 2 }
       ],
       "note": "Nazvati prije isporuke"
     }
     ```
   - **Šta Medusa workflow radi**:
     1. Provjerava stanje zaliha.
     2. Kreira standardnu Medusa narudžbu (Order).
     3. Izračunava osnovnu cijenu, proviziju preprodavača i kreira `ResellerOrder` zapis.
     4. Rezerviše količinu na skladištu.
     5. Vraća potvrdu sa brojem narudžbe.
3. **`GET /reseller-api/my-orders`**
   - Pregled statusa njihovih paketa u realnom vremenu (npr. *poslano kurirskom službom*, *isporučeno*, *vraćeno*).
4. **`GET /reseller-api/my-wallet`**
   - Trenutno stanje zarade preprodavača:
     - Ukupno zarađeno
     - Spremno za isplatu (isporučeni paketi)
     - Na čekanju (paketi još na putu)
     - Do sada isplaćeno

---

### 4.2. Medusa Admin API (`/admin/resellers`)

1. `GET /admin/resellers` — Lista preprodavača sa zbirnim podacima (broj narudžbi, ukupan promet, dugovanje).
2. `POST /admin/resellers` — Dodavanje novog preprodavača (ime, popust/provizija, generisanje API ključa).
3. `GET /admin/resellers/:id` — Detaljan profil preprodavača.
4. `PUT /admin/resellers/:id` — Izmjena postavki (% popusta, status, bankovni podaci).
5. `GET /admin/resellers/:id/orders` — Sve narudžbe odabranog preprodavača.
6. `GET /admin/resellers/:id/analytics` — Grafički podaci o prodaji i uspješnosti dostave (stopa vraćenih paketa).
7. `POST /admin/resellers/:id/payouts` — Kreiranje isplate (označavanje narudžbi kao isplaćene).

---

## 5. Medusa Admin Korisnički Interfejs (`src/admin/routes/resellers`)

Kreirat će se novi modul u bočnom meniju Medusa Admina: **Preprodavači**.

### Interfejs se sastoji od 3 glavna taba:

1. **Tab "Preprodavači" (Pregled i Menadžment)**:
   - Tabela sa kolonama: *Naziv*, *Kontakt/Email*, *Tip Provizije (% ili KM)*, *Ukupan Promet*, *Zarađena Provizija*, *Za Isplatu*, *Status*, *Akcije*.
   - Dugme **"Novi Preprodavač"** (otvara modal za unos podataka i postavljanje popusta).
   - Mogućnost regeneracije API ključa koji im šaljete za njihovu aplikaciju.

2. **Tab "Sve Narudžbe Preprodavača"**:
   - Centralni pregled svih narudžbi koje su stigle preko preprodavača.
   - Filteri po: *Preprodavaču*, *Statusu narudžbe*, *Statusu isplate*.
   - Detaljan prikaz: Ko je kupac, koliko je plaćeno pouzećem, kolika je zarada preprodavača.

3. **Tab "Isplate (Payouts)"**:
   - Pregled izvršenih i planiranih isplata.
   - Dugme **"Evidentiraj Isplatu"**: Sistem automatski sumira sve isporučene narudžbe koje još nisu isplaćene i kreira nalog za isplatu.

---

## 6. Automatizacija i Sinhronizacija Statusa (Subscribers)

Kako bi analitika bila 100% tačna bez ručnog unosa:

1. **Narudžba isporučena (`order.fulfillment.delivered`)**:
   - Kada kurirska služba ili skladište označi paket kao isporučen:
   - `ResellerOrder.order_status` prelazi u `delivered`.
   - `ResellerOrder.payout_status` prelazi u `eligible` (preprodavač tek sada stiče pravo na isplatu).
2. **Narudžba vraćena / odbijena (`order.fulfillment.canceled` ili povrat)**:
   - `ResellerOrder.order_status` prelazi u `returned`.
   - Zarada za tu narudžbu se postavlja na 0 (preprodavač ne dobija proviziju za vraćene pakete).

---

## 7. Faze Implementacije (Roadmap)

| Faza | Zadatak | Rezultat |
| :--- | :--- | :--- |
| **Faza 1** | **Kreiranje Modula i Baze** | `src/modules/reseller` sa modelima `Reseller`, `ResellerOrder`, `ResellerPayout` i migracijom. |
| **Faza 2** | **Workflows & Servis** | Servis za upravljanje preprodavačima, izračun provizije i kreiranje narudžbi. |
| **Faza 3** | **Admin API & UI** | Medusa Admin rute i UI stranica `/app/resellers` sa tabelama, analitikom i modalima. |
| **Faza 4** | **Eksterni Reseller API** | Zaštićeni endpointi (`/reseller-api`) sa API ključem za njihovu buduću aplikaciju. |
| **Faza 5** | **Subscribers & Finansije** | Automatsko prebacivanje provizije u "spremno za isplatu" po isporuci paketa. |
