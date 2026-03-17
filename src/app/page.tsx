"use client";

import { useState, useEffect } from "react";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { Demo } from "@/components/landing/Demo";
import { Testimonials } from "@/components/landing/Testimonials";
import { Pricing } from "@/components/landing/Pricing";
import { Founder } from "@/components/landing/Founder";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { FAQ } from "@/components/landing/FAQ";
import { Comparison } from "@/components/landing/Comparison";
import { TJMCalculator } from "@/components/landing/TJMCalculator";
import { Facto } from "@/components/landing/Facto";
import { ThemeToggle } from "@/components/ThemeToggle";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Freelens",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    description:
      "Le copilote financier des freelances en France : simulateur de revenus, comparateur de statuts, pipeline commercial, suivi des paiements, calendrier fiscal, trésorerie prévisionnelle et benchmark TJM.",
    url: "https://freelens.io",
    offers: [
      {
        "@type": "Offer",
        price: "0",
        priceCurrency: "EUR",
        description: "Plan Free — Simulateur, comparateur, benchmark",
      },
      {
        "@type": "Offer",
        price: "9",
        priceCurrency: "EUR",
        description: "Plan Pro — Tous les outils, clients illimités",
      },
    ],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "120",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Freelens",
    url: "https://freelens.io",
    logo: "https://freelens.io/logo.webp",
    description: "Le copilote financier des freelances. Simulateur de revenus, comparateur de statuts, pipeline commercial, suivi des paiements, calendrier fiscal et trésorerie prévisionnelle.",
    sameAs: [
      "https://www.linkedin.com/in/dorianri/",
      "https://x.com/dorian__richard",
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Freelens, c\u2019est quoi exactement ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Freelens est le copilote financier des freelances en France. Simulateur de revenus, comparateur de statuts (micro, EURL IR/IS, SASU IR/IS, portage), facturation avec devis et factures PDF, pipeline commercial, calendrier fiscal, trésorerie prévisionnelle et benchmark TJM — tout en un.",
        },
      },
      {
        "@type": "Question",
        name: "Qu\u2019est-ce que je peux faire avec Freelens ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Simuler tes revenus nets mois par mois, comparer les statuts juridiques avec mix salaire/dividendes optimisé, créer devis et factures PDF, gérer ton pipeline de prospects, suivre tes paiements, anticiper ta trésorerie sur 12 mois, consulter ton calendrier fiscal, analyser tes tendances YoY, et calculer le TJM pour atteindre ton objectif de revenu.",
        },
      },
      {
        "@type": "Question",
        name: "Mes données sont-elles en sécurité ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Oui. Tes données sont stockées sur des serveurs européens avec chiffrement de bout en bout. Nous ne revendons aucune donnée et tu peux supprimer ton compte à tout moment.",
        },
      },
      {
        "@type": "Question",
        name: "Quelle différence entre Free et Pro ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Le plan Free te donne accès au dashboard avec projections 12 mois et à l\u2019objectif revenu (1 client, 1 scénario). Le plan Pro débloque tout : clients et scénarios illimités, comparateur de statuts avec mix salaire/dividendes, devis et factures PDF, suivi des paiements, pipeline commercial, calendrier fiscal, trésorerie, tendances YoY, simulation retraite/ACRE, benchmark TJM (27 métiers), diagnostic financier et export PDF/CSV.",
        },
      },
      {
        "@type": "Question",
        name: "Les calculs sont-ils fiables ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Le moteur utilise les taux URSSAF 2026, le barème IR progressif, l\u2019IS progressif (15%/25%), le PFU à 31,4%, l\u2019abattement 10% frais pro sur les salaires, et la taxe PUMa sur les dividendes. Tous les statuts sont supportés : micro, EI, EURL IR/IS, SASU IR/IS, portage.",
        },
      },
      {
        "@type": "Question",
        name: "Comment fonctionne le simulateur de revenus ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Tu renseignes tes clients (TJM, forfait ou mission), ton statut juridique, tes jours travaillés et tes vacances. Le simulateur calcule ton CA et ton revenu net mois par mois sur 12 mois, en intégrant la saisonnalité, les cotisations URSSAF et l\u2019impôt sur le revenu. Tu peux créer plusieurs scénarios pour comparer différentes stratégies.",
        },
      },
      {
        "@type": "Question",
        name: "Puis-je créer des devis et factures ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Oui. L\u2019outil de facturation intégré gère devis et factures avec numérotation automatique, TVA configurable, conditions de paiement, export PDF professionnel, conversion devis → facture en 1 clic, et détection automatique des retards.",
        },
      },
      {
        "@type": "Question",
        name: "À quoi sert le comparateur de statuts ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Il compare côte à côte les statuts juridiques (micro-entreprise, EI, EURL IR/IS, SASU IR/IS, portage salarial) sur la base de ton CA réel. Tu vois immédiatement le net après charges et impôts pour chaque statut, ce qui t\u2019aide à choisir le plus avantageux pour ta situation.",
        },
      },
      {
        "@type": "Question",
        name: "Que fait le pipeline commercial ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "C\u2019est un mini-CRM intégré pour suivre tes prospects. Tu organises tes opportunités en colonnes (Lead, Devis envoyé, Signé, Actif) avec drag & drop, tu estimes le CA potentiel et la probabilité de closing. Le pipeline pondéré te donne une vision réaliste de ton CA à venir.",
        },
      },
      {
        "@type": "Question",
        name: "Comment fonctionne le simulateur de trésorerie ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Il projette ton solde bancaire sur 12 mois en intégrant tes entrées (CA clients) et tes sorties (URSSAF, IR, IS, charges fixes). Tu définis un seuil d\u2019alerte et le simulateur t\u2019avertit si ta trésorerie risque de passer en dessous. Idéal pour anticiper les mois creux.",
        },
      },
      {
        "@type": "Question",
        name: "Que montre l\u2019historique & tendances ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Il enregistre tes données mois après mois (CA, net, TJM moyen, nombre de clients) et les compare année après année. Tu visualises ta progression avec des graphiques Year over Year et tu identifies les tendances de ton activité.",
        },
      },
      {
        "@type": "Question",
        name: "Combien facturer en freelance ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Freelens inclut un benchmark TJM basé sur 27 métiers tech et un outil Objectif Revenu qui calcule le TJM nécessaire pour atteindre ton revenu net cible, en tenant compte de ton statut juridique, tes charges et tes vacances. Tu peux aussi comparer les statuts pour voir lequel te laisse le plus de net.",
        },
      },
      {
        "@type": "Question",
        name: "À quoi servent le calendrier fiscal et le suivi des paiements ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Le calendrier fiscal affiche toutes tes échéances URSSAF, TVA et impôts selon ton statut, pour ne plus jamais rater une date. Le suivi des paiements te permet de tracker les factures envoyées, reçues et en retard pour chaque client.",
        },
      },
      {
        "@type": "Question",
        name: "Quels moyens de paiement acceptez-vous ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Nous acceptons les cartes bancaires (Visa, Mastercard, Amex) via Stripe. Le paiement est sécurisé et conforme PCI-DSS. Tu peux choisir un abonnement mensuel (9€/mois) ou annuel (79€/an, soit 2 mois offerts).",
        },
      },
      {
        "@type": "Question",
        name: "Puis-je être remboursé ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Tu bénéficies d\u2019un essai gratuit de 7 jours sans carte bancaire. Ensuite, tu peux annuler ton abonnement à tout moment depuis tes paramètres. L\u2019annulation prend effet à la fin de la période en cours.",
        },
      },
    ],
  },
];

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user);
    });
  }, []);

  return (
    <div className="snap-container bg-background">
      {jsonLd.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      {/* Floating nav */}
      <nav className="fixed top-0 w-full z-50 bg-background/70 backdrop-blur-xl border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.webp" alt="Freelens" className="h-8 sm:h-9 w-auto opacity-80 hidden dark:block" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-light.webp" alt="Freelens" className="h-8 sm:h-9 w-auto opacity-80 block dark:hidden" />
            <span className="font-bold text-foreground text-base sm:text-lg">Freelens</span>
          </div>
          <div className="flex items-center gap-3 sm:gap-6">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">
              Fonctionnalités
            </a>
            <a href="#simulation" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">
              Simulation
            </a>
            <a href="#calculateur" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">
              Objectif TJM
            </a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">
              Tarifs
            </a>
            <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">
              Blog
            </Link>
            <ThemeToggle />
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="px-4 sm:px-5 py-2 bg-gradient-to-r from-[#5682F2] to-[#7C5BF2] text-white rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">
                  Connexion
                </Link>
                <Link
                  href="/signup"
                  className="px-4 sm:px-5 py-2 bg-gradient-to-r from-[#5682F2] to-[#7C5BF2] text-white rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  Essai gratuit
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <Hero />
      <Features />
      <Facto />
      <Demo />
      <TJMCalculator />
      <Testimonials />
      <Founder />
      <Comparison />
      <Pricing isLoggedIn={isLoggedIn} />
      <FAQ />
      <FinalCTA />
    </div>
  );
}
