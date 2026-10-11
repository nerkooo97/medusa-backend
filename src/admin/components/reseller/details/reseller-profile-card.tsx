import { Badge, Button, Container, Heading, Input, Label, Select, Text, toast } from "@medusajs/ui"
import { ArrowPath, Check, DocumentText, Key } from "@medusajs/icons"
import { useEffect, useState } from "react"
import { ResellerData, SalesChannelOption } from "../types"

interface ResellerProfileCardProps {
  reseller: ResellerData
  onUpdated: () => void
  salesChannels?: SalesChannelOption[]
}

export const ResellerProfileCard = ({
  reseller,
  onUpdated,
  salesChannels = [],
}: ResellerProfileCardProps) => {
  const [copied, setCopied] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [updatingChannel, setUpdatingChannel] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [availableChannels, setAvailableChannels] = useState<SalesChannelOption[]>(salesChannels)

  useEffect(() => {
    if (salesChannels.length > 0) {
      setAvailableChannels(salesChannels)
    } else {
      fetch("/admin/resellers")
        .then((r) => r.json())
        .then((d) => {
          if (d.sales_channels) {
            setAvailableChannels(d.sales_channels)
          }
        })
        .catch(() => {})
    }
  }, [salesChannels])

  const handleCopyKey = () => {
    navigator.clipboard.writeText(reseller.api_key)
    setCopied(true)
    toast.success("API ključ je kopiran u međuspremnik!")
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRegenerateKey = async () => {
    if (
      !confirm(
        "PAŽNJA: Generisanjem novog ključa, postojeći ključ u vanjskoj aplikaciji preprodavača odmah prestaje raditi! Nastaviti?"
      )
    ) {
      return
    }

    setRegenerating(true)
    try {
      const res = await fetch(`/admin/resellers/${reseller.id}/regenerate-key`, {
        method: "POST",
      })
      const data = await res.json()
      if (res.ok) {
        toast.success("API ključ je uspješno regenerisan!")
        onUpdated()
      } else {
        toast.error(data.message || "Greška pri regenerisanju ključa.")
      }
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setRegenerating(false)
    }
  }

  const handleChannelChange = async (newChannelId: string) => {
    setUpdatingChannel(true)
    try {
      const res = await fetch(`/admin/resellers/${reseller.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sales_channel_id: newChannelId === "all" ? null : newChannelId,
        }),
      })
      if (res.ok) {
        toast.success("Kanal prodaje za preprodavača je uspješno ažuriran.")
        onUpdated()
      } else {
        const d = await res.json()
        toast.error(d.message || "Greška pri promjeni kanala prodaje.")
      }
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setUpdatingChannel(false)
    }
  }

  const currentChannelValue = reseller.sales_channel_id || "all"

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
      {/* Osnovne i bankovne informacije */}
      <Container className="p-5 shadow-sm space-y-4">
        <div>
          <Heading level="h2" className="text-base font-semibold text-ui-fg-base">
            Informacije o Preprodavaču
          </Heading>
          <Text className="text-xs text-ui-fg-subtle">
            Osnovni podaci, dodijeljeni kanal prodaje, model provizije i bankovni podaci.
          </Text>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <Text className="text-xs text-ui-fg-muted font-medium">Ime / Naziv:</Text>
            <Text className="font-semibold text-ui-fg-base">{reseller.name}</Text>
          </div>
          <div>
            <Text className="text-xs text-ui-fg-muted font-medium">Kontakt osoba:</Text>
            <Text className="text-ui-fg-base">{reseller.contact_person || "-"}</Text>
          </div>
          <div>
            <Text className="text-xs text-ui-fg-muted font-medium">Email adresa:</Text>
            <Text className="text-ui-fg-base">{reseller.email}</Text>
          </div>
          <div>
            <Text className="text-xs text-ui-fg-muted font-medium">Broj telefona:</Text>
            <Text className="text-ui-fg-base">{reseller.phone}</Text>
          </div>
          <div>
            <Text className="text-xs text-ui-fg-muted font-medium">Model Zarade / Provizije:</Text>
            <Badge color="blue" className="mt-0.5">
              {reseller.commission_type === "percentage"
                ? `${reseller.commission_rate}% po narudžbi`
                : `${reseller.commission_rate} KM po narudžbi`}
            </Badge>
          </div>
          <div>
            <Text className="text-xs text-ui-fg-muted font-medium">Status Naloga:</Text>
            <Badge color={reseller.status === "active" ? "green" : "grey"} className="mt-0.5">
              {reseller.status === "active" ? "Aktivan" : "Neaktivan"}
            </Badge>
          </div>
        </div>

        {/* Dodijeljeni kanal prodaje sa opcijom promjene */}
        <div className="border-t pt-3 space-y-1.5">
          <Label className="text-xs font-semibold text-ui-fg-base">
            Kanal Prodaje (Dozvoljeni Asortiman):
          </Label>
          <div className="flex items-center gap-2">
            <Select
              value={currentChannelValue}
              onValueChange={handleChannelChange}
              disabled={updatingChannel}
            >
              <Select.Trigger className="w-full text-xs">
                <Select.Value />
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
          </div>
          <Text className="text-[11px] text-ui-fg-subtle">
            {reseller.sales_channel_id
              ? `Preprodavač ima pristup samo proizvodima dodijeljenim ovom kanalu.`
              : `Preprodavač ima pristup cjelokupnom asortimanu svih proizvoda.`}
          </Text>
        </div>

        <div className="border-t pt-3">
          <Text className="text-xs font-semibold text-ui-fg-base mb-2">
            Bankovni Podaci za Isplatu Provizije:
          </Text>
          {reseller.payout_info?.bank_name || reseller.payout_info?.account_number ? (
            <div className="bg-ui-bg-subtle p-3 rounded-md space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-ui-fg-muted">Banka:</span>
                <span className="font-medium text-ui-fg-base">{reseller.payout_info.bank_name || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ui-fg-muted">Broj računa / Žiro:</span>
                <span className="font-semibold text-ui-fg-base">{reseller.payout_info.account_number || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ui-fg-muted">Primalac:</span>
                <span className="font-medium text-ui-fg-base">{reseller.payout_info.recipient_name || reseller.name}</span>
              </div>
              {reseller.payout_info.iban && (
                <div className="flex justify-between">
                  <span className="text-ui-fg-muted">IBAN:</span>
                  <span className="font-mono text-ui-fg-base">{reseller.payout_info.iban}</span>
                </div>
              )}
            </div>
          ) : (
            <Text className="text-xs text-ui-fg-muted italic">
              Nisu uneseni bankovni podaci. Isplata se može vršiti gotovinski ili po dogovoru.
            </Text>
          )}
        </div>
      </Container>

      {/* Tehnički API podaci za vanjsku aplikaciju */}
      <Container className="p-5 shadow-sm space-y-4">
        <div>
          <Heading level="h2" className="text-base font-semibold text-ui-fg-base flex items-center gap-2">
            <Key className="text-ui-fg-interactive w-4 h-4" /> Autentifikacija & API Pristup
          </Heading>
          <Text className="text-xs text-ui-fg-subtle">
            API ključ koji preprodavač unosi u svoju mobilnu ili web aplikaciju za slanje narudžbi.
          </Text>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Text className="text-xs font-medium text-ui-fg-muted">Tajni Reseller API Ključ:</Text>
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="text-xs text-ui-fg-interactive hover:underline cursor-pointer"
            >
              {showKey ? "Sakrij ključ" : "Prikaži ključ"}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Input
              value={showKey ? reseller.api_key : `res_key_••••••••••••••••••••••••••••`}
              readOnly
              className="font-mono text-xs select-all bg-ui-bg-subtle"
            />
            <Button
              variant="secondary"
              size="small"
              onClick={handleCopyKey}
              className="whitespace-nowrap flex items-center"
            >
              {copied ? <Check className="text-ui-fg-interactive" /> : <DocumentText />}
              <span className="ml-1">{copied ? "Kopirano" : "Kopiraj"}</span>
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between border-t pt-3">
          <Button
            variant="danger"
            size="small"
            onClick={handleRegenerateKey}
            isLoading={regenerating}
            className="flex items-center"
          >
            <ArrowPath className="mr-1" /> Regeneriši API Ključ
          </Button>
        </div>

        <div className="bg-ui-bg-subtle p-3 rounded-md space-y-2 text-xs border border-ui-border-base">
          <Text className="font-semibold text-ui-fg-base">Integracija sa vanjskom aplikacijom:</Text>
          <div className="space-y-1 font-mono text-[11px] text-ui-fg-muted">
            <p>1. Zaglavlje zahtjeva: <span className="text-ui-fg-interactive font-bold">x-reseller-api-key: {showKey ? reseller.api_key : "res_key_..."}</span></p>
            <p>2. Preuzimanje kataloga artikala: <span className="text-ui-fg-base font-semibold">GET /reseller-api/products</span></p>
            <p>3. Slanje nove narudžbe: <span className="text-ui-fg-base font-semibold">POST /reseller-api/orders</span></p>
            <p>4. Pregled novčanika: <span className="text-ui-fg-base font-semibold">GET /reseller-api/my-wallet</span></p>
          </div>
        </div>
      </Container>
    </div>
  )
}
