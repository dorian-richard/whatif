"use client";

import { useState, useMemo } from "react";
import { simulate } from "@/lib/simulation-engine";
import { SEASONALITY, MONTHS_SHORT, DEFAULT_SIM } from "@/lib/constants";
import { fmt } from "@/lib/utils";
import { Icon } from "@/components/ui/icons";
import type { ClientData, FreelanceProfile, SimulationParams } from "@/types";

const DEMO_CLIENTS: ClientData[] = [
  { id: "1", name: "Startup Tech", billing: "tjm", dailyRate: 550, daysPerMonth: 8, color: "#6366f1" },
  { id: "2", name: "Agence Design", billing: "forfait", monthlyAmount: 2500, color: "#f59e0b" },
  { id: "3", name: "E-commerce", billing: "tjm", dailyRate: 450, daysPerMonth: 5, color: "#10b981" },
  { id: "4", name: "Refonte site", billing: "mission", totalAmount: 8000, startMonth: 3, endMonth: 6, color: "#ef4444" },
];

const DEMO_PROFILE: FreelanceProfile = {
  monthlyExpenses: 2000,
  savings: 12000,
  adminHoursPerWeek: 5,
  workDaysPerWeek: 5,
};

const DEMO_SCENARIOS = [
  { label: "3 semaines off", icon: "palmtree", params: { ...DEFAULT_SIM, vacationWeeks: 3 } },
  { label: "+20% tarifs", icon: "trending-up", params: { ...DEFAULT_SIM, rateChange: 20 } },
  { label: "Perte client #1", icon: "heart-crack", params: { ...DEFAULT_SIM, lostClientIndex: 0 } },
  { label: "4j/semaine", icon: "clock", params: { ...DEFAULT_SIM, workDaysPerWeek: 4 } },
];

export function Demo() {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const params = activeIdx !== null ? DEMO_SCENARIOS[activeIdx].params : DEFAULT_SIM;

  const projection = useMemo(
    () => simulate(DEMO_CLIENTS, params, DEMO_PROFILE),
    [params]
  );

  const beforeTotal = projection.before.reduce((a, b) => a + b, 0);
  const afterTotal = projection.after.reduce((a, b) => a + b, 0);
  const diff = afterTotal - beforeTotal;

  return (
    <section id="demo" className="py-20 px-4 bg-gray-50/50">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Essaie par toi-meme
          </h2>
          <p className="text-gray-500">
            Clique sur un scenario et vois l&apos;impact instantanement.
          </p>
        </div>

        {/* Scenario buttons */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {DEMO_SCENARIOS.map((s, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(activeIdx === i ? null : i)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeIdx === i
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                  : "bg-white text-gray-700 border border-gray-200 hover:border-indigo-300"
              }`}
            >
              <Icon name={s.icon} className="size-4 inline" /> {s.label}
            </button>
          ))}
        </div>

        {/* Mini chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-indigo-500 inline-block rounded" /> Actuel
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-orange-500 inline-block rounded" /> Simule
              </span>
            </div>
            {activeIdx !== null && (
              <span
                className={`text-sm font-bold px-3 py-1 rounded-full ${
                  diff >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                }`}
              >
                {diff >= 0 ? "+" : ""}{fmt(diff)}&euro;/an
              </span>
            )}
          </div>

          {/* Simple bar chart */}
          <div className="flex items-end gap-1.5 h-40">
            {MONTHS_SHORT.map((month, i) => {
              const maxVal = Math.max(...projection.before, ...projection.after);
              const beforeH = (projection.before[i] / maxVal) * 100;
              const afterH = (projection.after[i] / maxVal) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                  <div className="w-full flex gap-0.5 items-end" style={{ height: "120px" }}>
                    <div
                      className="flex-1 bg-indigo-200 rounded-t transition-all duration-300"
                      style={{ height: `${beforeH}%` }}
                    />
                    <div
                      className="flex-1 bg-orange-300 rounded-t transition-all duration-300"
                      style={{ height: `${afterH}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-400">{month}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-around text-center text-sm">
            <div>
              <div className="text-gray-400 text-xs">CA actuel</div>
              <div className="font-bold text-gray-900">{fmt(beforeTotal)}&euro;/an</div>
            </div>
            <div>
              <div className="text-gray-400 text-xs">CA simule</div>
              <div className="font-bold text-gray-900">{fmt(afterTotal)}&euro;/an</div>
            </div>
            <div>
              <div className="text-gray-400 text-xs">Impact</div>
              <div className={`font-bold ${diff >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                {diff >= 0 ? "+" : ""}{fmt(diff)}&euro;
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
