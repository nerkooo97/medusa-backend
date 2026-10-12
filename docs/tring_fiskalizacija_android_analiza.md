# Analiza Tring Fiskalizacije za Android POS Kase (Expo / React Native)

Ovaj dokument predstavlja detaljnu analizu tehničke dokumentacije **`7-uputstvo-za-integraciju.pdf`** kompanije **Tring d.o.o. Gračanica**, sa fokusom na **arhitekturu i implementaciju fiskalizacije na Android uređajima** (tableti i mobilni telefoni na kojima će se pokretati POS kasa razvijena u Expo / React Native okruženju).

---

## 1. Sažetak Dokumentacije Tring Fiskalnih Uređaja

Dokumentacija pokriva integraciju softverskih rješenja sa Tring fiskalnim uređajima (npr. *TringFavourite Plus*, *TringPartner* i dr.) putem softverskog servisa **`Tring.Fiscal.Server`**.

### Ključne postavke Tring sistema:
- `Tring.Fiscal.Server` djeluje kao posrednik (drajver) između korisničke aplikacije i fizičkog fiskalnog uređaja (spojenog preko serijskog porta RS232, USB-a ili mreže).
- Server podržava **4 načina integracije**:
  1. **.NET biblioteka (`Tring.Fiscal.Driver.dll`)** – Namijenjeno za C#, VB.NET na Windows platformi.
  2. **COM objekti** – Za starija okruženja (Delphi, VB6, FoxPro).
  3. **HTTP-POST metoda sa XML naredbama** – **KLJUČNO ZA ANDROID I WEB APLIKACIJE**.
  4. **Rad putem datoteka (File system)** – Upis `.xml` datoteka u ulazni folder i čitanje odgovora iz podfoldera `/odgovori`.

---

## 2. Zašto je HTTP-POST XML Metoda Pravo Rješenje za Android?

U poglavlju **6.1.3 ("Metod direktnog slanja XML naredbe putem HTTP-POST metode")**, Tring eksplicitno dokumentuje da `Tring.Fiscal.Server` posjeduje ugrađen **lokalni HTTP web server** koji po defaultu sluša na portu **`8085`** (npr. `http://localhost:8085/` ili na lokalnoj IP adresi `http://192.168.x.x:8085/`).

### Prednosti za Android (Expo / React Native):
1. **Nema potrebe za kompajliranjem native C#/C++ biblioteka za Android.**
2. **Standardni Web API:** Android aplikacija može koristiti običan JavaScript `fetch()` ili `axios` za slanje komandi.
3. **Čisti XML payload:** Naredbe se šalju kao HTTP `POST` sa zaglavljem `Content-Type: text/xml; charset=utf-8`.
4. **Strukturiran odgovor:** Server vraća XML dokument sa statusom `OK` ili kodom greške, zajedno sa brojem fiskalnog računa i vremenom štampe.

---

## 3. Moguće Arhitekture Povezivanja na Prodajnom Mjestu

Budući da je Android tablet bežičan uređaj na prodajnom pultu, a fiskalna kasa fizički hardver, razmatramo 3 arhitektonska modela:

```
─────────────────────────────────────────────────────────────────────────────
MODEL A: Lokalna Wi-Fi Mreža (Preporučeno i najčešće u BiH)
─────────────────────────────────────────────────────────────────────────────

  [Android Tablet - Expo POS]
             │
             │ Wi-Fi (HTTP POST na 192.168.1.150:8085)
             ▼
  [Lokalni Mini PC / Box sa Tring Serverom] ── USB/COM ──▶ [Tring Fiskalni Printer]
             │
             │ (Preuzima config i šalje narudžbe)
             ▼
  [Medusa v2 Cloud Backend]

─────────────────────────────────────────────────────────────────────────────
MODEL B: Direktno Mrežni Tring Printer (Ukoliko kasa ima LAN modul)
─────────────────────────────────────────────────────────────────────────────

  [Android Tablet - Expo POS] ── Wi-Fi ──▶ [Tring Mrežni Printer (LAN/IP)]

─────────────────────────────────────────────────────────────────────────────
MODEL C: Centralizovani Medusa Server Proxy (Za radnje u LAN-u backenda)
─────────────────────────────────────────────────────────────────────────────

  [Android Tablet] ──▶ [Medusa Backend] ──▶ [Lokalni Tring Server]
```

