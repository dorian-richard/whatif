"use client";

import { useState } from "react";
import { X, Building2 } from "@/components/ui/icons";

const STEPS = [
  {
    title: "Structure par d\u00e9faut",
    desc: "Ta soci\u00e9t\u00e9 op\u00e9rationnelle, une holding et toi en tant que personne physique sont cr\u00e9\u00e9s automatiquement. Double-clique sur un n\u0153ud pour le modifier.",
  },
  {
    title: "Configurer les entit\u00e9s",
    desc: "Renseigne le CA, le salaire du dirigeant et les frais de gestion pour chaque soci\u00e9t\u00e9. Le simulateur calcule l\u2019IS, le r\u00e9gime m\u00e8re-fille (95% d\u2019exon\u00e9ration sur dividendes) et le PFU.",
  },
  {
    title: "Ajouter des flux",
    desc: "Connecte deux n\u0153uds en glissant depuis le point de connexion (bas d\u2019un n\u0153ud vers le haut d\u2019un autre). Tu peux aussi utiliser le panneau \u00ab Flux financiers \u00bb \u00e0 droite.",
  },
  {
    title: "Comparer",
    desc: "Le simulateur compare automatiquement ton net avec et sans holding. L\u2019\u00e9conomie (ou le surco\u00fbt) s\u2019affiche en temps r\u00e9el.",
  },
];

export function HoldingGuide() {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("freelens-holding-guide-dismissed") === "true";
  });

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("freelens-holding-guide-dismissed", "true");
  };

  return (
    <div className="bg-[#a78bfa]/5 border border-[#a78bfa]/20 rounded-xl p-5 relative">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted"
      >
        <X className="size-4" />
      </button>

      <div className="flex items-center gap-2 mb-4">
        <Building2 className="size-4 text-[#a78bfa]" />
        <h3 className="text-sm font-semibold text-foreground">
          Comment utiliser le simulateur holding
        </h3>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {STEPS.map((step, i) => (
          <div key={i} className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-[#a78bfa] bg-[#a78bfa]/10 size-5 rounded-full flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <span className="text-xs font-semibold text-foreground">{step.title}</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed pl-7">
              {step.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
