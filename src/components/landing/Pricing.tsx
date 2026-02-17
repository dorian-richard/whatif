import Link from "next/link";

const PLANS = [
  {
    name: "Free",
    price: "0",
    period: "",
    description: "Pour découvrir Freelens",
    features: [
      "3 clients max",
      "1 scénario sauvegardé",
      "2 scénarios presets",
      "Simulateur temps réel",
      "Graphique de projection",
    ],
    limitations: [
      "Pas d'export PDF",
      "Pas de tableau mensuel",
      "Pas de métriques avancées",
    ],
    cta: "Commencer gratuitement",
    href: "/onboarding",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "9",
    period: "/mois",
    description: "Pour les freelances sérieux",
    features: [
      "Clients illimités",
      "Scénarios illimités",
      "6 scénarios presets",
      "Simulateur temps réel",
      "Graphique de projection",
      "Export PDF",
      "Tableau mensuel détaillé",
      "Métriques émotionnelles",
      "Support prioritaire",
    ],
    limitations: [],
    cta: "Démarrer l'essai Pro",
    href: "/onboarding",
    highlighted: true,
    badge: "Populaire",
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="snap-section relative flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/2 right-1/4 w-[500px] h-[500px] bg-[#a78bfa]/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-4xl mx-auto px-6 py-20 w-full">
        <div className="text-center mb-14">
          <span className="text-sm font-medium text-[#a78bfa] uppercase tracking-widest mb-3 block">Tarifs</span>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Simple et{" "}
            <span className="fn-gradient-text">transparent</span>
          </h2>
          <p className="text-lg text-[#8b8b9e]">
            Commence gratuitement, passe à Pro quand tu es prêt.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-6 border transition-all duration-300 ${
                plan.highlighted
                  ? "bg-gradient-to-b from-[#5682F2]/10 to-transparent border-[#5682F2]/30 fn-glow"
                  : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.05]"
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#5682F2] to-[#F4BE7E] text-white text-xs font-semibold px-4 py-1 rounded-full">
                  {plan.badge}
                </span>
              )}
              <h3 className="text-lg font-bold text-white">{plan.name}</h3>
              <p className="text-sm text-[#5a5a6e] mb-4">{plan.description}</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">{plan.price}&euro;</span>
                <span className="text-[#5a5a6e]">{plan.period}</span>
              </div>
              <ul className="space-y-2.5 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-[#c0c0d0]">
                    <svg className="size-4 text-[#4ade80] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
                {plan.limitations.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-[#5a5a6e]">
                    <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className={`block text-center py-3 rounded-full text-sm font-semibold transition-all ${
                  plan.highlighted
                    ? "bg-gradient-to-r from-[#5682F2] to-[#7C5BF2] text-white hover:opacity-90"
                    : "bg-white/5 text-white border border-white/10 hover:bg-white/10"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-[#5a5a6e] mt-8">
          Aussi disponible : <strong className="text-white">79&euro;/an</strong> (2 mois offerts)
        </p>
      </div>
    </section>
  );
}
