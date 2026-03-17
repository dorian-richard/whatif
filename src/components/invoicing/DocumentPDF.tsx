import jsPDF from "jspdf";
import type { InvoiceDocument, PDFOptions } from "@/types";

function formatDateFR(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

function fmtNum(n: number) {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

const DEFAULT_OPTIONS: PDFOptions = {
  accentColor: "#5682F2",
  fontSize: "normal",
  showIban: true,
  showBic: true,
};

const FONT_SCALES: Record<PDFOptions["fontSize"], number> = {
  small: 0.85,
  normal: 1,
  large: 1.15,
};

export function generateInvoicePDF(doc: InvoiceDocument, opts?: Partial<PDFOptions>): jsPDF {
  const options = { ...DEFAULT_OPTIONS, ...opts };
  const scale = FONT_SCALES[options.fontSize];
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = 210;
  const marginL = 20;
  const marginR = 20;
  const contentW = pageW - marginL - marginR;
  let y = 20;

  const issuer = doc.issuerSnapshot;
  const client = doc.clientSnapshot;

  // Colors
  const primary = hexToRgb(options.accentColor);
  const dark: [number, number, number] = [15, 15, 30];
  const gray: [number, number, number] = [120, 120, 140];

  const fs = (size: number) => Math.round(size * scale * 10) / 10;

  // ─── Logo (top-right) ───
  const logoSrc = options.logo ?? issuer?.logo;
  if (logoSrc) {
    try {
      pdf.addImage(logoSrc, "AUTO", pageW - marginR - 40, y - 5, 40, 20);
    } catch {
      // ignore invalid images
    }
  }

  // ─── Title ───
  pdf.setFontSize(fs(22));
  pdf.setTextColor(...primary);
  pdf.setFont("helvetica", "bold");
  const title = doc.type === "devis" ? "DEVIS" : "FACTURE";
  pdf.text(title, marginL, y);
  pdf.setFontSize(fs(11));
  pdf.setTextColor(...gray);
  pdf.setFont("helvetica", "normal");
  pdf.text(doc.number, marginL, y + 7);
  y += 18;

  // ─── Issuer (left) / Client (right) ───
  const colW = contentW / 2 - 5;

  // Issuer
  pdf.setFontSize(fs(8));
  pdf.setTextColor(...gray);
  pdf.text("ÉMETTEUR", marginL, y);
  y += 5;
  pdf.setFontSize(fs(10));
  pdf.setTextColor(...dark);
  pdf.setFont("helvetica", "bold");
  pdf.text(issuer?.companyName || "Mon entreprise", marginL, y);
  pdf.setFont("helvetica", "normal");
  let iy = y + 5;
  pdf.setFontSize(fs(9));
  if (issuer?.siret) { pdf.text(`SIRET : ${issuer.siret}`, marginL, iy); iy += 4; }
  if (issuer?.tvaNumber) { pdf.text(`TVA : ${issuer.tvaNumber}`, marginL, iy); iy += 4; }
  if (issuer?.address) { pdf.text(issuer.address, marginL, iy); iy += 4; }
  if (issuer?.zip || issuer?.city) { pdf.text(`${issuer?.zip ?? ""} ${issuer?.city ?? ""}`.trim(), marginL, iy); iy += 4; }
  if (options.showIban && issuer?.iban) { pdf.text(`IBAN : ${issuer.iban}`, marginL, iy); iy += 4; }
  if (options.showBic && issuer?.bic) { pdf.text(`BIC : ${issuer.bic}`, marginL, iy); iy += 4; }

  // Client
  const clientX = marginL + colW + 10;
  pdf.setFontSize(fs(8));
  pdf.setTextColor(...gray);
  pdf.text("DESTINATAIRE", clientX, y - 5);
  pdf.setFontSize(fs(10));
  pdf.setTextColor(...dark);
  pdf.setFont("helvetica", "bold");
  pdf.text(client?.companyName || client?.name || "Client", clientX, y);
  pdf.setFont("helvetica", "normal");
  let cy = y + 5;
  pdf.setFontSize(fs(9));
  if (client?.name && client?.companyName) { pdf.text(client.name, clientX, cy); cy += 4; }
  if (client?.siret) { pdf.text(`SIRET : ${client.siret}`, clientX, cy); cy += 4; }
  if (client?.address) { pdf.text(client.address, clientX, cy); cy += 4; }
  if (client?.zip || client?.city) { pdf.text(`${client?.zip ?? ""} ${client?.city ?? ""}`.trim(), clientX, cy); cy += 4; }
  if (client?.email) { pdf.text(client.email, clientX, cy); cy += 4; }

  y = Math.max(iy, cy) + 8;

  // ─── Dates ───
  pdf.setFontSize(fs(9));
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
  // Column positions — right edge of each column, all right-aligned except Description
  const colDescLeft = marginL;
  const colQtyRight = marginL + contentW - 90;
  const colUnitRight = marginL + contentW - 62;
  const colPURight = marginL + contentW - 25;
  const colTotalRight = marginL + contentW;

  pdf.setFillColor(245, 245, 250);
  pdf.rect(marginL, y - 4, contentW, 8, "F");
  pdf.setFontSize(fs(8));
  pdf.setTextColor(...gray);
  pdf.setFont("helvetica", "bold");
  pdf.text("Description", colDescLeft, y);
  pdf.text("Qté", colQtyRight, y, { align: "right" });
  pdf.text("Unité", colUnitRight, y, { align: "right" });
  pdf.text("PU HT", colPURight, y, { align: "right" });
  pdf.text("Total HT", colTotalRight, y, { align: "right" });
  y += 8;

  // ─── Table rows ───
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(...dark);
  pdf.setFontSize(fs(9));

  const descMaxW = colQtyRight - colDescLeft - 15;

  for (const item of doc.items) {
    if (y > 260) {
      pdf.addPage();
      y = 20;
    }

    // Wrap description text
    const descLines = pdf.splitTextToSize(item.description || "-", descMaxW);
    for (let i = 0; i < descLines.length; i++) {
      pdf.text(descLines[i], colDescLeft, y + i * 4);
    }

    // Quantity — right-aligned
    pdf.setFontSize(fs(9));
    pdf.setTextColor(...dark);
    pdf.text(String(item.quantity), colQtyRight, y, { align: "right" });

    // Unit — right-aligned, gray
    pdf.setFontSize(fs(8));
    pdf.setTextColor(...gray);
    pdf.text(item.unit || "", colUnitRight, y, { align: "right" });

    // Unit price — right-aligned
    pdf.setFontSize(fs(9));
    pdf.setTextColor(...dark);
    pdf.text(`${fmtNum(item.unitPrice)} €`, colPURight, y, { align: "right" });

    // Line total — right-aligned, bold
    pdf.setFont("helvetica", "bold");
    pdf.text(`${fmtNum(item.quantity * item.unitPrice)} €`, colTotalRight, y, { align: "right" });
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

  pdf.setFontSize(fs(9));
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
  pdf.setFontSize(fs(11));
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.text("Total TTC", totalsX, y + 2);
  pdf.text(`${fmtNum(doc.totalTTC)} €`, totalsValX, y + 2, { align: "right" });
  y += 16;

  // ─── Notes ───
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(fs(8));
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

  if (options.showIban && issuer?.iban) {
    const parts = [`Règlement par virement bancaire — IBAN : ${issuer.iban}`];
    if (options.showBic && issuer?.bic) parts.push(`BIC : ${issuer.bic}`);
    const ibanText = parts.join(" — ");
    const ibanLines = pdf.splitTextToSize(ibanText, contentW);
    for (const line of ibanLines) {
      if (y > 285) { pdf.addPage(); y = 20; }
      pdf.text(line, marginL, y);
      y += 3.5;
    }
  }

  // Custom footer
  if (options.customFooter) {
    y += 2;
    const footerLines = pdf.splitTextToSize(options.customFooter, contentW);
    for (const line of footerLines) {
      if (y > 285) { pdf.addPage(); y = 20; }
      pdf.text(line, marginL, y);
      y += 3.5;
    }
  }

  // Page footer
  pdf.setFontSize(fs(7));
  pdf.setTextColor(180, 180, 190);
  pdf.text("Généré avec Freelens — freelens.io", pageW / 2, 290, { align: "center" });

  return pdf;
}
