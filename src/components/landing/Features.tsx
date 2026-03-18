import Link from "next/link";
import { SlidersHorizontal, BarChart3, Scale, Lock, Target, CreditCard, TrendingUp, Gauge } from "@/components/ui/icons";
import { AnimateOnScroll } from "./AnimateOnScroll";

const HERO_FEATURES = [
  {
    icon: SlidersHorizontal,
    title: "\"Si je perds ce client, je survis ?\"",
    desc: "Vacances, hausse de TJM, passage à 4 jours, perte d'un client — simule avant de flipper.",
    color: "#5682F2",
  },
  {
    icon: BarChart3,
    title: "\"Combien mettre de côté pour l'URSSAF ?\"",
    desc: "Net réel mois par mois, provisions URSSAF et IR calculées — plus de mauvaise surprise à la déclaration.",
    color: "#fbbf24",
  },
  {
    icon: Scale,
    title: "\"Micro ou EURL, je perds combien ?\"",
    desc: "Compare ton net exact par statut avec ton CA réel. Vois à quel moment ça vaut le coup de basculer.",
    color: "#ec4899",
  },
];

const PRO_GROUPS = [
  {
    icon: Scale,
    title: "Analyse & comparaison",
    color: "#5682F2",
    items: [
      "Comparateur de statuts : Micro, EURL IR/IS, SASU IR/IS, portage",
      "Taxe PUMa, abattement 10% frais pro, PFU 31,4% — les vrais taux 2026",
      "Mix salaire/dividendes optimisé (EURL IS, SASU IS)",
      "Benchmark TJM marché (27 métiers, données Silkhom 2025)",
      "Objectif Revenu : du net cible au CA et TJM requis",
    ],
  },
  {
    icon: CreditCard,
    title: "Facturation & pilotage",
    color: "#ec4899",
    items: [
      "Devis et factures : numérotation auto, TVA, export PDF",
      "Conversion devis → facture en 1 clic",
      "Suivi des paiements : envoyés, payés, en retard",
      "Pipeline commercial : prospects en kanban avec CA pondéré",
      "Calendrier fiscal : URSSAF, TVA, IS, IR + export .ics",
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
              Arr&ecirc;te de piloter{" "}
              <span className="fn-gradient-text">&agrave; l&apos;aveugle</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Les r&eacute;ponses que tu cherches sur Reddit et dans les groupes Facebook &mdash; sauf qu&apos;ici c&apos;est avec tes vrais chiffres.
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

        {/* Pro features — 2x2 grid + 1 full width */}
        <div className="grid sm:grid-cols-2 gap-5 mb-5">
          {PRO_GROUPS.slice(0, 4).map((g, i) => (
            <AnimateOnScroll key={g.title} delay={0.05 * i}>
              <div className="relative bg-muted/40 border border-border rounded-2xl p-6 hover:bg-muted transition-all duration-300 h-full">
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
        {/* Last group — full width */}
        {(() => {
          const last = PRO_GROUPS[4];
          if (!last) return null;
          const LastIcon = last.icon;
          return (
            <AnimateOnScroll delay={0.2}>
              <div className="relative bg-muted/40 border border-border rounded-2xl p-6 hover:bg-muted transition-all duration-300">
                <span className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-[#5682F2] to-[#F4BE7E] text-white px-2 py-0.5 rounded-full">
                  Pro
                </span>
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="size-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${last.color}15` }}
                  >
                    <LastIcon className="size-5" style={{ color: last.color }} />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">{last.title}</h3>
                </div>
                <ul className="flex flex-wrap gap-x-8 gap-y-2">
                  {last.items.map((item) => (
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
          );
        })()}
      </div>
    </section>
  );
}
