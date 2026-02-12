"use client";

import { useRouter } from "next/navigation";
import { useProfileStore } from "@/stores/useProfileStore";
import { useSimulatorStore } from "@/stores/useSimulatorStore";
import { SimulatorEngine } from "@/components/simulator/SimulatorEngine";
import { getClientBaseCA } from "@/lib/simulation-engine";
import { fmt } from "@/lib/utils";

export default function SimulatorPage() {
  const router = useRouter();
  const profile = useProfileStore();
  const resetSim = useSimulatorStore((s) => s.reset);

  const totalCA = profile.clients.reduce((s, c) => s + getClientBaseCA(c), 0);
  const totalDays = profile.clients
    .filter((c) => c.billing === "tjm")
    .reduce((s, c) => s + (c.daysPerMonth ?? 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-lg">
              🔮
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">WhatIf</h1>
              <p className="text-xs text-gray-400">
                {fmt(totalCA)}&euro;/mois &middot; {profile.clients.length} clients
                {totalDays > 0 && <> &middot; {totalDays.toFixed(1)}j factures</>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={resetSim}
              className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
            >
              Reinitialiser
            </button>
            <button
              onClick={() => router.push("/scenarios")}
              className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors rounded-lg hover:bg-gray-100"
            >
              📋 Scenarios
            </button>
            <button
              onClick={() => router.push("/settings")}
              className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors rounded-lg hover:bg-gray-100"
            >
              ⚙️
            </button>
            <button
              onClick={() => router.push("/onboarding")}
              className="px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              Modifier profil
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <SimulatorEngine />
      </div>

      <div className="text-center py-6 text-xs text-gray-300">
        WhatIf — Simulateur de decisions freelance
      </div>
    </div>
  );
}
