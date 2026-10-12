# Implementation Plan: Expo POS Kasa Aplikacija (`medusa-pos`)

Ovaj plan implementacije detaljno opisuje arhitekturu, faze razvoja i module za izradu mobilne/tablet **Expo (React Native) POS aplikacije** pod nazivom **`medusa-pos`**.

Aplikacija je dizajnirana sa **modularnim drajverskim slojem (Driver / Strategy Pattern)** koji omogućava jednostavno prebacivanje između svih načina fiskalnog spajanja (direktno na uređaju, preko lokalne mreže/laptopa, USB-om, kao i ugrađeni simulator za potrebe razvoja bez fizičkog printera).

---

## 1. Arhitektura Fiskalnog Drajverskog Sloja (Multi-Driver Engine)

Srž fleksibilnosti aplikacije je univerzalni interfejs `IFiscalDriver`. Sve komponente u aplikaciji komuniciraju isključivo sa ovim interfejsom, dok se stvarna komunikacija delegira na izabrani drajver.

```
                         ┌────────────────────────┐
                         │   Expo POS Aplikacija  │
                         │ (Korpa, Naplata, Smjene│
                         └───────────┬────────────┘
                                     │
                                     ▼
                         ┌────────────────────────┐
                         │     IFiscalDriver      │
                         │  (Univerzalni Ugovor)  │
                         └───────────┬────────────┘
                                     │
       ┌───────────────┬─────────────┼───────────────┬────────────────┐
       ▼               ▼             ▼               ▼                ▼
┌──────────────┐┌──────────────┐┌──────────────┐┌───────────────┐┌───────────────┐
│ MockSimulator││ TringHttpLan ││  TringAidl   ││ TringUsbOtg   ││ GenericEscPos │
│   Driver     ││    Driver    ││  (CR-T2 OS)  ││    Driver     ││  (Bluetooth/  │
│(Razvoj/Test) ││ (Wi-Fi/PC/IP)││ (On-Device)  ││ (Direktno USB)││  Wi-Fi Slip)  │
└──────────────┘└──────────────┘└──────────────┘└───────────────┘└───────────────┘
```

### 1.1. Podržani Drajveri:

1. **`MockSimulatorDriver` (Simulacija za razvoj i testiranje):**
   - **Svrha:** Omogućava nesmetan razvoj i testiranje aplikacije na simulatoru ili telefonu bez ikakvog fizičkog printera.
   - **Funkcionalnost:**
     - Generiše fiktivne brojeve fiskalnih računa (npr. `FISK-SIM-0042`).
     - Simulira kašnjenje štampe (npr. 800ms) i zvučni signal.
     - Prikazuje vizuelni preview fiskalnog računa na ekranu (zaglavlje, PDV rekapitulacija, QR kod, podnožje).
     - Mogućnost testiranja grešaka (npr. dugme "Simuliraj nestanak papira" ili "Simuliraj prekid veze").

2. **`TringHttpLanDriver` (Mreža / Wi-Fi / Laptop / Mini-PC):**
   - **Svrha:** Komunikacija sa `Tring.Fiscal.Serverom` na lokalnoj mreži ili laptopu (standardni port `8085`).
   - **Funkcionalnost:** Generiše standardne XML komande (`StampatiFiskalniRacun`, `UnosNovca`, `Z-Izvještaj`) i šalje ih preko HTTP POST na zadatu IP adresu iz postavki kase.

3. **`TringAidlDriver` (All-in-One Android kase poput Tring CR-T2):**
   - **Svrha:** Direktna interna komunikacija na uređajima koji na sebi imaju integrisan printer i fiskalni modul na Android 10 sistemu.
   - **Funkcionalnost:** Povezuje se na Tring sistemski Android servis (`IFiscalService.aidl`) bez ikakvih mrežnih posrednika.

4. **`TringUsbOtgDriver` (Standardni tablet spojen USB kablom):**
   - **Svrha:** Za obične tablete spojene direktno u Tring kasu preko USB-OTG adaptera.
   - **Funkcionalnost:** Komunikacija preko serijskog porta na USB sabirnici (`UsbManager` / Serial Protocol).

5. **`GenericEscPosDriver` (Nefiskalni termalni printeri):**
   - Za štampanje nefiskalnih slipova, narudžbi za šank/skladište ili Bluetooth termalnih printera.

---

## 2. Ključni Moduli i Ekrani POS Aplikacije

### 2.1. Inicijalno Uparivanje i Konfiguracija Kase (`/setup`)
- Unos URL-a Medusa backenda (npr. `http://192.168.1.100:9000` ili produkcijska domena).
- Unos koda kase ili skeniranje QR koda sa `device_key`.
- Automatski poziv endpointa `GET /admin/pos/terminal/:id/config`.
- Preuzimanje podataka o poslovnoj jedinici, vezanom prodajnom kanalu i skladištu, podržanim načinima plaćanja i fiskalnom printeru.

### 2.2. PIN Lock Ekran – Brza Prijava Kasira (`/lock`)
- Veliki touch-screen numerički pad (1-9, 0, C, OK).
- Lista ovlaštenih operatera sa avatarom ili imenom.
- Brza autentifikacija unosom 4-cifrenog PIN-a bez potrebe za kucanjem emaila i duge lozinke.
- Automatsko zaključavanje ekrana nakon X minuta neaktivnosti (podesivo).

