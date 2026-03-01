import type { BusinessStatus, FreelanceProfile, RemunerationType } from "@/types";
import { computeNetFromCA } from "./simulation-engine";
import { BUSINESS_STATUS_CONFIG } from "./constants";

/* ════════════════════════════════════════════════
   Types
   ════════════════════════════════════════════════ */

export interface PatrimoineYear {
  year: number;
  capitalStart: number;
  invested: number;
  returns: number;
  capitalEnd: number;
}

export interface StatusWealth {
  status: BusinessStatus;
  label: string;
  color: string;
  annualNet: number;
  annualSurplus: number;
  monthlySurplus: number;
  wealth10y: number;
  wealth20y: number;
  ineligible?: boolean;
  ineligibleReason?: string;
}

export interface Milestone {
  label: string;
  targetAmount: number;
  monthsToReach: number | null;
  reached: boolean;
}

export type RiskProfile = "prudent" | "equilibre" | "dynamique";

export const RISK_PROFILES: Record<RiskProfile, { label: string; rate: number; color: string }> = {
  prudent:   { label: "Prudent (2%)",   rate: 0.02, color: "#5682F2" },
  equilibre: { label: "\u00C9quilibr\u00E9 (5%)", rate: 0.05, color: "#10b981" },
  dynamique: { label: "Dynamique (8%)", rate: 0.08, color: "#F4BE7E" },
};

const STATUTS: BusinessStatus[] = ["micro", "ei", "eurl_ir", "eurl_is", "sasu_ir", "sasu_is", "portage"];

/** Plafond CA micro-entreprise BNC */
const MICRO_PLAFOND = 77700;

const STATUT_COLORS: Record<BusinessStatus, string> = {
  micro: "#F4BE7E",
  ei: "#f97316",
  eurl_ir: "#5682F2",
  eurl_is: "#a78bfa",
  sasu_ir: "#f87171",
  sasu_is: "#4ade80",
  portage: "#06b6d4",
};

/* ════════════════════════════════════════════════
   Calculs
   ════════════════════════════════════════════════ */

/**
 * Future Value : capital initial + versements mensuels avec interets composes.
 * FV = PV * (1+r)^n + PMT * ((1+r)^n - 1) / r
 */
export function computeFutureValue(
  startingCapital: number,
  monthlyInvestment: number,
  monthlyRate: number,
  months: number,
): number {
  if (months <= 0) return startingCapital;
  if (monthlyRate === 0) return startingCapital + monthlyInvestment * months;
  const factor = Math.pow(1 + monthlyRate, months);
  return startingCapital * factor + monthlyInvestment * ((factor - 1) / monthlyRate);
}

/**
 * Calcule le surplus investissable pour un CA donne et un statut (optionnel override).
 */
export function computeSurplus(
  annualCA: number,
  profile: FreelanceProfile,
  statusOverride?: BusinessStatus,
): { annualNet: number; annualExpenses: number; annualSurplus: number; monthlySurplus: number } {
  const profileForStatus: FreelanceProfile = statusOverride
    ? { ...profile, businessStatus: statusOverride }
    : profile;

  const annualNet = computeNetFromCA(annualCA, profileForStatus);
  const annualExpenses = profile.monthlyExpenses * 12;
  const annualSurplus = annualNet - annualExpenses;
  return {
    annualNet: Math.round(annualNet),
    annualExpenses,
    annualSurplus: Math.round(annualSurplus),
    monthlySurplus: Math.round(annualSurplus / 12),
  };
}

/**
 * Projette le patrimoine annee par annee avec interets composes.
 */
export function projectWealth(
  startingCapital: number,
  monthlySurplus: number,
  investmentRate: number,
  annualReturn: number,
  years: number,
): PatrimoineYear[] {
  const monthlyRate = annualReturn / 12;
  const monthlyInvestment = Math.max(0, monthlySurplus * investmentRate);
  const result: PatrimoineYear[] = [];

  let capital = startingCapital;

  for (let y = 0; y <= years; y++) {
    if (y === 0) {
      result.push({
        year: y,
        capitalStart: Math.round(capital),
        invested: 0,
        returns: 0,
        capitalEnd: Math.round(capital),
      });
      continue;
    }

    const capitalStart = capital;
    const capitalEnd = computeFutureValue(capital, monthlyInvestment, monthlyRate, 12);
    const invested = monthlyInvestment * 12;
    const returns = capitalEnd - capitalStart - invested;

    result.push({
      year: y,
      capitalStart: Math.round(capitalStart),
      invested: Math.round(invested),
      returns: Math.round(returns),
      capitalEnd: Math.round(capitalEnd),
    });

    capital = capitalEnd;
  }

  return result;
}

/**
 * Compare les 7 statuts pour la construction patrimoniale.
 */
export function computeAllStatusWealth(
  annualCA: number,
  profile: FreelanceProfile,
  startingCapital: number,
  investmentRate: number,
  annualReturn: number,
): StatusWealth[] {
  return STATUTS.map((status) => {
    const { annualNet, annualSurplus, monthlySurplus } = computeSurplus(annualCA, profile, status);
    const monthlyInvestment = Math.max(0, monthlySurplus * investmentRate);
    const monthlyRate = annualReturn / 12;

    const wealth10y = computeFutureValue(startingCapital, monthlyInvestment, monthlyRate, 120);
    const wealth20y = computeFutureValue(startingCapital, monthlyInvestment, monthlyRate, 240);

    const ineligible = status === "micro" && annualCA > MICRO_PLAFOND;

    return {
      status,
      label: BUSINESS_STATUS_CONFIG[status].label,
      color: STATUT_COLORS[status],
      annualNet,
      annualSurplus,
      monthlySurplus,
      wealth10y: Math.round(wealth10y),
      wealth20y: Math.round(wealth20y),
      ineligible,
      ineligibleReason: ineligible ? `Plafond micro d\u00E9pass\u00E9 (${MICRO_PLAFOND.toLocaleString("fr-FR")}\u20AC)` : undefined,
    };
  }).sort((a, b) => b.wealth20y - a.wealth20y);
}

