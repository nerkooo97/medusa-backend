import React, { useState, useEffect } from "react"
import { Heading, Text, Button, Input, toast } from "@medusajs/ui"
import { XMark } from "@medusajs/icons"
import { CreateReceiptModalProps } from "../types"

export const CreateReceiptModal: React.FC<CreateReceiptModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  locations,
  inventoryItems,
}) => {
  const [form, setForm] = useState({
    supplier_name: "",
    invoice_number: "",
    invoice_date: new Date().toISOString().split("T")[0],
    stock_location_id: locations[0]?.id || "",
    notes: "",
    items: [{ inventory_item_id: "", sku: "", title: "", quantity: 1, unit_cost: 0 }],
  })

  useEffect(() => {
    if (locations.length > 0 && !form.stock_location_id) {
      setForm((prev) => ({ ...prev, stock_location_id: locations[0].id }))
    }
  }, [locations])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.supplier_name || !form.invoice_number) {
      toast.error("Molimo unesite dobavljača i broj fakture.")
      return
    }

    const validItems = form.items.filter((it) => it.inventory_item_id && it.quantity > 0)
    if (validItems.length === 0) {
      toast.error("Morate dodati barem jedan artikal sa količinom većom od 0.")
      return
    }

    try {
      const res = await fetch("/admin/warehouse/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          supplier_name: form.supplier_name,
          invoice_number: form.invoice_number,
          invoice_date: form.invoice_date,
          stock_location_id: form.stock_location_id,
          notes: form.notes,
          items: validItems,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || "Greška pri kreiranju prijemnice")
      }

      toast.success("Nova prijemnica kreirana (Draft)!")
      setForm({
        supplier_name: "",
        invoice_number: "",
        invoice_date: new Date().toISOString().split("T")[0],
        stock_location_id: locations[0]?.id || "",
        notes: "",
        items: [{ inventory_item_id: "", sku: "", title: "", quantity: 1, unit_cost: 0 }],
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
          <Heading className="text-lg font-semibold">Nova Prijemnica Robe</Heading>
          <Button size="small" variant="transparent" onClick={onClose}>
            <XMark />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold mb-1 block">Naziv Dobavljača *</label>
              <Input
                placeholder="npr. Nike Europe B.V."
                value={form.supplier_name}
                onChange={(e) => setForm({ ...form, supplier_name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block">Broj Fakture / Otpremnice *</label>
              <Input
                placeholder="npr. INV-2026-9901"
                value={form.invoice_number}
                onChange={(e) => setForm({ ...form, invoice_number: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold mb-1 block">Ciljni Magacin *</label>
              <select
                className="w-full bg-ui-bg-field border border-ui-border-base rounded-md px-3 py-2 text-sm"
                value={form.stock_location_id}
                onChange={(e) => setForm({ ...form, stock_location_id: e.target.value })}
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block">Datum Računa</label>
              <Input
                type="date"
                value={form.invoice_date}
                onChange={(e) => setForm({ ...form, invoice_date: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold mb-1 block">Napomena</label>
            <Input
              placeholder="Dodatne napomene za skladištare..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <div className="border-t pt-3">
            <div className="flex justify-between items-center mb-2">
              <Text className="text-sm font-semibold">Stavke Prijemnice</Text>
              <Button
                type="button"
                size="small"
                variant="secondary"
                onClick={() =>
                  setForm({
                    ...form,
                    items: [
                      ...form.items,
                      { inventory_item_id: "", sku: "", title: "", quantity: 1, unit_cost: 0 },
                    ],
                  })
                }
              >
                + Dodaj stavku
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
            ))}
          </div>

          <div className="flex justify-end gap-x-2 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={onClose}>
              Odustani
            </Button>
            <Button type="submit" variant="primary">
              Sačuvaj Prijemnicu (Draft)
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
