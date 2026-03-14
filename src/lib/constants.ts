import type { SimulationParams } from "@/types";

/* ── Constantes réglementaires ── */
export const PFU_RATE = 0.30; // 12.8% IR + 17.2% CSG/CRDS
export const MICRO_PLAFOND = 83600; // Plafond micro-entreprise BNC 2026
export const PLAFOND_SS = 48060; // Plafond annuel Sécurité Sociale 2026
export const CHARGES_SALARIALES = 0.23; // Taux moyen charges salariales CDI

export const MONTHS_SHORT = [
  "Jan", "Fév", "Mar", "Avr", "Mai", "Jun",
  "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc",
];

/**
 * Coefficients de saisonnalité moyens pour freelances en France.
 * Basés sur : creux estival (Jul/Aoû), creux fin d'année (Déc),
 * pics Q1/Q4 (Sep-Nov).
 */
export const SEASONALITY = [
  0.92, 0.96, 1.09, 1.12, 1.10, 1.02,
  0.81, 0.60, 1.17, 1.23, 1.12, 0.86,
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

export type ScenarioCategory = "croissance" | "equilibre" | "risque";

export const SCENARIO_CATEGORIES: Record<ScenarioCategory, string> = {
  croissance: "Croissance",
  equilibre: "Équilibre",
  risque: "Risque",
};

export const PRESET_SCENARIOS = [
  { id: "raise", icon: "trending-up", title: "+20% tarifs", cat: "croissance" as ScenarioCategory, changes: { rateChange: 20 } as Partial<SimulationParams> },
  { id: "scale", icon: "rocket", title: "+2 clients", cat: "croissance" as ScenarioCategory, changes: { newClients: 2 } as Partial<SimulationParams> },
  { id: "sprint", icon: "zap", title: "Sprint 6j", cat: "croissance" as ScenarioCategory, changes: { workDaysPerWeek: 6, newClients: 1 } as Partial<SimulationParams> },
  { id: "dream", icon: "sparkles", title: "Rêve", cat: "croissance" as ScenarioCategory, changes: { rateChange: 30, newClients: 2, vacationWeeks: 4 } as Partial<SimulationParams> },
  { id: "vacation", icon: "palmtree", title: "3 sem off", cat: "equilibre" as ScenarioCategory, changes: { vacationWeeks: 3 } as Partial<SimulationParams> },
  { id: "parttime", icon: "clock", title: "4j/sem", cat: "equilibre" as ScenarioCategory, changes: { workDaysPerWeek: 4 } as Partial<SimulationParams> },
  { id: "summer", icon: "sun", title: "Été off", cat: "equilibre" as ScenarioCategory, changes: { vacationWeeks: 6 } as Partial<SimulationParams> },
  { id: "invest", icon: "book-open", title: "Formation", cat: "equilibre" as ScenarioCategory, changes: { vacationWeeks: 4, rateChangeAfter: 15 } as Partial<SimulationParams> },
  { id: "lose_big", icon: "heart-crack", title: "Perte #1", cat: "risque" as ScenarioCategory, changes: { lostClientIndex: 0 } as Partial<SimulationParams> },
  { id: "bounce", icon: "trending-up", title: "Rebond", cat: "risque" as ScenarioCategory, changes: { lostClientIndex: 0, rateChange: 15 } as Partial<SimulationParams> },
  { id: "crisis", icon: "shield", title: "Survie", cat: "risque" as ScenarioCategory, changes: { lostClientIndex: 0, rateChange: -10, vacationWeeks: 2 } as Partial<SimulationParams> },
  { id: "expenses_up", icon: "flame", title: "+500\u20AC charges", cat: "risque" as ScenarioCategory, changes: { expenseChange: 500 } as Partial<SimulationParams> },
  { id: "conge_parental", icon: "life-buoy", title: "Congé parental", cat: "equilibre" as ScenarioCategory, changes: { vacationWeeks: 12 } as Partial<SimulationParams> },
  { id: "retraite_prog", icon: "clock", title: "Retraite progressive", cat: "equilibre" as ScenarioCategory, changes: { workDaysPerWeek: 4, expenseChange: 300 } as Partial<SimulationParams> },
  { id: "pivot_tarifs", icon: "target", title: "Pivot tarifs", cat: "croissance" as ScenarioCategory, changes: { rateChange: 30, lostClientIndex: 0 } as Partial<SimulationParams> },
  { id: "sabbatique", icon: "palmtree", title: "Année sabbatique", cat: "risque" as ScenarioCategory, changes: { vacationWeeks: 26 } as Partial<SimulationParams> },
  { id: "nouveau_depart", icon: "sparkles", title: "Nouveau départ", cat: "risque" as ScenarioCategory, changes: { lostClientIndex: 0, newClients: 1, rateChange: -10 } as Partial<SimulationParams> },
];

import type { BusinessStatus } from "@/types";

/**
 * Taux de cotisations et impôts par statut juridique.
 * urssaf = cotisations sociales (% du CA ou de la rémunération)
 * ir = tranche marginale d'impôt sur le revenu estimée
 * is = impôt sur les sociétés (si applicable)
 * label = nom affiché
 */
export const BUSINESS_STATUS_CONFIG: Record<
  BusinessStatus,
  {
    label: string;
    urssaf: number;
    ir: number;
    is: number;
    desc: string;
    regime: string;
    plafond?: string;
    details: string;
    avantages: string[];
    inconvenients: string[];
    warnings?: string[];
  }
> = {
  micro: {
    label: "Micro-entreprise",
    urssaf: 0.256,
    ir: 0.11,
    is: 0,
    desc: "25.6% du CA \u00B7 Abattement BNC 34% \u00B7 Plafond 83 600\u20AC",
    regime: "TNS simplifié",
    plafond: "83 600\u20AC/an (BNC)",
    details:
      "Cotisations sociales 25.6% (BNC) prélevées sur le CA. IR calculé après abattement forfaitaire de 34% : seuls 66% du CA sont imposés. Option versement libératoire à 2.2% si éligible. Franchise de TVA sous 37 500\u20AC. Comptabilité ultra-simplifiée.",
    avantages: [
      "Comptabilité simplifiée, pas de bilan",
      "Cotisations calculées sur le CA réel",
      "Franchise de TVA sous seuil",
      "Versement libératoire IR possible",
    ],
    inconvenients: [
      "Plafond CA 83 600\u20AC (BNC)",
      "Charges non déductibles du CA",
      "Pas de déduction de TVA",
      "Protection sociale minimale",
    ],
  },
  ei: {
    label: "EI classique",
    urssaf: 0.45,
    ir: 0.30,
    is: 0,
    desc: "TNS ~45% du bénéfice · IR progressif · Pas de plafond CA",
    regime: "TNS",
    details:
      "Cotisations TNS ~45% calculées sur le bénéfice (CA - charges déductibles). IR au barème progressif sur le revenu net. Charges pro déductibles (loyer, matériel, logiciels\u2026). Patrimoine personnel protégé depuis loi 2022. Pour freelances au-dessus du plafond micro ou avec charges élevées.",
    avantages: [
      "Charges professionnelles déductibles",
      "Pas de plafond de CA",
      "Patrimoine personnel protégé (loi 2022)",
      "Régime réel = optimisation fiscale possible",
    ],
    inconvenients: [
      "Cotisations ~45% sur le bénéfice",
      "Comptabilité obligatoire (bilan, compte de résultat)",
      "Appels de cotisations provisionnels (décalage)",
      "IR progressif pouvant monter à 41%+",
    ],
  },
  eurl_ir: {
    label: "EURL à l'IR",
    urssaf: 0.45,
    ir: 0.30,
    is: 0,
    desc: "Gérant TNS ~45% · IR progressif · Responsabilité limitée",
    regime: "TNS (gérant majoritaire)",
    details:
      "Gérant majoritaire TNS, cotisations ~45% sur la rémunération. IR au barème progressif. Responsabilité limitée aux apports. Mêmes charges que l'EI mais avec structure sociétaire et protection du patrimoine personnel. Nécessite capital social et statuts.",
    avantages: [
      "Responsabilité limitée aux apports",
      "Mêmes cotisations TNS que l'EI (~45%)",
      "Charges professionnelles déductibles",
      "Possibilité de passer à l'IS plus tard",
    ],
    inconvenients: [
      "Formalités de création (statuts, capital)",
      "Comptabilité de société obligatoire",
      "Appels de cotisations provisionnels",
      "Coût de gestion supérieur à l'EI",
    ],
  },
  eurl_is: {
    label: "EURL à l'IS",
    urssaf: 0.45,
    ir: 0.125,
    is: 0.15,
    desc: "IS 15/25% · TNS ~45% sur salaire · Dividendes soumis cotisations",
    regime: "TNS (gérant majoritaire)",
    details:
      "IS 15% jusqu'à 42 500\u20AC de bénéfice, 25% au-delà. Gérant TNS ~45% de charges sur sa rémunération uniquement. Dividendes > 10% du capital social soumis aux cotisations TNS (~45%). Permet d'optimiser entre salaire et dividendes. IR par défaut 12.5% = taux effectif estimé.",
    avantages: [
      "Optimisation salaire / dividendes",
      "IS taux réduit 15% jusqu'à 42 500\u20AC",
      "Rémunération du gérant déductible du bénéfice IS",
      "Mise en réserve possible (capitalisation)",
    ],
    inconvenients: [
      "Dividendes > 10% capital soumis TNS ~45%",
      "Double imposition : IS puis IR/cotisations",
      "Comptabilité société + déclarations fiscales",
      "Complexité de gestion accrue",
    ],
  },
  sasu_ir: {
    label: "SASU à l'IR",
    urssaf: 0.097,
    ir: 0.30,
    is: 0,
    desc: "Transparence fiscale · Prélèvements sociaux 9,7% · IR progressif · Option 5 ans max",
    regime: "Assimilé salarié (transparence fiscale)",
    details:
      "En SASU à l'IR (option temporaire, 5 exercices max), le résultat de la société est directement imposé à l'IR au nom de l'associé unique (transparence fiscale). Les prélèvements sociaux s'élèvent à 9,7% (CSG/CRDS sur revenus professionnels). Attention : le paiement des 9,7% se fait auprès de l'URSSAF par courrier (pas de télépaiement). Les acomptes sur résultat en cours d'exercice sont interdits (compte courant d'associé débiteur interdit) : il faut attendre la clôture et l'établissement du bilan.",
    avantages: [
      "Prélèvements sociaux faibles (9,7% vs 45% en salaire)",
      "Transparence fiscale : pas d'IS, résultat imposé directement à l'IR",
      "Charges pro déductibles du résultat fiscal",
      "Possibilité de repasser à l'IS à tout moment",
    ],
    inconvenients: [
      "Option IR limitée à 5 exercices",
      "Pas de droit au chômage",
      "Pas d'acomptes sur résultat (attendre la clôture)",
      "Paiement URSSAF 9,7% par courrier uniquement",
      "Risque de requalification en 17,2% (contrôles fiscaux récents)",
    ],
    warnings: [
      "Certaines SASU IR font l'objet de contrôles ciblés : l'administration conteste parfois le taux de 9,7%, considérant que les revenus relèvent du patrimoine (17,2%). La position majoritaire des experts-comptables défend le 9,7% (revenus professionnels). Par prudence, provisionner les sommes sur base 17,2% (droit de reprise sur 3 exercices).",
    ],
  },
  sasu_is: {
    label: "SASU à l'IS",
    urssaf: 0.45,
    ir: 0.125,
    is: 0.15,
    desc: "IS 15/25% · Salarié ~45% charges sur CA · Dividendes PFU 30%",
    regime: "Assimilé salarié",
    details:
      "IS 15% jusqu'à 42 500\u20AC, 25% au-delà. Président assimilé salarié, charges ~45% du CA alloué en salaire (patronales ~42% + salariales ~22% du brut). Dividendes au PFU 30% flat (12.8% IR + 17.2% prélèvements sociaux) sans cotisations TNS. Statut le plus protecteur socialement. Idéal pour optimisation via dividendes.",
    avantages: [
      "Dividendes PFU 30% flat, sans cotisations TNS",
      "IS taux réduit 15% jusqu'à 42 500\u20AC",
      "Meilleure protection sociale",
      "Crédibilité : fiches de paie, structure sociétaire",
    ],
    inconvenients: [
      "Charges salariales élevées (~45% du CA)",
      "Pas de droit au chômage",
      "Bulletins de paie obligatoires",
      "Gestion plus lourde (AG, comptes annuels)",
    ],
  },
  portage: {
    label: "Portage salarial",
    urssaf: 0.50,
    ir: 0.30,
    is: 0,
    desc: "Assimilé salarié ~50% charges tout compris (cotisations + frais de gestion) · Pas de création d'entreprise",
    regime: "Assimilé salarié (portage)",
    details:
      "Salarié d'une société de portage qui facture vos clients. Charges tout compris ~50% du CA (cotisations patronales + salariales + frais de gestion du porteur). Protection sociale CDI (maladie, retraite, chômage). Bulletin de paie mensuel. Idéal pour débuter ou si création d'entreprise impossible (visa, simplicité).",
    avantages: [
      "Protection sociale complète (maladie, retraite, chômage)",
      "Aucune création d'entreprise nécessaire",
      "Comptabilité entièrement gérée par le porteur",
      "Fiches de paie (crédibilité prêts, location, visa)",
    ],
    inconvenients: [
      "Charges sociales + frais de gestion élevés (~50% tout compris)",
      "Moins d'optimisation fiscale possible",
      "Dépendance vis-à-vis de la société de portage",
      "Marge de négociation limitée sur les frais",
    ],
  },
};

/** Client-safe plan limits (no server secrets) */
export const PLAN_LIMITS = {
  FREE: { maxClients: 1, maxScenarios: 1 },
  ACTIVE: { maxClients: Infinity, maxScenarios: Infinity },
} as const;

export const CLIENT_COLORS = [
  "#6366f1", "#f59e0b", "#10b981", "#ef4444",
  "#8b5cf6", "#06b6d4", "#f97316", "#ec4899",
];

/* ── Holding ── */

import type { HoldingFlowType, HoldingEntityType } from "@/types";

export const HOLDING_FLOW_TYPES: { value: HoldingFlowType; label: string; color: string; desc: string }[] = [
  { value: "dividend", label: "Dividendes", color: "#4ade80", desc: "Distribution de bénéfices" },
  { value: "management_fee", label: "Frais de gestion", color: "#a78bfa", desc: "Convention de prestation" },
  { value: "salary", label: "Salaire", color: "#5682F2", desc: "Rémunération dirigeant" },
];

export const HOLDING_FLOW_STYLES: Record<HoldingFlowType, { stroke: string; strokeDasharray?: string; strokeWidth: number }> = {
  dividend: { stroke: "#4ade80", strokeWidth: 2 },
  management_fee: { stroke: "#a78bfa", strokeDasharray: "5 5", strokeWidth: 2 },
  salary: { stroke: "#5682F2", strokeWidth: 2 },
};

export const HOLDING_ENTITY_TYPES: { value: HoldingEntityType; label: string }[] = [
  { value: "holding", label: "Holding" },
  { value: "operating", label: "Société opérationnelle" },
  { value: "person", label: "Personne physique" },
];

export const HOLDING_BUSINESS_STATUSES = [
  { value: "", label: "— Aucun —" },
  { value: "sasu_is", label: "SASU IS" },
  { value: "sasu_ir", label: "SASU IR" },
  { value: "eurl_is", label: "EURL IS" },
  { value: "eurl_ir", label: "EURL IR" },
  { value: "sci_is", label: "SCI IS" },
  { value: "sci_ir", label: "SCI IR" },
  { value: "sarl_is", label: "SARL IS" },
  { value: "sas_is", label: "SAS IS" },
  { value: "sa_is", label: "SA IS" },
];