### Preporučeni Model: **Model A (Lokalna Wi-Fi Komunikacija)**
- U svakom maloprodajnom objektu, Tring kasa je USB-om spojena na mali računar (mini PC, POS terminal, ili čak jeftini Windows stick/box) koji pokreće `Tring.Fiscal.Server`.
- U našem Medusa POS modulu, za tu kasu smo već predvidjeli polja:
  - `fiscal_printer_type`: `"tring"`
  - `fiscal_printer_ip`: `"192.168.1.150"` (lokalna IP adresa)
  - `fiscal_printer_port`: `8085`
- Kada se Expo aplikacija pokrene, ona pozove Medusa endpoint:
  ```http
  GET /admin/pos/terminal/:id/config
  ```
  i dobije tačnu IP adresu i port Tring servera za taj objekat.
- Prilikom završetka prodaje na kasi, **Expo aplikacija direktno šalje HTTP POST zahtjev na Tring server u lokalnoj mreži**. Štampa se izvršava trenutno (manje od 1 sekunde).

---

## 4. Specifikacija Tring XML Komandi (Prema Uputstvu)

### 4.1. Prijava na Uređaj – Inicijalizacija
Prije početka rada ili na početku smjene, kasir se prijavljuje na uređaj:

- **Endpoint:** `POST http://<IP>:8085/inicijalizacija`
- **Content-Type:** `text/xml; charset=utf-8`
- **Request XML:**
```xml
<?xml version="1.0" encoding="utf-8"?>
<Operator xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <BrojOperatora>1</BrojOperatora>
  <Lozinka>0</Lozinka>
</Operator>
```

---

### 4.2. Štampanje Fiskalnog Računa (`StampatiFiskalniRacun`)
Ovo je osnovna i najvažnija operacija prodaje.

- **Endpoint:** `POST http://<IP>:8085/stampatifiskalniracun`
- **Pravila iz dokumentacije:**
  1. **Poreske stope u BiH:**
     - `E` = Opšta stopa PDV-a (**17%**) – koristi se za veliku većinu artikala.
     - `K` = Stopa za artikle oslobođene plaćanja PDV-a (**0%**).
     - `A` = Stopa za firme koje **nisu** u sistemu PDV-a (**0%**).
  2. **Vrste plaćanja:**
     - `Gotovina`
     - `Kartica`
     - `Virman`
     - `Cek`
  3. **Mješovito plaćanje:** Moguće je kombinovati npr. dio iznosa karticom, a ostatak gotovinom.
  4. **Kupac (Pravno lice):** Ako kupac traži račun na firmu, prosljeđuje se element `<Kupac>` sa `IDbroj` (13 cifara JIB).

#### XML Primjer: Račun za Fizičko Lice (Gotovina / Kartica):
```xml
<?xml version="1.0" encoding="utf-8"?>
<RacunZahtjev xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <BrojZahtjeva>1001</BrojZahtjeva>
  <VrstaZahtjeva>0</VrstaZahtjeva>
  <NoviObjekat>
    <StavkeRacuna>
      <RacunStavka>
        <artikal>
          <Sifra>ALAT-01</Sifra>
          <Naziv>Aku bušilica 18V</Naziv>
          <JM>kom</JM>
          <Cijena>150.00</Cijena>
          <Stopa>E</Stopa>
          <Grupa>0</Grupa>
          <PLU>0</PLU>
        </artikal>
        <Kolicina>1</Kolicina>
        <Rabat>0</Rabat>
      </RacunStavka>
      <RacunStavka>
        <artikal>
          <Sifra>ALAT-02</Sifra>
          <Naziv>Set burgija za beton</Naziv>
          <JM>set</JM>
          <Cijena>25.50</Cijena>
          <Stopa>E</Stopa>
          <Grupa>0</Grupa>
          <PLU>0</PLU>
        </artikal>
        <Kolicina>2</Kolicina>
        <Rabat>10</Rabat> <!-- 10% rabat -->
      </RacunStavka>
    </StavkeRacuna>
    <VrstePlacanja>
      <VrstaPlacanja>
        <Oznaka>Gotovina</Oznaka>
        <Iznos>0</Iznos> <!-- Iznos 0 označava cjelokupan iznos računa -->
      </VrstaPlacanja>
    </VrstePlacanja>
    <Napomena>Hvala na kupovini - Piko Alati</Napomena>
    <BrojRacuna>0</BrojRacuna>
  </NoviObjekat>
</RacunZahtjev>
```

#### XML Primjer: Račun za Pravno Lice (Sa JIB Kupca):
Unutar `<NoviObjekat>` dodaje se blok `<Kupac>`:
```xml
<Kupac>
  <IDbroj>4200000000000</IDbroj> <!-- 13 cifara JIB -->
  <PDVbroj>200000000000</PDVbroj> <!-- 12 cifara PDV broj -->
  <Naziv>Građevinar d.o.o.</Naziv>
  <Adresa>Zmaja od Bosne 10</Adresa>
  <PostanskiBroj>71000</PostanskiBroj>
  <Grad>Sarajevo</Grad>
</Kupac>
```

