import { Hero } from "@/components/landing/Hero";
import { Demo } from "@/components/landing/Demo";
import { Pricing } from "@/components/landing/Pricing";
import { Testimonials } from "@/components/landing/Testimonials";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-sm border-b border-gray-100 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-sm">
              🔮
            </div>
            <span className="font-bold text-gray-900">WhatIf</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#demo" className="text-sm text-gray-500 hover:text-gray-700 hidden sm:inline">
              Demo
            </a>
            <a href="#pricing" className="text-sm text-gray-500 hover:text-gray-700 hidden sm:inline">
              Tarifs
            </a>
            <Link
              href="/login"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Connexion
            </Link>
            <Link
              href="/onboarding"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
            >
              Essai gratuit
            </Link>
          </div>
        </div>
      </nav>

      <Hero />
      <Demo />
      <Testimonials />
      <Pricing />

      {/* Footer */}
      <footer className="py-10 px-4 border-t border-gray-100">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center text-white text-xs">
              🔮
            </div>
            <span className="text-sm text-gray-400">
              WhatIf &mdash; Simulateur de decisions freelance
            </span>
          </div>
          <div className="flex gap-6 text-sm text-gray-400">
            <a href="#" className="hover:text-gray-600">CGU</a>
            <a href="#" className="hover:text-gray-600">Confidentialite</a>
            <a href="#" className="hover:text-gray-600">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
