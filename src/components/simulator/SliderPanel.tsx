"use client";

import type { ReactNode } from "react";
import { useSimulatorStore } from "@/stores/useSimulatorStore";
import { useProfileStore } from "@/stores/useProfileStore";
import { Slider } from "@/components/ui/slider";
import { PRESET_SCENARIOS } from "@/lib/constants";
import { fmt, cn } from "@/lib/utils";
import { getClientBaseCA } from "@/lib/simulation-engine";
import { Palmtree, TrendingUp, UserPlus, Clock, HeartCrack, Receipt } from "@/components/ui/icons";

function LabeledSlider({
  icon,
  label,
  value,
  onChange,
  min,
  max,
  step,
  unit,
  tooltip,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  unit: string;
  tooltip?: string;
}) {
  const isModified = value !== min && !(unit === "j" && value === 5);

  return (
    <div className="group p-3 rounded-xl hover:bg-muted/30 transition-colors">
      <div className="flex justify-between items-center mb-2.5">
        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2" title={tooltip}>
          <div className="size-7 rounded-lg bg-[#5682F2]/15 flex items-center justify-center group-hover:bg-[#5682F2]/20 transition-colors">
            {icon}
          </div>
          <span>{label}</span>
          {tooltip && (
            <span className="text-[10px] text-muted-foreground/60 hidden group-hover:inline" title={tooltip}>?</span>
          )}
        </label>
        <span className={cn(
          "text-sm font-bold px-2.5 py-1 rounded-lg transition-colors",
          isModified
            ? "text-[#5682F2] bg-[#5682F2]/15"
            : "text-muted-foreground/60 bg-muted/50"
        )}>
          {value}{unit}
        </span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={min}
        max={max}
        step={step}
      />
      <div className="flex justify-between text-[10px] text-muted-foreground/60 mt-1.5 px-0.5">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}

export function SliderPanel() {
  const sim = useSimulatorStore();
  const { clients } = useProfileStore();
  const totalCA = clients.reduce((sum, c) => sum + getClientBaseCA(c), 0);

  return (
    <div className="bg-card rounded-2xl p-5 border border-border">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-foreground">Paramètres</h3>
        {sim.activePreset && (
          <span className="text-xs text-[#5682F2] bg-[#5682F2]/15 px-2.5 py-1 rounded-full font-medium border border-[#5682F2]/20">
            {PRESET_SCENARIOS.find((p) => p.id === sim.activePreset)?.title}
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
        <LabeledSlider
          icon={<Palmtree className="size-4 text-[#5682F2]" />}
          label="Vacances"
          value={sim.vacationWeeks}
          onChange={(v) => sim.setParam("vacationWeeks", v)}
          min={0}
          max={12}
          step={1}
          unit=" sem"
          tooltip="TJM et Mission : revenu tombe a 0. Forfait : continue de tourner."
        />
        <LabeledSlider
          icon={<TrendingUp className="size-4 text-[#5682F2]" />}
          label="Tarifs"
          value={sim.rateChange}
          onChange={(v) => sim.setParam("rateChange", v)}
          min={-30}
          max={50}
          step={5}
          unit="%"
          tooltip="S'applique uniquement aux clients TJM."
        />
        <LabeledSlider
          icon={<UserPlus className="size-4 text-[#5682F2]" />}
          label="Nvx clients"
          value={sim.newClients}
          onChange={(v) => sim.setParam("newClients", v)}
          min={0}
          max={5}
          step={1}
          unit=""
        />
        <LabeledSlider
          icon={<Clock className="size-4 text-[#5682F2]" />}
          label="Jours / sem"
          value={sim.workDaysPerWeek}
          onChange={(v) => sim.setParam("workDaysPerWeek", v)}
          min={3}
          max={6}
          step={1}
          unit="j"
          tooltip="Affecte uniquement les clients TJM (proportionnel)."
        />

        <div className="p-3 rounded-xl hover:bg-muted/30 transition-colors">
          <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2.5">
            <div className="size-7 rounded-lg bg-[#5682F2]/15 flex items-center justify-center">
              <HeartCrack className="size-4 text-[#5682F2]" />
            </div>
            Perte d&apos;un client
          </label>
          <select
            value={sim.lostClientIndex}
            onChange={(e) => sim.setParam("lostClientIndex", Number(e.target.value))}
            className={cn(
              "w-full p-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5682F2]/30 transition-colors",
              sim.lostClientIndex >= 0
                ? "border-[#f87171]/30 bg-[#f87171]/8 text-[#f87171]"
                : "border-border bg-card text-foreground"
            )}
          >
            <option value={-1}>&mdash; Aucune perte &mdash;</option>
            {clients.map((c, i) => {
              const ca = getClientBaseCA(c);
              const pct = totalCA > 0 ? ((ca / totalCA) * 100).toFixed(0) : 0;
              return (
                <option key={c.id} value={i}>
                  {c.name} &middot; {fmt(ca)}&euro;/mois ({pct}%)
                </option>
              );
            })}
          </select>
        </div>

        <LabeledSlider
          icon={<Receipt className="size-4 text-[#5682F2]" />}
          label="Charges"
          value={sim.expenseChange}
          onChange={(v) => sim.setParam("expenseChange", v)}
          min={-500}
          max={1000}
          step={50}
          unit="&euro;"
        />
      </div>
    </div>
  );
}
