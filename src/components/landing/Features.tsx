import { SlidersHorizontal, BarChart3, Shield, Zap, Target, Gauge } from "@/components/ui/icons";

const FEATURES = [
  {
    icon: SlidersHorizontal,
    title: "Simule n'importe quel scénario",
    desc: "Vacances, hausse de TJM, perte d'un client, passage à 4 jours... Ajuste les curseurs et vois l'impact instantanément.",
    color: "#5682F2",
  },
  {
    icon: BarChart3,
    title: "Projection sur 12 mois",
    desc: "Visualise ton CA, ton revenu net et ta trésorerie mois par mois avec la saisonnalité réelle des jours ouvrés.",
    color: "#F4BE7E",
  },
  {
    icon: Shield,
    title: "Score santé business",
    desc: "Météo, runway, dépendance client, taux d'occupation — une vue complète de la solidité de ton activité.",
    color: "#4ade80",
  },
  {
    icon: Target,
    title: "Multi-clients, multi-tarifs",
    desc: "TJM, forfait, mission ponctuelle. Chaque client a son mode de facturation et son impact propre.",
    color: "#a78bfa",
  },
  {
    icon: Gauge,
    title: "Charges & fiscalité réelles",
    desc: "Micro, EURL IR/IS, SASU IS. Salaire vs dividendes, URSSAF, IS, IR, PFU — tout est pris en compte.",
    color: "#f87171",
  },
  {
    icon: Zap,
    title: "Temps réel, zéro attente",
    desc: "Chaque modification est recalculée instantanément. Pas de chargement, pas de serveur, tout est local.",
    color: "#fbbf24",
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
            Dashboard, simulateur, scénarios et suivi fiscal réunis en un seul outil.
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
