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
import { CheckCircleSolid } from "@medusajs/icons"
import { useState, useEffect } from "react"
import { ResellerData } from "../types"

interface CreatePayoutModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  reseller: ResellerData | null
  onSuccess: () => void
}

export const CreatePayoutModal = ({
  open,
  onOpenChange,
  reseller,
  onSuccess,
}: CreatePayoutModalProps) => {
  const [amount, setAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer")
  const [referenceNumber, setReferenceNumber] = useState("")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (reseller?.stats) {
      setAmount(String(reseller.stats.eligible_unpaid || 0))
    }
  }, [reseller])

  const handleSave = async () => {
    if (!reseller) return
    if (!amount || Number(amount) <= 0) {
      toast.error("Iznos isplate mora biti veći od 0.")
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/admin/resellers/${reseller.id}/payouts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(amount),
          payment_method: paymentMethod,
          reference_number: referenceNumber.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        toast.success(data.message || "Isplata je uspješno zabilježena!")
        onOpenChange(false)
        onSuccess()
      } else {
        toast.error(data.message || "Greška pri evidentiranju isplate.")
      }
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (!reseller) return null

  return (
    <FocusModal open={open} onOpenChange={onOpenChange}>
      <FocusModal.Content>
        <FocusModal.Header>
          <div className="flex items-center justify-between w-full px-6">
            <Heading level="h2">Evidentiraj Isplatu Provizije</Heading>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="small" onClick={() => onOpenChange(false)}>
                Odustani
              </Button>
              <Button variant="primary" size="small" isLoading={saving} onClick={handleSave}>
                Potvrdi Isplatu
              </Button>
            </div>
          </div>
        </FocusModal.Header>

        <FocusModal.Body className="overflow-y-auto p-8 max-w-xl w-full mx-auto space-y-6">
          <div className="p-4 rounded-lg bg-ui-bg-subtle/50 border space-y-2">
            <div className="flex items-center justify-between">
              <Text className="font-semibold text-ui-fg-base text-base">{reseller.name}</Text>
              <Badge color="green">
                <CheckCircleSolid /> Aktivan
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t">
              <div>
                <span className="text-ui-fg-subtle">Ukupno za isplatu:</span>{" "}
                <strong className="text-ui-fg-base text-sm font-semibold">
                  {reseller.stats?.eligible_unpaid || 0} KM
                </strong>
              </div>
              <div>
                <span className="text-ui-fg-subtle">Do sada isplaćeno:</span>{" "}
                <span className="text-ui-fg-muted font-medium">
                  {reseller.stats?.paid_commission || 0} KM
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Iznos Isplate (KM) *</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <Text className="text-xs text-ui-fg-subtle">
                Sve isporučene narudžbe ovog preprodavača do ovog iznosa bit će označene kao isplaćene.
              </Text>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Način Plaćanja</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <Select.Trigger>
                  <Select.Value />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="bank_transfer">Žiralno / Bankovna Doznaka</Select.Item>
                  <Select.Item value="cash">Gotovina / Blagajna</Select.Item>
                  <Select.Item value="other">Ostalo</Select.Item>
                </Select.Content>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Broj Transakcije / Uplatnice</Label>
              <Input
                placeholder="npr. UPL-2026-0042"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Napomena</Label>
              <Input
                placeholder="Opcionalna interna napomena..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        </FocusModal.Body>
      </FocusModal.Content>
    </FocusModal>
  )
}
