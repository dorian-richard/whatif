import { SlidersHorizontal, BarChart3, Target, Briefcase, CalendarDays } from "@/components/ui/icons";

const FEATURES = [
  {
    icon: SlidersHorizontal,
    title: "Et si je perdais un client ?",
    desc: "Vacances, hausse de TJM, passage à 4 jours, perte d'un client — simule le scénario, vois le résultat avant de décider.",
    color: "#5682F2",
  },
  {
    icon: Briefcase,
    title: "Benchmark TJM marché",
    desc: "27 métiers, 7 catégories, données réelles Silkhom 2025. Compare ton TJM au marché par séniorité et localisation.",
    color: "#F4BE7E",
  },
  {
    icon: Target,
    title: "Objectif Revenu",
    desc: "Tu vises un net mensuel ? On calcule le CA, le TJM et le nombre de clients nécessaires, statut par statut.",
    color: "#a78bfa",
  },
  {
    icon: BarChart3,
    title: "12 mois de visibilité",
    desc: "CA, revenu net, trésorerie mois par mois avec les vrais jours ouvrés, la saisonnalité et tous tes clients.",
    color: "#fbbf24",
  },
  {
    icon: CalendarDays,
    title: "Calendrier Fiscal",
    desc: "Toutes tes échéances fiscales sur 12 mois : URSSAF, TVA, IS, IR. Montants provisionnels estimés.",
    color: "#f97316",
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
          <span className="text-sm font-medium text-[#5682F2] uppercase tracking-widest mb-3 block">Fonctionnalités</span>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Tout ce qu&apos;il faut pour{" "}
            <span className="fn-gradient-text">décider sereinement</span>
          </h2>
          <p className="text-lg text-[#8b8b9e] max-w-xl mx-auto">
            Simulateur, benchmark et outils de décision — tout en un.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group relative bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 hover:bg-white/[0.06] hover:border-white/[0.1] transition-all duration-300"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: `${f.color}15` }}
              >
                <f.icon className="size-6" style={{ color: f.color }} />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-[#8b8b9e] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
