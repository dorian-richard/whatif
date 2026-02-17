"use client";

import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { Demo } from "@/components/landing/Demo";
import { Testimonials } from "@/components/landing/Testimonials";
import { Pricing } from "@/components/landing/Pricing";
import { FinalCTA } from "@/components/landing/FinalCTA";
import Link from "next/link";

export default function Home() {
  return (
    <div className="snap-container bg-[#07070e]">
      {/* Floating nav */}
      <nav className="fixed top-0 w-full z-50 bg-[#07070e]/70 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="Freelens" className="w-8 h-8 rounded-xl" />
            <span className="font-bold text-white text-lg">Freelens</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#features" className="text-sm text-[#8b8b9e] hover:text-white transition-colors hidden sm:inline">
              Fonctionnalités
            </a>
            <a href="#demo" className="text-sm text-[#8b8b9e] hover:text-white transition-colors hidden sm:inline">
              Démo
            </a>
            <a href="#pricing" className="text-sm text-[#8b8b9e] hover:text-white transition-colors hidden sm:inline">
              Tarifs
            </a>
            <Link href="/login" className="text-sm text-[#8b8b9e] hover:text-white transition-colors">
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
