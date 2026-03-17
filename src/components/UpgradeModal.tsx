"use client";

import { Lock, X } from "@/components/ui/icons";

const PRO_BENEFITS = [
  "Clients illimités",
  "Scénarios illimités",
  "Export PDF",
  "Tableau mensuel détaillé",
  "Diagnostic santé de l'activité",
];

export function UpgradeModal({
  open,
  onClose,
  message,
}: {
  open: boolean;
  onClose: () => void;
  message: string;
}) {
  if (!open) return null;

  const handleUpgrade = async () => {
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "monthly" }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      // silently fail
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-sm shadow-2xl">
        <div className="flex justify-end">
          <button onClick={onClose} className="text-muted-foreground/80 hover:text-foreground transition-colors">
            <X className="size-5" />
          </button>
        </div>

        <div className="text-center mb-5">
          <div className="size-12 rounded-xl bg-[#5682F2]/10 flex items-center justify-center mx-auto mb-3">
            <Lock className="size-6 text-[#5682F2]" />
          </div>
          <h2 className="text-lg font-bold text-foreground mb-1">Limite atteinte</h2>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>

        <ul className="space-y-2 mb-6">
          {PRO_BENEFITS.map((b) => (
            <li key={b} className="flex items-center gap-2 text-sm text-muted-foreground">
              <svg className="size-4 text-[#4ade80] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {b}
            </li>
          ))}
        </ul>

        <button
          onClick={handleUpgrade}
          className="w-full py-3 bg-gradient-to-r from-[#5682F2] to-[#7C5BF2] text-white rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Passer Pro &mdash; 9&euro;/mois
        </button>
        <button
          onClick={onClose}
          className="w-full py-2 mt-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Plus tard
        </button>
      </div>
    </div>
  );
}
