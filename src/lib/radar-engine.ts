import type { FreelanceProfile, ClientData, BusinessStatus } from "@/types";
import { getAnnualCA, getClientBaseCA, getClientMonthlyCA, computeNetFromCA } from "./simulation-engine";
import { BUSINESS_STATUS_CONFIG, SEASONALITY } from "./constants";
import { computeSurplus, computeFutureValue } from "./patrimoine-engine";

/* ════════════════════════════════════════════════
   Types
   ════════════════════════════════════════════════ */

export type Verdict = "bon" | "ok" | "attention" | "risque";

export type RadarAxisKey = "revenus" | "fiscalite" | "tresorerie" | "patrimoine" | "retraite" | "risque";

export interface RadarAxis {
  key: RadarAxisKey;
  label: string;
  score: number;
  verdict: Verdict;
  detail: string;
  recommendation: string;
}

export type Meteo = "soleil" | "beau" | "variable" | "orageux";

export interface RadarResult {
  globalScore: number;
  axes: RadarAxis[];
  meteo: Meteo;
}

/* ════════════════════════════════════════════════
   Helpers
   ════════════════════════════════════════════════ */

function getVerdict(score: number): Verdict {
  if (score >= 80) return "bon";
  if (score >= 60) return "ok";
  if (score >= 40) return "attention";
  return "risque";
}

function getMeteo(score: number): Meteo {
  if (score >= 80) return "soleil";
  if (score >= 60) return "beau";
  if (score >= 40) return "variable";
  return "orageux";
}

function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, v));
}

function fmt(n: number): string {
  return Math.round(n).toLocaleString("fr-FR");
}

/** Plafond CA micro-entreprise BNC */
const MICRO_PLAFOND = 77700;

/** Retraite constants (mirrored from retraite/page.tsx) */
const TRIMESTRE_THRESHOLD = 1747;
const PLAFOND_SS = 46368;
const ABATTEMENT_MICRO = 0.34;
const PENSION_RATE = 0.50;
const RETRAITE_RATE_TNS = 0.17;
const RETRAITE_RATE_SALARIE = 0.15;

const ALL_STATUSES: BusinessStatus[] = ["micro", "ei", "eurl_ir", "eurl_is", "sasu_ir", "sasu_is", "portage"];

/* ════════════════════════════════════════════════
   Axe 1 : Revenus (poids 25%)
   ════════════════════════════════════════════════ */

function scoreRevenus(
  clients: ClientData[],
  annualCA: number,
  profile: FreelanceProfile,
): RadarAxis {
  if (annualCA <= 0) {
    return {
      key: "revenus",
      label: "Revenus",
      score: 0,
      verdict: "risque",
      detail: "Aucun CA déclaré",
      recommendation: "Ajoute au moins un client pour commencer.",
    };
  }

  const clientCAs = clients.filter((c) => c.isActive !== false).map((c) => getClientBaseCA(c));
  const totalMonthly = clientCAs.reduce((s, v) => s + v, 0);

  // Recurring revenue % (TJM + forfait = recurring)
  const recurringCA = clients
    .filter((c) => c.isActive !== false && (c.billing === "tjm" || c.billing === "forfait"))
    .reduce((s, c) => s + getClientBaseCA(c), 0);
  const recurringPct = totalMonthly > 0 ? recurringCA / totalMonthly : 0;
  const recurringScore = clamp(recurringPct * 100 * 1.25); // 80% recurring = 100

  // Seasonal variance: low std dev = good
  const monthlyRevs: number[] = [];
  for (let m = 0; m < 12; m++) {
    let mCA = 0;
    for (const c of clients) {
      mCA += getClientMonthlyCA(c, m, SEASONALITY[m], 0);
    }
    monthlyRevs.push(mCA);
  }
  const avgMonth = monthlyRevs.reduce((a, b) => a + b, 0) / 12;
  const variance = monthlyRevs.reduce((s, v) => s + (v - avgMonth) ** 2, 0) / 12;
  const cv = avgMonth > 0 ? Math.sqrt(variance) / avgMonth : 1; // coefficient of variation
  const stabilityScore = clamp(100 - cv * 300); // cv 0.33 → 0

  // Utilization: days billed vs available
  const totalDaysPerWeek = clients
    .filter((c) => c.isActive !== false && c.billing === "tjm")
    .reduce((s, c) => s + (c.daysPerWeek ?? 0), 0);
  const utilizationPct = profile.workDaysPerWeek > 0
    ? Math.min(1, totalDaysPerWeek / profile.workDaysPerWeek)
    : 0;
  const utilizationScore = clamp(utilizationPct * 100);

  const score = Math.round(recurringScore * 0.4 + stabilityScore * 0.3 + utilizationScore * 0.3);
  const nbClients = clients.filter((c) => c.isActive !== false).length;

  let detail = `${nbClients} client${nbClients > 1 ? "s" : ""}, ${Math.round(recurringPct * 100)}% récurrent`;
  if (totalDaysPerWeek > 0) detail += `, ${totalDaysPerWeek}j/sem`;

  let recommendation: string;
  if (recurringPct < 0.5) {
    recommendation = "Privilégie les contrats récurrents (TJM/forfait) pour stabiliser tes revenus.";
  } else if (utilizationPct < 0.7) {
    recommendation = "Tu as de la capacité disponible — prospecte pour un nouveau client.";
  } else if (score >= 80) {
    recommendation = "Tes revenus sont bien structurés et stables.";
  } else {
    recommendation = "Diversifie tes sources de revenus pour plus de stabilité.";
  }

  return { key: "revenus", label: "Revenus", score, verdict: getVerdict(score), detail, recommendation };
}

