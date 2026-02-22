import Link from "next/link";
import { SlidersHorizontal, BarChart3, Target, Briefcase, CalendarDays, Scale, ArrowLeftRight, PiggyBank, BadgePercent, Lock } from "@/components/ui/icons";

const FREE_FEATURES = [
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
    icon: ArrowLeftRight,
    title: "Transition CDI → Freelance",
    desc: "Salaire net CDI vs revenu freelance : combien facturer pour gagner autant (ou plus) qu'en salariat ?",
    color: "#ec4899",
  },
];

const PRO_FEATURES = [
  {
    icon: Scale,
    title: "Comparateur de statuts",
    desc: "Micro, EURL, SASU, portage salarial — compare ton revenu net, tes charges et ta fiscalité statut par statut.",
    color: "#10b981",
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
    icon: CalendarDays,
    title: "Calendrier Fiscal",
    desc: "Toutes tes échéances fiscales sur 12 mois : URSSAF, TVA, IS, IR. Montants provisionnels estimés + export .ics.",
    color: "#f97316",
  },
  {
    icon: PiggyBank,
    title: "Projection Retraite",
    desc: "Estime ta pension selon ton statut, ton CA et ton âge. Compare les trimestres et points acquis par régime.",
    color: "#8b5cf6",
  },
  {
    icon: BadgePercent,
    title: "Simulation ACRE",
    desc: "Calcule tes économies URSSAF avec l'ACRE sur 1 an, statut par statut. Micro, EURL et SASU comparés.",
    color: "#06b6d4",
  },
];

function FeatureCard({ f }: { f: { icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; title: string; desc: string; color: string }; }) {
  return (
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
  );
}

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

        {/* Free features */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
          {FREE_FEATURES.map((f) => (
            <FeatureCard key={f.title} f={f} />
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

        {/* Pro features */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {PRO_FEATURES.map((f) => (
            <div key={f.title} className="relative">
              <FeatureCard f={f} />
              <span className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-[#5682F2] to-[#F4BE7E] text-white px-2 py-0.5 rounded-full">
                Pro
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
