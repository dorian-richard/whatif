"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Scale, SlidersHorizontal, Receipt, Bot, Target, X } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

const GOALS = [
  {
    id: "compare",
    icon: Scale,
    title: "Comparer les statuts",
    desc: "Micro, EURL, SASU — lequel me laisse le plus de net ?",
    href: "/comparateur",
    color: "from-[#5682F2] to-[#7C5BF2]",
  },
  {
    id: "simulate",
    icon: SlidersHorizontal,
    title: "Simuler mes revenus",
    desc: "Voir mon CA et net mois par mois sur 12 mois",
    href: "/simulator",
    color: "from-[#F4BE7E] to-[#E8955A]",
  },
  {
    id: "objective",
    icon: Target,
    title: "Trouver mon TJM ideal",
    desc: "Combien facturer pour atteindre mon objectif de revenu ?",
    href: "/objectif",
    color: "from-[#4ADE80] to-[#22C55E]",
  },
  {
    id: "invoice",
    icon: Receipt,
    title: "Facturer un client",
    desc: "Creer un devis ou une facture en quelques clics",
    href: "/facturation",
    color: "from-[#F472B6] to-[#EC4899]",
  },
  {
    id: "facto",
    icon: Bot,
    title: "Poser une question a Facto",
    desc: "Mon copilote IA repond avec mes vrais chiffres",
    href: "/assistant",
    color: "from-[#5682F2] to-[#7C5BF2]",
  },
];

const STORAGE_KEY = "freelens-welcome-seen";

export function WelcomeModal() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      // Small delay to let dashboard render first
      const t = setTimeout(() => setShow(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  function dismiss() {
    setShow(false);
    localStorage.setItem(STORAGE_KEY, "1");
  }

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={dismiss} />

      {/* Modal */}
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* Close */}
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors z-10"
        >
          <X className="size-4" />
        </button>

        {/* Header */}
        <div className="px-6 pt-6 pb-4 text-center">
          <div className="size-12 rounded-2xl bg-gradient-to-br from-[#5682F2] to-[#7C5BF2] flex items-center justify-center mx-auto mb-3">
            <span className="text-xl">👋</span>
          </div>
          <h2 className="text-xl font-bold text-foreground mb-1">Bienvenue sur Freelens</h2>
          <p className="text-sm text-muted-foreground">
            Par quoi veux-tu commencer ?
          </p>
        </div>

        {/* Goals grid */}
        <div className="px-6 pb-6 space-y-2">
          {GOALS.map((goal) => {
            const Icon = goal.icon;
            return (
              <Link
                key={goal.id}
                href={goal.href}
                onClick={dismiss}
                className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/40 transition-colors group"
              >
                <div className={cn("size-9 rounded-lg bg-gradient-to-br flex items-center justify-center shrink-0", goal.color)}>
                  <Icon className="size-4 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground group-hover:text-[#5682F2] transition-colors">{goal.title}</p>
                  <p className="text-xs text-muted-foreground">{goal.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Skip */}
        <div className="border-t border-border px-6 py-3">
          <button
            onClick={dismiss}
            className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Explorer librement
          </button>
        </div>
      </div>
    </div>
  );
}
