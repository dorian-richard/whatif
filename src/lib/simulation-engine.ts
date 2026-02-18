import type { ClientData, SimulationParams, ProjectionResult, FreelanceProfile, BusinessStatus } from "@/types";
import { SEASONALITY, BUSINESS_STATUS_CONFIG } from "./constants";

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
  season: number
): number {
  if (client.isActive === false) return 0;

  const start = client.startMonth ?? 0;
  const end = client.endMonth ?? 11;
  if (monthIndex < start || monthIndex > end) return 0;

  switch (client.billing) {
    case "tjm": {
      if (client.daysPerYear) {
        return (client.dailyRate ?? 0) * (client.daysPerYear / 12) * season;
      }
      if (client.daysPerWeek != null) {
        const businessDays = JOURS_OUVRES[monthIndex];
        return (client.dailyRate ?? 0) * (client.daysPerWeek / 5) * businessDays * season;
      }
      return (client.dailyRate ?? 0) * (client.daysPerMonth ?? 0) * season;
    }
    case "forfait":
      return client.monthlyAmount ?? 0;
    case "mission": {
      const duration = Math.max(1, (client.endMonth ?? 0) - (client.startMonth ?? 0) + 1);
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
  if (client.billing === "tjm") {
    if (client.daysPerYear) {
      return (client.dailyRate ?? 0) * client.daysPerYear / 12;
    }
    if (client.daysPerWeek != null) {
      return (client.dailyRate ?? 0) * (client.daysPerWeek / 5) * AVG_JOURS_OUVRES;
    }
  }
  return getClientMonthlyCA(client, 0, 1);
}

/**
 * Calcule le CA annuel reel a partir des clients en tenant compte de la
 * saisonnalite, des periodes de contrat et des clients inactifs.
 * Resultat coherent avec simulate().
 */
export function getAnnualCA(clients: ClientData[]): number {
  let total = 0;
  for (let month = 0; month < 12; month++) {
    const season = SEASONALITY[month];
    for (const client of clients) {
      total += getClientMonthlyCA(client, month, season);
    }
  }
  return total;
}

/** Taux du Prelevement Forfaitaire Unique (flat tax dividendes) */
const PFU_RATE = 0.30; // 12.8% IR + 17.2% CSG/CRDS

/**
 * Calcule le revenu net apres toutes charges et impots.
 *
 * Micro : URSSAF + IR sont des taux effectifs sur le CA
 * IR (ei, eurl_ir, sasu_ir) : URSSAF sur CA, puis IR sur le reste
 * IS (eurl_is, sasu_is) : depend du mode de remuneration :
 *   - Salaire : charges sociales + IR, salaire deductible donc pas d'IS
 *   - Dividendes : IS sur benefice, puis PFU 30% (SASU) ou charges TNS + IR (EURL)
 *   - Mixte : partie salaire + dividendes sur le reste
 */
export function computeNetFromCA(
  annualCA: number,
  profile: FreelanceProfile
): number {
  const statusConfig = BUSINESS_STATUS_CONFIG[profile.businessStatus ?? "micro"];
  const urssafRate = profile.customUrssafRate ?? statusConfig.urssaf;
  const irRate = profile.customIrRate ?? statusConfig.ir;
  const isRate = statusConfig.is;

  // Micro : taux forfaitaires appliques directement sur le CA
  if (profile.businessStatus === "micro") {
    return annualCA * (1 - urssafRate - irRate);
  }

  // Structures IR (pas d'IS) : URSSAF puis IR
  if (isRate === 0) {
    return annualCA * (1 - urssafRate) * (1 - irRate);
  }

  // --- Structures IS (eurl_is, sasu_is) ---
  const remunerationType = profile.remunerationType ?? "salaire";
  const isSASU = profile.businessStatus === "sasu_is";

  // Calcul net des dividendes apres IS :
  // SASU : PFU 30% flat (inclut IR + social)
  // EURL : charges TNS (~45%) + IR (dividendes > 10% du capital)
  const netFromDividends = (dividends: number) => {
    if (isSASU) return dividends * (1 - PFU_RATE);
    return dividends * (1 - urssafRate) * (1 - irRate);
  };

  // 100% Salaire : tout en remuneration, deductible = pas d'IS
  if (remunerationType === "salaire") {
    return annualCA * (1 - urssafRate) * (1 - irRate);
  }

  // 100% Dividendes : IS sur tout le benefice, puis taxation dividendes
  if (remunerationType === "dividendes") {
    const afterIS = annualCA * (1 - isRate);
    return netFromDividends(afterIS);
  }

  // Mixte : repartition salaire/dividendes selon pourcentage ou monthlySalary
  const mixtePartSalaire = profile.mixtePartSalaire ?? 50;

  // Calculer le cout salaire : soit via pourcentage du CA, soit via monthlySalary (fallback)
  let salaryCost: number;
  if (mixtePartSalaire > 0) {
    // Pourcentage du CA alloue en remuneration salaire (avant charges)
    salaryCost = Math.min(annualCA * (mixtePartSalaire / 100), annualCA);
  } else {
    const annualSalary = (profile.monthlySalary ?? 0) * 12;
    if (annualSalary <= 0) {
      const afterIS = annualCA * (1 - isRate);
      return netFromDividends(afterIS);
    }
    salaryCost = Math.min(annualSalary / (1 - urssafRate), annualCA);
  }

  const actualSalaryNet = salaryCost * (1 - urssafRate);

  // Benefice restant → IS → dividendes
  const remainingCA = Math.max(0, annualCA - salaryCost);
  const afterIS = remainingCA * (1 - isRate);

  const netSalary = actualSalaryNet * (1 - irRate);
  const netDividends = netFromDividends(afterIS);

  return netSalary + netDividends;
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

  for (let month = 0; month < 12; month++) {
    const season = SEASONALITY[month];
    let beforeTotal = 0;
    let afterTotal = 0;

    clients.forEach((client, clientIndex) => {
      const base = getClientMonthlyCA(client, month, season);
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
        const isFullVacMonth = month < Math.floor(vacMonths);
        const isPartialVacMonth =
          !isFullVacMonth && month < Math.ceil(vacMonths);

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
