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
import { useEffect, useState } from "react"
import { SalesChannelOption } from "../types"

interface CreateResellerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  salesChannels?: SalesChannelOption[]
}

export const CreateResellerModal = ({
  open,
  onOpenChange,
  onSuccess,
  salesChannels = [],
}: CreateResellerModalProps) => {
  const [name, setName] = useState("")
  const [contactPerson, setContactPerson] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [commissionType, setCommissionType] = useState<"percentage" | "fixed_amount">("percentage")
  const [commissionRate, setCommissionRate] = useState("15")
  const [salesChannelId, setSalesChannelId] = useState<string>("all")
  const [availableChannels, setAvailableChannels] = useState<SalesChannelOption[]>(salesChannels)
  const [bankName, setBankName] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [recipientName, setRecipientName] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (salesChannels.length > 0) {
      setAvailableChannels(salesChannels)
    } else if (open) {
      fetch("/admin/resellers")
        .then((r) => r.json())
        .then((d) => {
          if (d.sales_channels) {
            setAvailableChannels(d.sales_channels)
          }
        })
        .catch(() => {})
    }
  }, [salesChannels, open])

  const handleSave = async () => {
    if (!name.trim() || !email.trim() || !phone.trim()) {
      toast.error("Naziv, email i telefon su obavezna polja.")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/admin/resellers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          contact_person: contactPerson.trim() || undefined,
          email: email.trim(),
          phone: phone.trim(),
          commission_type: commissionType,
          commission_rate: Number(commissionRate) || 10,
          sales_channel_id: salesChannelId === "all" ? null : salesChannelId,
          payout_info: {
            bank_name: bankName.trim() || undefined,
            account_number: accountNumber.trim() || undefined,
            recipient_name: recipientName.trim() || undefined,
          },
        }),
      })

      const data = await res.json()
      if (res.ok) {
        toast.success(`Preprodavač '${name}' je uspješno kreiran!`)
        onOpenChange(false)
        onSuccess()
        // Reset form
        setName("")
        setContactPerson("")
        setEmail("")
        setPhone("")
        setCommissionRate("15")
        setSalesChannelId("all")
        setBankName("")
        setAccountNumber("")
        setRecipientName("")
      } else {
        toast.error(data.message || "Greška pri kreiranju preprodavača.")
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
            <Heading level="h2">Dodaj Novog Preprodavača</Heading>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="small" onClick={() => onOpenChange(false)}>
                Odustani
              </Button>
              <Button variant="primary" size="small" isLoading={saving} onClick={handleSave}>
                Snimi Preprodavača
              </Button>
            </div>
          </div>
        </FocusModal.Header>

        <FocusModal.Body className="overflow-y-auto p-8 max-w-2xl w-full mx-auto space-y-6">
          <div className="space-y-4">
            <Heading level="h3" className="text-sm font-semibold">
              Osnovni Podaci Preprodavača
            </Heading>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Naziv / Ime Preprodavača *</Label>
              <Input
                placeholder="npr. Dropship Partner Sarajevo d.o.o."
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Kontakt Osoba</Label>
                <Input
                  placeholder="Ime i prezime"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Broj Telefona *</Label>
                <Input
                  placeholder="npr. 061 123 456"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Email Adresa *</Label>
              <Input
                type="email"
                placeholder="partner@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Text className="text-xs text-ui-fg-subtle">
                Služi za identifikaciju i primanje obavijesti o isplatama.
              </Text>
            </div>
          </div>

          {/* Kanal prodaje (Sales Channel) */}
          <div className="border rounded-lg p-5 space-y-3 bg-ui-bg-subtle/30">
            <Heading level="h3" className="text-sm font-semibold">
              Kanal Prodaje (Dozvoljeni Asortiman Proizvoda)
            </Heading>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Dozvoljeni Prodajni Kanal</Label>
              <Select
                value={salesChannelId}
                onValueChange={(val: string) => setSalesChannelId(val)}
              >
                <Select.Trigger>
                  <Select.Value placeholder="Odaberite kanal prodaje" />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="all">Svi Proizvodi (Cjelokupni asortiman - Nema ograničenja)</Select.Item>
                  {availableChannels.map((sc) => (
                    <Select.Item key={sc.id} value={sc.id}>
                      {sc.name}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
              <Text className="text-xs text-ui-fg-subtle">
                Ako odaberete specifičan kanal prodaje, preprodavač će u API-ju vidjeti i moći naručiti isključivo proizvode dodijeljene tom kanalu. Ako odaberete "Svi Proizvodi", ima pristup svim artiklima iz vašeg sistema.
              </Text>
            </div>
          </div>

          {/* Postavke provizije */}
          <div className="border rounded-lg p-5 space-y-4 bg-ui-bg-subtle/30">
            <Heading level="h3" className="text-sm font-semibold">
              Model Provizije & Popusta
            </Heading>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Tip Provizije</Label>
                <Select
                  value={commissionType}
                  onValueChange={(val: any) => setCommissionType(val)}
                >
                  <Select.Trigger>
                    <Select.Value />
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="percentage">Postotak od MPC (%)</Select.Item>
                    <Select.Item value="fixed_amount">Fiksni iznos po narudžbi (KM)</Select.Item>
                  </Select.Content>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  {commissionType === "percentage" ? "Stopa Provizije (%)" : "Iznos Provizije (KM)"} *
                </Label>
                <Input
                  type="number"
                  placeholder="15"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                />
              </div>
            </div>
            <Text className="text-xs text-ui-fg-subtle">
              {commissionType === "percentage"
                ? `Preprodavač ostvaruje ${commissionRate}% zarade od maloprodajne cijene svakog prodatog artikla.`
                : `Preprodavač ostvaruje fiksnih ${commissionRate} KM po svakoj realizovanoj narudžbi.`}
            </Text>
          </div>

          {/* Bankovni podaci */}
          <div className="border rounded-lg p-5 space-y-4 bg-ui-bg-base">
            <Heading level="h3" className="text-sm font-semibold">
              Bankovni Podaci za Isplatu Provizije (Opcionalno)
            </Heading>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Banka</Label>
                <Input
                  placeholder="npr. Raiffeisen Bank d.d."
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Ime Primaoca na Računu</Label>
                <Input
                  placeholder="Ime i prezime ili naziv obrta"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Broj Transakcijskog Računa / IBAN</Label>
              <Input
                placeholder="npr. 1610000000000000"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
              />
            </div>
          </div>
        </FocusModal.Body>
      </FocusModal.Content>
    </FocusModal>
  )
}
