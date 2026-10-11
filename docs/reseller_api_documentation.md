# Medusa v2 – Reseller API Dokumentacija za Integraciju

Ova dokumentacija namijenjena je programerima koji razvijaju vanjsku mobilnu (iOS/Android) ili web aplikaciju za preprodavače / agente.

---

## 1. Postman Kolekcija

Gotov Postman Collection fajl možete direktno importovati u Postman:

- Putanja fajla: [reseller_postman_collection.json](file:///Users/nerminkaric/projekti/medusa-backend/docs/reseller_postman_collection.json)

### Kako importovati u Postman:

1. Otvorite **Postman**.
2. Kliknite na dugme **Import** (gore lijevo).
3. Odaberite fajl `docs/reseller_postman_collection.json`.
4. U Postmanu postavite varijable kolekcije (`Variables`):
   - `base_url`: `http://localhost:9000` (ili vaša produkcijska domena)
   - `reseller_api_key`: Vaš generisani ključ koji počinje sa `res_key_...`

---

## 2. Autentifikacija

Svi zahtjevi sa vanjske aplikacije preprodavača moraju sadržavati HTTP zaglavlje sa tajnim ključem:

```http
x-reseller-api-key: res_key_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

> [!NOTE]
> Ako ključ nedostaje ili je nevažeći, API vraća `401 Unauthorized`:
>
> ```json
> {
>   "message": "Nevažeći API ključ preprodavača."
> }
> ```

---

## 3. API Rute za Preprodavače

### 3.1. Katalog Proizvoda sa Popustom i Zaradom

Dohvaća sve artikle iz ponude sa izračunatim cijenama specifično za tog preprodavača (na osnovu njegovog procenta ili fiksnog iznosa provizije).

- **Metoda:** `GET`
- **Putanja:** `/reseller-api/products`
- **Zaglavlja:**
  ```http
  x-reseller-api-key: {{reseller_api_key}}
  ```

#### Primjer cURL zahtjeva:

```bash
curl -X GET "http://localhost:9000/reseller-api/products" \
  -H "x-reseller-api-key: res_key_xxxxxxxx"
```

#### Primjer odgovora (200 OK):

```json
{
  "reseller": {
    "id": "res_01M4PC1NB54QYY5E7HZR115QKV",
    "name": "Ahmed Hadžić",
    "commission_type": "percentage",
    "commission_rate": 15
  },
  "products": [
    {
      "id": "prod_01JXXXXXX",
      "title": "Muška Polo Majica",
      "subtitle": "Kvalitetni pamuk",
      "description": "Elegantna pamučna polo majica.",
      "thumbnail": "https://example.com/majica.jpg",
      "variants": [
        {
          "id": "variant_01JYYYYYY",
          "title": "Crna / L",
          "sku": "POLO-BLK-L",
          "retail_price": 60.0,
          "reseller_cost": 51.0,
          "profit_margin": 9.0,
          "currency": "BAM"
        }
      ]
    }
  ]
}
```

> [!NOTE]
> **Ograničenje po Kanalu Prodaje (Sales Channel):**
>
> - Ako je preprodavaču u admin postavkama dodijeljen određeni **Kanal Prodaje** (`sales_channel_id`), ova ruta automatski vraća **isključivo proizvode dodijeljene tom kanalu**.
> - Ako preprodavač nema definisan kanal (postavljeno na "Svi kanali"), ima pristup **cjelokupnom asortimanu svih proizvoda**.
> - Polje `reseller.sales_channel_id` u odgovoru prikazuje ID dodijeljenog kanala (ili `null` ako nema ograničenja).

_Pojašnjenje polja:_

- `retail_price`: Maloprodajna cijena (MPC) koju kupac plaća.
- `reseller_cost`: Cijena koju preprodavač duguje vama (`retail_price - profit_margin`).
- `profit_margin`: Čista zarada / provizija preprodavača za ovaj artikal.

---

### 3.2. Slanje Narudžbe za Krajnjeg Kupca

Preprodavač unosi podatke osobe koja je naručila preko njega i odabrane artikle. Medusa automatski kreira narudžbu i evidentira proviziju.

- **Metoda:** `POST`
- **Putanja:** `/reseller-api/orders`
- **Zaglavlja:**
  ```http
  x-reseller-api-key: {{reseller_api_key}}
  Content-Type: application/json
  ```

#### Tijelo Zahtjeva (JSON Body):

```json
{
  "customer": {
    "first_name": "Edin",
    "last_name": "Džeko",
    "phone": "+38761123456",
    "address": "Zmaja od Bosne 10",
    "city": "Sarajevo",
    "postal_code": "71000"
  },
  "items": [
    {
      "variant_id": "variant_01JYYYYYY",
      "quantity": 2
    }
  ],
  "note": "Molimo dostaviti poslije 16h."
}
```

#### Primjer cURL zahtjeva:

```bash
curl -X POST "http://localhost:9000/reseller-api/orders" \
  -H "x-reseller-api-key: res_key_xxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "customer": {
      "first_name": "Edin",
      "last_name": "Džeko",
      "phone": "+38761123456",
      "address": "Zmaja od Bosne 10",
      "city": "Sarajevo",
      "postal_code": "71000"
    },
    "items": [
      {
        "variant_id": "variant_01JYYYYYY",
        "quantity": 2
      }
    ],
    "note": "Zvati kupca prije isporuke"
  }'
