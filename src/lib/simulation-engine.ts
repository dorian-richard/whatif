import type { ClientData, SimulationParams, ProjectionResult, FreelanceProfile, BusinessStatus, RemunerationType } from "@/types";
import { SEASONALITY, BUSINESS_STATUS_CONFIG, PFU_RATE, ABATTEMENT_FRAIS_PRO, PUMA_RATE, PUMA_SEUIL_ACTIVITE, PUMA_DEDUCTIBLE_CAPITAL } from "./constants";

/**
 * Calcule les jours ouvres (lun-ven) pour chaque mois de l'annee donnee.
 */
function computeBusinessDays(year: number): number[] {
  const result: number[] = [];
  for (let m = 0; m < 12; m++) {
    let count = 0;
    const daysInMonth = new Date(year, m + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const dow = new Date(year, m, d).getDay();
      if (dow !== 0 && dow !== 6) count++;
    }
    result.push(count);
  }
  return result;
}

/** Jours ouvres par mois pour l'annee en cours */
export const JOURS_OUVRES = computeBusinessDays(new Date().getFullYear());

/** Moyenne des jours ouvres par mois (~21.75) */
export const AVG_JOURS_OUVRES = JOURS_OUVRES.reduce((a, b) => a + b, 0) / 12;

/**
 * Calcule le CA mensuel d'un client pour un mois donne.
 *
 * REGLES CLES :
 * - TJM : jours ouvres reels du mois x (jours/sem / 5), affecte par saisonnalite
 * - Forfait : montant FIXE, insensible a la saisonnalite
 * - Mission : reparti uniformement sur la periode, pas de saisonnalite
 */
export function getClientMonthlyCA(
  client: ClientData,
  monthIndex: number,
  season: number,
  vacationDaysThisMonth = 0
): number {
  if (client.isActive === false) return 0;

  const start = client.startMonth ?? 0;
  const end = client.endMonth ?? 11;
  if (monthIndex < start || monthIndex > end) return 0;

  switch (client.billing) {
    case "tjm": {
      if (client.daysPerYear) {
        // daysPerYear is already a total — vacation is already factored in by the user
        return (client.dailyRate ?? 0) * (client.daysPerYear / 12) * season;
      }
      if (client.daysPerWeek != null) {
        const businessDays = Math.max(0, JOURS_OUVRES[monthIndex] - vacationDaysThisMonth);
        // No seasonality: JOURS_OUVRES already captures month-to-month variation
        return (client.dailyRate ?? 0) * (client.daysPerWeek / 5) * businessDays;
      }
      // daysPerMonth is an explicit fixed value — no seasonality
      return (client.dailyRate ?? 0) * (client.daysPerMonth ?? 0);
    }
    case "forfait":
      return client.monthlyAmount ?? 0;
    case "mission": {
      const duration = Math.max(1, (client.endMonth ?? 11) - (client.startMonth ?? 0) + 1);
      return (client.totalAmount ?? 0) / duration;
    }
    default:
      return 0;
  }
}

/**
 * Calcule le CA mensuel de base (moyenne annuelle, sans saisonnalite) pour un client.
 * Utilise pour les moyennes et statistiques.
 */
export function getClientBaseCA(client: ClientData): number {
  if (client.isActive === false) return 0;

  // Nombre de mois actifs (startMonth/endMonth)
  const start = client.startMonth ?? 0;
  const end = client.endMonth ?? 11;
  const activeMonths = end - start + 1;

  switch (client.billing) {
    case "tjm": {
      let monthly: number;
      if (client.daysPerYear) {
        monthly = (client.dailyRate ?? 0) * client.daysPerYear / 12;
      } else if (client.daysPerWeek != null) {
        monthly = (client.dailyRate ?? 0) * (client.daysPerWeek / 5) * AVG_JOURS_OUVRES;
      } else {
        monthly = (client.dailyRate ?? 0) * (client.daysPerMonth ?? 0);
      }
      // Ramener au prorata si le contrat ne couvre pas l'annee entiere
      return activeMonths < 12 ? monthly * (activeMonths / 12) : monthly;
    }
    case "forfait":
      // Forfait mensuel proratise sur la duree du contrat
      return activeMonths < 12
        ? (client.monthlyAmount ?? 0) * (activeMonths / 12)
        : (client.monthlyAmount ?? 0);
    case "mission": {
      const duration = Math.max(1, activeMonths);
      return (client.totalAmount ?? 0) / duration;
    }
    default:
      return 0;
  }
}