/**
 * Calcule les milestones patrimoniaux : combien de mois pour atteindre chaque objectif.
 */
export function computeMilestones(
  monthlySurplus: number,
  investmentRate: number,
  startingCapital: number,
  monthlyExpenses: number,
  annualReturn: number,
): Milestone[] {
  const monthlyInvestment = monthlySurplus * investmentRate;
  const monthlyRate = annualReturn / 12;

  const targets: { label: string; amount: number }[] = [
    { label: "6 mois de tr\u00E9sorerie", amount: monthlyExpenses * 6 },
    { label: "1 an de s\u00E9curit\u00E9", amount: monthlyExpenses * 12 },
    { label: "100 000\u20AC de patrimoine", amount: 100_000 },
    { label: "Ind\u00E9pendance financi\u00E8re", amount: monthlyExpenses * 12 * 25 }, // 4% rule
  ];

  return targets.map(({ label, amount }) => {
    if (startingCapital >= amount) {
      return { label, targetAmount: Math.round(amount), monthsToReach: 0, reached: true };
    }

    if (monthlyInvestment <= 0) {
      // Pas d'investissement : verifier si les rendements seuls suffisent
      if (monthlyRate <= 0) {
        return { label, targetAmount: Math.round(amount), monthsToReach: null, reached: false };
      }
      // Temps pour que le capital seul atteigne le target
      const months = Math.ceil(Math.log(amount / startingCapital) / Math.log(1 + monthlyRate));
      if (months > 600 || !isFinite(months)) {
        return { label, targetAmount: Math.round(amount), monthsToReach: null, reached: false };
      }
      return { label, targetAmount: Math.round(amount), monthsToReach: months, reached: false };
    }

    // Recherche iterative : combien de mois pour FV >= target
    // Borne max 600 mois (50 ans)
    for (let m = 1; m <= 600; m++) {
      const fv = computeFutureValue(startingCapital, monthlyInvestment, monthlyRate, m);
      if (fv >= amount) {
        return { label, targetAmount: Math.round(amount), monthsToReach: m, reached: false };
      }
    }

    return { label, targetAmount: Math.round(amount), monthsToReach: null, reached: false };
  });
}

/* ════════════════════════════════════════════════
   Vehicules d'investissement (data pure)
   ════════════════════════════════════════════════ */

export interface VehicleCategory {
  category: string;
  statuses: BusinessStatus[];
  color: string;
  vehicles: { name: string; desc: string }[];
}

export const INVESTMENT_VEHICLES: VehicleCategory[] = [
  {
    category: "Micro-entreprise",
    statuses: ["micro"],
    color: "#F4BE7E",
    vehicles: [
      { name: "PEA", desc: "Plan \u00C9pargne en Actions, exon\u00E9r\u00E9 apr\u00E8s 5 ans" },
      { name: "Assurance-vie", desc: "Fiscalit\u00E9 all\u00E9g\u00E9e apr\u00E8s 8 ans" },
      { name: "SCPI (perso)", desc: "Immobilier en parts, revenus fonciers" },
      { name: "Livrets r\u00E9glement\u00E9s", desc: "Livret A, LDDS — sans risque, liquid" },
    ],
  },
  {
    category: "EI / EURL \u00E0 l\u2019IR",
    statuses: ["ei", "eurl_ir", "sasu_ir"],
    color: "#5682F2",
    vehicles: [
      { name: "PEA", desc: "Plan \u00C9pargne en Actions" },
      { name: "Assurance-vie", desc: "Fiscalit\u00E9 all\u00E9g\u00E9e apr\u00E8s 8 ans" },
      { name: "SCPI (perso)", desc: "Immobilier en parts" },
      { name: "PER", desc: "D\u00E9ductible du b\u00E9n\u00E9fice imposable" },
    ],
  },
  {
    category: "EURL IS / SASU IS",
    statuses: ["eurl_is", "sasu_is"],
    color: "#a78bfa",
    vehicles: [
      { name: "R\u00E9serves en soci\u00E9t\u00E9", desc: "Capitalisation \u00E0 l\u2019IS 15% (vs IR jusqu\u2019\u00E0 45%)" },
      { name: "Investissement via soci\u00E9t\u00E9", desc: "Achat immobilier, parts SCPI" },
      { name: "SCI", desc: "Soci\u00E9t\u00E9 civile immobili\u00E8re pour l\u2019immo" },
      { name: "PER + PEA + AV", desc: "Tous les v\u00E9hicules personnels aussi" },
    ],
  },
  {
    category: "Holding",
    statuses: [],
    color: "#10b981",
    vehicles: [
      { name: "R\u00E9gime m\u00E8re-fille", desc: "Exon\u00E9ration 95% des dividendes re\u00E7us" },
      { name: "Report d\u2019imposition", desc: "R\u00E9investissement sans fiscalit\u00E9 imm\u00E9diate" },
      { name: "Investissement inter-soci\u00E9t\u00E9s", desc: "Flux optimis\u00E9s entre entit\u00E9s" },
      { name: "Tous v\u00E9hicules perso + soci\u00E9t\u00E9", desc: "Combinaison de toutes les options" },
    ],
  },
];
