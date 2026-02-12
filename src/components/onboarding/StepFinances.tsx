"use client";

import { useProfileStore } from "@/stores/useProfileStore";
import { Slider } from "@/components/ui/slider";
import { fmt } from "@/lib/utils";

export function StepFinances() {
  const { monthlyExpenses, savings, setProfile } = useProfileStore();

  const runway = monthlyExpenses > 0 ? savings / monthlyExpenses : 0;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Ta situation financiere</h2>
        <p className="text-sm text-gray-400 mb-6">
          Pour calculer ton runway et tes marges de manoeuvre.
        </p>
      </div>

      <div className="space-y-8">
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
              <span className="text-base">🧾</span> Charges mensuelles fixes
            </label>
            <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
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
          <div className="flex justify-between text-xs text-gray-300 mt-1">
            <span>500&euro;</span>
            <span>6 000&euro;</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
              <span className="text-base">🏦</span> Epargne de securite
            </label>
            <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
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
          <div className="flex justify-between text-xs text-gray-300 mt-1">
            <span>0&euro;</span>
            <span>60 000&euro;</span>
          </div>
        </div>
      </div>

      <div className="p-3 bg-gray-50 rounded-xl text-center">
        <span className="text-sm text-gray-500">
          Runway actuel : <strong className="text-indigo-600">{runway.toFixed(1)} mois</strong>
        </span>
      </div>
    </div>
  );
}