### 2.3. Upravljanje Smjenama Kase (`/shifts`)
- **Otvaranje smjene:** Unos početnog pologa gotovine u ladici (npr. 200 KM), slanje komande u kasu (`/unosnovca`) i poziv Medusa API-ja `POST /sessions` sa statusom `open`.
- **U toku smjene:** Uvid u trenutno stanje gotovine, broj izdatih računa, ukupno plaćeno karticom i gotovinom.
- **Zatvaranje smjene:** Brojanje novca u kasi, unos zatečenog iznosa, štampanje fiskalnog dnevnog Z-izvještaja (`/stampatidnevniizvjestaj`) i zatvaranje sesije na backendu.

### 2.4. Glavni Prodajni Ekran (`/pos`)
- **Katalog i Kategorije:**
  - Pregledne kategorije sa brzim filterima.
  - Kartice artikala sa nazivom, cijenom, šifrom i stanjem zaliha u realnom vremenu (sa vezanog magacina).
- **Barkod Skener:**
  - Podrška za ugrađenu kameru uređaja (Expo Camera) ili hardverski USB/Bluetooth bar-kod skener (automatsko dodavanje stavke pri skeniranju).
- **Interaktivna Korpa:**
  - Promjena količine (+ / - / direktan unos).
  - Dodavanje pojedinačnog popusta/rabata na stavku ili na cijeli račun.
  - Odabir kupca: Standardni maloprodajni kupac ili unos JIB/PDV pravnog lica za fakturu/gotovinski račun.

### 2.5. Ekran Naplate i Fiskalizacije (`/checkout`)
- Prikaz ukupnog iznosa računa.
- Odabir načina plaćanja:
  - **Gotovina:** Kalkulator primljenog novca i automatski izračun kusura.
  - **Kartica:** Slanje na eksterni POS terminal ili ručna potvrda slipa.
  - **Žiralno / Virman:** Za kupce sa definisanim JIB-om.
  - **Kombinovano:** npr. 50 KM kartica + 25 KM gotovina.
- **Akcija "Završi i Štampaj":**
  1. Poziva se selektovani fiskalni drajver (`printFiscalReceipt`).
  2. Nakon uspješne štampe i dobijanja broja fiskalnog računa, kreira se narudžba u Medusi preko API-ja sa svim fiskalnim metapodacima.
  3. Automatsko otvaranje ladice za novac (opciono preko drajvera).

### 2.6. Postavke i Hardverska Dijagnostika (`/settings/hardware`)
- Prekidač za odabir drajvera:
  - `[ ] Mock Simulator (Razvoj)`
  - `[ ] Tring LAN / Wi-Fi (IP + Port)`
  - `[ ] Tring CR-T2 (Ugrađeni Android Servis)`
  - `[ ] Tring USB-OTG`
- Dugme **"Testiraj Konekciju"** – šalje testni upit printeru i prikazuje status (npr. *Uređaj spreman*, *Nema papira*, *Greška u komunikaciji*).
- Dugme **"Štampaj X-Izvještaj (Presjek stanja)"**.

---

## 3. Tehnološki Stack za `medusa-pos`

- **Framework:** React Native + Expo (SDK 52+).
- **Navigacija:** Expo Router (File-based routing za tabove i modalne dijaloge).
- **Stilovi & UI:** React Native Paper ili Tailwind CSS (NativeWind v4) optimizovan za tablete u Landscape orijentaciji (10-inčni pultni format) i Portrait za mobilne uređaje.
- **State Management & Caching:** Zustand (brzi store za korpu, smjenu i operatera) + TanStack React Query (keširanje kataloga i offline tolerancija).
- **XML / Drajveri:** `fast-xml-parser` za generisanje i parsiranje Tring XML paketa.

---

## 4. Faze Implementacije (Roadmap)

### Faza 1: Inicijalizacija Projekta i Simulator Drajver
- Inicijalizacija Expo projekta u direktoriju `medusa-pos`.
- Postavljanje tipova, foldera i univerzalnog interfejsa `IFiscalDriver`.
- Izrada `MockSimulatorDriver`-a sa virtuelnim preview-om fiskalnog računa na ekranu.

### Faza 2: Povezivanje sa Medusa Backendom
- Klijentski servis za komunikaciju sa našim backendom (`/admin/pos/terminal/:id/config`, `/auth`, `/sessions`).
- Setup ekran za uparivanje kase i preuzimanje poslovne jedinice, prodajnog kanala i skladišta.
- PIN Lock ekran za prijavu operatera.

### Faza 3: Prodajni Ekran (Katalog, Korpa & Naplata)
- UI za prikaz proizvoda i kategorija u formatu prilagođenom tabletima.
- Logika korpe, kalkulacije popusta i odabir načina plaćanja.
- Unos podataka o kupcu (JIB/PDV) za pravna lica.

### Faza 4: Implementacija Pravih Tring Drajvera
- **`TringHttpLanDriver`:** Implementacija mrežnog HTTP XML pozivanja prema `Tring.Fiscal.Serveru` (za Wi-Fi/PC/laptop opciju).
- **`TringAidlDriver`:** Priprema konfiguracije i native adaptera za Android servise (za Tring CR-T2 uređaje).
- Ekran sa postavkama i dijagnostikom hardvera.

### Faza 5: Smjene, X/Z Izvještaji i Završno Testiranje
- Implementacija otvaranja/zatvaranja smjene i unosa pologa novca.
- Slanje komandi za dnevni Z-izvještaj i X-izvještaj.
- Testiranje cjelokupnog ciklusa: Smjena -> Prodaja -> Fiskalizacija -> Skladište.

---

## 5. Sljedeći Korak

Nakon što potvrdite i date odobrenje za ovaj plan, možemo započeti sa **Fazom 1** (kreiranje `medusa-pos` aplikacije, arhitektura drajvera i simulator za razvoj).
