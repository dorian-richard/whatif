"use client";

import { useState, useMemo } from "react";
import { simulate } from "@/lib/simulation-engine";
import { DEFAULT_SIM, MONTHS_SHORT } from "@/lib/constants";
import { fmt } from "@/lib/utils";
import { Icon } from "@/components/ui/icons";
import type { ClientData, FreelanceProfile } from "@/types";

const DEMO_CLIENTS: ClientData[] = [
  { id: "1", name: "Startup Tech", billing: "tjm", dailyRate: 550, daysPerWeek: 3, color: "#5682F2" },
  { id: "2", name: "Agence Design", billing: "forfait", monthlyAmount: 2500, color: "#F4BE7E" },
  { id: "3", name: "E-commerce", billing: "tjm", dailyRate: 450, daysPerWeek: 2, color: "#4ade80" },
  { id: "4", name: "Refonte site", billing: "mission", totalAmount: 8000, startMonth: 3, endMonth: 6, color: "#f87171" },
];

const DEMO_PROFILE: FreelanceProfile = {
  monthlyExpenses: 2000,
  savings: 12000,
  adminHoursPerWeek: 5,
  workDaysPerWeek: 5,
  businessStatus: "micro",
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
  const maxVal = Math.max(...projection.before, ...projection.after, 1);

  return (
    <section id="simulation" className="snap-section relative flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute bottom-1/4 left-1/4 w-[600px] h-[600px] bg-[#F4BE7E]/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-5xl mx-auto px-6 py-20 w-full">
        <div className="text-center mb-12">
          <span className="text-sm font-medium text-[#F4BE7E] uppercase tracking-widest mb-3 block">Simulation</span>
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Teste un scénario en 1 clic
          </h2>
          <p className="text-lg text-muted-foreground">
            Vacances, hausse de tarifs, perte de client — vois l&apos;impact sur ton CA instantanément.
          </p>
        </div>

        {/* Scenario buttons */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {DEMO_SCENARIOS.map((s, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(activeIdx === i ? null : i)}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 border ${
                activeIdx === i
                  ? "bg-gradient-to-r from-[#5682F2] to-[#7C5BF2] border-[#5682F2] text-white fn-glow"
                  : "bg-muted/30 border-border text-foreground hover:bg-muted hover:border-border"
              }`}
            >
              <Icon name={s.icon} className="size-4 inline mr-1" /> {s.label}
            </button>
          ))}
        </div>

        {/* Chart card */}
        <div className="bg-card rounded-2xl p-6 border border-border max-w-3xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-4 text-xs text-foreground font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-1.5 bg-[#5682F2] inline-block rounded" /> Actuel
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-1.5 bg-[#F4BE7E] inline-block rounded" /> Simulé
              </span>
            </div>
            {activeIdx !== null && (
              <span
                className={`text-sm font-bold px-4 py-1.5 rounded-full ${
                  diff >= 0
                    ? "bg-[#4ade80]/15 text-[#4ade80]"
                    : "bg-[#f87171]/15 text-[#f87171]"
                }`}
              >
                {diff >= 0 ? "+" : ""}{fmt(diff)}&euro;/an
              </span>
            )}
          </div>

          {/* Bar chart */}
          <div className="flex items-end gap-2 h-44">
            {MONTHS_SHORT.map((month, i) => {
              const beforeH = (projection.before[i] / maxVal) * 100;
              const afterH = (projection.after[i] / maxVal) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex gap-[2px] items-end" style={{ height: "140px" }}>
                    <div
                      className="flex-1 bg-[#5682F2] rounded-t-sm transition-all duration-500 opacity-60"
                      style={{ height: `${Math.max(2, beforeH)}%` }}
                    />
                    <div
                      className="flex-1 rounded-t-sm transition-all duration-500"
                      style={{
                        height: `${Math.max(2, afterH)}%`,
                        backgroundColor: activeIdx !== null ? "#F4BE7E" : "#5682F2",
                        opacity: activeIdx !== null ? 0.9 : 0.6,
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground/60">{month}</span>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="mt-6 pt-4 border-t border-border grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-[11px] text-muted-foreground/60 uppercase tracking-wider">CA actuel</div>
              <div className="text-lg font-bold text-foreground mt-1">{fmt(beforeTotal)}&euro;</div>
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground/60 uppercase tracking-wider">CA simulé</div>
              <div className="text-lg font-bold text-foreground mt-1">{fmt(afterTotal)}&euro;</div>
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground/60 uppercase tracking-wider">Impact</div>
              <div className={`text-lg font-bold mt-1 ${diff >= 0 ? "text-[#4ade80]" : "text-[#f87171]"}`}>
                {diff >= 0 ? "+" : ""}{fmt(diff)}&euro;
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