#### Odgovor Tring Servera (Uspješno odštampano):
```xml
<?xml version="1.0" encoding="utf-8"?>
<KasaOdgovor xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <Odgovori>
    <Odgovor>
      <Naziv>BrojFiskalnogRacuna</Naziv>
      <Vrijednost xsi:type="xsd:string">1482</Vrijednost>
    </Odgovor>
    <Odgovor>
      <Naziv>DatumFiskalnogRacuna</Naziv>
      <Vrijednost xsi:type="xsd:string">12.10.2026</Vrijednost>
    </Odgovor>
    <Odgovor>
      <Naziv>VrijemeFiskalnogRacuna</Naziv>
      <Vrijednost xsi:type="xsd:string">15:20</Vrijednost>
    </Odgovor>
    <Odgovor>
      <Naziv>IznosFiskalnogRacuna</Naziv>
      <Vrijednost xsi:type="xsd:double">195.90</Vrijednost>
    </Odgovor>
  </Odgovori>
  <VrstaOdgovora>OK</VrstaOdgovora>
  <BrojZahtjeva>1001</BrojZahtjeva>
</KasaOdgovor>
```

---

### 4.3. Reklamirani / Storno Račun (`StampatiReklamiraniRacun`)
Kada kupac vrati artikal ili se račun stornira:
- **Endpoint:** `POST http://<IP>:8085/stampatireklamiraniracun`
- **Obavezan parametar:** `<BrojRacuna>` mora sadržavati **broj originalnog fiskalnog računa** koji se stornira.

---

### 4.4. Unos i Povrat Novca (Depozit / Polog u Kasi)
Povezano sa našim Medusa `PosRegisterSession` modulom:
- **Polog novca na početku smjene:**
  - **Endpoint:** `POST http://<IP>:8085/unosnovca`
  - XML sadrži `<Iznos>200.00</Iznos>`.
- **Podizanje gotovine iz kase:**
  - **Endpoint:** `POST http://<IP>:8085/povratnovca`

---

### 4.5. Dnevni Izvještaj (Z-Izvještaj) i Presjek Stanja (X-Izvještaj)
Na kraju radnog dana ili prilikom smjene:
- **Dnevni Z-izvještaj (Zaključenje dana):**
  - **Endpoint:** `POST http://<IP>:8085/stampatidnevniizvjestaj`
  - Štampa zakonski obavezni dnevni fiskalni izvještaj i resetuje dnevni promet.
- **Presjek stanja X-izvještaj (Informativni presjek bez resetovanja):**
  - **Endpoint:** `POST http://<IP>:8085/stampatipresjekstanja`

---

## 5. Implementacija u Expo (React Native) Aplikaciji

U Expo aplikaciji možemo kreirati servisni modul npr. `services/tringFiscalService.ts`.

### Primjer Implementacije u TypeScriptu:

