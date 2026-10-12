# Medusa v2 – POS (Point of Sale) Modul & API Dokumentacija

Ova dokumentacija namijenjena je programerima koji integrišu **POS (kasa) modul** sa Medusa v2 backendom, razvijaju vanjsku **Expo (React Native) tablet/mobilnu aplikaciju za kasu** i pripremaju hardversko povezivanje sa **fiskalnim printerima u Bosni i Hercegovini (FBiH / RS)**.

---

## 1. Pregled Arhitekture

POS modul omogućava organizaciju maloprodajne mreže sa više fizičkih objekata (poslovnih jedinica), registar kasa, magacina i kasira:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        MEDUSA v2 POS MODUL                             │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  [Poslovna Jedinica / Objekat]                                         │
│   ├── Naziv, Adresa, Grad, Poštanski broj                              │
│   └── JIB / PIB (porezni broj) & PDV broj                              │
│                                                                        │
│  [PosRegister - Kasa]                                                  │
│   ├── Šifra (npr. POS-001) & Sigurnosni Device Key                     │
│   ├── Povezani Prodajni Kanal (Sales Channel - cjenovnik i artikli)    │
│   ├── Povezani Magacin (Stock Location - skidanje stanja sa zaliha)    │
│   ├── Načini plaćanja (Gotovina, Kartica, Žiralno, Vaučer)             │
│   └── BiH Fiskalni Printer (Tring, HCP, Tremol - IP, Port, IBFM)       │
│                                                                        │
│  [PosRegisterOperator - Kasiri]                                        │
│   ├── Veza sa Medusa User nalogom                                      │
│   ├── Uloga (cashier, supervisor, admin)                               │
│   └── 4-cifreni PIN kod za brzu touch prijavu                         │
│                                                                        │
│  [PosRegisterSession - Smjene]                                         │
│   ├── Otvaranje smjene & Početni polog gotovine                        │
│   └── Zatvaranje smjene & Rekapitulacija stanja gotovine               │
│                                                                        │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
              ┌────────────────────┴────────────────────┐
              ▼                                         ▼
   [Expo Tablet/POS App]                       [Medusa Admin Panel]
   - Touch-screen prodaja                      - Konfiguracija objekata
   - PIN prijava kasira                        - Dodjela kasira i kanala
   - Fiskalno štampanje računa                 - Uvid u smjene i pologe
```

---

## 2. Postman Kolekcija

Gotova Postman kolekcija (v2.1.0) nalazi se u direktoriju projekta:
- **Putanja fajla:** [docs/pos_postman_collection.json](file:///Users/nermin.karic/projekti/medusajsshops/medusa-backend/docs/pos_postman_collection.json)

### Kako importovati u Postman:
1. Otvorite **Postman**.
2. Kliknite na dugme **Import** (gore lijevo).
3. Odaberite fajl `docs/pos_postman_collection.json`.
4. U Postmanu podesite varijable kolekcije (`Variables`):
   - `base_url`: `http://localhost:9000` (ili vaša produkcijska domena)
   - `admin_token`: Vaš Medusa Admin JWT token
   - `pos_register_id`: ID kase sa kojom radite (npr. `01M4R3BSMFJNMNPGYD7XMK6Q09`)
   - `pos_device_key`: Sigurnosni ključ kase (npr. `pos_dev_8c1ced6f51b12dec...`)
   - `user_id`: ID registrovanog korisnika iz Medusa `User` modula

---

## 3. Expo POS Terminal Integracija (Mobilna / Tablet Aplikacija)

Kada se Expo aplikacija pokrene na tabletu na prodajnom mjestu, ona izvršava dva ključna koraka:
1. **Preuzimanje konfiguracije objekta i kase** (`GET /admin/pos/terminal/:id/config`)
2. **Brza autentifikacija kasira putem PIN koda** (`POST /admin/pos/terminal/:id/auth`)

---

### 3.1. Preuzimanje Konfiguracije Kase za Expo Aplikaciju

Vraća cjelokupan profil poslovne jedinice, prodajni kanal, magacin, načine plaćanja, postavke za BiH fiskalni printer, te listu ovlaštenih kasira (bez izlaganja samog PIN koda klijentu).

- **Metoda:** `GET`
- **Putanja:** `/admin/pos/terminal/:id/config`
- **Zaglavlja:**
  ```http
  Authorization: Bearer {{admin_token}}
  x-pos-device-key: {{pos_device_key}}
  ```

#### Primjer cURL zahtjeva:
```bash
curl -X GET "http://localhost:9000/admin/pos/terminal/01M4R3BSMFJNMNPGYD7XMK6Q09/config" \
  -H "Authorization: Bearer <ADMIN_JWT_TOKEN>" \
  -H "x-pos-device-key: pos_dev_8c1ced6f51b12dec73181306f8da123a"
```

