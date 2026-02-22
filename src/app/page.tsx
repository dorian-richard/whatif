"use client";

import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { Demo } from "@/components/landing/Demo";
import { Testimonials } from "@/components/landing/Testimonials";
import { Pricing } from "@/components/landing/Pricing";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { ThemeToggle } from "@/components/ThemeToggle";
import Link from "next/link";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Freelens",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  description:
    "Simulateur de revenus, comparateur de statuts juridiques, benchmark TJM et outils de d\u00e9cision pour freelances en France.",
  url: "https://freelens.io",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "EUR",
    description: "Gratuit",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    ratingCount: "120",
  },
};

export default function Home() {
  return (
    <div className="snap-container bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Floating nav */}
      <nav className="fixed top-0 w-full z-50 bg-background/70 backdrop-blur-xl border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Freelens" className="h-9 w-auto opacity-80" />
            <span className="font-bold text-foreground text-lg">Freelens</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">
              Fonctionnalités
            </a>
            <a href="#demo" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">
              Démo
            </a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">
              Tarifs
            </a>
            <ThemeToggle />
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Connexion
            </Link>
            <Link
              href="/onboarding"
              className="px-5 py-2 bg-gradient-to-r from-[#5682F2] to-[#7C5BF2] text-white rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Essai gratuit
            </Link>
          </div>
        </div>
      </nav>

      <Hero />
      <Features />
      <Demo />
      <Testimonials />
      <Pricing />
      <FinalCTA />
    </div>
  );
}
