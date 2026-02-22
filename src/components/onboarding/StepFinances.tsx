"use client";

import { useProfileStore } from "@/stores/useProfileStore";
import { Slider } from "@/components/ui/slider";
import { fmt } from "@/lib/utils";
import { Receipt, Landmark } from "@/components/ui/icons";

export function StepFinances() {
  const { monthlyExpenses, savings, setProfile } = useProfileStore();

  const runway = monthlyExpenses > 0 ? savings / monthlyExpenses : 0;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">Ta situation financière</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Pour calculer ton runway et tes marges de manœuvre.
        </p>
      </div>

      <div className="space-y-8">
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <Receipt className="size-4 text-[#5682F2]" /> Charges mensuelles fixes
            </label>
            <span className="text-sm font-bold text-[#5682F2] bg-[#5682F2]/10 px-2.5 py-1 rounded-md">
              {fmt(monthlyExpenses)}&euro;
            </span>
          </div>
          <Slider
            value={[monthlyExpenses]}
            onValueChange={([v]) => setProfile({ monthlyExpenses: v })}
            min={500}
            max={6000}
            step={100}
          />
          <div className="flex justify-between text-xs text-muted-foreground/70 mt-1">
            <span>500&euro;</span>
            <span>6 000&euro;</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <Landmark className="size-4 text-[#5682F2]" /> Trésorerie de sécurité
            </label>
            <span className="text-sm font-bold text-[#5682F2] bg-[#5682F2]/10 px-2.5 py-1 rounded-md">
              {fmt(savings)}&euro;
            </span>
          </div>
          <Slider
            value={[savings]}
            onValueChange={([v]) => setProfile({ savings: v })}
            min={0}
            max={60000}
            step={1000}
          />
          <div className="flex justify-between text-xs text-muted-foreground/70 mt-1">
            <span>0&euro;</span>
            <span>60 000&euro;</span>
          </div>
        </div>
      </div>

      <div className="p-3 bg-muted/50 border border-border rounded-xl text-center">
        <span className="text-sm text-muted-foreground">
          Runway actuel : <strong className="text-[#5682F2]">{runway.toFixed(1)} mois</strong>
        </span>
      </div>
    </div>
  );
}