#### Primjer JSON Odgovora (200 OK):
```json
{
  "terminal": {
    "id": "01M4R3BSMFJNMNPGYD7XMK6Q09",
    "name": "Glavna Kasa Sarajevo 1",
    "code": "POS-001",
    "status": "active",
    "unit": {
      "name": "Piko Alati - PJ Sarajevo 1",
      "address": "Džemala Bijedića 160",
      "city": "Sarajevo",
      "postal_code": "71000",
      "country_code": "ba",
      "phone": "+387 33 123 456",
      "email": "pos.sarajevo1@pikoalati.ba",
      "tax_id": "4201234560001",
      "vat_id": "201234560001"
    },
    "sales_channel": {
      "id": "sc_01M4R3AF7MMJ12A8BEJ9SV0VGA",
      "name": "Default Sales Channel",
      "description": "Glavni prodajni kanal za maloprodaju"
    },
    "stock_location": {
      "id": "sloc_01M4R3AFCEJF4BH2D800A00C2N",
      "name": "Glavno Skladište Sarajevo"
    },
    "payment_methods": [
      { "id": "cash", "label": "Gotovina", "is_default": true },
      { "id": "card", "label": "Platna kartica", "is_default": false },
      { "id": "wire_transfer", "label": "Žiralno / Virman", "is_default": false }
    ],
    "fiscal_hardware": {
      "type": "tring",
      "ip": "192.168.1.150",
      "port": 8080,
      "device_serial": "TRING-IBFM-0042",
      "receipt_header": "PIKO ALATI d.o.o.\nPJ Sarajevo 1\nDžemala Bijedića 160",
      "receipt_footer": "Hvala na posjeti!\nKupujte sigurno - Piko Alati"
    },
    "current_session": {
      "id": "01M4R3BSN2Y0QXETYH17B3W7S9",
      "status": "open",
      "opened_at": "2026-10-12T13:03:20.000Z",
      "opening_cash": 200,
      "opened_by_user_id": "usr_01M4R3AF..."
    },
    "operators": [
      {
        "operator_id": "01M4R...",
        "user_id": "usr_01M4R...",
        "role": "cashier",
        "has_pin": true,
        "name": "Nermin Karić",
        "email": "admin@pikoalati.ba"
      }
    ]
  }
}
```

---

### 3.2. Prijava Kasira na Touch Ekranu (PIN Auth)

Omogućava brzu prijavu kasira na kasi odabirom operatera sa liste i unosom njegovog 4-cifrenog PIN-a.

- **Metoda:** `POST`
- **Putanja:** `/admin/pos/terminal/:id/auth`
- **Body:**
  ```json
  {
    "user_id": "usr_01M4R3AF...",
    "pin_code": "1234"
  }
  ```

#### Primjer JSON Odgovora (200 OK):
```json
{
  "success": true,
  "operator": {
    "operator_id": "01M4R...",
    "user_id": "usr_01M4R...",
    "role": "cashier",
    "name": "Nermin Karić",
    "email": "admin@pikoalati.ba"
  },
  "current_session": {
    "id": "01M4R3BSN2Y0QXETYH17B3W7S9",
    "status": "open",
    "opened_at": "2026-10-12T13:03:20.000Z",
    "opening_cash": 200
  }
}
```

> [!WARNING]
> Ako je unesen pogrešan PIN kod, endpoint vraća HTTP `401 Unauthorized`:
> ```json
> {
>   "success": false,
>   "message": "Pogrešan PIN kod.",
>   "requires_pin": true
> }
> ```

---

## 4. Admin API – Upravljanje Kasama i Poslovnim Jedinicama

### 4.1. Dohvat Dostupnih Opcija za Konfiguraciju
Vraća postojeće prodajne kanale, skladišta, registrovane korisnike, metode plaćanja i tipove fiskalnih uređaja za popunjavanje dropdown menija u administrativnom sučelju.

- **Metoda:** `GET`
- **Putanja:** `/admin/pos/options`

---

### 4.2. Lista Svih POS Kasa
- **Metoda:** `GET`
- **Putanja:** `/admin/pos/registers`
- **Query parametri:**
  - `limit` (default: 50)
  - `offset` (default: 0)
  - `status` (`active`, `inactive`, `maintenance`)
  - `store_city` (filtriranje po gradu)

---

### 4.3. Kreiranje Nove POS Kase
- **Metoda:** `POST`
- **Putanja:** `/admin/pos/registers`
- **Body (Primjer):**
```json
{
  "name": "Glavna Kasa Sarajevo 1",
  "code": "POS-001",
  "description": "POS terminal za maloprodajni objekat Sarajevo",
  "status": "active",
  "store_name": "Piko Alati - PJ Sarajevo 1",
  "store_address": "Džemala Bijedića 160",
  "store_city": "Sarajevo",
  "store_postal_code": "71000",
  "store_country_code": "ba",
  "store_phone": "+387 33 123 456",
  "store_email": "pos.sarajevo1@pikoalati.ba",
  "tax_id": "4201234560001",
  "vat_id": "201234560001",
  "sales_channel_id": "sc_01M4R3AF7MMJ12A8BEJ9SV0VGA",
  "stock_location_id": "sloc_01M4R3AFCEJF4BH2D800A00C2N",
  "supported_payment_methods": ["cash", "card", "wire_transfer"],
  "default_payment_method": "cash",
  "fiscal_printer_type": "tring",
  "fiscal_printer_ip": "192.168.1.150",
  "fiscal_printer_port": 8080,
  "fiscal_device_serial": "TRING-IBFM-0042",
  "receipt_header": "PIKO ALATI d.o.o.\nPJ Sarajevo 1\nDžemala Bijedića 160",
  "receipt_footer": "Hvala na posjeti!\nKupujte sigurno - Piko Alati"
}
```