/* ════════════════════════════════════════════════
   Axe 2 : Fiscalité (poids 20%)
   ════════════════════════════════════════════════ */

function scoreFiscalite(
  annualCA: number,
  profile: FreelanceProfile,
): RadarAxis {
  if (annualCA <= 0) {
    return {
      key: "fiscalite",
      label: "Fiscalité",
      score: 50,
      verdict: "ok",
      detail: "Pas de CA pour comparer",
      recommendation: "Ajoute tes clients pour analyser ton optimisation fiscale.",
    };
  }

  const currentNet = computeNetFromCA(annualCA, profile);

  // Find best eligible status
  let bestNet = currentNet;
  let bestStatus: BusinessStatus = profile.businessStatus;

  for (const status of ALL_STATUSES) {
    if (status === "micro" && annualCA > MICRO_PLAFOND) continue;
    const testProfile: FreelanceProfile = { ...profile, businessStatus: status };
    const net = computeNetFromCA(annualCA, testProfile);
    if (net > bestNet) {
      bestNet = net;
      bestStatus = status;
    }
  }

  const gap = bestNet > 0 ? (bestNet - currentNet) / bestNet : 0;
  let score: number;
  if (gap < 0.05) score = 100;
  else if (gap < 0.15) score = 70;
  else if (gap < 0.30) score = 40;
  else score = 20;

  const currentLabel = BUSINESS_STATUS_CONFIG[profile.businessStatus].label;
  const annualDiff = Math.round(bestNet - currentNet);

  let detail: string;
  let recommendation: string;

  if (bestStatus === profile.businessStatus || annualDiff < 500) {
    detail = `${currentLabel} — statut optimal`;
    recommendation = "Ton statut est bien optimisé pour ton CA actuel.";
  } else {
    const bestLabel = BUSINESS_STATUS_CONFIG[bestStatus].label;
    detail = `${currentLabel} → ${bestLabel} : +${fmt(annualDiff)}\u20AC/an`;
    recommendation = `Passe en ${bestLabel} pour économiser ${fmt(annualDiff)}\u20AC/an net.`;
  }

  return { key: "fiscalite", label: "Fiscalité", score, verdict: getVerdict(score), detail, recommendation };
}

/* ════════════════════════════════════════════════
   Axe 3 : Trésorerie (poids 20%)
   ════════════════════════════════════════════════ */

function scoreTresorerie(profile: FreelanceProfile): RadarAxis {
  const { savings, monthlyExpenses } = profile;
  const runway = monthlyExpenses > 0 ? savings / monthlyExpenses : 0;

  let score: number;
  if (runway >= 6) score = 100;
  else if (runway >= 3) score = 40 + (runway - 3) * 20; // 3→40, 6→100
  else if (runway >= 1) score = 15 + (runway - 1) * 12.5; // 1→15, 3→40
  else score = clamp(runway * 15); // 0→0, 1→15

  const detail = `${runway.toFixed(1)} mois de trésorerie (${fmt(savings)}\u20AC)`;

  let recommendation: string;
  if (runway >= 6) {
    recommendation = "Ta trésorerie est solide — 6+ mois de sécurité.";
  } else if (runway >= 3) {
    recommendation = `Vise 6 mois de réserve, il te manque ${fmt(monthlyExpenses * 6 - savings)}\u20AC.`;
  } else {
    recommendation = `Priorité : constitue un matelas de ${fmt(monthlyExpenses * 6)}\u20AC (6 mois).`;
  }

  return { key: "tresorerie", label: "Trésorerie", score: Math.round(score), verdict: getVerdict(score), detail, recommendation };
}

