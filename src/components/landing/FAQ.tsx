"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const QUESTIONS = [
  {
    q: "Freelens, c\u2019est quoi exactement ?",
    a: "Freelens est le copilote financier des freelances en France. Bien plus qu\u2019un simulateur : c\u2019est une plateforme compl\u00e8te qui combine simulateur de revenus, comparateur de statuts juridiques, pipeline commercial, suivi des paiements, calendrier fiscal, simulateur de tr\u00e9sorerie, historique avec tendances YoY, et benchmark TJM march\u00e9. Tout ce qu\u2019il te faut pour piloter ton activit\u00e9.",
  },
  {
    q: "Qu\u2019est-ce que je peux faire avec Freelens ?",
    a: "Simuler tes revenus nets mois par mois selon ton statut, comparer les statuts juridiques (micro, EI, EURL, SASU, portage), g\u00e9rer ton pipeline de prospects, suivre tes paiements clients, anticiper ta tr\u00e9sorerie sur 12 mois, consulter le calendrier de tes \u00e9ch\u00e9ances fiscales, analyser tes tendances ann\u00e9e apr\u00e8s ann\u00e9e, et calculer le TJM id\u00e9al pour atteindre ton objectif de revenu.",
  },
  {
    q: "Mes donn\u00e9es sont-elles en s\u00e9curit\u00e9 ?",
    a: "Oui. Tes donn\u00e9es sont stock\u00e9es sur des serveurs europ\u00e9ens avec chiffrement de bout en bout. Nous ne revendons aucune donn\u00e9e et tu peux supprimer ton compte \u00e0 tout moment.",
  },
  {
    q: "Quelle diff\u00e9rence entre Free et Pro ?",
    a: "Le plan Free te donne acc\u00e8s au simulateur, au comparateur de statuts, \u00e0 l\u2019objectif revenu, \u00e0 la transition CDI \u2192 freelance et au benchmark TJM (3 clients max, 1 sc\u00e9nario). Le plan Pro d\u00e9bloque tout : clients et sc\u00e9narios illimit\u00e9s, suivi des paiements, pipeline commercial, calendrier fiscal, simulateur de tr\u00e9sorerie, historique & tendances, simulation retraite & ACRE, et export PDF & CSV.",
  },
  {
    q: "Les calculs sont-ils fiables ?",
    a: "Le moteur de simulation utilise les taux officiels URSSAF 2025 et les bar\u00e8mes d\u2019IR en vigueur. Les cotisations sont calcul\u00e9es selon ton statut juridique r\u00e9el (micro, EI, EURL IR/IS, SASU IR/IS, portage). Le simulateur de tr\u00e9sorerie int\u00e8gre URSSAF, IR et IS pour une projection fid\u00e8le.",
  },
  {
    q: "Comment fonctionne le simulateur de revenus ?",
    a: "Tu renseignes tes clients (TJM, forfait ou mission), ton statut juridique, tes jours travaill\u00e9s et tes vacances. Le simulateur calcule ton CA et ton revenu net mois par mois sur 12 mois, en int\u00e9grant la saisonnalit\u00e9, les cotisations URSSAF et l\u2019imp\u00f4t sur le revenu. Tu peux cr\u00e9er plusieurs sc\u00e9narios pour comparer diff\u00e9rentes strat\u00e9gies.",
  },
  {
    q: "\u00c0 quoi sert le comparateur de statuts ?",
    a: "Il compare c\u00f4te \u00e0 c\u00f4te les statuts juridiques (micro-entreprise, EI, EURL IR/IS, SASU IR/IS, portage salarial) sur la base de ton CA r\u00e9el. Tu vois imm\u00e9diatement le net apr\u00e8s charges et imp\u00f4ts pour chaque statut, ce qui t\u2019aide \u00e0 choisir le plus avantageux pour ta situation.",
  },
  {
    q: "Que fait le pipeline commercial ?",
    a: "C\u2019est un mini-CRM int\u00e9gr\u00e9 pour suivre tes prospects. Tu organises tes opportunit\u00e9s en colonnes (Lead, Devis envoy\u00e9, Sign\u00e9, Actif) avec drag & drop, tu estimes le CA potentiel et la probabilit\u00e9 de closing. Le pipeline pondr\u00e9 te donne une vision r\u00e9aliste de ton CA \u00e0 venir.",
  },
  {
    q: "Comment fonctionne le simulateur de tr\u00e9sorerie ?",
    a: "Il projette ton solde bancaire sur 12 mois en int\u00e9grant tes entr\u00e9es (CA clients) et tes sorties (URSSAF, IR, IS, charges fixes). Tu d\u00e9finis un seuil d\u2019alerte et le simulateur t\u2019avertit si ta tr\u00e9sorerie risque de passer en dessous. Id\u00e9al pour anticiper les mois creux.",
  },
  {
    q: "Que montre l\u2019historique & tendances ?",
    a: "Il enregistre tes donn\u00e9es mois apr\u00e8s mois (CA, net, TJM moyen, nombre de clients) et les compare ann\u00e9e apr\u00e8s ann\u00e9e. Tu visualises ta progression avec des graphiques Year over Year et tu identifies les tendances de ton activit\u00e9.",
  },
  {
    q: "Combien facturer en freelance ?",
    a: "Freelens inclut un benchmark TJM bas\u00e9 sur 27 m\u00e9tiers tech et un outil Objectif Revenu qui calcule le TJM n\u00e9cessaire pour atteindre ton revenu net cible, en tenant compte de ton statut juridique, tes charges et tes vacances. Tu peux aussi comparer les statuts pour voir lequel te laisse le plus de net.",
  },
  {
    q: "\u00c0 quoi servent le calendrier fiscal et le suivi des paiements ?",
    a: "Le calendrier fiscal affiche toutes tes \u00e9ch\u00e9ances URSSAF, TVA et imp\u00f4ts selon ton statut, pour ne plus jamais rater une date. Le suivi des paiements te permet de tracker les factures envoy\u00e9es, re\u00e7ues et en retard pour chaque client.",
  },
  {
    q: "Quels moyens de paiement acceptez-vous ?",
    a: "Nous acceptons les cartes bancaires (Visa, Mastercard, Amex) via Stripe. Le paiement est s\u00e9curis\u00e9 et conforme PCI-DSS. Tu peux choisir un abonnement mensuel (9\u20ac/mois) ou annuel (79\u20ac/an, soit 2 mois offerts).",
  },
  {
    q: "Puis-je \u00eatre rembours\u00e9 ?",
    a: "Tu b\u00e9n\u00e9ficies d\u2019un essai gratuit de 14 jours sans carte bancaire. Ensuite, tu peux annuler ton abonnement \u00e0 tout moment depuis tes param\u00e8tres. L\u2019annulation prend effet \u00e0 la fin de la p\u00e9riode en cours.",
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
            <span className="fn-gradient-text">fr&#233;quentes</span>
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