```typescript
// tringFiscalService.ts
export interface FiscalItem {
  sku: string
  name: string
  unit: string // 'kom', 'kg', 'm' (max 2 znaka)
  price: number
  quantity: number
  discountPercent?: number
  taxRate?: 'E' | 'K' | 'A' // E = 17% PDV
}

export interface FiscalBuyer {
  taxId: string // JIB (13 cifara)
  vatId?: string // PDV (12 cifara)
  name: string
  address: string
  postalCode: string
  city: string
}

export class TringFiscalService {
  private baseUrl: string

  constructor(ip: string, port: number = 8085) {
    this.baseUrl = `http://${ip}:${port}`
  }

  /**
   * Generiše XML i šalje fiskalni račun Tring serveru
   */
  async printFiscalReceipt(params: {
    requestId: number | string
    items: FiscalItem[]
    paymentMethod: 'Gotovina' | 'Kartica' | 'Virman' | 'Cek'
    paymentAmount?: number
    buyer?: FiscalBuyer
    note?: string
  }) {
    const xml = this.buildReceiptXml(params)

    const response = await fetch(`${this.baseUrl}/stampatifiskalniracun`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
      },
      body: xml,
    })

    if (!response.ok) {
      throw new Error(`Tring printer greška: HTTP ${response.status}`)
    }

    const responseXml = await response.text()
    return this.parseFiscalResponse(responseXml)
  }

  private buildReceiptXml(params: any): string {
    const itemsXml = params.items.map((item: FiscalItem) => `
      <RacunStavka>
        <artikal>
          <Sifra>${item.sku}</Sifra>
          <Naziv>${item.name.substring(0, 32)}</Naziv>
          <JM>${item.unit.substring(0, 2)}</JM>
          <Cijena>${item.price.toFixed(2)}</Cijena>
          <Stopa>${item.taxRate || 'E'}</Stopa>
          <Grupa>0</Grupa>
          <PLU>0</PLU>
        </artikal>
        <Kolicina>${item.quantity}</Kolicina>
        <Rabat>${item.discountPercent || 0}</Rabat>
      </RacunStavka>`).join('')

    const buyerXml = params.buyer ? `
      <Kupac>
        <IDbroj>${params.buyer.taxId}</IDbroj>
        <PDVbroj>${params.buyer.vatId || ''}</PDVbroj>
        <Naziv>${params.buyer.name.substring(0, 32)}</Naziv>
        <Adresa>${params.buyer.address.substring(0, 32)}</Adresa>
        <PostanskiBroj>${params.buyer.postalCode}</PostanskiBroj>
        <Grad>${params.buyer.city}</Grad>
      </Kupac>` : ''

    return `<?xml version="1.0" encoding="utf-8"?>
<RacunZahtjev xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <BrojZahtjeva>${params.requestId}</BrojZahtjeva>
  <VrstaZahtjeva>0</VrstaZahtjeva>
  <NoviObjekat>
    <StavkeRacuna>${itemsXml}
    </StavkeRacuna>
    <VrstePlacanja>
      <VrstaPlacanja>
        <Oznaka>${params.paymentMethod}</Oznaka>
        <Iznos>${params.paymentAmount || 0}</Iznos>
      </VrstaPlacanja>
    </VrstePlacanja>${buyerXml}
    <Napomena>${params.note || 'Hvala na posjeti!'}</Napomena>
    <BrojRacuna>0</BrojRacuna>
  </NoviObjekat>
</RacunZahtjev>`
  }

  private parseFiscalResponse(xml: string) {
    const isOk = xml.includes('<VrstaOdgovora>OK</VrstaOdgovora>')
    if (!isOk) {
      throw new Error(`Greška pri fiskalizaciji računa na printeru.`)
    }

    // Izvlačenje broja fiskalnog računa regexom
    const matchReceiptNumber = xml.match(/<Naziv>BrojFiskalnogRacuna<\/Naziv>\s*<Vrijednost[^>]*>([^<]+)<\/Vrijednost>/)
    const receiptNumber = matchReceiptNumber ? matchReceiptNumber[1] : null

    return {
      success: true,
      fiscalReceiptNumber: receiptNumber,
      rawXml: xml,
    }
  }
}
```

---

## 6. Integracija sa Medusa Backendom

Tok podataka u sistemu je potpuno zatvoren i automatizovan:

```
1. Android POS Kasa (Expo):
   └── Poziva Medusa endpoint: GET /admin/pos/terminal/{id}/config
   └── Dobija: IP (192.168.1.150), Port (8085), JIB, Naziv PJ, Operatora

2. Kupac plaća račun na kasi:
   └── Expo aplikacija šalje XML na: http://192.168.1.150:8085/stampatifiskalniracun
   └── Tring printer fizički štampa račun i vraća: BrojFiskalnogRacuna = "1482"

3. Evidencija u Medusa sistemu:
   └── Expo aplikacija šalje narudžbu Medusi sa atributom:
       metadata: {
         fiscal_receipt_number: "1482",
         fiscal_device_serial: "TRING-IBFM-0042",
         fiscal_printed_at: "2026-10-12T15:20:00Z"
       }
   └── Medusa kreira Order i automatski skida zalihe sa magacina dodijeljenog toj kasi.
```

---

## 7. Preporučeni Naredni Koraci

1. **U radnji / testnom okruženju:**
   - Pokrenuti `Tring.Fiscal.Server` na računaru gdje je priključen printer.
   - U postavkama Tring servera osigurati da je polje za HTTP server uključeno i postavljeno na port `8085` (ili konfigurisan port).
   - Dozvoliti port `8085` u Windows Firewall-u za lokalnu mrežu.
2. **U Medusa POS modulu:**
   - Kroz Admin panel na stranici `/app/pos` unijeti lokalnu IP adresu printera za taj objekat (npr. `192.168.1.150`).
3. **U Expo aplikaciji:**
   - Iskoristiti gore navedenu `TringFiscalService` klasu za direktno slanje XML-a sa tableta na Tring printer.
