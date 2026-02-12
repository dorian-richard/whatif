"use client";

import { useSimulatorStore } from "@/stores/useSimulatorStore";
import { useProfileStore } from "@/stores/useProfileStore";
import { Slider } from "@/components/ui/slider";
import { PRESET_SCENARIOS } from "@/lib/constants";
import { fmt } from "@/lib/utils";
import { getClientBaseCA } from "@/lib/simulation-engine";

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
  icon: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  unit: string;
  tooltip?: string;
}) {
  return (
    <div className="group">
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5" title={tooltip}>
          <span className="text-base">{icon}</span>
          {label}
        </label>
        <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
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
      <div className="flex justify-between text-xs text-gray-300 mt-1">
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
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-gray-800">Ajustement fin</h3>
        {sim.activePreset && (
          <span className="text-xs text-indigo-500 bg-indigo-50 px-2 py-1 rounded-full">
            Scenario &quot;{PRESET_SCENARIOS.find((p) => p.id === sim.activePreset)?.title}&quot; actif
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        <LabeledSlider
          icon="🏖️"
          label="Semaines de vacances"
          value={sim.vacationWeeks}
          onChange={(v) => sim.setParam("vacationWeeks", v)}
          min={0}
          max={12}
          step={1}
          unit=" sem"
          tooltip="TJM et Mission : revenu tombe a 0. Forfait : continue de tourner."
        />
        <LabeledSlider
          icon="📈"
          label="Variation de tarifs"
          value={sim.rateChange}
          onChange={(v) => sim.setParam("rateChange", v)}
          min={-30}
          max={50}
          step={5}
          unit="%"
          tooltip="S'applique uniquement aux clients TJM."
        />
        <LabeledSlider
          icon="🆕"
          label="Nouveaux clients"
          value={sim.newClients}
          onChange={(v) => sim.setParam("newClients", v)}
          min={0}
          max={5}
          step={1}
          unit=""
        />
        <LabeledSlider
          icon="⏰"
          label="Jours de travail / semaine"
          value={sim.workDaysPerWeek}
          onChange={(v) => sim.setParam("workDaysPerWeek", v)}
          min={3}
          max={6}
          step={1}
          unit="j"
          tooltip="Affecte uniquement les clients TJM (proportionnel)."
        />

        <div>
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5 mb-2">
            <span className="text-base">💔</span>Perte d&apos;un client
          </label>
          <select
            value={sim.lostClientIndex}
            onChange={(e) => sim.setParam("lostClientIndex", Number(e.target.value))}
            className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white"
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
          icon="🧾"
          label="Variation charges mensuelles"
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