/**
 * Calcule le CA annuel d'un seul client en sommant ses 12 mois.
 * Tient compte de startMonth/endMonth (ex: mission ponctuelle sur 1 mois).
 */
export function getClientAnnualCA(client: ClientData, vacationDaysPerMonth?: number[]): number {
  let total = 0;
  for (let month = 0; month < 12; month++) {
    const season = SEASONALITY[month];
    const vacDays = vacationDaysPerMonth?.[month] ?? 0;
    total += getClientMonthlyCA(client, month, season, vacDays);
  }
  return total;
}

/**
 * Calcule le CA annuel reel a partir des clients en tenant compte de la
 * saisonnalite, des periodes de contrat et des clients inactifs.
 * Resultat coherent avec simulate().
 */
export function getAnnualCA(clients: ClientData[], vacationDaysPerMonth?: number[]): number {
  let total = 0;
  for (let month = 0; month < 12; month++) {
    const season = SEASONALITY[month];
    const vacDays = vacationDaysPerMonth?.[month] ?? 0;
    for (const client of clients) {
      total += getClientMonthlyCA(client, month, season, vacDays);
    }
  }
  return total;
}

/** Taux du Prelevement Forfaitaire Unique (flat tax dividendes) */

/**
 * IS progressif France :
 * - 15% sur les premiers 42 500€ de benefice
 * - 25% au-dela
 */
export function computeIS(profit: number): number {
  if (profit <= 0) return 0;
  const tranche1 = Math.min(profit, 42500);
  const tranche2 = Math.max(0, profit - 42500);
  return tranche1 * 0.15 + tranche2 * 0.25;
}

/**
 * IR progressif bareme 2026 (revenus 2025, LFI 2026 art. 2 ter, +0.9%).
 * Applique le quotient familial puis multiplie par le nombre de parts.
 */
const IR_BRACKETS: [number, number][] = [
  [11600, 0],
  [29579, 0.11],
  [84577, 0.30],
  [181917, 0.41],
  [Infinity, 0.45],
];

export function computeIR(taxableIncome: number, parts = 1): number {
  if (taxableIncome <= 0) return 0;
  const quotient = taxableIncome / parts;
  let tax = 0;
  let prev = 0;
  for (const [limit, rate] of IR_BRACKETS) {
    if (quotient <= prev) break;
    const taxable = Math.min(quotient, limit) - prev;
    tax += taxable * rate;
    prev = limit;
  }
  return tax * parts;
}

/**
 * Reverse calculation: given a desired annual net, find the required CA.
 * Uses iterative Newton-style approach for all cases (progressive IR is non-linear).
 */
export function reverseCA(
  targetNet: number,
  status: BusinessStatus,
  remType: RemunerationType,
  mixtePartSalaire: number,
  customIrRate?: number,
  nbParts?: number
): number {
  // Build a minimal profile to reuse computeNetFromCA
  const profile: FreelanceProfile = {
    monthlyExpenses: 0,
    savings: 0,
    adminHoursPerWeek: 0,
    workDaysPerWeek: 5,
    businessStatus: status,
    remunerationType: remType,
    mixtePartSalaire,
    customIrRate,
    nbParts: nbParts ?? 1,
  };

  // Newton-style iteration: converges in ~5-10 iterations
  let ca = targetNet * 2;
  for (let i = 0; i < 30; i++) {
    const net = computeNetFromCA(ca, profile);
    if (Math.abs(net - targetNet) < 1) break;
    if (net <= 0) { ca *= 2; continue; }
    ca = ca * (targetNet / net);
  }
  return ca;
}

