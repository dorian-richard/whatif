import type { SimulationParams } from "@/types";

export const MONTHS_SHORT = [
  "Jan", "Fev", "Mar", "Avr", "Mai", "Jun",
  "Jul", "Aou", "Sep", "Oct", "Nov", "Dec",
];

/**
 * Coefficients de saisonnalite moyens pour freelances en France.
 * Bases sur : creux estival (Jul/Aou), creux fin d'annee (Dec),
 * pics Q1/Q4 (Sep-Nov).
 */
export const SEASONALITY = [
  0.88, 0.92, 1.05, 1.08, 1.06, 0.98,
  0.78, 0.58, 1.12, 1.18, 1.08, 0.82,
];

export const DEFAULT_SIM: SimulationParams = {
  vacationWeeks: 0,
  rateChange: 0,
  rateChangeAfter: 0,
  lostClientIndex: -1,
  newClients: 0,
  workDaysPerWeek: 5,
  expenseChange: 0,
};

export const PRESET_SCENARIOS = [
  {
    id: "vacation",
    icon: "🏖️",
    title: "Prendre des vacances",
    desc: "Combien me coutent vraiment 3 semaines off ?",
    changes: { vacationWeeks: 3 } as Partial<SimulationParams>,
  },
  {
    id: "raise",
    icon: "📈",
    title: "Augmenter mes tarifs de 20%",
    desc: "Impact si j'augmente sur les nouveaux devis",
    changes: { rateChange: 20 } as Partial<SimulationParams>,
  },
  {
    id: "lose_big",
    icon: "💔",
    title: "Perdre mon plus gros client",
    desc: "Worst case : mon client #1 part demain",
    changes: { lostClientIndex: 0 } as Partial<SimulationParams>,
  },
  {
    id: "scale",
    icon: "🚀",
    title: "Prendre 2 clients de plus",
    desc: "J'accepte 2 nouvelles missions",
    changes: { newClients: 2 } as Partial<SimulationParams>,
  },
  {
    id: "parttime",
    icon: "⏰",
    title: "Passer a 4j/semaine",
    desc: "Travailler moins pour vivre mieux ?",
    changes: { workDaysPerWeek: 4 } as Partial<SimulationParams>,
  },
  {
    id: "invest",
    icon: "📚",
    title: "1 mois de formation",
    desc: "Arreter 1 mois pour monter en competence",
    changes: { vacationWeeks: 4, rateChangeAfter: 15 } as Partial<SimulationParams>,
  },
];

export const CLIENT_COLORS = [
  "#6366f1", "#f59e0b", "#10b981", "#ef4444",
  "#8b5cf6", "#06b6d4", "#f97316", "#ec4899",
];
