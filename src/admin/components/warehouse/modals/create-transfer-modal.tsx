import React, { useState, useEffect } from "react"
import { Heading, Text, Button, Input, toast } from "@medusajs/ui"
import { XMark, ArrowUpDown } from "@medusajs/icons"
import { CreateTransferModalProps } from "../types"

export const CreateTransferModal: React.FC<CreateTransferModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  locations,
  inventoryItems,
}) => {
  const [form, setForm] = useState({
    source_location_id: locations[0]?.id || "",
    destination_location_id: locations[1]?.id || locations[0]?.id || "",
    notes: "",
    items: [{ inventory_item_id: "", sku: "", title: "", quantity: 1 }],
  })

  useEffect(() => {
    if (locations.length > 0) {
      setForm((prev) => ({
        ...prev,
        source_location_id: prev.source_location_id || locations[0].id,
        destination_location_id: prev.destination_location_id || locations[1]?.id || locations[0].id,
      }))
    }
  }, [locations])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (form.source_location_id === form.destination_location_id) {
      toast.error("Izvorni i odredišni magacin ne mogu biti isti!")
      return
    }

    const validItems = form.items.filter((it) => it.inventory_item_id && it.quantity > 0)
    if (validItems.length === 0) {
      toast.error("Morate dodati barem jedan artikal sa količinom većom od 0.")
      return
    }

    try {
      const res = await fetch("/admin/warehouse/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          source_location_id: form.source_location_id,
          destination_location_id: form.destination_location_id,
          notes: form.notes,
          items: validItems,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || "Greška pri kreiranju transfera")
      }

      toast.success("Međuskladišnica kreirana (Draft)!")
      setForm({
        source_location_id: locations[0]?.id || "",
        destination_location_id: locations[1]?.id || locations[0]?.id || "",
        notes: "",
        items: [{ inventory_item_id: "", sku: "", title: "", quantity: 1 }],
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
            <ArrowUpDown className="text-ui-fg-interactive" />
            <Heading className="text-lg font-semibold">Nova Međuskladišnica</Heading>
          </div>
          <Button size="small" variant="transparent" onClick={onClose}>
            <XMark />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold mb-1 block">Izvorni Magacin (Otprema sa) *</label>
              <select
                className="w-full bg-ui-bg-field border border-ui-border-base rounded-md px-3 py-2 text-sm"
                value={form.source_location_id}
                onChange={(e) => setForm({ ...form, source_location_id: e.target.value })}
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
              <label className="text-xs font-semibold mb-1 block">Odredišni Magacin (Prijem na) *</label>
              <select
                className="w-full bg-ui-bg-field border border-ui-border-base rounded-md px-3 py-2 text-sm"
                value={form.destination_location_id}
                onChange={(e) => setForm({ ...form, destination_location_id: e.target.value })}
                required
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold mb-1 block">Napomena uz prevoz / Vozač</label>
            <Input
              placeholder="npr. Vozač: Emir (Kombi reg. A12-E-345)..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <div className="border-t pt-3">
            <div className="flex justify-between items-center mb-2">
              <Text className="text-sm font-semibold">Stavke za prenos</Text>
              <Button
                type="button"
                size="small"
                variant="secondary"
                onClick={() =>
                  setForm({
                    ...form,
                    items: [
                      ...form.items,
                      { inventory_item_id: "", sku: "", title: "", quantity: 1 },
                    ],
                  })
                }
              >
                + Dodaj artikal
              </Button>
            </div>

            {form.items.map((item, index) => (
              <div key={index} className="flex gap-2 items-center mb-2 bg-ui-bg-subtle p-2 rounded-lg">
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
                <div className="w-28">
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
            ))}
          </div>

          <div className="flex justify-end gap-x-2 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={onClose}>
              Odustani
            </Button>
            <Button type="submit" variant="primary">
              Sačuvaj Međuskladišnicu (Draft)
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
