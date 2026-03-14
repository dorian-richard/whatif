import type { BusinessStatus, RemunerationType } from "@/types";
import { BUSINESS_STATUS_CONFIG } from "@/lib/constants";
import { computeIS } from "@/lib/simulation-engine";

export type DeadlineCategory = "urssaf" | "tva" | "is" | "ir" | "admin";

/**
 * Contexte de rémunération pour estimer les montants fiscaux.
 * Nécessaire pour les structures IS (EURL IS, SASU IS) où les charges
 * dépendent du mode de rémunération (salaire, dividendes, mixte).
 */
export interface FiscalEstimateContext {
  remunerationType: RemunerationType;
  mixtePartSalaire: number;
}

export interface FiscalDeadline {
  month: number;
  day: number;
  label: string;
  category: DeadlineCategory;
  statuses: BusinessStatus[];
  estimateAmount?: (annualCA: number, status: BusinessStatus, ctx?: FiscalEstimateContext) => number;
  /** When set, uses the month-specific CA instead of annual average (e.g. TVA) */
  estimateFromMonthlyCA?: (monthlyCA: number) => number;
  note?: string;
}

export const CATEGORY_CONFIG: Record<DeadlineCategory, { label: string; color: string }> = {
  urssaf: { label: "URSSAF", color: "#5682F2" },
  tva: { label: "TVA", color: "#f97316" },
  is: { label: "IS", color: "#a78bfa" },
  ir: { label: "IR", color: "#4ade80" },
  admin: { label: "Admin", color: "#8b8b9e" },
};

const rate = (s: BusinessStatus) => BUSINESS_STATUS_CONFIG[s].urssaf;
const irRate = (s: BusinessStatus) => BUSINESS_STATUS_CONFIG[s].ir;

const TVA_RATE = 0.20;
const CFE_ESTIMATE = 750;
const PFU_RATE = 0.30;

/**
 * Calcule la part du CA allouée au salaire pour les structures IS.
 * Retourne 1 (100% du CA) pour les structures IR et micro.
 */
function salaryShare(s: BusinessStatus, ctx?: FiscalEstimateContext): number {
  const isStructure = s === "eurl_is" || s === "sasu_is";
  if (!isStructure || !ctx) return 1;
  if (ctx.remunerationType === "salaire") return 1;
  if (ctx.remunerationType === "dividendes") return 0;
  return (ctx.mixtePartSalaire ?? 50) / 100;
}

/**
 * Calcule les cotisations URSSAF annuelles en tenant compte du mode de rémunération.
 * - Micro/TNS/SASU IR : charges sur le CA total
 * - EURL IS : charges TNS sur la part salaire uniquement
 * - SASU IS : charges salariales sur la part salaire uniquement (0 si 100% dividendes)
 */
function estimateAnnualUrssaf(ca: number, s: BusinessStatus, ctx?: FiscalEstimateContext): number {
  const share = salaryShare(s, ctx);
  return ca * share * rate(s);
}

/**
 * Calcule l'IS annuel avec les tranches progressives.
 * - Profit = CA - part salaire (le salaire est déductible du bénéfice IS)
 * - IS 15% jusqu'à 42 500€, 25% au-delà
 */
function estimateAnnualIS(ca: number, s: BusinessStatus, ctx?: FiscalEstimateContext): number {
  const share = salaryShare(s, ctx);
  const profit = Math.max(0, ca * (1 - share));
  return computeIS(profit);
}

/**
 * Calcule l'IR annuel estimé.
 * - Micro : taux forfaitaire sur le CA
 * - IR structures : IR sur le net après URSSAF
 * - IS structures salaire : IR sur le net après charges sociales
 * - IS structures dividendes SASU : PFU 30% (inclut IR 12.8%)
 * - IS structures dividendes EURL : charges TNS + IR sur dividendes
 * - IS mixte : IR sur salaire + taxation dividendes
 */
function estimateAnnualIR(ca: number, s: BusinessStatus, ctx?: FiscalEstimateContext): number {
  if (s === "micro") return ca * irRate(s);

  const isStructure = s === "eurl_is" || s === "sasu_is";
  const isSASU = s === "sasu_is";

  if (!isStructure) {
    // IR structures : IR sur net après URSSAF
    return ca * (1 - rate(s)) * irRate(s);
  }

  // --- IS structures ---
  const remType = ctx?.remunerationType ?? "salaire";
  const share = salaryShare(s, ctx);

  // Part salaire → IR sur net après charges
  const salaryCost = ca * share;
  const salaryIR = salaryCost * (1 - rate(s)) * irRate(s);

  // Part dividendes → IS puis taxation
  const profit = Math.max(0, ca * (1 - share));
  const isAmount = computeIS(profit);
  const afterIS = profit - isAmount;

  let divIR: number;
  if (isSASU) {
    // PFU 30% flat (inclut IR 12.8% + prélèvements sociaux 17.2%)
    divIR = afterIS * PFU_RATE;
  } else {
    // EURL : charges TNS sur dividendes + IR
    const divAfterUrssaf = afterIS * (1 - rate(s));
    divIR = divAfterUrssaf * irRate(s);
  }

  if (remType === "salaire") return salaryIR;
  if (remType === "dividendes") return divIR;
  return salaryIR + divIR;
}

