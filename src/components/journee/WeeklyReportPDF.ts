import jsPDF from "jspdf";

interface ClientStat {
  name: string;
  color: string;
  hours: number;
  days: number;
  clientCA: number;
  effectiveTJM: number;
  isProfitable: boolean;
}

interface WeekDay {
  day: string;
  label: string;
  entries: { clientId: string; hours: number; description?: string }[];
}

interface UrgentActions {
  overdueInvoices: { number: string; totalTTC: number; clientSnapshot?: { name?: string } }[];
  overdueAmount: number;
  pendingDevis: { number: string; clientSnapshot?: { name?: string } }[];
  deadlines: { label: string; date: Date | string }[];
  staleProspects: { name: string }[];
}

interface WeeklyReportData {
  weekEntries: WeekDay[];
  totalWeekHours: number;
  monthCA: number;
  monthHours: number;
  monthWorkedDays: number;
  monthTotalBizDays: number;
  overallTJM: number;
  utilizationRate: number;
  hourlyRate: number;
  clientStats: ClientStat[];
  urgentActions: UrgentActions;
  clientName: (id: string) => string;
  companyName?: string;
}

function fmtNum(n: number) {
  return Math.round(n).toLocaleString("fr-FR");
}

function fmtHM(hours: number) {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}

function formatDateFR(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export function generateWeeklyReportPDF(data: WeeklyReportData): jsPDF {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = 210;
  const marginL = 20;
  const marginR = 20;
  const contentW = pageW - marginL - marginR;
  let y = 20;

  const primary: [number, number, number] = [86, 130, 242];
  const dark: [number, number, number] = [15, 15, 30];
  const gray: [number, number, number] = [120, 120, 140];
  const green: [number, number, number] = [74, 222, 128];
  const red: [number, number, number] = [248, 113, 113];

  // ─── Title ───
  pdf.setFontSize(20);
  pdf.setTextColor(...primary);
  pdf.setFont("helvetica", "bold");
  pdf.text("RAPPORT HEBDOMADAIRE", marginL, y);
  y += 7;

  pdf.setFontSize(10);
  pdf.setTextColor(...gray);
  pdf.setFont("helvetica", "normal");
  const monday = data.weekEntries[0]?.day;
  const friday = data.weekEntries[4]?.day;
  if (monday && friday) {
    pdf.text(`Semaine du ${formatDateFR(monday)} au ${formatDateFR(friday)}`, marginL, y);
  }
  if (data.companyName) {
    pdf.text(data.companyName, pageW - marginR, y, { align: "right" });
  }
  y += 4;

  // Separator
  pdf.setDrawColor(230, 230, 240);
  pdf.line(marginL, y, marginL + contentW, y);
  y += 8;

  // ─── KPIs row ───
  const kpiW = contentW / 4;
  const kpis = [
    { label: "Heures semaine", value: fmtHM(data.totalWeekHours) },
    { label: "CA du mois", value: `${fmtNum(data.monthCA)} \u20ac` },
    { label: "TJM effectif", value: `${fmtNum(data.overallTJM)} \u20ac` },
    { label: "Utilisation", value: `${Math.round(data.utilizationRate * 100)}%` },
  ];

  // KPI background
  pdf.setFillColor(245, 245, 252);
  pdf.rect(marginL, y - 4, contentW, 16, "F");

  kpis.forEach((kpi, i) => {
    const x = marginL + i * kpiW + kpiW / 2;
    pdf.setFontSize(7);
    pdf.setTextColor(...gray);
    pdf.setFont("helvetica", "normal");
    pdf.text(kpi.label.toUpperCase(), x, y, { align: "center" });
    pdf.setFontSize(14);
    pdf.setTextColor(...dark);
    pdf.setFont("helvetica", "bold");
    pdf.text(kpi.value, x, y + 8, { align: "center" });
  });
  y += 20;

  // ─── Weekly breakdown table ───
  pdf.setFontSize(11);
  pdf.setTextColor(...dark);
  pdf.setFont("helvetica", "bold");
  pdf.text("Suivi du temps", marginL, y);
  y += 6;

  // Table header
  const colDay = marginL;
  const colClient = marginL + 25;
  const colDesc = marginL + 70;
  const colHours = marginL + contentW;

  pdf.setFillColor(245, 245, 250);
  pdf.rect(marginL, y - 3.5, contentW, 7, "F");
  pdf.setFontSize(7);
  pdf.setTextColor(...gray);
  pdf.setFont("helvetica", "bold");
  pdf.text("JOUR", colDay, y);
  pdf.text("CLIENT", colClient, y);
  pdf.text("DESCRIPTION", colDesc, y);
  pdf.text("HEURES", colHours, y, { align: "right" });
  y += 6;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);

  for (const dayData of data.weekEntries) {
    if (dayData.entries.length === 0) continue;

    if (y > 255) { pdf.addPage(); y = 20; }

    // Day label
    const dayLabel = `${dayData.label} ${formatDateFR(dayData.day)}`;

    for (let i = 0; i < dayData.entries.length; i++) {
      const entry = dayData.entries[i];
      if (y > 265) { pdf.addPage(); y = 20; }

      // Show day label only on first entry
      if (i === 0) {
        pdf.setTextColor(...dark);
        pdf.setFont("helvetica", "bold");
        pdf.text(dayLabel, colDay, y);
      }

      pdf.setTextColor(...dark);
      pdf.setFont("helvetica", "normal");
      pdf.text(data.clientName(entry.clientId), colClient, y);

      if (entry.description) {
        const desc = pdf.splitTextToSize(entry.description, colHours - colDesc - 15);
        pdf.setTextColor(...gray);
        pdf.text(desc[0] || "", colDesc, y);
      }

      pdf.setTextColor(...dark);
      pdf.setFont("helvetica", "medium" as "normal");
      pdf.text(fmtHM(entry.hours), colHours, y, { align: "right" });
      pdf.setFont("helvetica", "normal");

      y += 5;
    }

    // Day total
    const dayTotal = dayData.entries.reduce((s, e) => s + e.hours, 0);
    pdf.setDrawColor(240, 240, 245);
    pdf.line(colClient, y - 1.5, marginL + contentW, y - 1.5);
    pdf.setFontSize(8);
    pdf.setTextColor(...gray);
    pdf.text(`Sous-total : ${fmtHM(dayTotal)}`, colHours, y + 1, { align: "right" });
    y += 6;
  }

  // Week total
  pdf.setFillColor(...primary);
  pdf.rect(marginL + contentW - 55, y - 3, 55, 8, "F");
  pdf.setFontSize(9);
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.text(`Total semaine : ${fmtHM(data.totalWeekHours)}`, colHours, y + 1.5, { align: "right" });
  y += 14;

  // ─── Client profitability ───
  if (data.clientStats.length > 0) {
    if (y > 230) { pdf.addPage(); y = 20; }

    pdf.setFontSize(11);
    pdf.setTextColor(...dark);
    pdf.setFont("helvetica", "bold");
    pdf.text("Rentabilit\u00e9 par client (mois en cours)", marginL, y);
    y += 6;

    // Table header
    pdf.setFillColor(245, 245, 250);
    pdf.rect(marginL, y - 3.5, contentW, 7, "F");
    pdf.setFontSize(7);
    pdf.setTextColor(...gray);
    pdf.setFont("helvetica", "bold");
    pdf.text("CLIENT", marginL, y);
    pdf.text("HEURES", marginL + 70, y, { align: "right" });
    pdf.text("JOURS", marginL + 90, y, { align: "right" });
    pdf.text("CA", marginL + 115, y, { align: "right" });
    pdf.text("TJM EFF.", marginL + 140, y, { align: "right" });
    pdf.text("STATUT", marginL + contentW, y, { align: "right" });
    y += 6;

    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");

    for (const cs of data.clientStats) {
      if (y > 270) { pdf.addPage(); y = 20; }

      // Color dot
      const [r, g, b] = hexToRgb(cs.color);
      pdf.setFillColor(r, g, b);
      pdf.circle(marginL + 1.5, y - 1, 1.5, "F");

      pdf.setTextColor(...dark);
      pdf.text(cs.name, marginL + 5, y);
      pdf.setTextColor(...gray);
      pdf.text(fmtHM(cs.hours), marginL + 70, y, { align: "right" });
      pdf.text(cs.days.toFixed(1) + "j", marginL + 90, y, { align: "right" });
      pdf.text(`${fmtNum(cs.clientCA)} \u20ac`, marginL + 115, y, { align: "right" });
      pdf.setTextColor(...dark);
      pdf.setFont("helvetica", "bold");
      pdf.text(`${fmtNum(cs.effectiveTJM)} \u20ac`, marginL + 140, y, { align: "right" });
      pdf.setFont("helvetica", "normal");

      pdf.setTextColor(...(cs.isProfitable ? green : red));
      pdf.text(cs.isProfitable ? "\u2713" : "\u2717", marginL + contentW, y, { align: "right" });

      y += 5;
    }

    // Monthly summary
    y += 3;
    pdf.setDrawColor(230, 230, 240);
    pdf.line(marginL, y, marginL + contentW, y);
    y += 5;

    pdf.setFontSize(8);
    pdf.setTextColor(...gray);
    pdf.setFont("helvetica", "normal");
    const summaryItems = [
      `${data.monthWorkedDays} jours travaill\u00e9s / ${data.monthTotalBizDays} jours ouvr\u00e9s`,
      `${fmtHM(data.monthHours)} heures logu\u00e9es`,
      `Taux horaire effectif : ${fmtNum(data.hourlyRate)} \u20ac/h`,
    ];
    summaryItems.forEach((item) => {
      pdf.text(`\u2022  ${item}`, marginL, y);
      y += 4;
    });
    y += 4;
  }

  // ─── Urgent actions ───
  const ua = data.urgentActions;
  const hasUrgent = ua.overdueInvoices.length + ua.pendingDevis.length + ua.deadlines.length + ua.staleProspects.length > 0;

  if (hasUrgent) {
    if (y > 240) { pdf.addPage(); y = 20; }

    pdf.setFontSize(11);
    pdf.setTextColor(...dark);
    pdf.setFont("helvetica", "bold");
    pdf.text("Actions urgentes", marginL, y);
    y += 6;

    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");

    if (ua.overdueInvoices.length > 0) {
      pdf.setTextColor(...red);
      pdf.text(`\u26a0  ${ua.overdueInvoices.length} facture${ua.overdueInvoices.length > 1 ? "s" : ""} en retard (${fmtNum(ua.overdueAmount)} \u20ac)`, marginL, y);
      y += 5;
      pdf.setFontSize(8);
      pdf.setTextColor(...gray);
      ua.overdueInvoices.forEach((inv) => {
        pdf.text(`   ${inv.number} \u2014 ${inv.clientSnapshot?.name ?? "Client"} \u2014 ${fmtNum(inv.totalTTC)} \u20ac`, marginL + 5, y);
        y += 4;
      });
      pdf.setFontSize(9);
      y += 2;
    }

    if (ua.pendingDevis.length > 0) {
      pdf.setTextColor(251, 191, 36);
      pdf.text(`\u23f3  ${ua.pendingDevis.length} devis en attente depuis plus de 7 jours`, marginL, y);
      y += 5;
      pdf.setFontSize(8);
      pdf.setTextColor(...gray);
      ua.pendingDevis.forEach((d) => {
        pdf.text(`   ${d.number} \u2014 ${d.clientSnapshot?.name ?? "Client"}`, marginL + 5, y);
        y += 4;
      });
      pdf.setFontSize(9);
      y += 2;
    }

    if (ua.deadlines.length > 0) {
      pdf.setTextColor(...primary);
      pdf.text(`\ud83d\udcc5  ${ua.deadlines.length} \u00e9ch\u00e9ance${ua.deadlines.length > 1 ? "s" : ""} fiscale${ua.deadlines.length > 1 ? "s" : ""} cette semaine`, marginL, y);
      y += 5;
      pdf.setFontSize(8);
      pdf.setTextColor(...gray);
      ua.deadlines.forEach((dl) => {
        const dlDate = dl.date instanceof Date ? dl.date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : dl.date;
        pdf.text(`   ${dlDate} \u2014 ${dl.label}`, marginL + 5, y);
        y += 4;
      });
      pdf.setFontSize(9);
      y += 2;
    }

    if (ua.staleProspects.length > 0) {
      pdf.setTextColor(167, 139, 250);
      pdf.text(`\ud83d\udd14  ${ua.staleProspects.length} prospect${ua.staleProspects.length > 1 ? "s" : ""} \u00e0 relancer`, marginL, y);
      y += 5;
      pdf.setFontSize(8);
      pdf.setTextColor(...gray);
      ua.staleProspects.forEach((p) => {
        pdf.text(`   ${p.name}`, marginL + 5, y);
        y += 4;
      });
    }
  }

  // ─── Footer ───
  pdf.setFontSize(7);
  pdf.setTextColor(180, 180, 190);
  pdf.text(`G\u00e9n\u00e9r\u00e9 avec Freelens \u2014 freelens.io`, pageW / 2, 290, { align: "center" });

  return pdf;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16) || 86,
    parseInt(h.substring(2, 4), 16) || 130,
    parseInt(h.substring(4, 6), 16) || 242,
  ];
}
