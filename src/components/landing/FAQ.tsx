"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { AnimateOnScroll } from "./AnimateOnScroll";

const QUESTIONS = [
  {
    q: "Freelens, c\u2019est quoi exactement ?",
    a: "Freelens est le copilote financier des freelances en France. Simulateur de revenus, comparateur de statuts (micro, EURL IR/IS, SASU IR/IS, portage), facturation avec devis et factures PDF, pipeline commercial, calendrier fiscal, tr\u00e9sorerie pr\u00e9visionnelle et benchmark TJM \u2014 tout en un.",
  },
  {
    q: "Quelle diff\u00e9rence entre Free et Pro ?",
    a: "Le plan Free te donne acc\u00e8s au dashboard avec projections 12 mois et \u00e0 l\u2019objectif revenu (1 client, 1 sc\u00e9nario). Le plan Pro d\u00e9bloque tout : clients et sc\u00e9narios illimit\u00e9s, comparateur de statuts avec mix salaire/dividendes, devis et factures PDF, suivi des paiements, pipeline commercial, calendrier fiscal, tr\u00e9sorerie, tendances YoY, simulation retraite/ACRE, benchmark TJM (27 m\u00e9tiers), diagnostic financier et export PDF/CSV.",
  },
  {
    q: "Les calculs sont-ils fiables ?",
    a: "Le moteur utilise les taux URSSAF 2026, le bar\u00e8me IR progressif, l\u2019IS progressif (15%/25%), le PFU \u00e0 31,4%, l\u2019abattement 10% frais pro sur les salaires, et la taxe PUMa sur les dividendes. Tous les statuts sont support\u00e9s : micro, EI, EURL IR/IS, SASU IR/IS, portage.",
  },
  {
    q: "Puis-je cr\u00e9er des devis et factures ?",
    a: "Oui. L\u2019outil de facturation int\u00e9gr\u00e9 g\u00e8re devis et factures avec num\u00e9rotation automatique, TVA configurable, conditions de paiement, export PDF professionnel, conversion devis \u2192 facture en 1 clic, et d\u00e9tection automatique des retards.",
  },
  {
    q: "Mes donn\u00e9es sont-elles en s\u00e9curit\u00e9 ?",
    a: "Oui. Tes donn\u00e9es sont stock\u00e9es sur des serveurs europ\u00e9ens avec chiffrement de bout en bout. Nous ne revendons aucune donn\u00e9e et tu peux supprimer ton compte \u00e0 tout moment.",
  },
  {
    q: "Quels moyens de paiement acceptez-vous ?",
    a: "Cartes bancaires (Visa, Mastercard, Amex) via Stripe. Paiement s\u00e9curis\u00e9 et conforme PCI-DSS. Abonnement mensuel (9\u20ac/mois) ou annuel (79\u20ac/an).",
  },
  {
    q: "Puis-je \u00eatre rembours\u00e9 ?",
    a: "Tu b\u00e9n\u00e9ficies d\u2019un essai gratuit de 7 jours sans carte bancaire. Ensuite, tu peux annuler ton abonnement \u00e0 tout moment depuis tes param\u00e8tres. L\u2019annulation prend effet \u00e0 la fin de la p\u00e9riode en cours.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="snap-section relative flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-[#a78bfa]/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20 w-full">
        <AnimateOnScroll>
          <div className="text-center mb-12">
            <span className="text-sm font-medium text-[#a78bfa] uppercase tracking-widest mb-3 block">FAQ</span>
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
              Questions{" "}
              <span className="fn-gradient-text">fr&#233;quentes</span>
            </h2>
          </div>
        </AnimateOnScroll>

        <AnimateOnScroll delay={0.1}>
        <div className="space-y-2">
          {QUESTIONS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div
                key={i}
                className="bg-muted/40 border border-border rounded-2xl overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left"
                >
                  <span className="text-sm font-semibold text-foreground pr-4">{item.q}</span>
                  <span
                    className={cn(
                      "size-6 rounded-full flex items-center justify-center shrink-0 transition-all duration-200",
                      isOpen
                        ? "bg-[#a78bfa]/15 text-[#a78bfa] rotate-45"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <svg className="size-3.5" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <line x1="7" y1="1" x2="7" y2="13" />
                      <line x1="1" y1="7" x2="13" y2="7" />
                    </svg>
                  </span>
                </button>
                <div
                  className={cn(
                    "overflow-hidden transition-all duration-200",
                    isOpen ? "max-h-60 opacity-100" : "max-h-0 opacity-0"
                  )}
                >
                  <p className="px-6 pb-5 text-sm text-muted-foreground leading-relaxed">
                    {item.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="text-center mt-6">
          <Link
            href="/faq"
            className="text-sm font-medium text-[#a78bfa] hover:text-[#a78bfa]/80 transition-colors"
          >
            Voir toutes les questions &rarr;
          </Link>
        </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
