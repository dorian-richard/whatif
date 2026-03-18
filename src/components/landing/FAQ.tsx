"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { AnimateOnScroll } from "./AnimateOnScroll";

const QUESTIONS = [
  {
    q: "J\u2019ai un tableur Excel, pourquoi Freelens ?",
    a: "Ton tableur ne calcule pas l\u2019URSSAF, l\u2019IR progressif, le PFU ou la taxe PUMa. Et il ne se met pas \u00e0 jour quand les taux changent. Freelens fait tout \u00e7a automatiquement avec les vrais bar\u00e8mes 2026, en 2 minutes.",
  },
  {
    q: "Les calculs sont-ils fiables ? Mon comptable dit que...",
    a: "Le moteur utilise les taux URSSAF 2026, le bar\u00e8me IR progressif, l\u2019IS progressif (15%/25%), le PFU \u00e0 31,4%, l\u2019abattement 10% frais pro et la taxe PUMa. Ce sont les m\u00eames chiffres que ton comptable, sauf que tu les as en temps r\u00e9el, pas 3 mois apr\u00e8s. Freelens ne remplace pas un expert-comptable, il te permet de comprendre tes chiffres avant de lui parler.",
  },
  {
    q: "Je suis en micro, \u00e7a me concerne ?",
    a: "Surtout toi. Le simulateur te montre exactement combien tu gagnes vraiment apr\u00e8s URSSAF et IR. Et quand ton CA approche les seuils, tu vois en un clic si l\u2019EURL ou la SASU te ferait gagner plus.",
  },
  {
    q: "Quelle diff\u00e9rence entre Free et Pro ?",
    a: "Le plan Free te donne le dashboard avec projections 12 mois (1 client, 1 sc\u00e9nario). Le plan Pro d\u00e9bloque tout : clients illimit\u00e9s, comparateur de statuts, facturation PDF, pipeline commercial, calendrier fiscal, tr\u00e9sorerie, benchmark TJM, simulation retraite/ACRE et l\u2019assistant IA Facto.",
  },
  {
    q: "Mes donn\u00e9es sont-elles en s\u00e9curit\u00e9 ?",
    a: "Oui. Tes donn\u00e9es sont stock\u00e9es sur des serveurs europ\u00e9ens (Paris) avec chiffrement. L\u2019IA Facto tourne sur AWS Bedrock en Europe \u2014 tes donn\u00e9es ne quittent pas l\u2019UE. On ne revend rien, et tu peux supprimer ton compte \u00e0 tout moment.",
  },
  {
    q: "Je peux tester sans payer ?",
    a: "Oui. Essai Pro gratuit de 7 jours, sans carte bancaire. Tu testes tout, et si \u00e7a te pla\u00eet pas, tu ne paies rien. Annulation en 1 clic depuis les param\u00e8tres.",
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
