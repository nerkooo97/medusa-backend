# Tring Fiskalizacija Direktno na Android Uređajima (Bez PC-a)

Ova analiza objašnjava kako realizovati POS kasu i fiskalizaciju **isključivo putem Android uređaja** (Expo / React Native aplikacija), bez potrebe za pomoćnim Windows računarom ili mini-PC-jem na prodajnom mjestu.

---

## 1. Analiza Ponude na Kase.ba (All-in-One Android Kase)

Na platformi **[kase.ba](https://kase.ba)** proizvođač Tring d.o.o. nudi novu generaciju fiskalnih uređaja:

### **Tring CR-T2 (Desktop Android Fiskalna Kasa)**
- **Operativni sistem:** Fabrički instaliran **Android 10**.
- **Ekran:** 10-inčni kapacitivni ekran na dodir (touch-screen).
- **Hardver:** Ugrađen termalni fiskalni štampač, rezač papira, ladica za novac interfejs, Wi-Fi, Bluetooth, USB portovi i integrisani zakonski fiskalni modul (komunikacija sa Poreznom upravom).
- **Značenje za naš projekat:**
  Ovaj uređaj je u suštini **Android tablet sa integrisanim printerom i fiskalnim modulom**. Naša Expo/React Native aplikacija se instalira **direktno na ovaj uređaj** kao standardna Android aplikacija!

---

## 2. Načini Komunikacije Direktno na Androidu

Ukoliko se sve vrti na Androidu, komunikacija sa fiskalnim printerom može se izvesti na tri načina:

### Model A: Komunikacija preko Android Servisa (AIDL) – Za Tring CR-T2
Kod specijalizovanih Android fiskalnih uređaja, Tring u samom Android OS-u ima instaliran sistemski pozadinski servis:
1. Tring obezbjeđuje `.aidl` fajl interfejsa (npr. `IFiscalService.aidl`).
2. U React Native / Expo aplikaciji se kreira mali native modul koji se veže na taj servis putem standardnog `bindService`:
   ```kotlin
   val intent = Intent("tring.fiscal.action.REMOTESERVICE").apply {
       setPackage("ba.tring.fiscal")
   }
   context.bindService(intent, serviceConnection, Context.BIND_AUTO_CREATE)
   ```
3. Aplikacija poziva funkciju `printFiscalReceipt(jsonPayload)` i printer direktno štampa račun.

### Model B: Lokalni Mrežni / Localhost Server na Androidu
Neke verzije Tring drajvera za Android pokreću lokalni servis u pozadini koji sluša na `http://127.0.0.1:8085`:
- Naša Expo aplikacija jednostavno šalje HTTP POST sa XML-om na `http://localhost:8085/stampatifiskalniracun`.
- Ovo je najjednostavniji pristup jer u Expo kodu ne zahtijeva nikakve posebne native biblioteke.

### Model C: Standardni Tablet + Eksterni Tring Printer preko USB-OTG
Ako ne koristite All-in-One uređaj već običan Samsung/Lenovo Android tablet:
- Tablet se spaja USB-OTG kablom na Tring printer.
- React Native pristupa serijskom portu preko `android.hardware.usb.UsbManager` (npr. koristeći biblioteku `react-native-usb-serialport-for-android`).

---

## 3. Preporučeni Koraci za Realizaciju sa kase.ba / Tring d.o.o.

Kada budete kontaktirali **kase.ba** ili Tring tehničku podršku (podrska@tring.ba):

1. **Izbor modela kase:**
   - Preporučite klijentu **Tring CR-T2 Android** ukoliko želi moderan uređaj sa ekranom na dodir bez eksternog računara.
2. **Zatražite programerski paket za Android:**
   - *"Zanima nas integracija naše prilagođene Android aplikacije na Tring CR-T2 uređaju. Možete li nam dostaviti Android SDK / AIDL fajlove ili lokalni servis za štampu računa iz vanjske Android aplikacije?"*
3. **Povezivanje sa Medusa v2:**
   - Android aplikacija na kasi povuče cjelokupan katalog i konfiguraciju iz Medusa backenda preko našeg endpointa:
     ```http
     GET /admin/pos/terminal/:id/config
     ```
   - Kada kasir pritisne "Naplati", aplikacija lokalno na uređaju izvrši fiskalizaciju na Tring printeru.
   - Broj fiskalnog računa i vrijeme štampe se šalju nazad u Medusu uz kreiranu narudžbu.
