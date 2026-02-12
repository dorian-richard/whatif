import type { ClientData, SimulationParams, ProjectionResult, FreelanceProfile } from "@/types";
import { SEASONALITY } from "./constants";

/**
 * Calcule le CA mensuel d'un client pour un mois donne.
 *
 * REGLES CLES :
 * - TJM : affecte par saisonnalite (moins de jours dispos en ete)
 * - Forfait : montant FIXE, insensible a la saisonnalite
 * - Mission : reparti uniformement sur la periode, pas de saisonnalite
 */
export function getClientMonthlyCA(
  client: ClientData,
  monthIndex: number,
  season: number
): number {
  if (client.isActive === false) return 0;

  // Verifier si le client est actif ce mois-ci (pour missions bornees)
  const start = client.startMonth ?? 0;
  const end = client.endMonth ?? 11;
  if (monthIndex < start || monthIndex > end) return 0;

  switch (client.billing) {
    case "tjm":
      return (client.dailyRate ?? 0) * (client.daysPerMonth ?? 0) * season;
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
 * Calcule le CA mensuel de base (sans saisonnalite) pour un client.
 * Utilise pour les moyennes et statistiques.
 */
export function getClientBaseCA(client: ClientData): number {
  return getClientMonthlyCA(client, 0, 1);
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

  // CA de base (mois 0, saisonnalite 1) pour les nouveaux clients
  const totalBaseCA = clients.reduce(
    (sum, c) => sum + getClientMonthlyCA(c, 0, 1),
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

      // Client perdu -> skip entierement
      if (params.lostClientIndex === clientIndex) return;

      let simulated = base;

      // Variation de tarifs (TJM seulement)
      if (client.billing === "tjm") {
        simulated *= 1 + params.rateChange / 100;

        // Post-formation : +X% a partir du mois 3 (index 2)
        if (params.rateChangeAfter > 0 && month >= 2) {
          simulated *= 1 + params.rateChangeAfter / 100;
        }

        // Reduction jours/semaine (TJM seulement)
        if (params.workDaysPerWeek < profile.workDaysPerWeek) {
          simulated *= params.workDaysPerWeek / profile.workDaysPerWeek;
        }
      }

      // Vacances
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
          // Forfait : PAS impacte par les vacances
        }
      }

      afterTotal += simulated;
    });

    // Nouveaux clients (montee progressive sur 3 mois)
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