/* ════════════════════════════════════════════════
   Axe 4 : Patrimoine (poids 15%)
   ════════════════════════════════════════════════ */

function scorePatrimoine(
  annualCA: number,
  profile: FreelanceProfile,
): RadarAxis {
  const { annualSurplus, monthlySurplus } = computeSurplus(annualCA, profile);
  const { savings } = profile;

  // Sub-scores
  const surplusScore = monthlySurplus > 0 ? clamp(Math.min(monthlySurplus / 3000, 1) * 100) : 0; // 3000€/mois surplus = max
  const savingsScore = clamp((savings / 100_000) * 100); // 100k€ = max
  const hasCapital = savings > 0 ? 30 : 0;

  const score = Math.round(surplusScore * 0.4 + hasCapital + savingsScore * 0.3);

  // Project 10y wealth with 5% return, 80% invested
  const wealth10y = computeFutureValue(savings, Math.max(0, monthlySurplus * 0.8), 0.05 / 12, 120);

  const detail = monthlySurplus > 0
    ? `Surplus : ${fmt(monthlySurplus)}\u20AC/mois \u00B7 Projection 10 ans : ${fmt(wealth10y)}\u20AC`
    : `Surplus négatif (${fmt(monthlySurplus)}\u20AC/mois) \u00B7 Épargne : ${fmt(savings)}\u20AC`;

  let recommendation: string;
  if (monthlySurplus <= 0) {
    recommendation = "Réduis tes charges ou augmente ton CA pour dégager un surplus investissable.";
  } else if (savings < 10_000) {
    recommendation = `Investis ton surplus de ${fmt(monthlySurplus)}\u20AC/mois dès que ta trésorerie de sécurité est constituée.`;
  } else if (score >= 80) {
    recommendation = "Tu construis ton patrimoine efficacement, continue sur cette lancée.";
  } else {
    recommendation = `Investis ${fmt(monthlySurplus)}\u20AC/mois sur un PEA ou assurance-vie pour accélérer.`;
  }

  return { key: "patrimoine", label: "Patrimoine", score, verdict: getVerdict(score), detail, recommendation };
}

/* ════════════════════════════════════════════════
   Axe 5 : Retraite (poids 10%)
   ════════════════════════════════════════════════ */

function getRevenuCotise(annualCA: number, status: BusinessStatus): number {
  if (status === "micro") return annualCA * (1 - ABATTEMENT_MICRO);
  if (status === "ei" || status === "eurl_ir" || status === "eurl_is") {
    return annualCA * (1 - BUSINESS_STATUS_CONFIG[status].urssaf);
  }
  return annualCA * 0.55;
}

function scoreRetraite(
  annualCA: number,
  profile: FreelanceProfile,
): RadarAxis {
  const revenuCotise = getRevenuCotise(annualCA, profile.businessStatus);
  const trimestres = Math.min(4, Math.floor(revenuCotise / TRIMESTRE_THRESHOLD));
  const trimestresScore = clamp((trimestres / 4) * 100); // 4 trimestres = 100

  const isSalarie = profile.businessStatus === "sasu_ir" || profile.businessStatus === "sasu_is" || profile.businessStatus === "portage";
  const salaireMoyen = Math.min(revenuCotise, PLAFOND_SS);
  const pensionBase = salaireMoyen * PENSION_RATE / 12;
  const pensionMensuelle = isSalarie ? pensionBase * 1.10 : pensionBase;

  const coverageRatio = profile.monthlyExpenses > 0 ? pensionMensuelle / profile.monthlyExpenses : 0;
  const coverageScore = clamp(coverageRatio * 100); // 100% coverage = 100

  const score = Math.round(trimestresScore * 0.5 + coverageScore * 0.5);

  const detail = `${trimestres}/4 trimestres validés \u00B7 Pension estimée : ${fmt(pensionMensuelle)}\u20AC/mois`;

  let recommendation: string;
  if (trimestres < 4) {
    const minCA = Math.ceil((TRIMESTRE_THRESHOLD * 4) / (1 - (profile.businessStatus === "micro" ? ABATTEMENT_MICRO : BUSINESS_STATUS_CONFIG[profile.businessStatus].urssaf)));
    recommendation = `Tu ne valides que ${trimestres} trimestres/an. Vise ${fmt(minCA)}\u20AC de CA minimum.`;
  } else if (coverageRatio < 0.4) {
    recommendation = "Ta pension couvrira moins de 40% de tes charges. Complète avec un PER ou assurance-vie.";
  } else if (score >= 80) {
    recommendation = "Tes droits retraite se constituent bien. Complète avec de l'épargne long terme.";
  } else {
    recommendation = "Ouvre un PER pour déduire de ton revenu imposable et compléter ta retraite.";
  }

  return { key: "retraite", label: "Retraite", score, verdict: getVerdict(score), detail, recommendation };
}

