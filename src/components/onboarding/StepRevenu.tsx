"use client";

import { useProfileStore } from "@/stores/useProfileStore";
import { Slider } from "@/components/ui/slider";
import { fmt } from "@/lib/utils";

/**
 * Single-field quick income entry. We store the approximate monthly CA as a
 * placeholder "forfait" client so the simulation engine can work immediately.
 * The user refines later by adding real clients.
 */
export function StepRevenu() {
  const { clients, addClient, updateClient } = useProfileStore();

  // Look for the onboarding placeholder client
  const placeholder = clients.find((c) => c.id === "onboarding-placeholder");
  const currentAmount = placeholder?.monthlyAmount ?? 5000;

  const setAmount = (v: number) => {
    if (placeholder) {
      updateClient(placeholder.id, { monthlyAmount: v });
    } else {
      // Bypass normal addClient (which generates UUID) — we use a fixed id
      useProfileStore.setState((state) => ({
        clients: [
          ...state.clients,
          {
            id: "onboarding-placeholder",
            name: "Mon activité",
            billing: "forfait",
            monthlyAmount: v,
            color: "#5682F2",
          },
        ],
      }));
    }
  };

  const annual = currentAmount * 12;

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-2">Tu factures combien par mois&nbsp;?</h2>
      <p className="text-sm text-muted-foreground mb-8">
        En moyenne, tous clients confondus. Tu pourras détailler client par client ensuite.
      </p>

      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          CA mensuel
        </span>
        <span className="text-3xl font-bold text-[#5682F2]">{fmt(currentAmount)}&euro;</span>
      </div>

      <Slider
        value={[currentAmount]}
        onValueChange={([v]) => setAmount(v)}
        min={500}
        max={20000}
        step={250}
      />
      <div className="flex justify-between text-xs text-muted-foreground/70 mt-1">
        <span>500&euro;</span>
        <span>20 000&euro;</span>
      </div>

      <div className="mt-6 p-4 bg-muted/40 border border-border rounded-xl text-center">
        <div className="text-xs text-muted-foreground/80 uppercase tracking-wider mb-1">
          CA annuel estimé
        </div>
        <div className="text-xl font-bold text-foreground">{fmt(annual)}&euro;/an</div>
      </div>
    </div>
  );
}
