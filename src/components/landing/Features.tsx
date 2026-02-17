import { SlidersHorizontal, BarChart3, Shield, Zap, Target, Gauge } from "@/components/ui/icons";

const FEATURES = [
  {
    icon: SlidersHorizontal,
    title: "Et si je perdais un client ?",
    desc: "Vacances, hausse de TJM, passage à 4 jours, perte d'un client — simule le scénario, vois le résultat avant de décider.",
    color: "#5682F2",
  },
  {
    icon: BarChart3,
    title: "12 mois de visibilité",
    desc: "CA, revenu net, trésorerie mois par mois. Avec les vrais jours ouvrés, pas une moyenne approximative.",
    color: "#F4BE7E",
  },
  {
    icon: Shield,
    title: "Ta météo financière",
    desc: "Runway, dépendance client, taux d'occupation. En un coup d'œil, tu sais si ton activité tient la route.",
    color: "#4ade80",
  },
  {
    icon: Target,
    title: "Chaque client, son modèle",
    desc: "TJM, forfait mensuel, mission ponctuelle. Mixe les modes de facturation comme dans la vraie vie.",
    color: "#a78bfa",
  },
  {
    icon: Gauge,
    title: "La vraie fiscalité, pas un tableur",
    desc: "Micro, EURL, SASU. Salaire, dividendes, mixte. URSSAF, IS, IR, PFU — les vrais calculs, automatiquement.",
    color: "#f87171",
  },
  {
    icon: Zap,
    title: "Construit pour les freelances",
    desc: "Pas un outil générique adapté. Freelens est pensé pour tes décisions : renégocier un TJM, changer de statut, prendre des congés.",
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
