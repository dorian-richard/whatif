import jsPDF from "jspdf";
import type { InvoiceDocument } from "@/types";

function formatDateFR(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

function fmtNum(n: number) {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function generateInvoicePDF(doc: InvoiceDocument): jsPDF {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = 210;
  const marginL = 20;
  const marginR = 20;
  const contentW = pageW - marginL - marginR;
  let y = 20;

  const issuer = doc.issuerSnapshot;
  const client = doc.clientSnapshot;

  // Colors
  const primary: [number, number, number] = [86, 130, 242]; // #5682F2
  const dark: [number, number, number] = [15, 15, 30];
  const gray: [number, number, number] = [120, 120, 140];

  // ─── Logo (top-right) ───
  if (issuer?.logo) {
    try {
      pdf.addImage(issuer.logo, "AUTO", pageW - marginR - 40, y - 5, 40, 20);
    } catch {
      // ignore invalid images
    }
  }

  // ─── Title ───
  pdf.setFontSize(22);
  pdf.setTextColor(...primary);
  pdf.setFont("helvetica", "bold");
  const title = doc.type === "devis" ? "DEVIS" : "FACTURE";
  pdf.text(title, marginL, y);
  pdf.setFontSize(11);
  pdf.setTextColor(...gray);
  pdf.setFont("helvetica", "normal");
  pdf.text(doc.number, marginL, y + 7);
  y += 18;

  // ─── Issuer (left) / Client (right) ───
  const colW = contentW / 2 - 5;

  // Issuer
  pdf.setFontSize(8);
  pdf.setTextColor(...gray);
  pdf.text("ÉMETTEUR", marginL, y);
  y += 5;
  pdf.setFontSize(10);
  pdf.setTextColor(...dark);
  pdf.setFont("helvetica", "bold");
  pdf.text(issuer?.companyName || "Mon entreprise", marginL, y);
  pdf.setFont("helvetica", "normal");
  let iy = y + 5;
  if (issuer?.siret) { pdf.setFontSize(9); pdf.text(`SIRET : ${issuer.siret}`, marginL, iy); iy += 4; }
  if (issuer?.tvaNumber) { pdf.text(`TVA : ${issuer.tvaNumber}`, marginL, iy); iy += 4; }
  if (issuer?.address) { pdf.text(issuer.address, marginL, iy); iy += 4; }
  if (issuer?.zip || issuer?.city) { pdf.text(`${issuer?.zip ?? ""} ${issuer?.city ?? ""}`.trim(), marginL, iy); iy += 4; }
  if (issuer?.iban) { pdf.text(`IBAN : ${issuer.iban}`, marginL, iy); iy += 4; }
  if (issuer?.bic) { pdf.text(`BIC : ${issuer.bic}`, marginL, iy); iy += 4; }

  // Client
  const clientX = marginL + colW + 10;
  pdf.setFontSize(8);
  pdf.setTextColor(...gray);
  pdf.text("DESTINATAIRE", clientX, y - 5);
  pdf.setFontSize(10);
  pdf.setTextColor(...dark);
  pdf.setFont("helvetica", "bold");
  pdf.text(client?.companyName || client?.name || "Client", clientX, y);
  pdf.setFont("helvetica", "normal");
  let cy = y + 5;
  if (client?.name && client?.companyName) { pdf.setFontSize(9); pdf.text(client.name, clientX, cy); cy += 4; }
  if (client?.siret) { pdf.text(`SIRET : ${client.siret}`, clientX, cy); cy += 4; }
  if (client?.address) { pdf.text(client.address, clientX, cy); cy += 4; }
  if (client?.zip || client?.city) { pdf.text(`${client?.zip ?? ""} ${client?.city ?? ""}`.trim(), clientX, cy); cy += 4; }
  if (client?.email) { pdf.text(client.email, clientX, cy); cy += 4; }

  y = Math.max(iy, cy) + 8;

  // ─── Dates ───
  pdf.setFontSize(9);
  pdf.setTextColor(...gray);
  pdf.text(`Date d'émission : ${formatDateFR(doc.issueDate)}`, marginL, y);
  if (doc.type === "facture" && doc.dueDate) {
    pdf.text(`Date d'échéance : ${formatDateFR(doc.dueDate)}`, marginL + colW + 10, y);
  }
  if (doc.type === "devis" && doc.validUntil) {
    pdf.text(`Valable jusqu'au : ${formatDateFR(doc.validUntil)}`, marginL + colW + 10, y);
  }
  y += 10;

  // ─── Table header ───
  const colDesc = marginL;
  const colQty = marginL + contentW - 105;
  const colUnit = marginL + contentW - 85;
  const colPU = marginL + contentW - 50;
  const colTotal = marginL + contentW;

  pdf.setFillColor(245, 245, 250);
  pdf.rect(marginL, y - 4, contentW, 8, "F");
  pdf.setFontSize(8);
  pdf.setTextColor(...gray);
  pdf.setFont("helvetica", "bold");
  pdf.text("Description", colDesc, y);
  pdf.text("Qté", colQty, y, { align: "right" });
  pdf.text("Unité", colUnit, y);
  pdf.text("PU HT", colPU, y, { align: "right" });
  pdf.text("Total HT", colTotal, y, { align: "right" });
  y += 8;

  // ─── Table rows ───
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(...dark);
  pdf.setFontSize(9);

  for (const item of doc.items) {
    if (y > 260) {
      pdf.addPage();
      y = 20;
    }

    // Wrap description text — limit to available width before Qté column
    const descMaxW = colQty - colDesc - 20;
    const descLines = pdf.splitTextToSize(item.description || "-", descMaxW);
    for (let i = 0; i < descLines.length; i++) {
      pdf.text(descLines[i], colDesc, y + i * 4);
    }
    pdf.text(String(item.quantity), colQty, y, { align: "right" });
    pdf.setFontSize(8);
    pdf.setTextColor(...gray);
    pdf.text(item.unit || "", colUnit, y);
    pdf.setFontSize(9);
    pdf.setTextColor(...dark);
    pdf.text(`${fmtNum(item.unitPrice)} \u20ac`, colPU, y, { align: "right" });
    pdf.setFont("helvetica", "bold");
    pdf.text(`${fmtNum(item.quantity * item.unitPrice)} \u20ac`, colTotal, y, { align: "right" });
    pdf.setFont("helvetica", "normal");

    y += Math.max(descLines.length * 4, 4) + 4;

    // Separator line
    pdf.setDrawColor(230, 230, 240);
    pdf.line(marginL, y - 2, marginL + contentW, y - 2);
  }

  y += 4;

  // ─── Totals ───
  const totalsX = marginL + contentW - 65;
  const totalsValX = marginL + contentW;

  pdf.setFontSize(9);
  pdf.setTextColor(...gray);
  pdf.text("Total HT", totalsX, y);
  pdf.setTextColor(...dark);
  pdf.text(`${fmtNum(doc.totalHT)} €`, totalsValX, y, { align: "right" });
  y += 5;

  pdf.setTextColor(...gray);
  pdf.text(`TVA (${doc.tvaRate}%)`, totalsX, y);
  pdf.setTextColor(...dark);
  pdf.text(`${fmtNum(doc.totalTVA)} €`, totalsValX, y, { align: "right" });
  y += 6;

  pdf.setFillColor(...primary);
  pdf.rect(totalsX - 5, y - 4, contentW - totalsX + marginL + 5, 9, "F");
  pdf.setFontSize(11);
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.text("Total TTC", totalsX, y + 2);
  pdf.text(`${fmtNum(doc.totalTTC)} €`, totalsValX, y + 2, { align: "right" });
  y += 16;

  // ─── Notes ───
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(...gray);

  if (doc.notes) {
    const noteLines = pdf.splitTextToSize(doc.notes, contentW);
    for (const line of noteLines) {
      if (y > 280) { pdf.addPage(); y = 20; }
      pdf.text(line, marginL, y);
      y += 3.5;
    }
    y += 4;
  }

  // ─── Legal footer ───
  if (doc.tvaRate === 0) {
    pdf.text("TVA non applicable, art. 293 B du CGI", marginL, y);
    y += 4;
  }

  if (issuer?.iban) {
    const ibanText = `Règlement par virement bancaire — IBAN : ${issuer.iban}${issuer.bic ? ` — BIC : ${issuer.bic}` : ""}`;
    const ibanLines = pdf.splitTextToSize(ibanText, contentW);
    for (const line of ibanLines) {
      if (y > 285) { pdf.addPage(); y = 20; }
      pdf.text(line, marginL, y);
      y += 3.5;
    }
  }

  // Page footer
  pdf.setFontSize(7);
  pdf.setTextColor(180, 180, 190);
  pdf.text("Généré avec Freelens — freelens.io", pageW / 2, 290, { align: "center" });

  return pdf;
}
