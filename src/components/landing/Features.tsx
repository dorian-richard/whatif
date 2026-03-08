import Link from "next/link";
import { SlidersHorizontal, BarChart3, Scale, Lock, Target, CreditCard, TrendingUp, Gauge } from "@/components/ui/icons";
import { AnimateOnScroll } from "./AnimateOnScroll";

const HERO_FEATURES = [
  {
    icon: SlidersHorizontal,
    title: "Et si je perdais un client ?",
    desc: "Vacances, hausse de TJM, passage à 4 jours, perte d'un client — simule le scénario, vois le résultat avant de décider.",
    color: "#5682F2",
  },
  {
    icon: BarChart3,
    title: "12 mois de visibilité",
    desc: "CA, revenu net, trésorerie mois par mois avec les vrais jours ouvrés, la saisonnalité et tous tes clients.",
    color: "#fbbf24",
  },
  {
    icon: Scale,
    title: "Scénarios comparés",
    desc: "Sauvegarde plusieurs configurations, compare-les côte à côte. Visualise l'impact de chaque décision avant de la prendre.",
    color: "#ec4899",
  },
];

const PRO_GROUPS = [
  {
    icon: Scale,
    title: "Analyse & comparaison",
    color: "#5682F2",
    items: [
      "Comparateur de statuts : Micro, EURL, SASU, portage",
      "Benchmark TJM marché (27 métiers, données Silkhom 2025)",
      "Objectif Revenu : du net cible au CA et TJM requis",
      "Transition CDI → Freelance : combien facturer pour gagner plus ?",
    ],
  },
  {
    icon: CreditCard,
    title: "Pilotage au quotidien",
    color: "#ec4899",
    items: [
      "Suivi des factures : envoyées, payées, en retard",
      "Pipeline commercial : prospects en kanban",
      "Calendrier fiscal : URSSAF, TVA, IS, IR + export .ics",
      "Devis et factures : numérotation auto, TVA, export PDF",
    ],
  },
  {
    icon: TrendingUp,
    title: "Trésorerie & historique",
    color: "#10b981",
    items: [
      "Prévisions de trésorerie sur 12 mois avec alertes",
      "Historique et tendances : compare tes revenus YoY",
    ],
  },
  {
    icon: Target,
    title: "Projections long terme",
    color: "#a78bfa",
    items: [
      "Simulation retraite : pension estimée vs CDI",
      "Simulation ACRE : économies URSSAF sur 1 an",
      "Simulateur patrimoine : épargne sur 5 à 30 ans",
      "Optimisation holding : IS, mère-fille, graphe interactif",
    ],
  },
  {
    icon: Gauge,
    title: "Diagnostic",
    color: "#F4BE7E",
    items: [
      "Score de santé financière sur 6 axes",
      "Recommandations personnalisées",
      "Export PDF & CSV de tous tes rapports",
    ],
  },
];

export function Features() {
  return (
    <section id="features" className="snap-section relative flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-[#5682F2]/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20 w-full">
        <AnimateOnScroll>
          <div className="text-center mb-16">
            <span className="text-sm font-medium text-primary uppercase tracking-widest mb-3 block">Fonctionnalités</span>
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
              Tout ce qu&apos;il faut pour{" "}
              <span className="fn-gradient-text">décider sereinement</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Simulateur, comparateur, benchmark et outils de décision — tout en un.
            </p>
          </div>
        </AnimateOnScroll>

        {/* Hero features — 3 big cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
          {HERO_FEATURES.map((f, i) => (
            <AnimateOnScroll key={f.title} delay={0.05 * i}>
              <div className="group relative bg-muted/40 border border-border rounded-2xl p-6 hover:bg-muted hover:border-border transition-all duration-300">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${f.color}15` }}
                >
                  <f.icon className="size-6" style={{ color: f.color }} />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            </AnimateOnScroll>
          ))}
        </div>

        {/* Pro separator */}
        <div className="flex items-center gap-4 mb-10">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#5682F2]/30 to-transparent" />
          <div className="flex items-center gap-3">
            <Lock className="size-4 text-[#F4BE7E]" />
            <span className="text-sm font-bold uppercase tracking-wider bg-gradient-to-r from-[#5682F2] to-[#F4BE7E] bg-clip-text text-transparent">
              Fonctionnalités Pro
            </span>
            <Link
              href="#pricing"
              className="px-4 py-1.5 bg-gradient-to-r from-[#5682F2] to-[#7C5BF2] text-white rounded-full text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              Passer Pro
            </Link>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#5682F2]/30 to-transparent" />
        </div>

        {/* Pro features — grouped categories */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {PRO_GROUPS.map((g, i) => (
            <AnimateOnScroll key={g.title} delay={0.05 * i}>
              <div className="relative bg-muted/40 border border-border rounded-2xl p-6 hover:bg-muted transition-all duration-300">
                <span className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-[#5682F2] to-[#F4BE7E] text-white px-2 py-0.5 rounded-full">
                  Pro
                </span>
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="size-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${g.color}15` }}
                  >
                    <g.icon className="size-5" style={{ color: g.color }} />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">{g.title}</h3>
                </div>
                <ul className="space-y-2">
                  {g.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <svg className="size-4 text-[#4ade80] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