---

### 4.4. Ažuriranje POS Kase
- **Metoda:** `PUT`
- **Putanja:** `/admin/pos/registers/:id`
- **Body:** Bilo koje polje koje se mijenja (`name`, `store_address`, `sales_channel_id`, `stock_location_id`, `supported_payment_methods`, `fiscal_printer_ip`, itd.).

---

### 4.5. Brisanje POS Kase
- **Metoda:** `DELETE`
- **Putanja:** `/admin/pos/registers/:id`

---

## 5. Upravljanje Kasirima (Operaterima Kase)

### 5.1. Dodjeljivanje Registrovanog Korisnika na Kasu
- **Metoda:** `POST`
- **Putanja:** `/admin/pos/registers/:id/operators`
- **Body:**
```json
{
  "user_id": "usr_01M4R3AF...",
  "role": "cashier",
  "pin_code": "1234",
  "is_active": true
}
```
*Uloge mogu biti: `cashier` (kasir), `supervisor` (poslovođa), `admin` (administrator).*

---

### 5.2. Ažuriranje Uloge ili PIN Koda Kasira
- **Metoda:** `PUT`
- **Putanja:** `/admin/pos/registers/:id/operators/:operator_id`
- **Body:**
```json
{
  "role": "supervisor",
  "pin_code": "4321",
  "is_active": true
}
```

---

### 5.3. Uklanjanje Kasira sa Kase
- **Metoda:** `DELETE`
- **Putanja:** `/admin/pos/registers/:id/operators/:operator_id`

---

## 6. Upravljanje Smjenama (Otvaranje, Polog & Zatvaranje)

Smjene prate fizički tok novca na kasi tokom radnog dana.

### 6.1. Otvaranje Smjene (Početni Polog Gotovine)
- **Metoda:** `POST`
- **Putanja:** `/admin/pos/registers/:id/sessions`
- **Body:**
```json
{
  "action": "open",
  "user_id": "usr_01M4R3AF...",
  "opening_cash": 200,
  "notes": "Jutarnja smjena otvorena sa pologom od 200 KM"
}
```

> [!NOTE]
> Ako kasa već ima otvorenu smjenu, sistem vraća grešku. Prethodna smjena se prvo mora zatvoriti.

---

### 6.2. Zatvaranje Smjene (Krajnji Iznos Gotovine)
- **Metoda:** `POST`
- **Putanja:** `/admin/pos/registers/:id/sessions`
- **Body:**
```json
{
  "action": "close",
  "session_id": "01M4R3BSN2Y0QXETYH17B3W7S9",
  "user_id": "usr_01M4R3AF...",
  "closing_cash": 850,
  "notes": "Kraj dana. Polog + dnevni gotovinski pazar iznosi 850 KM."
}
```

---

### 6.3. Pregled Prethodnih Smjena
- **Metoda:** `GET`
- **Putanja:** `/admin/pos/registers/:id/sessions?limit=20&offset=0`

---

## 7. Hardver & Fiskalizacija u BiH (Smjernice za Expo i Printere)

U BiH zakonodavstvu (FBiH i RS), fiskalni račun zahtijeva:
1. **JIB obveznika** (`tax_id`) – 13-cifreni jedinstveni identifikacioni broj.
2. **PDV broj** (`vat_id`) – 12-cifreni broj ako je firma u sistemu PDV-a.
3. **IBFM** (`fiscal_device_serial`) – Individualni broj fiskalnog modula štampača.
4. **Tačan naziv i adresu prodajnog mjesta** (`store_name`, `store_address`, `store_city`).
5. **Način plaćanja** – Gotovina, Kartica, Žiralno.

### Podržani protokoli i printeri u BiH:
- **Tring (FBiH/RS):** Podržava komunikaciju preko lokalnog HTTP/WebSocket Tring Fiskalnog Servera ili TCP socketa (port obično `8080` ili `8085`).
- **HCP (Best, P2DS, Ultima):** Podržava TCP/IP mrežnu komunikaciju ili serijski port preko protokola sa CRC kontrolom.
- **Tremol (FP05, FP15, FP24):** Komunikacija preko LAN interfejsa ili Tremol Server REST servisa.
- **Generički ESC/POS:** Standardni termalni mrežni printeri za izdavanje nefiskalnih slipova i narudžbi za kuhinju/magacin.

U konfiguraciji kase (`fiscal_printer_type`, `fiscal_printer_ip`, `fiscal_printer_port`, `fiscal_device_serial`) svi ovi parametri su već centralizovano pohranjeni u bazi i odmah dostupni tabletu kroz `/terminal/:id/config` endpoint!