/* ════════════════════════════════════════════════
   Axe 6 : Risque (poids 10%)
   ════════════════════════════════════════════════ */

function scoreRisque(clients: ClientData[]): RadarAxis {
  const activeClients = clients.filter((c) => c.isActive !== false);
  const nbClients = activeClients.length;

  if (nbClients === 0) {
    return {
      key: "risque",
      label: "Risque",
      score: 0,
      verdict: "risque",
      detail: "Aucun client actif",
      recommendation: "Sans client, ton risque financier est maximal.",
    };
  }

  const clientCAs = activeClients.map((c) => getClientBaseCA(c));
  const totalCA = clientCAs.reduce((s, v) => s + v, 0);
  const maxCA = Math.max(...clientCAs);
  const dependencyPct = totalCA > 0 ? maxCA / totalCA : 1;

  // Dependency score (lower dependency = better)
  let dependencyScore: number;
  if (dependencyPct <= 0.30) dependencyScore = 100;
  else if (dependencyPct <= 0.50) dependencyScore = 60;
  else if (dependencyPct <= 0.70) dependencyScore = 30;
  else dependencyScore = 10;

  // Client count bonus
  const countBonus = nbClients >= 3 ? 20 : nbClients >= 2 ? 10 : 0;

  // Billing mix: having different types is better
  const billingTypes = new Set(activeClients.map((c) => c.billing));
  const mixBonus = billingTypes.size >= 3 ? 20 : billingTypes.size >= 2 ? 10 : 0;

  const score = clamp(Math.round(dependencyScore * 0.6 + countBonus + mixBonus));

  const topClient = activeClients.reduce((a, b) => getClientBaseCA(a) > getClientBaseCA(b) ? a : b);
  const detail = `${nbClients} client${nbClients > 1 ? "s" : ""} \u00B7 Dépendance max : ${Math.round(dependencyPct * 100)}% (${topClient.name})`;

  let recommendation: string;
  if (dependencyPct > 0.50) {
    recommendation = `Réduis ta dépendance à ${topClient.name} (${Math.round(dependencyPct * 100)}% du CA). Prospecte un nouveau client.`;
  } else if (nbClients < 3) {
    recommendation = "Vise 3 clients minimum pour une meilleure résilience.";
  } else if (score >= 80) {
    recommendation = "Bonne diversification clients — ton risque est bien maîtrisé.";
  } else {
    recommendation = "Diversifie tes types de contrats (TJM + forfait) pour lisser le risque.";
  }

  return { key: "risque", label: "Risque", score, verdict: getVerdict(score), detail, recommendation };
}

/* ════════════════════════════════════════════════
   Fonction principale
   ════════════════════════════════════════════════ */

const WEIGHTS: Record<RadarAxisKey, number> = {
  revenus: 0.25,
  fiscalite: 0.20,
  tresorerie: 0.20,
  patrimoine: 0.15,
  retraite: 0.10,
  risque: 0.10,
};

export function computeRadar(
  profile: FreelanceProfile,
  clients: ClientData[],
  vacationDaysPerMonth?: number[],
): RadarResult {
  const annualCA = getAnnualCA(clients, vacationDaysPerMonth);

  const axes: RadarAxis[] = [
    scoreRevenus(clients, annualCA, profile),
    scoreFiscalite(annualCA, profile),
    scoreTresorerie(profile),
    scorePatrimoine(annualCA, profile),
    scoreRetraite(annualCA, profile),
    scoreRisque(clients),
  ];

  const globalScore = Math.round(
    axes.reduce((s, a) => s + a.score * WEIGHTS[a.key], 0),
  );

  return {
    globalScore,
    axes,
    meteo: getMeteo(globalScore),
  };
}