/**
 * Calcule le revenu net apres toutes charges et impots.
 *
 * Utilise le bareme IR progressif 2026 sauf si customIrRate est defini.
 *
 * Micro : URSSAF sur CA, IR progressif sur assiette (CA × 0.66 apres abattement 34%)
 * IR (ei, eurl_ir, sasu_ir, portage) : charges pro deductibles, URSSAF, puis IR progressif
 * IS (eurl_is, sasu_is) : depend du mode de remuneration :
 *   - Salaire : charges sociales + IR progressif
 *   - Dividendes : IS sur benefice, puis PFU 30% (SASU) ou charges TNS + IR (EURL)
 *   - Mixte : partie salaire + dividendes sur le reste
 */
export function computeNetFromCA(
  annualCA: number,
  profile: FreelanceProfile
): number {
  const statusConfig = BUSINESS_STATUS_CONFIG[profile.businessStatus ?? "micro"];
  const urssafRate = profile.customUrssafRate ?? statusConfig.urssaf;
  const useProgressiveIR = profile.customIrRate == null;
  const flatIrRate = profile.customIrRate ?? statusConfig.ir;
  const isRate = statusConfig.is;
  const parts = profile.nbParts ?? 1;
  const chargesProRate = profile.chargesPro ?? 0;

  // Helper: compute IR (progressive or flat)
  const irOn = (taxable: number) =>
    useProgressiveIR ? computeIR(taxable, parts) : taxable * flatIrRate;

  // Micro : URSSAF sur CA, IR sur assiette apres abattement 34%
  if (profile.businessStatus === "micro") {
    const urssaf = annualCA * urssafRate;
    const taxableIncome = annualCA * 0.66; // abattement BNC 34%
    const ir = irOn(taxableIncome);
    return annualCA - urssaf - ir;
  }

  // Charges pro deductibles pour tous les regimes reels (EI, EURL IR/IS, SASU IR/IS)
  // Pas pour la micro (abattement forfaitaire 34% a la place) ni pour le portage (gere par le porteur)
  const deductChargesPro = ["ei", "eurl_ir", "eurl_is", "sasu_ir", "sasu_is"].includes(profile.businessStatus ?? "");
  const caAfterChargesPro = deductChargesPro
    ? annualCA * (1 - chargesProRate / 100)
    : annualCA;

  // Structures IR (pas d'IS) : URSSAF puis IR progressif
  if (isRate === 0) {
    const afterUrssaf = caAfterChargesPro * (1 - urssafRate);
    // Abattement 10% frais pro sur revenus salariés (art. 62, assimilé-salarié, portage)
    // Ne s'applique pas à l'EI (BIC/BNC)
    const hasSalaryAbatement = profile.businessStatus !== "ei";
    const taxableIncome = hasSalaryAbatement ? afterUrssaf * (1 - ABATTEMENT_FRAIS_PRO) : afterUrssaf;
    const ir = irOn(taxableIncome);
    return afterUrssaf - ir;
  }

  // --- Structures IS (eurl_is, sasu_is) ---

  // Taxe PUMa : cotisation subsidiaire maladie si revenus d'activité < 20% PASS
  // Formule : 6,5% × max(0, revenus du capital - 50% PASS) × (1 - activité / (20% PASS))
  // Source : art. L. 380-2 CSS
  const computePUMa = (revenuActivite: number, revenuCapital: number) => {
    if (revenuActivite >= PUMA_SEUIL_ACTIVITE) return 0;
    const assiette = Math.max(0, revenuCapital - PUMA_DEDUCTIBLE_CAPITAL);
    if (assiette <= 0) return 0;
    const minoration = 1 - revenuActivite / PUMA_SEUIL_ACTIVITE;
    return PUMA_RATE * assiette * minoration;
  };

  const remunerationType = profile.remunerationType ?? "salaire";
  const isSASU = profile.businessStatus === "sasu_is";
  const isEURL = profile.businessStatus === "eurl_is";
  const capitalSocial = profile.capitalSocial ?? 0;

  // Net des dividendes apres IS :
  // SASU : PFU 30% flat
  // EURL : dividendes <= 10% capital social → PFU 30%, au-dela → TNS + IR
  const netFromDividends = (dividends: number, otherTaxableIncome = 0) => {
    if (isSASU) return dividends * (1 - PFU_RATE);
    if (isEURL && capitalSocial > 0) {
      const seuilPFU = capitalSocial * 0.10;
      const partPFU = Math.min(dividends, seuilPFU);
      const partTNS = Math.max(0, dividends - seuilPFU);
      const netPFU = partPFU * (1 - PFU_RATE);
      const afterTNS = partTNS * (1 - urssafRate);
      const ir = irOn(afterTNS + otherTaxableIncome) - irOn(otherTaxableIncome);
      return netPFU + afterTNS - ir;
    }
    // EURL sans capital social renseigne → tout en TNS (conservateur)
    const afterUrssaf = dividends * (1 - urssafRate);
    const ir = irOn(afterUrssaf + otherTaxableIncome) - irOn(otherTaxableIncome);
    return afterUrssaf - ir;
  };

  // 100% Salaire : tout en remuneration, deductible = pas d'IS
  if (remunerationType === "salaire") {
    const afterUrssaf = caAfterChargesPro * (1 - urssafRate);
    // Abattement 10% frais pro sur revenu salarié (art. 62 EURL / assimilé-salarié SASU)
    const ir = irOn(afterUrssaf * (1 - ABATTEMENT_FRAIS_PRO));
    return afterUrssaf - ir;
  }

  // 100% Dividendes : IS progressif sur tout le benefice, puis taxation dividendes
  if (remunerationType === "dividendes") {
    const isAmount = computeIS(caAfterChargesPro);
    const afterIS = caAfterChargesPro - isAmount;
    // Taxe PUMa : pas de revenu d'activité → taxe maximale sur dividendes
    const puma = computePUMa(0, afterIS);
    return netFromDividends(afterIS) - puma;
  }

  // Mixte : repartition salaire/dividendes selon pourcentage ou monthlySalary
  const mixtePartSalaire = profile.mixtePartSalaire ?? 50;

  let salaryCost: number;
  if (mixtePartSalaire > 0) {
    salaryCost = Math.min(caAfterChargesPro * (mixtePartSalaire / 100), caAfterChargesPro);
  } else {
    const annualSalary = (profile.monthlySalary ?? 0) * 12;
    if (annualSalary <= 0) {
      const isAmount = computeIS(caAfterChargesPro);
      const afterIS = caAfterChargesPro - isAmount;
      return netFromDividends(afterIS);
    }
    salaryCost = Math.min(annualSalary / (1 - urssafRate), caAfterChargesPro);
  }

  const salaryNet = salaryCost * (1 - urssafRate);
  // Abattement 10% frais pro sur la part salaire
  const salaryTaxable = salaryNet * (1 - ABATTEMENT_FRAIS_PRO);
  const irSalary = irOn(salaryTaxable);
  const netSalary = salaryNet - irSalary;

  // Benefice restant → IS progressif → dividendes
  const remainingCA = Math.max(0, caAfterChargesPro - salaryCost);
  const isAmount = computeIS(remainingCA);
  const afterIS = remainingCA - isAmount;

  // IR marginal calcule sur la base taxable du salaire (apres abattement 10%)
  const netDividends = netFromDividends(afterIS, salaryTaxable);

  // Taxe PUMa si le salaire est insuffisant (< 20% PASS)
  const puma = computePUMa(salaryNet, afterIS);

  return netSalary + netDividends - puma;
}

