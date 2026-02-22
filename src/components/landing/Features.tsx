import { SlidersHorizontal, BarChart3, Target, Briefcase, CalendarDays, Scale, ArrowLeftRight, PiggyBank, BadgePercent } from "@/components/ui/icons";

const FEATURES = [
  {
    icon: SlidersHorizontal,
    title: "Et si je perdais un client ?",
    desc: "Vacances, hausse de TJM, passage à 4 jours, perte d'un client — simule le scénario, vois le résultat avant de décider.",
    color: "#5682F2",
    pro: false,
  },
  {
    icon: Briefcase,
    title: "Benchmark TJM marché",
    desc: "27 métiers, 7 catégories, données réelles Silkhom 2025. Compare ton TJM au marché par séniorité et localisation.",
    color: "#F4BE7E",
    pro: true,
  },
  {
    icon: Target,
    title: "Objectif Revenu",
    desc: "Tu vises un net mensuel ? On calcule le CA, le TJM et le nombre de clients nécessaires, statut par statut.",
    color: "#a78bfa",
    pro: true,
  },
  {
    icon: BarChart3,
    title: "12 mois de visibilité",
    desc: "CA, revenu net, trésorerie mois par mois avec les vrais jours ouvrés, la saisonnalité et tous tes clients.",
    color: "#fbbf24",
    pro: false,
  },
  {
    icon: CalendarDays,
    title: "Calendrier Fiscal",
    desc: "Toutes tes échéances fiscales sur 12 mois : URSSAF, TVA, IS, IR. Montants provisionnels estimés + export .ics.",
    color: "#f97316",
    pro: true,
  },
  {
    icon: Scale,
    title: "Comparateur de statuts",
    desc: "Micro, EURL, SASU, portage salarial — compare ton revenu net, tes charges et ta fiscalité statut par statut.",
    color: "#10b981",
    pro: false,
  },
  {
    icon: ArrowLeftRight,
    title: "Transition CDI → Freelance",
    desc: "Salaire net CDI vs revenu freelance : combien facturer pour gagner autant (ou plus) qu'en salariat ?",
    color: "#ec4899",
    pro: false,
  },
  {
    icon: PiggyBank,
    title: "Projection Retraite",
    desc: "Estime ta pension selon ton statut, ton CA et ton âge. Compare les trimestres et points acquis par régime.",
    color: "#8b5cf6",
    pro: true,
  },
  {
    icon: BadgePercent,
    title: "Simulation ACRE",
    desc: "Calcule tes économies URSSAF avec l'ACRE sur 1 an, statut par statut. Micro, EURL et SASU comparés.",
    color: "#06b6d4",
    pro: false,
  },
];

export function Features() {
  return (
    <section id="features" className="snap-section relative flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-[#5682F2]/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-5xl mx-auto px-6 py-20 w-full">
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

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group relative bg-muted/40 border border-border rounded-2xl p-6 hover:bg-muted hover:border-border transition-all duration-300"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: `${f.color}15` }}
              >
                <f.icon className="size-6" style={{ color: f.color }} />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-base font-semibold text-foreground">{f.title}</h3>
                {f.pro && (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-[#5682F2] to-[#F4BE7E] text-white px-2 py-0.5 rounded-full">
                    Pro
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
