export type PrintDocumentType = "receipt" | "transfer" | "write_off"

export const printWarehouseDocument = ({
  type,
  data,
  locationMap,
}: {
  type: PrintDocumentType
  data: any
  locationMap: Record<string, string>
}) => {
  const printWindow = window.open("", "_blank")
  if (!printWindow) {
    alert("Molimo omogućite pop-up prozore u browseru kako bi se dokument mogao otvoriti za štampu/PDF.")
    return
  }

  const isReceipt = type === "receipt"
  const isTransfer = type === "transfer"
  const isWriteOff = type === "write_off"

  const title = isReceipt
    ? `Prijemnica_${data.receipt_number || "dokument"}`
    : isTransfer
    ? `Medjuskladisnica_${data.transfer_number || "dokument"}`
    : `Zapisnik_Otpisa_${data.write_off_number || "dokument"}`

  const docTitle = isReceipt
    ? "PRIJEMNICA ROBE / KALKULACIJA"
    : isTransfer
    ? "MEĐUSKLADIŠNICA / OTPREMNICA"
    : "ZAPISNIK O OTPISU I RASHODU ROBE"

  const docNumber = isReceipt
    ? data.receipt_number
    : isTransfer
    ? data.transfer_number
    : data.write_off_number

  const docDate = isReceipt
    ? data.received_at
      ? new Date(data.received_at).toLocaleDateString("bs-BA")
      : data.invoice_date
      ? new Date(data.invoice_date).toLocaleDateString("bs-BA")
      : new Date(data.created_at).toLocaleDateString("bs-BA")
    : isTransfer
    ? data.dispatched_at
      ? new Date(data.dispatched_at).toLocaleDateString("bs-BA")
      : new Date(data.created_at).toLocaleDateString("bs-BA")
    : data.posted_at
    ? new Date(data.posted_at).toLocaleDateString("bs-BA")
    : new Date(data.created_at).toLocaleDateString("bs-BA")

  const totalQuantity = (data.items || []).reduce((acc: number, item: any) => acc + (item.quantity || 0), 0)
  const totalAmount = isReceipt || isWriteOff
    ? (data.items || []).reduce((acc: number, item: any) => acc + (item.total_cost || (item.unit_cost ? item.unit_cost * item.quantity : 0)), 0)
    : 0

  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case "damaged":
        return "Oštećenje / Lom robe"
      case "expired":
        return "Istekao rok trajanja"
      case "lost":
        return "Kalo / Rastur / Manjak"
      case "internal_use":
        return "Interna potrošnja"
      default:
        return "Ostalo"
    }
  }

  const html = `<!DOCTYPE html>
<html lang="bs">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm;
    }
    * {
      box-sizing: border-box;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    body {
      color: #111827;
      background: #fff;
      margin: 0;
      padding: 10px;
      font-size: 13px;
      line-height: 1.4;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 25px;
      border-bottom: 2px solid #111827;
      padding-bottom: 15px;
    }
    .header-table td {
      vertical-align: top;
    }
    .company-name {
      font-size: 20px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #111827;
      margin-bottom: 4px;
    }
    .doc-badge {
      text-align: right;
    }
    .doc-title {
      font-size: 18px;
      font-weight: 800;
      color: #1f2937;
      margin-bottom: 4px;
    }
    .doc-number {
      font-size: 15px;
      font-weight: 700;
      color: #2563eb;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-bottom: 25px;
      background: #f9fafb;
      padding: 15px;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
    }
    .info-row {
      margin-bottom: 6px;
      display: flex;
    }
    .info-label {
      width: 150px;
      font-weight: 600;
      color: #4b5563;
      font-size: 12px;
    }
    .info-value {
      flex: 1;
      font-weight: 700;
      color: #111827;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 25px;
    }
    .data-table th {
      background: #f3f4f6;
      border-top: 1px solid #d1d5db;
      border-bottom: 2px solid #9ca3af;
      padding: 8px 10px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #374151;
      text-align: left;
    }
    .data-table td {
      padding: 8px 10px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 12px;
    }
    .text-right { text-align: right !important; }
    .text-center { text-align: center !important; }
    .total-row td {
      font-weight: 800;
      border-top: 2px solid #111827;
      border-bottom: 2px solid #111827;
      background: #f9fafb;
      font-size: 13px;
    }
    .signatures {
      margin-top: 60px;
      width: 100%;
      border-collapse: collapse;
      page-break-inside: avoid;
    }
    .signatures td {
      width: ${isReceipt ? "50%" : "33.3%"};
      text-align: center;
      vertical-align: top;
      padding: 0 15px;
    }
    .sig-line {
      border-top: 1px solid #4b5563;
      margin-top: 50px;
      padding-top: 6px;
      font-size: 12px;
      font-weight: 600;
      color: #374151;
    }
    .sig-mp {
      margin-top: 10px;
      font-size: 10px;
      color: #9ca3af;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <table class="header-table">
    <tr>
      <td>
        <div class="company-name">DTC ROBNO POSLOVANJE</div>
        <div style="color: #6b7280; font-size: 11px;">Centralni Skladišni Sistem & Knjigovodstvo</div>
      </td>
      <td class="doc-badge">
        <div class="doc-title">${docTitle}</div>
        <div class="doc-number">${docNumber}</div>
        <div style="font-size: 12px; color: #6b7280;">Datum: <strong>${docDate}</strong></div>
      </td>
    </tr>
  </table>

  <div class="info-grid">
    <div>
      ${
        isReceipt
          ? `
        <div class="info-row"><span class="info-label">Dobavljač:</span><span class="info-value">${data.supplier_name}</span></div>
        <div class="info-row"><span class="info-label">Broj ulazne fakture:</span><span class="info-value">${data.invoice_number}</span></div>
        <div class="info-row"><span class="info-label">Datum fakture:</span><span class="info-value">${data.invoice_date ? new Date(data.invoice_date).toLocaleDateString("bs-BA") : "-"}</span></div>
      `
          : isTransfer
          ? `
        <div class="info-row"><span class="info-label">Polazni Magacin:</span><span class="info-value">${locationMap[data.source_location_id] || data.source_location_id}</span></div>
        <div class="info-row"><span class="info-label">Odredišni Magacin:</span><span class="info-value">${locationMap[data.destination_location_id] || data.destination_location_id}</span></div>
      `
          : `
        <div class="info-row"><span class="info-label">Magacin / Lokacija:</span><span class="info-value">${locationMap[data.stock_location_id] || data.stock_location_id}</span></div>
        <div class="info-row"><span class="info-label">Razlog rashoda:</span><span class="info-value" style="color: #dc2626;">${getReasonLabel(data.reason)}</span></div>
        <div class="info-row"><span class="info-label">Komisija za rashod:</span><span class="info-value">${data.commission_members || "Skladišna komisija"}</span></div>
      `
      }
    </div>
    <div>
      ${
        isReceipt
          ? `
        <div class="info-row"><span class="info-label">Ciljno Skladište:</span><span class="info-value">${locationMap[data.stock_location_id] || data.stock_location_id}</span></div>
        <div class="info-row"><span class="info-label">Status dokumenta:</span><span class="info-value">${data.status === "posted" ? "PROKNJIŽENO" : data.status.toUpperCase()}</span></div>
        <div class="info-row"><span class="info-label">Datum prijema na stanje:</span><span class="info-value">${data.received_at ? new Date(data.received_at).toLocaleString("bs-BA") : "U pripremi"}</span></div>
      `
          : isTransfer
          ? `
        <div class="info-row"><span class="info-label">Status transfera:</span><span class="info-value">${data.status === "completed" ? "ZAVRŠENO" : data.status === "in_transit" ? "U TRANZITU (NA PUTU)" : "U PRIPREMI"}</span></div>
        <div class="info-row"><span class="info-label">Datum otpreme:</span><span class="info-value">${data.dispatched_at ? new Date(data.dispatched_at).toLocaleString("bs-BA") : "-"}</span></div>
        <div class="info-row"><span class="info-label">Datum prijema:</span><span class="info-value">${data.received_at ? new Date(data.received_at).toLocaleString("bs-BA") : "-"}</span></div>
      `
          : `
        <div class="info-row"><span class="info-label">Status dokumenta:</span><span class="info-value">${data.status === "posted" ? "PROKNJIŽENO (SKINUTO SA STANJA)" : "U PRIPREMI (DRAFT)"}</span></div>
        <div class="info-row"><span class="info-label">Datum knjiženja:</span><span class="info-value">${data.posted_at ? new Date(data.posted_at).toLocaleString("bs-BA") : "U pripremi"}</span></div>
      `
      }
      ${data.notes ? `<div class="info-row"><span class="info-label">Napomena / Obrazloženje:</span><span class="info-value" style="font-style: italic;">${data.notes}</span></div>` : ""}
    </div>
  </div>

  <table class="data-table">
    <thead>
      <tr>
        <th class="text-center" style="width: 40px;">R.br.</th>
        <th>Šifra / SKU</th>
        <th>Naziv Artikla</th>
        ${isWriteOff ? `<th>Opis Oštećenja</th>` : ""}
        <th class="text-right" style="width: 90px;">Količina</th>
        ${
          isReceipt || isWriteOff
            ? `
          <th class="text-right" style="width: 120px;">Nabavna Cijena</th>
          <th class="text-right" style="width: 130px;">Ukupno (KM)</th>
        `
            : ""
        }
      </tr>
    </thead>
    <tbody>
      ${(data.items || [])
        .map(
          (item: any, idx: number) => `
        <tr>
          <td class="text-center">${idx + 1}.</td>
          <td style="font-family: monospace; font-weight: 600;">${item.sku}</td>
          <td>${item.title || item.sku}</td>
          ${isWriteOff ? `<td style="font-size: 11px; color: #4b5563;">${item.item_notes || "-"}</td>` : ""}
          <td class="text-right" style="font-weight: 700;">${item.quantity}</td>
          ${
            isReceipt || isWriteOff
              ? `
            <td class="text-right">${item.unit_cost ? Number(item.unit_cost).toFixed(2) + " KM" : "-"}</td>
            <td class="text-right" style="font-weight: 700;">${
              item.total_cost
                ? Number(item.total_cost).toFixed(2) + " KM"
                : item.unit_cost
                ? (Number(item.unit_cost) * item.quantity).toFixed(2) + " KM"
                : "-"
            }</td>
          `
              : ""
          }
        </tr>
      `
        )
        .join("")}
      <tr class="total-row">
        <td colspan="${isWriteOff ? 4 : 3}" class="text-right">UKUPNO ZA RASHOD / PRENOS:</td>
        <td class="text-right">${totalQuantity} kom.</td>
        ${
          isReceipt || isWriteOff
            ? `
          <td></td>
          <td class="text-right">${Number(totalAmount).toFixed(2)} KM</td>
        `
            : ""
        }
      </tr>
    </tbody>
  </table>

  <div style="font-size: 11px; color: #4b5563; margin-top: 15px;">
    ${
      isWriteOff
        ? "Konstatovano je da je gore navedena roba oštećena/neupotrebljiva i komisijski se predlaže njeno trajno rashodovanje i skidanje sa robno-materijalne evidencije preduzeća."
        : "Ovaj dokument je generisan elektronski u robnom knjigovodstvu i pravosnažan je bez pečata ukoliko je digitalno verifikovan."
    }
  </div>

  <table class="signatures">
    <tr>
      ${
        isReceipt
          ? `
        <td>
          <div class="sig-line">Roba Predata (Dobavljač / Prevoznik)</div>
          <div class="sig-mp">M.P.</div>
        </td>
        <td>
          <div class="sig-line">Roba Primljena i Pregledana (Skladištar)</div>
          <div class="sig-mp">M.P.</div>
        </td>
      `
          : isTransfer
          ? `
        <td>
          <div class="sig-line">Robu Otpremio (Izvorni magacin)</div>
          <div class="sig-mp">M.P.</div>
        </td>
        <td>
          <div class="sig-line">Vozač / Prevoznik</div>
        </td>
        <td>
          <div class="sig-line">Robu Zaprimio (Odredišni magacin)</div>
          <div class="sig-mp">M.P.</div>
        </td>
      `
          : `
        <td>
          <div class="sig-line">Član Komisije 1</div>
        </td>
        <td>
          <div class="sig-line">Član Komisije 2</div>
        </td>
        <td>
          <div class="sig-line">Predsjednik Komisije / Šef Skladišta</div>
          <div class="sig-mp">M.P.</div>
        </td>
      `
      }
    </tr>
  </table>

  <script>
    setTimeout(() => {
      window.focus();
      window.print();
    }, 250);
  </script>
</body>
</html>`

  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()
}
