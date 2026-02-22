"use client";

import { useState } from "react";
import Link from "next/link";

const FREE_FEATURES = [
  "Simulateur temps réel",
  "Dashboard & projections",
  "3 clients max",
  "1 scénario sauvegardé",
  "Graphique 12 mois",
  "Paramètres de base",
];

const FREE_LIMITATIONS = [
  "Benchmark TJM marché",
  "Objectif Revenu inversé",
  "Calendrier Fiscal",
  "Métriques émotionnelles",
  "Export PDF",
];

const PRO_FEATURES = [
  "Tout du plan Free",
  "Clients illimités",
  "Scénarios illimités",
  "Benchmark TJM marché",
  "Objectif Revenu inversé",
  "Calendrier Fiscal",
  "Tableau mensuel détaillé",
  "Métriques émotionnelles",
  "Export PDF",
  "Support prioritaire",
];

export function Pricing() {
  const [annual, setAnnual] = useState(false);

  const proPrice = annual ? 79 : 9;
  const proPeriod = annual ? "/an" : "/mois";
  const savings = annual ? "2 mois offerts" : null;

  return (
    <section id="pricing" className="snap-section relative flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/2 right-1/4 w-[500px] h-[500px] bg-[#a78bfa]/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-4xl mx-auto px-6 py-20 w-full">
        <div className="text-center mb-10">
          <span className="text-sm font-medium text-[#a78bfa] uppercase tracking-widest mb-3 block">Tarifs</span>
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Simple et{" "}
            <span className="fn-gradient-text">transparent</span>
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Commence gratuitement, passe à Pro pour débloquer les outils avancés.
          </p>

          {/* Toggle mensuel/annuel */}
          <div className="inline-flex items-center gap-3 bg-muted/50 rounded-full p-1 border border-border">
            <button
              onClick={() => setAnnual(false)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                !annual
                  ? "bg-[#5682F2] text-white shadow-lg shadow-[#5682F2]/25"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                annual
                  ? "bg-[#5682F2] text-white shadow-lg shadow-[#5682F2]/25"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Annuel
              <span className="text-[10px] font-bold bg-[#F4BE7E] text-[#07070e] px-2 py-0.5 rounded-full">
                -27%
              </span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Free */}
          <div className="relative rounded-2xl p-6 border bg-muted/40 border-border hover:bg-muted/50 transition-all duration-300">
            <h3 className="text-lg font-bold text-foreground">Free</h3>
            <p className="text-sm text-muted-foreground/60 mb-4">Pour découvrir Freelens</p>
            <div className="mb-6">
              <span className="text-4xl font-bold text-foreground">0&euro;</span>
              <span className="text-muted-foreground/60 ml-1">pour toujours</span>
            </div>
            <ul className="space-y-2.5 mb-6">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <svg className="size-4 text-[#4ade80] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
              {FREE_LIMITATIONS.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-muted-foreground/40">
                  <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="block text-center py-3 rounded-full text-sm font-semibold transition-all bg-muted/30 text-foreground border border-border hover:bg-muted"
            >
              Commencer gratuitement
            </Link>
          </div>

          {/* Pro */}
          <div className="relative rounded-2xl p-6 border bg-gradient-to-b from-[#5682F2]/10 to-transparent border-[#5682F2]/30 fn-glow transition-all duration-300">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#5682F2] to-[#F4BE7E] text-white text-xs font-semibold px-4 py-1 rounded-full">
              Populaire
            </span>
            <h3 className="text-lg font-bold text-foreground">Pro</h3>
            <p className="text-sm text-muted-foreground/60 mb-4">Pour les freelances sérieux</p>
            <div className="mb-6 flex items-baseline gap-1">
              <span className="text-4xl font-bold text-foreground">{proPrice}&euro;</span>
              <span className="text-muted-foreground/60">{proPeriod}</span>
              {savings && (
                <span className="ml-2 text-xs font-medium text-[#F4BE7E] bg-[#F4BE7E]/10 px-2 py-0.5 rounded-full">
                  {savings}
                </span>
              )}
            </div>
            <ul className="space-y-2.5 mb-6">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <svg className="size-4 text-[#4ade80] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="block text-center py-3 rounded-full text-sm font-semibold transition-all bg-gradient-to-r from-[#5682F2] to-[#7C5BF2] text-white hover:opacity-90"
            >
              Démarrer l&apos;essai Pro
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
