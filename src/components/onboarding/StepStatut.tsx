"use client";

import { useProfileStore } from "@/stores/useProfileStore";
import { BUSINESS_STATUS_CONFIG } from "@/lib/constants";
import type { BusinessStatus } from "@/types";
import { cn } from "@/lib/utils";

const QUICK_STATUTS: { key: BusinessStatus; label: string; tagline: string }[] = [
  { key: "micro", label: "Micro-entreprise", tagline: "Jusqu'à 83 600€" },
  { key: "ei", label: "EI classique", tagline: "Pas de plafond" },
  { key: "eurl_is", label: "EURL", tagline: "À l'IS" },
  { key: "sasu_is", label: "SASU", tagline: "À l'IS" },
  { key: "portage", label: "Portage salarial", tagline: "Salarié via société" },
];

export function StepStatut() {
  const { businessStatus, setProfile } = useProfileStore();

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-2">Tu exerces sous quel statut&nbsp;?</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Ça nous permet d&apos;appliquer les bons taux URSSAF et IR.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {QUICK_STATUTS.map(({ key, label, tagline }) => {
          const selected = businessStatus === key;
          return (
            <button
              key={key}
              onClick={() =>
                setProfile({
                  businessStatus: key,
                  customUrssafRate: undefined,
                  remunerationType: undefined,
                })
              }
              className={cn(
                "p-4 rounded-xl border text-left transition-all duration-150",
                selected
                  ? "bg-[#5682F2]/15 border-[#5682F2]/40 ring-2 ring-[#5682F2]/20"
                  : "bg-muted/50 border-border hover:border-[#5682F2]/30 hover:bg-muted"
              )}
            >
              <div
                className={cn(
                  "text-sm font-semibold mb-0.5",
                  selected ? "text-[#5682F2]" : "text-foreground"
                )}
              >
                {label}
              </div>
              <div className="text-xs text-muted-foreground/80">{tagline}</div>
              <div className="text-[10px] text-muted-foreground/60 mt-1">
                URSSAF ~{(BUSINESS_STATUS_CONFIG[key].urssaf * 100).toFixed(0)}%
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground/70 mt-4 text-center">
        Tu pourras changer à tout moment dans les paramètres.
      </p>
    </div>
  );
}