export const DEADLINES: FiscalDeadline[] = [
  // MICRO: URSSAF quarterly
  { month: 0, day: 31, label: "Declaration CA T4 (N-1)", category: "urssaf", statuses: ["micro"],
    estimateAmount: (ca, s) => ca * rate(s) / 4 },
  { month: 3, day: 30, label: "Declaration CA T1", category: "urssaf", statuses: ["micro"],
    estimateAmount: (ca, s) => ca * rate(s) / 4 },
  { month: 6, day: 31, label: "Declaration CA T2", category: "urssaf", statuses: ["micro"],
    estimateAmount: (ca, s) => ca * rate(s) / 4 },
  { month: 9, day: 31, label: "Declaration CA T3", category: "urssaf", statuses: ["micro"],
    estimateAmount: (ca, s) => ca * rate(s) / 4 },

  // TNS: URSSAF quarterly (EI, EURL IR, EURL IS)
  { month: 1, day: 5, label: "Appel provisionnel URSSAF T1", category: "urssaf",
    statuses: ["ei", "eurl_ir", "eurl_is"],
    estimateAmount: (ca, s, ctx) => estimateAnnualUrssaf(ca, s, ctx) / 4 },
  { month: 4, day: 5, label: "Appel provisionnel URSSAF T2", category: "urssaf",
    statuses: ["ei", "eurl_ir", "eurl_is"],
    estimateAmount: (ca, s, ctx) => estimateAnnualUrssaf(ca, s, ctx) / 4 },
  { month: 7, day: 5, label: "Appel provisionnel URSSAF T3", category: "urssaf",
    statuses: ["ei", "eurl_ir", "eurl_is"],
    estimateAmount: (ca, s, ctx) => estimateAnnualUrssaf(ca, s, ctx) / 4 },
  { month: 10, day: 5, label: "Appel provisionnel URSSAF T4", category: "urssaf",
    statuses: ["ei", "eurl_ir", "eurl_is"],
    estimateAmount: (ca, s, ctx) => estimateAnnualUrssaf(ca, s, ctx) / 4 },

  // SASU: bulletin de paie + charges mensuelles
  ...Array.from({ length: 12 }, (_, i): FiscalDeadline => ({
    month: i, day: 15, label: "Bulletin de paie + charges sociales", category: "urssaf",
    statuses: ["sasu_ir", "sasu_is"],
    estimateAmount: (ca, s, ctx) => estimateAnnualUrssaf(ca, s, ctx) / 12,
  })),

  // TVA: declaration mensuelle (non-micro) — uses actual monthly CA, not annual average
  ...Array.from({ length: 12 }, (_, i): FiscalDeadline => ({
    month: i, day: 19, label: "Declaration TVA", category: "tva",
    statuses: ["ei", "eurl_ir", "eurl_is", "sasu_ir", "sasu_is"],
    estimateAmount: (ca) => ca * TVA_RATE / 12,
    estimateFromMonthlyCA: (monthlyCA) => monthlyCA * TVA_RATE,
    note: "TVA collectee - TVA deductible",
  })),

  // IS acomptes (progressive brackets)
  { month: 2, day: 15, label: "Acompte IS T1", category: "is",
    statuses: ["eurl_is", "sasu_is"],
    estimateAmount: (ca, s, ctx) => estimateAnnualIS(ca, s, ctx) / 4 },
  { month: 5, day: 15, label: "Acompte IS T2", category: "is",
    statuses: ["eurl_is", "sasu_is"],
    estimateAmount: (ca, s, ctx) => estimateAnnualIS(ca, s, ctx) / 4 },
  { month: 8, day: 15, label: "Acompte IS T3", category: "is",
    statuses: ["eurl_is", "sasu_is"],
    estimateAmount: (ca, s, ctx) => estimateAnnualIS(ca, s, ctx) / 4 },
  { month: 11, day: 15, label: "Acompte IS T4", category: "is",
    statuses: ["eurl_is", "sasu_is"],
    estimateAmount: (ca, s, ctx) => estimateAnnualIS(ca, s, ctx) / 4 },

  // IR
  { month: 4, day: 25, label: "Declaration de revenus IR", category: "ir",
    statuses: ["micro", "ei", "eurl_ir", "eurl_is", "sasu_ir", "sasu_is", "portage"],
    estimateAmount: (ca, s, ctx) => estimateAnnualIR(ca, s, ctx),
    note: "Solde IR annuel" },

  // Admin
  { month: 4, day: 15, label: "Liasse fiscale (2065 / 2035)", category: "admin",
    statuses: ["ei", "eurl_ir", "eurl_is", "sasu_ir", "sasu_is"] },
  { month: 5, day: 30, label: "AG (approbation des comptes)", category: "admin",
    statuses: ["eurl_ir", "eurl_is", "sasu_ir", "sasu_is"] },
  { month: 11, day: 15, label: "CFE (Cotisation Fonciere)", category: "admin",
    statuses: ["micro", "ei", "eurl_ir", "eurl_is", "sasu_ir", "sasu_is"],
    estimateAmount: () => CFE_ESTIMATE,
    note: "Exonere la 1ere annee" },
];

/**
 * Returns deadlines happening within the next `daysAhead` days for a given status.
 */
export function getUpcomingDeadlines(
  status: BusinessStatus,
  daysAhead: number = 7
): (FiscalDeadline & { date: Date })[] {
  const now = new Date();
  const year = now.getFullYear();
  const upcoming: (FiscalDeadline & { date: Date })[] = [];

  for (const d of DEADLINES) {
    if (!d.statuses.includes(status)) continue;
    const maxDay = new Date(year, d.month + 1, 0).getDate();
    const day = Math.min(d.day, maxDay);
    const date = new Date(year, d.month, day);

    const diff = (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    if (diff >= 0 && diff <= daysAhead) {
      upcoming.push({ ...d, date });
    }
  }

  upcoming.sort((a, b) => a.date.getTime() - b.date.getTime());
  return upcoming;
}
