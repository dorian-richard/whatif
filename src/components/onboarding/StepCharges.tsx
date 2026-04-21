"use client";

import { useProfileStore } from "@/stores/useProfileStore";
import { Slider } from "@/components/ui/slider";
import { fmt } from "@/lib/utils";

export function StepCharges() {
  const { monthlyExpenses, setProfile } = useProfileStore();

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-2">Tes charges fixes mensuelles&nbsp;?</h2>
      <p className="text-sm text-muted-foreground mb-8">
        Loyer pro, logiciels, comptable, mutuelle, télécoms... Pas besoin d&apos;être précis au centime.
      </p>

      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Charges mensuelles
        </span>
        <span className="text-3xl font-bold text-[#5682F2]">{fmt(monthlyExpenses)}&euro;</span>
      </div>

      <Slider
        value={[monthlyExpenses]}
        onValueChange={([v]) => setProfile({ monthlyExpenses: v })}
        min={0}
        max={5000}
        step={50}
      />
      <div className="flex justify-between text-xs text-muted-foreground/70 mt-1">
        <span>0&euro;</span>
        <span>5 000&euro;</span>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-2 text-[11px] text-muted-foreground/80">
        <button
          onClick={() => setProfile({ monthlyExpenses: 500 })}
          className="p-2 rounded-lg bg-muted/40 border border-border hover:bg-muted transition-colors"
        >
          <div className="font-semibold text-foreground">Léger</div>
          <div>500&euro;</div>
        </button>
        <button
          onClick={() => setProfile({ monthlyExpenses: 1500 })}
          className="p-2 rounded-lg bg-muted/40 border border-border hover:bg-muted transition-colors"
        >
          <div className="font-semibold text-foreground">Moyen</div>
          <div>1 500&euro;</div>
        </button>
        <button
          onClick={() => setProfile({ monthlyExpenses: 3000 })}
          className="p-2 rounded-lg bg-muted/40 border border-border hover:bg-muted transition-colors"
        >
          <div className="font-semibold text-foreground">Bureau + équipe</div>
          <div>3 000&euro;</div>
        </button>
      </div>
    </div>
  );
}
