import {
  Button,
  FocusModal,
  Heading,
  Input,
  Label,
  Select,
  Text,
  toast,
} from "@medusajs/ui"
import { useState } from "react"
import { PosOptions } from "../types"

interface CreateRegisterModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  options: PosOptions
}

export const CreateRegisterModal = ({
  open,
  onOpenChange,
  onSuccess,
  options,
}: CreateRegisterModalProps) => {
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [description, setDescription] = useState("")

  // Poslovna jedinica
  const [storeName, setStoreName] = useState("")
  const [storeAddress, setStoreAddress] = useState("")
  const [storeCity, setStoreCity] = useState("Sarajevo")
  const [storePostalCode, setStorePostalCode] = useState("71000")
  const [taxId, setTaxId] = useState("")
  const [vatId, setVatId] = useState("")
  const [storePhone, setStorePhone] = useState("")

  // Medusa relacije
  const [selectedChannel, setSelectedChannel] = useState<string>("none")
  const [selectedLocation, setSelectedLocation] = useState<string>("none")

  // Načini plaćanja
  const [paymentMethods, setPaymentMethods] = useState<string[]>([
    "cash",
    "card",
    "wire_transfer",
  ])
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState("cash")

  // Fiskalni printer
  const [fiscalType, setFiscalType] = useState("none")
  const [fiscalIp, setFiscalIp] = useState("")
  const [fiscalPort, setFiscalPort] = useState("")
  const [fiscalSerial, setFiscalSerial] = useState("")
  const [receiptHeader, setReceiptHeader] = useState("")
  const [receiptFooter, setReceiptFooter] = useState("Hvala na posjeti!")

  const [saving, setSaving] = useState(false)

  const togglePaymentMethod = (methodId: string) => {
    if (paymentMethods.includes(methodId)) {
      if (paymentMethods.length === 1) {
        toast.error("Mora biti omogućen barem jedan način plaćanja.")
        return
      }
      const updated = paymentMethods.filter((m) => m !== methodId)
      setPaymentMethods(updated)
      if (defaultPaymentMethod === methodId) {
        setDefaultPaymentMethod(updated[0])
      }
    } else {
      setPaymentMethods([...paymentMethods, methodId])
    }
  }

  const handleSave = async () => {
    if (!name.trim() || !storeName.trim() || !storeAddress.trim() || !storeCity.trim()) {
      toast.error("Naziv kase, naziv PJ, adresa i grad su obavezna polja.")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/admin/pos/registers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          code: code.trim() || undefined,
          description: description.trim() || undefined,
          store_name: storeName.trim(),
          store_address: storeAddress.trim(),
          store_city: storeCity.trim(),
          store_postal_code: storePostalCode.trim() || undefined,
          tax_id: taxId.trim() || undefined,
          vat_id: vatId.trim() || undefined,
          store_phone: storePhone.trim() || undefined,
          sales_channel_id: selectedChannel === "none" ? null : selectedChannel,
          stock_location_id: selectedLocation === "none" ? null : selectedLocation,
          supported_payment_methods: paymentMethods,
          default_payment_method: defaultPaymentMethod,
          fiscal_printer_type: fiscalType,
          fiscal_printer_ip: fiscalIp.trim() || undefined,
          fiscal_printer_port: fiscalPort ? Number(fiscalPort) : undefined,
          fiscal_device_serial: fiscalSerial.trim() || undefined,
          receipt_header: receiptHeader.trim() || undefined,
          receipt_footer: receiptFooter.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        toast.success(`POS kasa '${name}' je uspješno kreirana!`)
        onOpenChange(false)
        onSuccess()
        // Reset form
        setName("")
        setCode("")
        setDescription("")
        setStoreName("")
        setStoreAddress("")
        setTaxId("")
        setVatId("")
        setStorePhone("")
        setSelectedChannel("none")
        setSelectedLocation("none")
      } else {
        toast.error(data.message || "Greška pri kreiranju kase.")
      }
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <FocusModal open={open} onOpenChange={onOpenChange}>
      <FocusModal.Content>
        <FocusModal.Header>
          <div className="flex items-center justify-between w-full px-6">
            <Heading level="h2">Kreiranje Nove POS Kase</Heading>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="small" onClick={() => onOpenChange(false)}>
                Odustani
              </Button>
              <Button variant="primary" size="small" isLoading={saving} onClick={handleSave}>
                Kreiraj Kasu
              </Button>
            </div>
          </div>
        </FocusModal.Header>

        <FocusModal.Body className="overflow-y-auto p-8 max-w-3xl w-full mx-auto space-y-6">
          {/* 1. Osnovni podaci kase */}
          <div className="border rounded-lg p-5 space-y-4 bg-ui-bg-base">
            <Heading level="h3" className="text-sm font-semibold text-ui-fg-base">
              1. Osnovni Podaci o Kasi
            </Heading>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Naziv POS Kase *</Label>
                <Input
                  placeholder="npr. Glavna Kasa 1 ili Pult Salon"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Šifra Kase (Opcionalno)</Label>
                <Input
                  placeholder="npr. POS-01 (Automatski ako je prazno)"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Opis / Napomena</Label>
              <Input
                placeholder="npr. Kasa na glavnom ulazu u maloprodajnom objektu"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* 2. Podaci o poslovnoj jedinici */}
          <div className="border rounded-lg p-5 space-y-4 bg-ui-bg-base">
            <Heading level="h3" className="text-sm font-semibold text-ui-fg-base">
              2. Podaci o Poslovnoj Jedinici (Objektu)
            </Heading>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Naziv Poslovne Jedinice (PJ) *</Label>
                <Input
                  placeholder="npr. Maloprodaja Sarajevo 1"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Adresa Poslovne Jedinice *</Label>
                <Input
                  placeholder="npr. Džemala Bijedića 160"
                  value={storeAddress}
                  onChange={(e) => setStoreAddress(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Grad *</Label>
                <Input
                  placeholder="Sarajevo"
                  value={storeCity}
                  onChange={(e) => setStoreCity(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Poštanski Broj</Label>
                <Input
                  placeholder="71000"
                  value={storePostalCode}
                  onChange={(e) => setStorePostalCode(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Kontakt Telefon</Label>
                <Input
                  placeholder="033 123 456"
                  value={storePhone}
                  onChange={(e) => setStorePhone(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">JIB / PIB (Jedinstveni Identifikacioni Broj BiH)</Label>
                <Input
                  placeholder="npr. 4200000000000"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">PDV Broj (Obveznik PDV-a)</Label>
                <Input
                  placeholder="npr. 200000000000"
                  value={vatId}
                  onChange={(e) => setVatId(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* 3. Povezivanje sa Medusa resursima */}
          <div className="border rounded-lg p-5 space-y-4 bg-ui-bg-base">
            <Heading level="h3" className="text-sm font-semibold text-ui-fg-base">
              3. Povezivanje sa Prodajnim Kanalom & Skladištem
            </Heading>
            <Text className="text-xs text-ui-fg-subtle">
              Kasa prodaje artikle iz odabranog prodajnog kanala, a naplaćene količine se automatski razdužuju sa odabranog skladišta.
            </Text>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Prodajni Kanal</Label>
                <Select value={selectedChannel} onValueChange={setSelectedChannel}>
                  <Select.Trigger>
                    <Select.Value placeholder="Odaberite prodajni kanal" />
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="none">-- Nije povezano (Svi kanali) --</Select.Item>
                    {options.sales_channels.map((sc) => (
                      <Select.Item key={sc.id} value={sc.id}>
                        {sc.name}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Magacin (Skladište za razduženje)</Label>
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <Select.Trigger>
                    <Select.Value placeholder="Odaberite skladište" />
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="none">-- Nije povezano --</Select.Item>
                    {options.stock_locations.map((sl) => (
                      <Select.Item key={sl.id} value={sl.id}>
                        {sl.name}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select>
              </div>
            </div>
          </div>

          {/* 4. Načini plaćanja */}
          <div className="border rounded-lg p-5 space-y-4 bg-ui-bg-base">
            <Heading level="h3" className="text-sm font-semibold text-ui-fg-base">
              4. Načini Plaćanja na Kasi
            </Heading>

            <div className="space-y-2">
              <Label className="text-xs font-medium">Dozvoljeni Načini Plaćanja</Label>
              <div className="flex flex-wrap gap-2">
                {options.payment_methods.map((pm) => {
                  const isSelected = paymentMethods.includes(pm.id)
                  return (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => togglePaymentMethod(pm.id)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-ui-bg-interactive text-ui-fg-on-color border-ui-border-interactive"
                          : "bg-ui-bg-subtle text-ui-fg-muted border-ui-border-base hover:bg-ui-bg-subtle-hover"
                      }`}
                    >
                      {isSelected ? "✓ " : "+ "}
                      {pm.name}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <Label className="text-xs font-medium">Podrazumijevani (Primarni) Način Plaćanja</Label>
              <Select value={defaultPaymentMethod} onValueChange={setDefaultPaymentMethod}>
                <Select.Trigger>
                  <Select.Value />
                </Select.Trigger>
                <Select.Content>
                  {paymentMethods.map((pmId) => {
                    const found = options.payment_methods.find((m) => m.id === pmId)
                    return (
                      <Select.Item key={pmId} value={pmId}>
                        {found?.name || pmId}
                      </Select.Item>
                    )
                  })}
                </Select.Content>
              </Select>
            </div>
          </div>

          {/* 5. Fiskalni printer i uređaji */}
          <div className="border rounded-lg p-5 space-y-4 bg-ui-bg-base">
            <Heading level="h3" className="text-sm font-semibold text-ui-fg-base">
              5. Fiskalizacija & Printer (BiH)
            </Heading>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Tip Fiskalnog Uređaja</Label>
              <Select value={fiscalType} onValueChange={setFiscalType}>
                <Select.Trigger>
                  <Select.Value />
                </Select.Trigger>
                <Select.Content>
                  {options.fiscal_printer_types.map((fpt) => (
                    <Select.Item key={fpt.id} value={fpt.id}>
                      {fpt.name}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </div>

            {fiscalType !== "none" && (
              <div className="space-y-4 border-t pt-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">IP Adresa Printera</Label>
                    <Input
                      placeholder="192.168.1.150"
                      value={fiscalIp}
                      onChange={(e) => setFiscalIp(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Port Printera</Label>
                    <Input
                      placeholder="npr. 9100 ili 8000"
                      type="number"
                      value={fiscalPort}
                      onChange={(e) => setFiscalPort(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">IBFM / Serijski Broj</Label>
                    <Input
                      placeholder="npr. TR123456"
                      value={fiscalSerial}
                      onChange={(e) => setFiscalSerial(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Tekst u Zaglavlju Računa</Label>
                    <Input
                      placeholder="npr. Dobrodošli u naš maloprodajni salon!"
                      value={receiptHeader}
                      onChange={(e) => setReceiptHeader(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Tekst u Podnožju Računa</Label>
                    <Input
                      placeholder="npr. Hvala na posjeti! Molimo sačuvajte račun."
                      value={receiptFooter}
                      onChange={(e) => setReceiptFooter(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </FocusModal.Body>
      </FocusModal.Content>
    </FocusModal>
  )
}