/**
 * Projette le CA sur 12 mois, avant et apres simulation.
 *
 * REGLES DE SIMULATION PAR TYPE :
 *
 * VACANCES :
 *   - TJM -> revenu tombe a 0 (pas de jours = pas de facture)
 *   - Forfait -> CONTINUE de tourner (le client paie quand meme)
 *   - Mission -> PAUSE (pas de revenu pendant les vacances)
 *
 * VARIATION DE TARIFS :
 *   - TJM -> applique directement sur le taux journalier
 *   - Forfait -> NON applique (contrat fixe deja signe)
 *   - Mission -> NON applique (prix deja convenu)
 *
 * JOURS/SEMAINE :
 *   - TJM -> proportionnel (4j/5j = 80% du CA TJM)
 *   - Forfait -> PAS d'impact (c'est un forfait, pas du temps)
 *   - Mission -> PAS d'impact
 *
 * PERTE DE CLIENT :
 *   - Tous types -> le client disparait de la projection
 *
 * NOUVEAUX CLIENTS :
 *   - Montee en charge progressive sur 3 mois (33%, 66%, 100%)
 *   - CA moyen base sur la moyenne des clients existants
 */
export function simulate(
  clients: ClientData[],
  params: SimulationParams,
  profile: FreelanceProfile
): ProjectionResult {
  const before: number[] = [];
  const after: number[] = [];

  const totalBaseCA = clients.reduce(
    (sum, c) => sum + getClientBaseCA(c),
    0
  );
  const clientCount = clients.filter((c) => c.isActive !== false).length;

  const vacDaysPerMonth = profile.vacationDaysPerMonth;

  for (let month = 0; month < 12; month++) {
    const season = SEASONALITY[month];
    const vacDays = vacDaysPerMonth?.[month] ?? 0;
    let beforeTotal = 0;
    let afterTotal = 0;

    clients.forEach((client, clientIndex) => {
      const base = getClientMonthlyCA(client, month, season, vacDays);
      beforeTotal += base;

      if (params.lostClientIndex === clientIndex) return;

      let simulated = base;

      if (client.billing === "tjm") {
        simulated *= 1 + params.rateChange / 100;

        if (params.rateChangeAfter > 0 && month >= 2) {
          simulated *= 1 + params.rateChangeAfter / 100;
        }

        if (params.workDaysPerWeek < profile.workDaysPerWeek) {
          simulated *= params.workDaysPerWeek / profile.workDaysPerWeek;
        }
      }

      if (params.vacationWeeks > 0) {
        const vacMonths = params.vacationWeeks / 4.33;
        // Repartir les vacances sur l'ete d'abord : aout, juillet, sept, juin...
        const VAC_ORDER = [7, 6, 8, 5, 9, 4, 10, 3, 11, 0, 1, 2];
        const vacRank = VAC_ORDER.indexOf(month);
        const isFullVacMonth = vacRank < Math.floor(vacMonths);
        const isPartialVacMonth =
          !isFullVacMonth && vacRank < Math.ceil(vacMonths);

        if (client.billing === "tjm" || client.billing === "mission") {
          if (isFullVacMonth) {
            simulated = 0;
          } else if (isPartialVacMonth) {
            simulated *= 1 - (vacMonths % 1);
          }
        }
      }

      afterTotal += simulated;
    });

    if (params.newClients > 0 && clientCount > 0) {
      const avgCA = totalBaseCA / clientCount;
      const rampUp = Math.min(1, (month + 1) / 3);
      afterTotal += params.newClients * avgCA * rampUp * season;
    }

    before.push(beforeTotal);
    after.push(Math.max(0, afterTotal));
  }

  return { before, after };
}
