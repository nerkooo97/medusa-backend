import React, { useState, useEffect } from "react"
import { Heading, Text, Button, Input, toast } from "@medusajs/ui"
import { XMark, Trash } from "@medusajs/icons"
import { CreateWriteOffModalProps } from "../types"

export const CreateWriteOffModal: React.FC<CreateWriteOffModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  locations,
  inventoryItems,
}) => {
  const [form, setForm] = useState({
    stock_location_id: locations[0]?.id || "",
    reason: "damaged",
    commission_members: "",
    notes: "",
    items: [{ inventory_item_id: "", sku: "", title: "", quantity: 1, unit_cost: 0, item_notes: "" }],
  })

  useEffect(() => {
    if (locations.length > 0 && !form.stock_location_id) {
      setForm((prev) => ({ ...prev, stock_location_id: locations[0].id }))
    }
  }, [locations])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.stock_location_id) {
      toast.error("Molimo odaberite magacin.")
      return
    }

    const validItems = form.items.filter((it) => it.inventory_item_id && it.quantity > 0)
    if (validItems.length === 0) {
      toast.error("Morate dodati barem jedan artikal sa količinom većom od 0.")
      return
    }

    try {
      const res = await fetch("/admin/warehouse/write-offs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          stock_location_id: form.stock_location_id,
          reason: form.reason,
          commission_members: form.commission_members,
          notes: form.notes,
          items: validItems,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || "Greška pri kreiranju zapisnika o otpisu")
      }

      toast.success("Zapisnik o otpisu kreiran (Draft)!")
      setForm({
        stock_location_id: locations[0]?.id || "",
        reason: "damaged",
        commission_members: "",
        notes: "",
        items: [{ inventory_item_id: "", sku: "", title: "", quantity: 1, unit_cost: 0, item_notes: "" }],
      })
      onSuccess()
    } catch (e: any) {
      toast.error("Greška", { description: e.message })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-ui-bg-base border border-ui-border-base rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col gap-y-4 shadow-2xl">
        <div className="flex justify-between items-center pb-3 border-b">
          <div className="flex items-center gap-x-2">
            <Trash className="text-rose-500" />
            <Heading className="text-lg font-semibold">Novi Zapisnik o Otpisu i Rashodu</Heading>
          </div>
          <Button size="small" variant="transparent" onClick={onClose}>
            <XMark />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold mb-1 block">Magacin za rashod *</label>
              <select
                className="w-full bg-ui-bg-field border border-ui-border-base rounded-md px-3 py-2 text-sm"
                value={form.stock_location_id}
                onChange={(e) => setForm({ ...form, stock_location_id: e.target.value })}
                required
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block">Razlog Rashoda *</label>
              <select
                className="w-full bg-ui-bg-field border border-ui-border-base rounded-md px-3 py-2 text-sm"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                required
              >
                <option value="damaged">🔴 Oštećenje / Lom robe</option>
                <option value="expired">🟠 Istekao rok trajanja</option>
                <option value="lost">🟡 Kalo / Rastur / Manjak</option>
                <option value="internal_use">🔵 Interna potrošnja preduzeća</option>
                <option value="other">⚪ Ostalo</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold mb-1 block">Članovi Komisije za otpis</label>
            <Input
              placeholder="npr. Emir H. (predsjednik), Selma B., Damir K."
              value={form.commission_members}
              onChange={(e) => setForm({ ...form, commission_members: e.target.value })}
            />
          </div>

          <div>
            <label className="text-xs font-semibold mb-1 block">Obrazloženje / Napomena</label>
            <Input
              placeholder="npr. Roba oštećena prilikom pada palete sa regala..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <div className="border-t pt-3">
            <div className="flex justify-between items-center mb-2">
              <Text className="text-sm font-semibold">Stavke za rashod</Text>
              <Button
                type="button"
                size="small"
                variant="secondary"
                onClick={() =>
                  setForm({
                    ...form,
                    items: [
                      ...form.items,
                      { inventory_item_id: "", sku: "", title: "", quantity: 1, unit_cost: 0, item_notes: "" },
                    ],
                  })
                }
              >
                + Dodaj artikal
              </Button>
            </div>

            {form.items.map((item, index) => (
              <div key={index} className="flex flex-col gap-2 mb-3 bg-ui-bg-subtle p-3 rounded-lg border border-ui-border-base">
                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <select
                      className="w-full bg-ui-bg-field border border-ui-border-base rounded-md px-2 py-1.5 text-xs"
                      value={item.inventory_item_id}
                      onChange={(e) => {
                        const selectedInv = inventoryItems.find((inv) => inv.id === e.target.value)
                        const updated = [...form.items]
                        updated[index] = {
                          ...updated[index],
                          inventory_item_id: e.target.value,
                          sku: selectedInv?.sku || "",
                          title: selectedInv?.title || "",
                        }
                        setForm({ ...form, items: updated })
                      }}
                      required
                    >
                      <option value="">-- Odaberite Artikal / SKU --</option>
                      {inventoryItems.map((inv) => (
                            <option key={inv.id} value={inv.id}>
                              {inv.sku} ({inv.title})
                            </option>
                          ))}
                    </select>
                  </div>
                  <div className="w-24">
                    <Input
                      type="number"
                      min="1"
                      placeholder="Količina"
                      value={item.quantity}
                      onChange={(e) => {
                        const updated = [...form.items]
                        updated[index].quantity = parseInt(e.target.value) || 1
                        setForm({ ...form, items: updated })
                      }}
                    />
                  </div>
                  <div className="w-28">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Nabavna cijena"
                      value={item.unit_cost}
                      onChange={(e) => {
                        const updated = [...form.items]
                        updated[index].unit_cost = parseFloat(e.target.value) || 0
                        setForm({ ...form, items: updated })
                      }}
                    />
                  </div>
                  {form.items.length > 1 && (
                    <Button
                      type="button"
                      size="small"
                      variant="transparent"
                      onClick={() => {
                        const updated = form.items.filter((_, idx) => idx !== index)
                        setForm({ ...form, items: updated })
                      }}
                    >
                      ✕
                    </Button>
                  )}
                </div>
                <div>
                  <Input
                    placeholder="Opis oštećenja za ovu stavku (npr. Polomljeno kućište, istekla garancija...)"
                    value={item.item_notes}
                    onChange={(e) => {
                      const updated = [...form.items]
                      updated[index].item_notes = e.target.value
                      setForm({ ...form, items: updated })
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-x-2 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={onClose}>
              Odustani
            </Button>
            <Button type="submit" variant="primary">
              Sačuvaj Zapisnik o Otpisu (Draft)
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
