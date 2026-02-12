import Link from "next/link";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    name: "Free",
    price: "0",
    period: "",
    description: "Pour decouvrir WhatIf",
    features: [
      "3 clients max",
      "1 scenario sauvegarde",
      "2 scenarios presets",
      "Simulateur en temps reel",
      "Graphique de projection",
    ],
    limitations: [
      "Pas d'export PDF",
      "Pas de tableau mensuel",
      "Pas de metriques emotionnelles",
    ],
    cta: "Commencer gratuitement",
    href: "/onboarding",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "9",
    period: "/mois",
    description: "Pour les freelances serieux",
    features: [
      "Clients illimites",
      "Scenarios illimites",
      "6 scenarios presets",
      "Simulateur en temps reel",
      "Graphique de projection",
      "Export PDF",
      "Tableau mensuel detaille",
      "Metriques emotionnelles",
      "Support prioritaire",
    ],
    limitations: [],
    cta: "Demarrer l'essai Pro",
    href: "/onboarding",
    highlighted: true,
    badge: "Populaire",
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Simple et transparent
          </h2>
          <p className="text-gray-500">
            Commence gratuitement, passe a Pro quand tu es pret.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "rounded-2xl p-6 border",
                plan.highlighted
                  ? "border-indigo-600 bg-white shadow-xl shadow-indigo-100 relative"
                  : "border-gray-200 bg-white"
              )}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  {plan.badge}
                </span>
              )}
              <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
              <p className="text-sm text-gray-400 mb-4">{plan.description}</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">{plan.price}&euro;</span>
                <span className="text-gray-400">{plan.period}</span>
              </div>
              <ul className="space-y-2 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="text-emerald-500">&#10003;</span> {f}
                  </li>
                ))}
                {plan.limitations.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-400">
                    <span>&mdash;</span> {f}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className={cn(
                  "block text-center py-2.5 rounded-xl text-sm font-semibold transition-colors",
                  plan.highlighted
                    ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          Aussi disponible : <strong>79&euro;/an</strong> (2 mois offerts)
        </p>
      </div>
    </section>
  );
}
