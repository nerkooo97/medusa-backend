import {
  Badge,
  Button,
  FocusModal,
  Heading,
  Input,
  Label,
  Text,
  toast,
} from "@medusajs/ui"
import { ArrowPath, Check, DocumentText, Key } from "@medusajs/icons"
import { useState } from "react"
import { ResellerData } from "../types"

interface ResellerDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  reseller: ResellerData | null
  onRefresh: () => void
}

export const ResellerDetailsModal = ({
  open,
  onOpenChange,
  reseller,
  onRefresh,
}: ResellerDetailsModalProps) => {
  const [copied, setCopied] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  if (!reseller) return null

  const handleCopy = () => {
    navigator.clipboard.writeText(reseller.api_key)
    setCopied(true)
    toast.success("API ključ je kopiran u međuspremnik!")
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRegenerateKey = async () => {
    if (!confirm(`Da li ste sigurni da želite generisati novi API ključ za '${reseller.name}'? Stari ključ će odmah prestati raditi u njihovoj aplikaciji!`)) {
      return
    }

    setRegenerating(true)
    try {
      const res = await fetch(`/admin/resellers/${reseller.id}/regenerate-key`, {
        method: "POST",
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message || "Novi API ključ je generisan!")
        onRefresh()
      } else {
        toast.error(data.message || "Greška pri regeneraciji ključa.")
      }
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setRegenerating(false)
    }
  }

  return (
    <FocusModal open={open} onOpenChange={onOpenChange}>
      <FocusModal.Content>
        <FocusModal.Header>
          <div className="flex items-center justify-between w-full px-6">
            <Heading level="h2">Detalji Preprodavača: {reseller.name}</Heading>
            <Button variant="secondary" size="small" onClick={() => onOpenChange(false)}>
              Zatvori
            </Button>
          </div>
        </FocusModal.Header>

        <FocusModal.Body className="overflow-y-auto p-8 max-w-2xl w-full mx-auto space-y-6">
          {/* API Integracijski ključ */}
          <div className="border border-ui-border-interactive/40 rounded-lg p-5 space-y-3 bg-ui-bg-subtle/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="text-ui-fg-interactive" />
                <Heading level="h3" className="text-sm font-semibold">
                  API Ključ za Eksternu Aplikaciju
                </Heading>
              </div>
              <Button
                variant="secondary"
                size="small"
                isLoading={regenerating}
                onClick={handleRegenerateKey}
              >
                <ArrowPath className="mr-1" /> Novi Ključ
              </Button>
            </div>

            <Text className="text-xs text-ui-fg-subtle">
              Ovaj ključ preprodavač unosi u svoju mobilnu ili web aplikaciju kako bi automatski slao narudžbe u vaš sistem.
            </Text>

            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={reseller.api_key}
                className="font-mono text-xs bg-ui-bg-base"
              />
              <Button variant="primary" size="small" onClick={handleCopy} className="shrink-0">
                {copied ? <Check className="mr-1" /> : <DocumentText className="mr-1" />}
                {copied ? "Kopirano" : "Kopiraj"}
              </Button>
            </div>
          </div>

          {/* Statistika */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-lg bg-ui-bg-subtle/40 border">
              <Text className="text-xs text-ui-fg-subtle">Ukupno Narudžbi</Text>
              <Heading level="h3" className="text-lg font-bold text-ui-fg-base mt-1">
                {reseller.stats?.total_orders || 0}
              </Heading>
            </div>
            <div className="p-4 rounded-lg bg-ui-bg-subtle/40 border">
              <Text className="text-xs text-ui-fg-subtle">Ukupan Promet</Text>
              <Heading level="h3" className="text-lg font-bold text-ui-fg-base mt-1">
                {reseller.stats?.total_retail || 0} KM
              </Heading>
            </div>
            <div className="p-4 rounded-lg bg-ui-bg-subtle/40 border">
              <Text className="text-xs text-ui-fg-subtle">Za Isplatu</Text>
              <Heading level="h3" className="text-lg font-bold text-ui-fg-interactive mt-1">
                {reseller.stats?.eligible_unpaid || 0} KM
              </Heading>
            </div>
            <div className="p-4 rounded-lg bg-ui-bg-subtle/40 border">
              <Text className="text-xs text-ui-fg-subtle">Do Sada Isplaćeno</Text>
              <Heading level="h3" className="text-lg font-bold text-ui-fg-base mt-1">
                {reseller.stats?.paid_commission || 0} KM
              </Heading>
            </div>
          </div>

          {/* Kontakt i bankovni podaci */}
          <div className="space-y-4 border rounded-lg p-5">
            <Heading level="h3" className="text-sm font-semibold">
              Kontakt & Bankovni Podaci
            </Heading>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-ui-fg-subtle block">Email:</span>
                <span className="font-medium text-ui-fg-base">{reseller.email}</span>
              </div>
              <div>
                <span className="text-ui-fg-subtle block">Telefon:</span>
                <span className="font-medium text-ui-fg-base">{reseller.phone}</span>
              </div>
              <div>
                <span className="text-ui-fg-subtle block">Provizija:</span>
                <span className="font-medium text-ui-fg-base">
                  {reseller.commission_rate} {reseller.commission_type === "percentage" ? "%" : "KM po narudžbi"}
                </span>
              </div>
              <div>
                <span className="text-ui-fg-subtle block">Banka / Račun:</span>
                <span className="font-medium text-ui-fg-base">
                  {reseller.payout_info?.bank_name || "Nije uneseno"} - {reseller.payout_info?.account_number || "—"}
                </span>
              </div>
            </div>
          </div>
        </FocusModal.Body>
      </FocusModal.Content>
    </FocusModal>
  )
}
