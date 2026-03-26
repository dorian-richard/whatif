/**
 * Builds the full context object sent to Facto (AI assistant).
 * Centralizes all user data so Facto has complete knowledge.
 */

import { useProfileStore } from "@/stores/useProfileStore";
import { useInvoiceStore } from "@/stores/useInvoiceStore";
import { useHoldingStore } from "@/stores/useHoldingStore";
import { usePipelineStore } from "@/stores/usePipelineStore";
import { usePaymentStore } from "@/stores/usePaymentStore";
import { useWorkLogStore } from "@/stores/useWorkLogStore";
import { getClientAnnualCA } from "@/lib/simulation-engine";

export function buildFactoContext() {
  const profile = useProfileStore.getState();
  const { documents } = useInvoiceStore.getState();
  const holding = useHoldingStore.getState();
  const pipeline = usePipelineStore.getState();
  const payments = usePaymentStore.getState();
  const workLog = useWorkLogStore.getState();

  // ─── Profile & clients ───
  const activeClients = profile.clients.filter((c) => c.isActive !== false);
  const totalCA = activeClients.reduce((sum, c) => sum + getClientAnnualCA(c, profile.vacationDaysPerMonth), 0);

  // ─── Invoices summary ───
  const factures = documents.filter((d) => d.type === "facture");
  const devis = documents.filter((d) => d.type === "devis");
  const unpaidInvoices = factures.filter((d) => d.status === "sent" || d.status === "late");
  const paidInvoices = factures.filter((d) => d.status === "paid");

  // ─── Pipeline summary ───
  const activeProspects = pipeline.prospects.filter((p) => p.stage !== "perdu");
  const pipelineWeighted = activeProspects.reduce((sum, p) => sum + p.estimatedCA * (p.probability / 100), 0);

  // ─── Payments / Trésorerie ───
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const yearPayments = payments.payments.filter((p) => p.year === currentYear);
  const totalReceived = yearPayments.filter((p) => p.status === "paid").reduce((s, p) => s + p.received, 0);
  const totalPending = yearPayments.filter((p) => p.status === "pending" || p.status === "late").reduce((s, p) => s + (p.expected - p.received), 0);
  const latePayments = yearPayments.filter((p) => p.status === "late");

  // ─── Work log summary (current month) ───
  const now = new Date();
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthEntries = workLog.entries.filter((e) => e.date.startsWith(monthPrefix));
  const hoursThisMonth = monthEntries.reduce((s, e) => s + e.hours, 0);
  const hoursByClient: Record<string, number> = {};
  for (const e of monthEntries) {
    hoursByClient[e.clientId] = (hoursByClient[e.clientId] ?? 0) + e.hours;
  }
  // Map client IDs to names
  const hoursByClientNamed: Record<string, number> = {};
  for (const [clientId, hours] of Object.entries(hoursByClient)) {
    const client = profile.clients.find((c) => c.id === clientId);
    hoursByClientNamed[client?.name ?? clientId] = hours;
  }

  // ─── Holding summary ───
  const holdingContext = holding.entities.length > 0 ? {
    name: holding.name,
    entities: holding.entities.map((e) => ({
      name: e.name,
      type: e.type,
      businessStatus: e.businessStatus,
      annualCA: e.annualCA,
      annualSalary: e.annualSalary,
      managementFees: e.managementFees,
    })),
    flows: holding.flows.map((f) => {
      const from = holding.entities.find((e) => e.id === f.fromEntityId);
      const to = holding.entities.find((e) => e.id === f.toEntityId);
      return {
        from: from?.name ?? f.fromEntityId,
        to: to?.name ?? f.toEntityId,
        type: f.type,
        annualAmount: f.annualAmount,
      };
    }),
  } : null;

  return {
    // Profil
    businessStatus: profile.businessStatus,
    role: profile.role,
    companyName: profile.companyName,
    monthlyExpenses: profile.monthlyExpenses,
    savings: profile.savings,
    workDaysPerWeek: profile.workDaysPerWeek,
    age: profile.age,
    monthlySalary: profile.monthlySalary,
    nbParts: profile.nbParts,
    chargesPro: profile.chargesPro,
    capitalSocial: profile.capitalSocial,
    remunerationType: profile.remunerationType,
    mixtePartSalaire: profile.mixtePartSalaire,

    // Clients
    clients: activeClients.map((c) => ({
      id: c.id,
      name: c.name,
      companyName: c.companyName,
      billing: c.billing,
      dailyRate: c.dailyRate,
      daysPerWeek: c.daysPerWeek,
      daysPerMonth: c.daysPerMonth,
      monthlyAmount: c.monthlyAmount,
      totalAmount: c.totalAmount,
      isActive: c.isActive,
    })),
    caAnnuel: Math.round(totalCA),

    // Facturation
    invoices: {
      total: documents.length,
      unpaid: unpaidInvoices.length,
      unpaidAmount: Math.round(unpaidInvoices.reduce((s, d) => s + d.totalTTC, 0)),
      lateCount: unpaidInvoices.filter((d) => d.status === "late").length,
      paidCount: paidInvoices.length,
      paidAmount: Math.round(paidInvoices.reduce((s, d) => s + d.totalTTC, 0)),
      drafts: documents.filter((d) => d.status === "draft").length,
      devisEnAttente: devis.filter((d) => d.status === "sent").length,
    },

    // Pipeline CRM
    pipeline: {
      totalProspects: activeProspects.length,
      weightedCA: Math.round(pipelineWeighted),
      byStage: {
        leads: activeProspects.filter((p) => p.stage === "lead").length,
        devisEnvoyes: activeProspects.filter((p) => p.stage === "devis_envoye").length,
        signes: activeProspects.filter((p) => p.stage === "signe").length,
        actifs: activeProspects.filter((p) => p.stage === "actif").length,
      },
      perdus: pipeline.prospects.filter((p) => p.stage === "perdu").length,
      prospects: activeProspects.map((p) => ({
        name: p.name,
        company: p.company,
        estimatedCA: p.estimatedCA,
        probability: p.probability,
        stage: p.stage,
        expectedClose: p.expectedClose,
      })),
    },

    // Trésorerie / Paiements
    tresorerie: {
      year: currentYear,
      totalReceived: Math.round(totalReceived),
      totalPending: Math.round(totalPending),
      latePayments: latePayments.length,
      lateAmount: Math.round(latePayments.reduce((s, p) => s + (p.expected - p.received), 0)),
    },

    // Suivi temps (mois en cours)
    workLog: {
      currentMonth: monthPrefix,
      hoursThisMonth: Math.round(hoursThisMonth * 10) / 10,
      hoursByClient: hoursByClientNamed,
      streak: workLog.currentStreak,
    },

    // Holding
    holding: holdingContext,
  };
}
