import type { BusinessStatus } from "@/types";
import { BUSINESS_STATUS_CONFIG } from "@/lib/constants";

export type DeadlineCategory = "urssaf" | "tva" | "is" | "ir" | "admin";

export interface FiscalDeadline {
  month: number;
  day: number;
  label: string;
  category: DeadlineCategory;
  statuses: BusinessStatus[];
  estimateAmount?: (annualCA: number, status: BusinessStatus) => number;
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
const isRate = (s: BusinessStatus) => BUSINESS_STATUS_CONFIG[s].is;

const TVA_RATE = 0.20;
const CFE_ESTIMATE = 750;

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
    estimateAmount: (ca, s) => ca * rate(s) / 4 },
  { month: 4, day: 5, label: "Appel provisionnel URSSAF T2", category: "urssaf",
    statuses: ["ei", "eurl_ir", "eurl_is"],
    estimateAmount: (ca, s) => ca * rate(s) / 4 },
  { month: 7, day: 5, label: "Appel provisionnel URSSAF T3", category: "urssaf",
    statuses: ["ei", "eurl_ir", "eurl_is"],
    estimateAmount: (ca, s) => ca * rate(s) / 4 },
  { month: 10, day: 5, label: "Appel provisionnel URSSAF T4", category: "urssaf",
    statuses: ["ei", "eurl_ir", "eurl_is"],
    estimateAmount: (ca, s) => ca * rate(s) / 4 },

  // SASU: bulletin de paie + charges mensuelles
  ...Array.from({ length: 12 }, (_, i): FiscalDeadline => ({
    month: i, day: 15, label: "Bulletin de paie + charges sociales", category: "urssaf",
    statuses: ["sasu_ir", "sasu_is"],
    estimateAmount: (ca, s) => ca * rate(s) / 12,
  })),

  // TVA: declaration mensuelle (non-micro)
  ...Array.from({ length: 12 }, (_, i): FiscalDeadline => ({
    month: i, day: 19, label: "Declaration TVA", category: "tva",
    statuses: ["ei", "eurl_ir", "eurl_is", "sasu_ir", "sasu_is"],
    estimateAmount: (ca) => ca * TVA_RATE / 12,
    note: "TVA collectee - TVA deductible",
  })),

  // IS acomptes
  { month: 2, day: 15, label: "Acompte IS T1", category: "is",
    statuses: ["eurl_is", "sasu_is"],
    estimateAmount: (ca, s) => ca * isRate(s) / 4 },
  { month: 5, day: 15, label: "Acompte IS T2", category: "is",
    statuses: ["eurl_is", "sasu_is"],
    estimateAmount: (ca, s) => ca * isRate(s) / 4 },
  { month: 8, day: 15, label: "Acompte IS T3", category: "is",
    statuses: ["eurl_is", "sasu_is"],
    estimateAmount: (ca, s) => ca * isRate(s) / 4 },
  { month: 11, day: 15, label: "Acompte IS T4", category: "is",
    statuses: ["eurl_is", "sasu_is"],
    estimateAmount: (ca, s) => ca * isRate(s) / 4 },

  // IR
  { month: 4, day: 25, label: "Declaration de revenus IR", category: "ir",
    statuses: ["micro", "ei", "eurl_ir", "eurl_is", "sasu_ir", "sasu_is", "portage"],
    estimateAmount: (ca, s) => {
      if (s === "micro") return ca * irRate(s);
      return ca * (1 - rate(s)) * irRate(s);
    },
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
