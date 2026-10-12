import {
  Badge,
  Button,
  FocusModal,
  Heading,
  Input,
  Label,
  Select,
  Text,
  toast,
} from "@medusajs/ui"
import {
  ArrowPath,
  Buildings,
  Check,
  CreditCard,
  DocumentText,
  Key,
  Plus,
  Trash,
  Users,
} from "@medusajs/icons"
import { useEffect, useState } from "react"
import { PosOptions, PosRegister } from "../types"

interface ConfigureRegisterModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  register: PosRegister | null
  onSuccess: () => void
  options: PosOptions
}

export const ConfigureRegisterModal = ({
  open,
  onOpenChange,
  register,
  onSuccess,
  options,
}: ConfigureRegisterModalProps) => {
  const [activeTab, setActiveTab] = useState<"general" | "integration" | "fiscal" | "terminal" | "operators" | "session">("general")
  const [copiedKey, setCopiedKey] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [detailedRegister, setDetailedRegister] = useState<PosRegister | null>(null)

  // Form states
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState<"active" | "inactive" | "maintenance">("active")

  const [storeName, setStoreName] = useState("")
  const [storeAddress, setStoreAddress] = useState("")
  const [storeCity, setStoreCity] = useState("")
  const [storePostalCode, setStorePostalCode] = useState("")
  const [taxId, setTaxId] = useState("")
  const [vatId, setVatId] = useState("")
  const [storePhone, setStorePhone] = useState("")
  const [storeEmail, setStoreEmail] = useState("")

  const [salesChannelId, setSalesChannelId] = useState("none")
  const [stockLocationId, setStockLocationId] = useState("none")

  const [paymentMethods, setPaymentMethods] = useState<string[]>([])
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState("cash")

  const [fiscalType, setFiscalType] = useState("none")
  const [fiscalIp, setFiscalIp] = useState("")
  const [fiscalPort, setFiscalPort] = useState("")
  const [fiscalSerial, setFiscalSerial] = useState("")
  const [receiptHeader, setReceiptHeader] = useState("")
  const [receiptFooter, setReceiptFooter] = useState("")

  // Operator add form
  const [selectedUserId, setSelectedUserId] = useState("")
  const [operatorRole, setOperatorRole] = useState<"cashier" | "supervisor" | "manager">("cashier")
  const [operatorPin, setOperatorPin] = useState("")
  const [addingOperator, setAddingOperator] = useState(false)

  // Session form
  const [sessionCash, setSessionCash] = useState("100")
  const [sessionNotes, setSessionNotes] = useState("")
  const [sessionLoading, setSessionLoading] = useState(false)

  const fetchFullRegister = async (regId: string) => {
    setLoadingDetails(true)
    try {
      const res = await fetch(`/admin/pos/registers/${regId}`)
      const d = await res.json()
      if (res.ok && d.register) {
        setDetailedRegister(d.register)
        populateForm(d.register)
      }
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoadingDetails(false)
    }
  }

  const populateForm = (reg: PosRegister) => {
    setName(reg.name || "")
    setCode(reg.code || "")
    setDescription(reg.description || "")
    setStatus(reg.status || "active")

    setStoreName(reg.store_name || "")
    setStoreAddress(reg.store_address || "")
    setStoreCity(reg.store_city || "")
    setStorePostalCode(reg.store_postal_code || "")
    setTaxId(reg.tax_id || "")
    setVatId(reg.vat_id || "")
    setStorePhone(reg.store_phone || "")
    setStoreEmail(reg.store_email || "")

    setSalesChannelId(reg.sales_channel_id || "none")
    setStockLocationId(reg.stock_location_id || "none")

    setPaymentMethods(reg.supported_payment_methods || ["cash", "card"])
    setDefaultPaymentMethod(reg.default_payment_method || "cash")

    setFiscalType(reg.fiscal_printer_type || "none")
    setFiscalIp(reg.fiscal_printer_ip || "")
    setFiscalPort(reg.fiscal_printer_port ? String(reg.fiscal_printer_port) : "")
    setFiscalSerial(reg.fiscal_device_serial || "")
    setReceiptHeader(reg.receipt_header || "")
    setReceiptFooter(reg.receipt_footer || "")
  }

  useEffect(() => {
    if (open && register) {
      populateForm(register)
      fetchFullRegister(register.id)
    }
  }, [open, register?.id])

  const currentReg = detailedRegister || register
  if (!currentReg) return null

  const handleCopyKey = () => {
    navigator.clipboard.writeText(currentReg.device_key)
    setCopiedKey(true)
    toast.success("Sigurnosni ključ terminala je kopiran u međuspremnik!")
    setTimeout(() => setCopiedKey(false), 2000)
  }

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

  const handleSaveGeneral = async () => {
    if (!name.trim() || !storeName.trim() || !storeAddress.trim() || !storeCity.trim()) {
      toast.error("Naziv kase, naziv PJ, adresa i grad su obavezna polja.")
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/admin/pos/registers/${currentReg.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          code: code.trim(),
          description: description.trim() || null,
          status,
          store_name: storeName.trim(),
          store_address: storeAddress.trim(),
          store_city: storeCity.trim(),
          store_postal_code: storePostalCode.trim() || null,
          tax_id: taxId.trim() || null,
          vat_id: vatId.trim() || null,
          store_phone: storePhone.trim() || null,
          store_email: storeEmail.trim() || null,
          sales_channel_id: salesChannelId === "none" ? null : salesChannelId,
          stock_location_id: stockLocationId === "none" ? null : stockLocationId,
          supported_payment_methods: paymentMethods,
          default_payment_method: defaultPaymentMethod,
          fiscal_printer_type: fiscalType,
          fiscal_printer_ip: fiscalIp.trim() || null,
          fiscal_printer_port: fiscalPort ? Number(fiscalPort) : null,
          fiscal_device_serial: fiscalSerial.trim() || null,
          receipt_header: receiptHeader.trim() || null,
          receipt_footer: receiptFooter.trim() || null,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        toast.success(`Konfiguracija kase '${name}' je uspješno ažurirana!`)
        onSuccess()
        fetchFullRegister(currentReg.id)
      } else {
        toast.error(data.message || "Greška pri spremanju konfiguracije.")
      }
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleAddOperator = async () => {
    if (!selectedUserId) {
      toast.error("Molimo odaberite korisnika sa liste.")
      return
    }

    setAddingOperator(true)
    try {
      const res = await fetch(`/admin/pos/registers/${currentReg.id}/operators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: selectedUserId,
          role: operatorRole,
          pin_code: operatorPin.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        toast.success("Operater je uspješno dodijeljen kasi!")
        setSelectedUserId("")
        setOperatorPin("")
        fetchFullRegister(currentReg.id)
      } else {
        toast.error(data.message || "Greška pri dodavanju operatera.")
      }
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setAddingOperator(false)
    }
  }

  const handleRemoveOperator = async (operatorId: string) => {
    if (!confirm("Ukloniti ovog operatera sa kase?")) return

    try {
      const res = await fetch(`/admin/pos/registers/${currentReg.id}/operators/${operatorId}`, {
        method: "DELETE",
      })
      if (res.ok) {
        toast.success("Operater je uklonjen sa kase.")
        fetchFullRegister(currentReg.id)
      } else {
        toast.error("Greška pri uklanjanju operatera.")
      }
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const handleToggleSession = async (action: "open" | "close") => {
    setSessionLoading(true)
    try {
      // Pronađi admin korisnika
      const adminUser = options.users[0]?.id
      const body: any = {
        action,
        user_id: adminUser,
        notes: sessionNotes || undefined,
      }

      if (action === "open") {
        body.opening_cash = Number(sessionCash) || 0
      } else {
        body.session_id = currentReg.active_session?.id
        body.closing_cash = Number(sessionCash) || 0
      }

      const res = await fetch(`/admin/pos/registers/${currentReg.id}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (res.ok) {
        toast.success(action === "open" ? "Smjena je uspješno otvorena!" : "Smjena je uspješno zatvorena!")
        setSessionNotes("")
        fetchFullRegister(currentReg.id)
        onSuccess()
      } else {
        toast.error(data.message || "Greška pri upravljanju smjenom.")
      }
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSessionLoading(false)
    }
  }

  return (
    <FocusModal open={open} onOpenChange={onOpenChange}>
      <FocusModal.Content>
        <FocusModal.Header>
          <div className="flex items-center justify-between w-full px-6">
            <div className="flex items-center gap-3">
              <Heading level="h2">Konfiguracija Kase: {currentReg.name}</Heading>
              <Badge
                color={
                  status === "active"
                    ? "green"
                    : status === "maintenance"
                    ? "orange"
                    : "grey"
                }
              >
                {status === "active" ? "Aktivna" : status === "maintenance" ? "Održavanje" : "Neaktivna"}
              </Badge>
              <span className="font-mono text-xs text-ui-fg-muted">{currentReg.code}</span>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="secondary" size="small" onClick={() => onOpenChange(false)}>
                Zatvori
              </Button>
              <Button variant="primary" size="small" isLoading={saving} onClick={handleSaveGeneral}>
                Sačuvaj Promjene
              </Button>
            </div>
          </div>
        </FocusModal.Header>

        <FocusModal.Body className="overflow-y-auto p-6 sm:p-8 max-w-4xl w-full mx-auto space-y-6">
          {/* Navigacijski tabovi konfiguracije */}
          <div className="flex flex-wrap items-center gap-2 border-b pb-3">
            <Button
              variant={activeTab === "general" ? "primary" : "secondary"}
              size="small"
              onClick={() => setActiveTab("general")}
            >
              <Buildings className="mr-1.5" /> Osnovno & Poslovna Jedinica
            </Button>
            <Button
              variant={activeTab === "integration" ? "primary" : "secondary"}
              size="small"
              onClick={() => setActiveTab("integration")}
            >
              <CreditCard className="mr-1.5" /> Kanal, Magacin & Plaćanja
            </Button>
            <Button
              variant={activeTab === "fiscal" ? "primary" : "secondary"}
              size="small"
              onClick={() => setActiveTab("fiscal")}
            >
              <DocumentText className="mr-1.5" /> Fiskalni Uređaj (BiH)
            </Button>
            <Button
              variant={activeTab === "terminal" ? "primary" : "secondary"}
              size="small"
              onClick={() => setActiveTab("terminal")}
            >
              <Key className="mr-1.5" /> Expo Terminal Ključ
            </Button>
            <Button
              variant={activeTab === "operators" ? "primary" : "secondary"}
              size="small"
              onClick={() => setActiveTab("operators")}
            >
              <Users className="mr-1.5" /> Kasiri & Operateri ({currentReg.operators?.length || 0})
            </Button>
            <Button
              variant={activeTab === "session" ? "primary" : "secondary"}
              size="small"
              onClick={() => setActiveTab("session")}
            >
              <ArrowPath className="mr-1.5" /> Smjena
            </Button>
          </div>

          {/* TAB 1: OSNOVNO & POSLOVNA JEDINICA */}
          {activeTab === "general" && (
            <div className="space-y-6">
              <div className="border rounded-lg p-5 space-y-4 bg-ui-bg-base">
                <Heading level="h3" className="text-sm font-semibold text-ui-fg-base">
                  Postavke POS Kase
                </Heading>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Naziv Kase *</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Šifra Kase (Jedinstvena) *</Label>
                    <Input value={code} onChange={(e) => setCode(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Status Kase</Label>
                    <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                      <Select.Trigger>
                        <Select.Value />
                      </Select.Trigger>
                      <Select.Content>
                        <Select.Item value="active">Aktivan (U funkciji)</Select.Item>
                        <Select.Item value="maintenance">Održavanje / Servis</Select.Item>
                        <Select.Item value="inactive">Neaktivan (Isključen)</Select.Item>
                      </Select.Content>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Opis / Zabilješka</Label>
                  <Input
                    placeholder="Opis kase ili lokacije unutar objekta"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>

              <div className="border rounded-lg p-5 space-y-4 bg-ui-bg-base">
                <Heading level="h3" className="text-sm font-semibold text-ui-fg-base">
                  Poslovna Jedinica (Objekat)
                </Heading>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Naziv Poslovne Jedinice *</Label>
                    <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Adresa Poslovne Jedinice *</Label>
                    <Input value={storeAddress} onChange={(e) => setStoreAddress(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Grad *</Label>
                    <Input value={storeCity} onChange={(e) => setStoreCity(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Poštanski Broj</Label>
                    <Input value={storePostalCode} onChange={(e) => setStorePostalCode(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Telefon</Label>
                    <Input value={storePhone} onChange={(e) => setStorePhone(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Email</Label>
                    <Input value={storeEmail} onChange={(e) => setStoreEmail(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">JIB / PIB (BiH)</Label>
                    <Input placeholder="4200000000000" value={taxId} onChange={(e) => setTaxId(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">PDV Broj</Label>
                    <Input placeholder="200000000000" value={vatId} onChange={(e) => setVatId(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: KANAL, MAGACIN & PLAĆANJA */}
          {activeTab === "integration" && (
            <div className="space-y-6">
              <div className="border rounded-lg p-5 space-y-4 bg-ui-bg-base">
                <Heading level="h3" className="text-sm font-semibold text-ui-fg-base">
                  Povezani Prodajni Kanal & Skladište
                </Heading>
                <Text className="text-xs text-ui-fg-subtle">
                  Kasa omogućava prodaju artikala iz dodijeljenog kanala i automatsko skidanje zaliha sa odabranog skladišta.
                </Text>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Prodajni Kanal</Label>
                    <Select value={salesChannelId} onValueChange={setSalesChannelId}>
                      <Select.Trigger>
                        <Select.Value />
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
                    <Label className="text-xs font-medium">Magacin (Skladište)</Label>
                    <Select value={stockLocationId} onValueChange={setStockLocationId}>
                      <Select.Trigger>
                        <Select.Value />
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

              <div className="border rounded-lg p-5 space-y-4 bg-ui-bg-base">
                <Heading level="h3" className="text-sm font-semibold text-ui-fg-base">
                  Konfiguracija Načina Plaćanja
                </Heading>

                <div className="space-y-2">
                  <Label className="text-xs font-medium">Aktivni Načini Plaćanja</Label>
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
                  <Label className="text-xs font-medium">Primarni Način Plaćanja</Label>
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
            </div>
          )}

          {/* TAB 3: FISKALNI PRINTER (BIH) */}
          {activeTab === "fiscal" && (
            <div className="space-y-6">
              <div className="border rounded-lg p-5 space-y-4 bg-ui-bg-base">
                <Heading level="h3" className="text-sm font-semibold text-ui-fg-base">
                  Fiskalni Uređaj & Mrežni Parametri (BiH)
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
                          placeholder="9100 ili 8000"
                          type="number"
                          value={fiscalPort}
                          onChange={(e) => setFiscalPort(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">IBFM / Serijski Broj</Label>
                        <Input
                          placeholder="TR123456"
                          value={fiscalSerial}
                          onChange={(e) => setFiscalSerial(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Tekst u Zaglavlju Računa</Label>
                        <Input
                          placeholder="Dobrodošli u naš maloprodajni salon!"
                          value={receiptHeader}
                          onChange={(e) => setReceiptHeader(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Tekst u Podnožju Računa</Label>
                        <Input
                          placeholder="Hvala na posjeti! Molimo sačuvajte račun."
                          value={receiptFooter}
                          onChange={(e) => setReceiptFooter(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: EXPO TERMINAL KLJUČ */}
          {activeTab === "terminal" && (
            <div className="space-y-6">
              <div className="border rounded-lg p-5 space-y-4 bg-ui-bg-base">
                <Heading level="h3" className="text-sm font-semibold text-ui-fg-base flex items-center gap-2">
                  <Key className="text-ui-fg-interactive w-4 h-4" /> Sigurnosni Ključ za Expo POS Terminal
                </Heading>
                <Text className="text-xs text-ui-fg-subtle">
                  Ovaj ključ unosite u mobilnu ili tablet aplikaciju prilikom prve autorizacije uređaja za ovu kasu.
                </Text>

                <div className="flex items-center gap-2">
                  <Input
                    value={currentReg.device_key}
                    readOnly
                    className="font-mono text-xs select-all bg-ui-bg-subtle"
                  />
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={handleCopyKey}
                    className="whitespace-nowrap flex items-center"
                  >
                    {copiedKey ? <Check className="text-ui-fg-interactive" /> : <DocumentText />}
                    <span className="ml-1">{copiedKey ? "Kopirano" : "Kopiraj Ključ"}</span>
                  </Button>
                </div>

                <div className="bg-ui-bg-subtle p-4 rounded-md space-y-2 text-xs border border-ui-border-base">
                  <Text className="font-semibold text-ui-fg-base">Povezivanje Expo Terminal Aplikacije:</Text>
                  <div className="space-y-1 font-mono text-[11px] text-ui-fg-muted">
                    <p>1. Otvorite Expo POS aplikaciju na tabletu / telefonu.</p>
                    <p>2. Unesite URL servera: <span className="text-ui-fg-interactive">http://&lt;vass-server-ip&gt;:9000</span></p>
                    <p>3. Unesite Device Key: <span className="text-ui-fg-interactive font-bold">{currentReg.device_key}</span></p>
                    <p>4. Kasa se automatski autorizuje i preuzima artikle, cijene i postavke fiskalnog uređaja.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: KASIRI & OPERATERI */}
          {activeTab === "operators" && (
            <div className="space-y-6">
              {/* Dodavanje novog operatera */}
              <div className="border rounded-lg p-5 space-y-4 bg-ui-bg-base">
                <Heading level="h3" className="text-sm font-semibold text-ui-fg-base flex items-center gap-2">
                  <Plus /> Dodaj Kasira / Operatera na ovu Kasu
                </Heading>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs font-medium">Odaberi Korisnika iz Sistema *</Label>
                    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                      <Select.Trigger>
                        <Select.Value placeholder="-- Odaberite korisnika --" />
                      </Select.Trigger>
                      <Select.Content>
                        {options.users.map((u) => (
                          <Select.Item key={u.id} value={u.id}>
                            {u.first_name || u.last_name ? `${u.first_name || ""} ${u.last_name || ""} (${u.email})` : u.email}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Uloga na Kasi</Label>
                    <Select value={operatorRole} onValueChange={(v: any) => setOperatorRole(v)}>
                      <Select.Trigger>
                        <Select.Value />
                      </Select.Trigger>
                      <Select.Content>
                        <Select.Item value="cashier">Kasir (Prodaja)</Select.Item>
                        <Select.Item value="supervisor">Poslovođa</Select.Item>
                        <Select.Item value="manager">Administrator Kase</Select.Item>
                      </Select.Content>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">PIN Kod (4 cifre)</Label>
                    <Input
                      placeholder="npr. 1234"
                      maxLength={6}
                      value={operatorPin}
                      onChange={(e) => setOperatorPin(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    variant="secondary"
                    size="small"
                    isLoading={addingOperator}
                    onClick={handleAddOperator}
                  >
                    <Plus className="mr-1" /> Dodijeli Korisnika
                  </Button>
                </div>
              </div>

              {/* Lista postojećih operatera */}
              <div className="border rounded-lg p-5 space-y-4 bg-ui-bg-base">
                <Heading level="h3" className="text-sm font-semibold text-ui-fg-base">
                  Dodijeljeni Operateri ({currentReg.operators?.length || 0})
                </Heading>

                {(!currentReg.operators || currentReg.operators.length === 0) ? (
                  <Text className="text-xs text-ui-fg-muted italic">
                    Trenutno nema dodijeljenih operatera. Dodajte barem jednog korisnika kako bi se mogao prijaviti na Expo POS terminalu.
                  </Text>
                ) : (
                  <div className="divide-y border rounded-md overflow-hidden">
                    {currentReg.operators.map((op) => (
                      <div key={op.id} className="p-3 flex items-center justify-between text-xs hover:bg-ui-bg-subtle">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-ui-bg-subtle-pressed flex items-center justify-center font-bold text-ui-fg-subtle">
                            {(op.user?.first_name?.[0] || op.user?.email?.[0] || "U").toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-ui-fg-base">
                              {op.user?.first_name || op.user?.last_name
                                ? `${op.user.first_name || ""} ${op.user.last_name || ""}`.trim()
                                : op.user?.email || "Operater"}
                            </div>
                            <div className="text-ui-fg-muted text-[11px]">{op.user?.email}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Badge color="blue" size="small">
                            {op.role === "manager" ? "Upravitelj" : op.role === "supervisor" ? "Poslovođa" : "Kasir"}
                          </Badge>
                          <Badge color={op.pin_code ? "green" : "grey"} size="small">
                            {op.pin_code ? "PIN postavljen" : "Bez PIN-a"}
                          </Badge>
                          <Button
                            variant="danger"
                            size="small"
                            onClick={() => handleRemoveOperator(op.id)}
                          >
                            <Trash />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: SMJENA */}
          {activeTab === "session" && (
            <div className="space-y-6">
              <div className="border rounded-lg p-5 space-y-4 bg-ui-bg-base">
                <div className="flex items-center justify-between">
                  <div>
                    <Heading level="h3" className="text-sm font-semibold text-ui-fg-base">
                      Status Smjene na Kasi
                    </Heading>
                    <Text className="text-xs text-ui-fg-subtle">
                      Upravljanje otvaranjem i zatvaranjem smjene (početni depozit i zaključivanje pazara).
                    </Text>
                  </div>
                  <Badge color={currentReg.active_session ? "green" : "grey"} size="large">
                    {currentReg.active_session ? "Smjena je OTVORENA" : "Smjena je ZATVORENA"}
                  </Badge>
                </div>

                {currentReg.active_session ? (
                  <div className="bg-ui-bg-subtle p-4 rounded-md space-y-3 border">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <Text className="text-ui-fg-muted font-medium">Otvorena u:</Text>
                        <Text className="font-semibold text-ui-fg-base">
                          {new Date(currentReg.active_session.opened_at).toLocaleString("bs-BA")}
                        </Text>
                      </div>
                      <div>
                        <Text className="text-ui-fg-muted font-medium">Početni Polog u Kasi:</Text>
                        <Text className="font-semibold text-emerald-600">
                          {currentReg.active_session.opening_cash} KM
                        </Text>
                      </div>
                    </div>

                    <div className="border-t pt-3 space-y-3">
                      <Label className="text-xs font-semibold text-ui-fg-base">Zatvaranje Smjene</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Zatečeni Novac u Kasi (KM) *</Label>
                          <Input
                            type="number"
                            placeholder="Završno stanje gotovine"
                            value={sessionCash}
                            onChange={(e) => setSessionCash(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Zabilješka / Napomena</Label>
                          <Input
                            placeholder="Napomena o pazaru"
                            value={sessionNotes}
                            onChange={(e) => setSessionNotes(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <Button
                          variant="danger"
                          size="small"
                          isLoading={sessionLoading}
                          onClick={() => handleToggleSession("close")}
                        >
                          Zaključi i Zatvori Smjenu
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-ui-bg-subtle p-4 rounded-md space-y-3 border">
                    <Text className="text-xs text-ui-fg-subtle">
                      Kasa trenutno nema otvorenu smjenu. Unesite početni iznos gotovine (polog) za početak rada:
                    </Text>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Početni Polog u Kasi (KM) *</Label>
                        <Input
                          type="number"
                          placeholder="npr. 100"
                          value={sessionCash}
                          onChange={(e) => setSessionCash(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Zabilješka / Napomena</Label>
                        <Input
                          placeholder="npr. Početak rada jutarnja smjena"
                          value={sessionNotes}
                          onChange={(e) => setSessionNotes(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button
                        variant="primary"
                        size="small"
                        isLoading={sessionLoading}
                        onClick={() => handleToggleSession("open")}
                      >
                        Otvori Novu Smjenu
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </FocusModal.Body>
      </FocusModal.Content>
    </FocusModal>
  )
}
