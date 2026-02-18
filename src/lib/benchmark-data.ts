/* ══ Données réelles — TJM Paris (base), sources : Silkhom 2025, Embarq 2025 ══
   Chaque range = { min, médiane estimée, max } en €/jour à Paris.
   Les autres localisations sont dérivées via multiplicateur.
   Partagé entre /benchmark et /settings. */

export interface TJMRange {
  min: number;
  median: number;
  max: number;
}

export type Seniority = "junior" | "confirme" | "senior" | "expert";

export interface Metier {
  id: string;
  label: string;
  category: string;
  ranges: Record<Seniority, TJMRange>;
}

export const METIERS: Metier[] = [
  /* ── Tech (source : Silkhom 2025) ──────────────────────────── */
  {
    id: "dev_frontend",
    label: "Dev Frontend",
    category: "Tech",
    ranges: {
      junior:   { min: 320, median: 385, max: 450 },
      confirme: { min: 400, median: 450, max: 500 },
      senior:   { min: 450, median: 525, max: 600 },
      expert:   { min: 500, median: 600, max: 700 },
    },
  },
  {
    id: "dev_backend",
    label: "Dev Backend",
    category: "Tech",
    ranges: {
      junior:   { min: 320, median: 385, max: 450 },
      confirme: { min: 400, median: 450, max: 500 },
      senior:   { min: 450, median: 525, max: 600 },
      expert:   { min: 500, median: 600, max: 700 },
    },
  },
  {
    id: "dev_fullstack",
    label: "Dev Fullstack",
    category: "Tech",
    ranges: {
      junior:   { min: 350, median: 400, max: 450 },
      confirme: { min: 400, median: 450, max: 500 },
      senior:   { min: 450, median: 525, max: 600 },
      expert:   { min: 500, median: 600, max: 700 },
    },
  },
  {
    id: "dev_python",
    label: "Dev Python",
    category: "Tech",
    ranges: {
      junior:   { min: 380, median: 415, max: 450 },
      confirme: { min: 450, median: 500, max: 550 },
      senior:   { min: 500, median: 550, max: 600 },
      expert:   { min: 600, median: 675, max: 750 },
    },
  },
  {
    id: "dev_java",
    label: "Dev Java / .NET",
    category: "Tech",
    ranges: {
      junior:   { min: 350, median: 400, max: 450 },
      confirme: { min: 390, median: 440, max: 490 },
      senior:   { min: 450, median: 525, max: 600 },
      expert:   { min: 600, median: 650, max: 700 },
    },
  },
  {
    id: "dev_mobile",
    label: "Dev Mobile",
    category: "Tech",
    ranges: {
      junior:   { min: 330, median: 380, max: 430 },
      confirme: { min: 400, median: 475, max: 550 },
      senior:   { min: 500, median: 575, max: 650 },
      expert:   { min: 600, median: 660, max: 720 },
    },
  },
  {
    id: "devops",
    label: "DevOps / Cloud",
    category: "Tech",
    ranges: {
      junior:   { min: 450, median: 490, max: 530 },
      confirme: { min: 500, median: 525, max: 550 },
      senior:   { min: 520, median: 585, max: 650 },
      expert:   { min: 600, median: 675, max: 750 },
    },
  },
  {
    id: "lead_archi",
    label: "Lead Tech / Archi",
    category: "Tech",
    ranges: {
      junior:   { min: 500, median: 575, max: 650 },
      confirme: { min: 550, median: 625, max: 700 },
      senior:   { min: 600, median: 700, max: 800 },
      expert:   { min: 700, median: 800, max: 900 },
    },
  },

  /* ── Data & IA (source : Silkhom 2025) ─────────────────────── */
  {
    id: "data_engineer",
    label: "Data Engineer",
    category: "Data & IA",
    ranges: {
      junior:   { min: 430, median: 480, max: 530 },
      confirme: { min: 450, median: 525, max: 600 },
      senior:   { min: 550, median: 625, max: 700 },
      expert:   { min: 650, median: 750, max: 850 },
    },
  },
  {
    id: "data_scientist",
    label: "Data Scientist / ML",
    category: "Data & IA",
    ranges: {
      junior:   { min: 430, median: 480, max: 530 },
      confirme: { min: 450, median: 525, max: 600 },
      senior:   { min: 550, median: 625, max: 700 },
      expert:   { min: 650, median: 750, max: 850 },
    },
  },
  {
    id: "data_analyst",
    label: "Data Analyst",
    category: "Data & IA",
    ranges: {
      junior:   { min: 350, median: 400, max: 450 },
      confirme: { min: 420, median: 480, max: 540 },
      senior:   { min: 500, median: 570, max: 640 },
      expert:   { min: 600, median: 670, max: 740 },
    },
  },

  /* ── Infra & Sécu (source : Silkhom 2025) ──────────────────── */
  {
    id: "cybersecurite",
    label: "Cybersécurité",
    category: "Infra & Sécu",
    ranges: {
      junior:   { min: 460, median: 520, max: 580 },
      confirme: { min: 530, median: 605, max: 680 },
      senior:   { min: 660, median: 745, max: 830 },
      expert:   { min: 750, median: 850, max: 950 },
    },
  },
  {
    id: "sysadmin",
    label: "Systèmes & Réseaux",
    category: "Infra & Sécu",
    ranges: {
      junior:   { min: 350, median: 400, max: 450 },
      confirme: { min: 450, median: 475, max: 500 },
      senior:   { min: 500, median: 550, max: 600 },
      expert:   { min: 550, median: 600, max: 650 },
    },
  },

  /* ── Product & Design (sources : Silkhom 2025 + Embarq) ────── */
  {
    id: "product_owner",
    label: "Product Owner / PM",
    category: "Product & Design",
    ranges: {
      junior:   { min: 400, median: 450, max: 500 },
      confirme: { min: 500, median: 560, max: 620 },
      senior:   { min: 580, median: 670, max: 760 },
      expert:   { min: 700, median: 800, max: 900 },
    },
  },
  {
    id: "ux_ui_designer",
    label: "UX / UI Designer",
    category: "Product & Design",
    ranges: {
      junior:   { min: 350, median: 400, max: 450 },
      confirme: { min: 430, median: 480, max: 530 },
      senior:   { min: 450, median: 515, max: 580 },
      expert:   { min: 530, median: 600, max: 680 },
    },
  },
  {
    id: "graphiste_da",
    label: "Graphiste / DA",
    category: "Product & Design",
    ranges: {
      junior:   { min: 250, median: 300, max: 350 },
      confirme: { min: 330, median: 380, max: 430 },
      senior:   { min: 400, median: 460, max: 520 },
      expert:   { min: 500, median: 560, max: 620 },
    },
  },

  /* ── Conseil & Gestion (sources : Silkhom 2025 + Embarq) ───── */
  {
    id: "scrum_master",
    label: "Scrum Master / Coach",
    category: "Conseil & Gestion",
    ranges: {
      junior:   { min: 400, median: 450, max: 500 },
      confirme: { min: 500, median: 575, max: 650 },
      senior:   { min: 600, median: 700, max: 800 },
      expert:   { min: 700, median: 800, max: 900 },
    },
  },
  {
    id: "chef_projet_tech",
    label: "Chef de Projet Technique",
    category: "Conseil & Gestion",
    ranges: {
      junior:   { min: 550, median: 600, max: 650 },
      confirme: { min: 600, median: 650, max: 700 },
      senior:   { min: 700, median: 775, max: 850 },
      expert:   { min: 800, median: 875, max: 950 },
    },
  },
  {
    id: "business_analyst",
    label: "Business Analyst",
    category: "Conseil & Gestion",
    ranges: {
      junior:   { min: 400, median: 450, max: 500 },
      confirme: { min: 450, median: 500, max: 550 },
      senior:   { min: 550, median: 625, max: 700 },
      expert:   { min: 650, median: 725, max: 800 },
    },
  },
  {
    id: "consultant_strategie",
    label: "Consultant Stratégie",
    category: "Conseil & Gestion",
    ranges: {
      junior:   { min: 350, median: 420, max: 500 },
      confirme: { min: 500, median: 580, max: 650 },
      senior:   { min: 650, median: 750, max: 850 },
      expert:   { min: 800, median: 920, max: 1050 },
    },
  },

  /* ── Marketing & Com (source : Embarq 2025) ───────────────── */
  {
    id: "growth",
    label: "Growth / Acquisition",
    category: "Marketing & Com",
    ranges: {
      junior:   { min: 280, median: 330, max: 380 },
      confirme: { min: 380, median: 440, max: 500 },
      senior:   { min: 480, median: 540, max: 600 },
      expert:   { min: 580, median: 650, max: 720 },
    },
  },
  {
    id: "seo_sea",
    label: "SEO / SEA",
    category: "Marketing & Com",
    ranges: {
      junior:   { min: 280, median: 330, max: 380 },
      confirme: { min: 350, median: 400, max: 450 },
      senior:   { min: 430, median: 490, max: 550 },
      expert:   { min: 530, median: 590, max: 650 },
    },
  },
  {
    id: "community_manager",
    label: "Community Manager",
    category: "Marketing & Com",
    ranges: {
      junior:   { min: 200, median: 250, max: 300 },
      confirme: { min: 280, median: 330, max: 380 },
      senior:   { min: 350, median: 400, max: 450 },
      expert:   { min: 420, median: 470, max: 520 },
    },
  },
  {
    id: "copywriter",
    label: "Rédacteur / Copywriter",
    category: "Marketing & Com",
    ranges: {
      junior:   { min: 250, median: 300, max: 350 },
      confirme: { min: 330, median: 380, max: 430 },
      senior:   { min: 400, median: 460, max: 520 },
      expert:   { min: 500, median: 560, max: 620 },
    },
  },

  /* ── Finance & RH (source : Embarq 2025) ──────────────────── */
  {
    id: "daf_finance",
    label: "DAF / Contrôle de gestion",
    category: "Finance & RH",
    ranges: {
      junior:   { min: 400, median: 460, max: 520 },
      confirme: { min: 500, median: 575, max: 650 },
      senior:   { min: 620, median: 710, max: 800 },
      expert:   { min: 750, median: 875, max: 1000 },
    },
  },
  {
    id: "consultant_rh",
    label: "Consultant RH",
    category: "Finance & RH",
    ranges: {
      junior:   { min: 300, median: 350, max: 400 },
      confirme: { min: 380, median: 430, max: 480 },
      senior:   { min: 460, median: 530, max: 600 },
      expert:   { min: 580, median: 650, max: 720 },
    },
  },
  {
    id: "formateur",
    label: "Formateur",
    category: "Finance & RH",
    ranges: {
      junior:   { min: 350, median: 400, max: 450 },
      confirme: { min: 430, median: 500, max: 570 },
      senior:   { min: 550, median: 625, max: 700 },
      expert:   { min: 650, median: 730, max: 800 },
    },
  },
];

export const METIER_CATEGORIES = [...new Set(METIERS.map((m) => m.category))];

export const CATEGORY_COLORS: Record<string, string> = {
  Tech: "#5682F2",
  "Data & IA": "#a78bfa",
  "Infra & Sécu": "#f87171",
  "Product & Design": "#F4BE7E",
  "Conseil & Gestion": "#4ade80",
  "Marketing & Com": "#f97316",
  "Finance & RH": "#38bdf8",
};
