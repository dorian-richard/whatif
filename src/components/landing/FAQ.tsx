"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const QUESTIONS = [
  {
    q: "Freelens, c\u2019est quoi exactement ?",
    a: "Freelens est un simulateur de revenus con\u00e7u pour les freelances en France. Il te permet de visualiser l\u2019impact de tes d\u00e9cisions (vacances, hausse de TJM, perte de client\u2026) sur ton CA et ton net annuel, mois par mois.",
  },
  {
    q: "Mes donn\u00e9es sont-elles en s\u00e9curit\u00e9 ?",
    a: "Oui. Tes donn\u00e9es sont stock\u00e9es dans une base PostgreSQL h\u00e9berg\u00e9e sur Supabase (serveurs europ\u00e9ens). Les connexions sont chiffr\u00e9es de bout en bout (TLS). Nous ne revendons aucune donn\u00e9e et tu peux supprimer ton compte \u00e0 tout moment.",
  },
  {
    q: "Quelle diff\u00e9rence entre Free et Pro ?",
    a: "Le plan Free te donne acc\u00e8s au simulateur avec 3 clients max et 1 sc\u00e9nario sauvegard\u00e9. Le plan Pro d\u00e9bloque tout : clients illimit\u00e9s, sc\u00e9narios illimit\u00e9s, export PDF, tableau mensuel d\u00e9taill\u00e9 et m\u00e9triques \u00e9motionnelles.",
  },
  {
    q: "Les calculs sont-ils fiables ?",
    a: "Le moteur de simulation utilise les taux officiels URSSAF 2024/2025 et les barèmes d\u2019IR en vigueur. Les cotisations sont calcul\u00e9es selon ton statut juridique r\u00e9el (micro, EI, EURL, SASU, portage). Tu peux aussi ajuster manuellement les taux.",
  },
  {
    q: "Puis-je exporter mes r\u00e9sultats ?",
    a: "Oui, avec le plan Pro tu peux exporter tes projections en PDF pour les partager avec ton comptable, ta banque ou pour tes archives personnelles.",
  },
  {
    q: "Quels moyens de paiement acceptez-vous ?",
    a: "Nous acceptons les cartes bancaires (Visa, Mastercard, Amex) via Stripe. Le paiement est s\u00e9curis\u00e9 et conforme PCI-DSS. Tu peux choisir un abonnement mensuel ou annuel.",
  },
  {
    q: "Puis-je \u00eatre rembours\u00e9 ?",
    a: "Tu peux annuler ton abonnement \u00e0 tout moment depuis tes param\u00e8tres. L\u2019annulation prend effet \u00e0 la fin de la p\u00e9riode en cours. Nous ne proposons pas de remboursement partiel, mais l\u2019essai gratuit de 14 jours te permet de tester sans engagement.",
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
        <div className="text-center mb-12">
          <span className="text-sm font-medium text-[#a78bfa] uppercase tracking-widest mb-3 block">FAQ</span>
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Questions{" "}
            <span className="fn-gradient-text">fréquentes</span>
          </h2>
        </div>

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
      </div>
    </section>
  );
}
