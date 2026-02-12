import Link from "next/link";
import { Sparkles } from "@/components/ui/icons";

export function Hero() {
  return (
    <section className="pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-sm font-medium mb-8">
          <Sparkles className="size-4" /> Simulateur de decisions freelance
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
          Chaque decision a un prix.
          <br />
          <span className="text-indigo-600">Connais-le avant de la prendre.</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
          Vacances, hausse de tarifs, perte d&apos;un client, passage a 4 jours...
          WhatIf simule l&apos;impact sur tes 12 prochains mois en temps reel.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/onboarding"
            className="px-8 py-3.5 bg-indigo-600 text-white rounded-xl text-lg font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
          >
            Essayer gratuitement &rarr;
          </Link>
          <a
            href="#demo"
            className="px-8 py-3.5 bg-white text-gray-700 rounded-xl text-lg font-semibold hover:bg-gray-50 transition-colors border border-gray-200"
          >
            Voir la demo
          </a>
        </div>
        <p className="text-sm text-gray-400 mt-4">
          Gratuit pour 3 clients &middot; Pas de carte bancaire requise
        </p>
      </div>
    </section>
  );
}
