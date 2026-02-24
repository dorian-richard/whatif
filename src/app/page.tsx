"use client";

import { useState, useEffect } from "react";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { Demo } from "@/components/landing/Demo";
import { Testimonials } from "@/components/landing/Testimonials";
import { Pricing } from "@/components/landing/Pricing";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { FAQ } from "@/components/landing/FAQ";
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
      "Simulateur de revenus, comparateur de statuts juridiques, benchmark TJM et outils de décision pour freelances en France.",
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
        price: "9.99",
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
    logo: "https://freelens.io/logo.png",
    description: "Le copilote financier des freelances. Simulateur de revenus, comparateur de statuts et outils de décision.",
    sameAs: [],
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
          text: "Freelens est un simulateur de revenus conçu pour les freelances en France. Il te permet de visualiser l\u2019impact de tes décisions (vacances, hausse de TJM, perte de client\u2026) sur ton CA et ton net annuel, mois par mois.",
        },
      },
      {
        "@type": "Question",
        name: "Mes données sont-elles en sécurité ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Oui. Tes données sont stockées dans une base PostgreSQL hébergée sur Supabase (serveurs européens). Les connexions sont chiffrées de bout en bout (TLS). Nous ne revendons aucune donnée et tu peux supprimer ton compte à tout moment.",
        },
      },
      {
        "@type": "Question",
        name: "Quelle différence entre Free et Pro ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Le plan Free te donne accès au simulateur avec 3 clients max et 1 scénario sauvegardé. Le plan Pro débloque tout : clients illimités, scénarios illimités, export PDF, tableau mensuel détaillé et métriques émotionnelles.",
        },
      },
      {
        "@type": "Question",
        name: "Les calculs sont-ils fiables ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Le moteur de simulation utilise les taux officiels URSSAF 2024/2025 et les barèmes d\u2019IR en vigueur. Les cotisations sont calculées selon ton statut juridique réel (micro, EI, EURL, SASU, portage). Tu peux aussi ajuster manuellement les taux.",
        },
      },
      {
        "@type": "Question",
        name: "Puis-je exporter mes résultats ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Oui, avec le plan Pro tu peux exporter tes projections en PDF pour les partager avec ton comptable, ta banque ou pour tes archives personnelles.",
        },
      },
      {
        "@type": "Question",
        name: "Combien facturer en freelance ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Freelens inclut un benchmark TJM basé sur 27 métiers et un outil Objectif Revenu qui calcule le TJM nécessaire pour atteindre ton revenu net cible, en tenant compte de ton statut juridique, tes charges et tes vacances.",
        },
      },
      {
        "@type": "Question",
        name: "Quels moyens de paiement acceptez-vous ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Nous acceptons les cartes bancaires (Visa, Mastercard, Amex) via Stripe. Le paiement est sécurisé et conforme PCI-DSS. Tu peux choisir un abonnement mensuel ou annuel.",
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
            <img src="/logo.png" alt="Freelens" className="h-8 sm:h-9 w-auto opacity-80 hidden dark:block" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-light.png" alt="Freelens" className="h-8 sm:h-9 w-auto opacity-80 block dark:hidden" />
            <span className="font-bold text-foreground text-base sm:text-lg">Freelens</span>
          </div>
          <div className="flex items-center gap-3 sm:gap-6">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">
              Fonctionnalités
            </a>
            <a href="#simulation" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">
              Simulation
            </a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">
              Tarifs
            </a>
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
      <Demo />
      <Testimonials />
      <Pricing isLoggedIn={isLoggedIn} />
      <FAQ />
      <FinalCTA />
    </div>
  );
}