```

#### Primjer odgovora (201 Created):

```json
{
  "success": true,
  "order_id": "order_01M4PDXXXX",
  "customer_id": "cus_01M4PDYYYY",
  "medusa_order": {
    "id": "order_01M4PDXXXX",
    "display_id": 1002,
    "status": "pending"
  },
  "reseller_order": {
    "id": "res_ord_01M4PDZZZZ",
    "order_id": "order_01M4PDXXXX",
    "customer_name": "Edin Džeko",
    "retail_total": 120.0,
    "reseller_cost": 102.0,
    "commission_earned": 18.0,
    "order_status": "pending",
    "payout_status": "unearned"
  },
  "message": "Narudžba i kupac su uspješno evidentirani u standardnom Medusa sistemu."
}
```

> [!IMPORTANT]
> **Kako funkcioniše standardna Medusa veza i validacija kanala:**
>
> 1. **Provjera Kanala Prodaje**: Ako preprodavač ima dodijeljen određeni kanal, a pokuša poslati narudžbu sa varijantom artikla koja ne pripada tom kanalu, API vraća `403 Forbidden` (`Artikal '...' nije dostupan u vašem prodajnom kanalu`).
> 2. **Centralni Kupci (`/app/customers`)**: Sistem automatski provjerava telefon i email kupca u bazi. Ako kupac već postoji, nova narudžba se veže na njegov postojeći profil. Ako ne postoji, kreira se novi standardni Medusa Kupac sa spremljenom adresom za dostavu.
> 3. **Centralne Narudžbe (`/app/orders`)**: Narudžba se kreira kroz standardni `createOrderWorkflow` (i automatski se veže za kanal prodaje preprodavača) i odmah se pojavljuje u glavnoj listi narudžbi Medusa Admin panela, sa svim artiklima, cijenama i adresom.
> 4. **Isporuka & Skladište**: Skladište obrađuje i šalje paket kroz standardni Medusa fulfillment workflow. Kada paket pređe u status `Poslano` i `Isporučeno`, subscriber automatski prepoznaje promjenu i ažurira status preprodavačeve provizije u `eligible` (spremno za isplatu).
> 5. **Reseller veza**: Reseller modul služi isključivo kao veza koja prati izvor prodaje, kalkuliše maržu preprodavača i vodi evidenciju isplata provizije.

---

### 3.3. Pregled Poslatih Narudžbi Preprodavača

Vraća sve narudžbe ovog preprodavača kako bi mogao pratiti u kojoj je fazi dostava i kada mu je provizija odobrena.

- **Metoda:** `GET`
- **Putanja:** `/reseller-api/my-orders`
- **Zaglavlja:**
  ```http
  x-reseller-api-key: {{reseller_api_key}}
  ```

#### Primjer cURL zahtjeva:

```bash
curl -X GET "http://localhost:9000/reseller-api/my-orders" \
  -H "x-reseller-api-key: res_key_xxxxxxxx"
```

#### Primjer odgovora (200 OK):

```json
{
  "orders": [
    {
      "id": "res_ord_01M4PDXXXX",
      "order_id": "ord_res_17917500000_abcde",
      "customer_name": "Edin Džeko",
      "customer_phone": "+38761123456",
      "customer_city": "Sarajevo",
      "retail_total": 120.0,
      "reseller_cost": 102.0,
      "commission_earned": 18.0,
      "order_status": "shipped",
      "payout_status": "unearned",
      "created_at": "2026-10-11T21:05:00.000Z"
    }
  ]
}
```

_Statusi narudžbe (`order_status`):_

- `pending`: Narudžba zaprimljena, čeka pakovanje.
- `shipped`: Paket poslan brzom poštom.
- `delivered`: Paket uspješno uručen kupcu i naplaćen! (Provizija automatski prelazi u `eligible`).
- `returned`: Paket vraćen / neisporučen.
- `canceled`: Narudžba stornirana.

---

### 3.4. Stanje Novčanika & Zarade Preprodavača

Preprodavač u svojoj aplikaciji vidi profil, ukupan promet, zarađenu proviziju, iznos koji može podići i do sada isplaćeni novac.

- **Metoda:** `GET`
- **Putanja:** `/reseller-api/my-wallet`
- **Zaglavlja:**
  ```http
  x-reseller-api-key: {{reseller_api_key}}
  ```

#### Primjer cURL zahtjeva:

```bash
curl -X GET "http://localhost:9000/reseller-api/my-wallet" \
  -H "x-reseller-api-key: res_key_xxxxxxxx"
```

#### Primjer odgovora (200 OK):

```json
{
  "reseller": {
    "id": "res_01M4PC1NB54QYY5E7HZR115QKV",
    "name": "Ahmed Hadžić",
    "commission_type": "percentage",
    "commission_rate": 15
  },
  "wallet": {
    "total_sales_turnover": 850.0,
    "total_earned_commission": 127.5,
    "eligible_for_payout": 45.0,
    "already_paid_out": 82.5,
    "pending_delivery": 0.0,
    "currency": "BAM"
  }
}
```

---

## 4. JavaScript / TypeScript Primjer za Frontend Aplikaciju

```typescript
const RESELLER_API_BASE = "http://localhost:9000/reseller-api";
const API_KEY = "res_key_vas_api_kljuc";

// 1. Dohvaćanje proizvoda
export async function getProducts() {
  const res = await fetch(`${RESELLER_API_BASE}/products`, {
    headers: { "x-reseller-api-key": API_KEY },
  });
  return await res.json();
}

// 2. Slanje narudžbe
export async function placeOrder(
  customerData: any,
  items: any[],
  note?: string,
) {
  const res = await fetch(`${RESELLER_API_BASE}/orders`, {
    method: "POST",
    headers: {
      "x-reseller-api-key": API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      customer: customerData,
      items: items,
      note: note,
    }),
  });
  return await res.json();
}

// 3. Stanje novčanika
export async function getWallet() {
  const res = await fetch(`${RESELLER_API_BASE}/my-wallet`, {
    headers: { "x-reseller-api-key": API_KEY },
  });
  return await res.json();
}
```
