"use client";

import type { ProjectionResult, FreelanceProfile, SimulationParams, ClientData } from "@/types";
import { cn, fmt } from "@/lib/utils";

interface EmotionalMetricsProps {
  projection: ProjectionResult;
  profile: FreelanceProfile;
  sim: SimulationParams;
  clients: ClientData[];
}

export function EmotionalMetrics({ projection, profile, sim, clients }: EmotionalMetricsProps) {
  const afterAnnual = projection.after.reduce((a, b) => a + b, 0);
  const beforeAnnual = projection.before.reduce((a, b) => a + b, 0);

  // Freedom days
  const freedomDaysBefore = (5 - profile.workDaysPerWeek) * 52;
  const freedomDaysAfter = (5 - sim.workDaysPerWeek) * 52 + sim.vacationWeeks * 5;

  // Savings at end of year
  const expenses = profile.monthlyExpenses + sim.expenseChange;
  const savingsEndBefore = profile.savings + beforeAnnual - profile.monthlyExpenses * 12;
  const savingsEndAfter = profile.savings + afterAnnual - expenses * 12;

  // Runway
  const runwayBefore =
    profile.monthlyExpenses > 0 ? profile.savings / profile.monthlyExpenses : 99;
  const runwayAfter = expenses > 0 ? profile.savings / expenses : 99;

  // Recurring percentage
  const recurringCA = clients
    .filter((c) => c.billing === "tjm" || c.billing === "forfait")
    .reduce((s, c) => {
      if (c.billing === "tjm") return s + (c.dailyRate ?? 0) * (c.daysPerMonth ?? 0);
      return s + (c.monthlyAmount ?? 0);
    }, 0);
  const totalBaseCA = clients.reduce((s, c) => {
    if (c.billing === "tjm") return s + (c.dailyRate ?? 0) * (c.daysPerMonth ?? 0);
    if (c.billing === "forfait") return s + (c.monthlyAmount ?? 0);
    const dur = Math.max(1, (c.endMonth ?? 0) - (c.startMonth ?? 0) + 1);
    return s + (c.totalAmount ?? 0) / dur;
  }, 0);
  const recurringPct = totalBaseCA > 0 ? (recurringCA / totalBaseCA) * 100 : 0;

  const metrics = [
    {
      icon: "🗓️",
      label: "Jours de liberte/an",
      before: freedomDaysBefore,
      after: freedomDaysAfter,
      unit: "j",
      reverse: false,
    },
    {
      icon: "💰",
      label: "Epargne fin d'annee",
      before: Math.round(savingsEndBefore),
      after: Math.round(savingsEndAfter),
      unit: "\u20AC",
      reverse: false,
    },
    {
      icon: "🛟",
      label: "Runway de securite",
      before: parseFloat(runwayBefore.toFixed(1)),
      after: parseFloat(runwayAfter.toFixed(1)),
      unit: " mois",
      reverse: false,
    },
    {
      icon: "🔄",
      label: "% recurrent",
      before: Math.round(recurringPct),
      after: Math.round(recurringPct),
      unit: "%",
      reverse: false,
    },
  ];

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <h3 className="text-sm font-bold text-gray-800 mb-4">Ce que ca change dans ta vie</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {metrics.map((m, i) => {
          const diff = m.after - m.before;
          const isPositive = m.reverse ? diff < 0 : diff > 0;
          const isNeutral = Math.abs(diff) < 0.5;
          return (
            <div key={i} className="text-center p-3 bg-gray-50 rounded-xl">
              <div className="text-2xl mb-1">{m.icon}</div>
              <div className="text-xs text-gray-500 mb-1">{m.label}</div>
              <div className="text-lg font-bold text-gray-800">
                {typeof m.after === "number" && Math.abs(m.after) > 999
                  ? fmt(m.after)
                  : m.after}
                {m.unit}
              </div>
              {!isNeutral && (
                <div
                  className={cn(
                    "text-xs font-bold",
                    isPositive ? "text-emerald-600" : "text-red-600"
                  )}
                >
                  {diff > 0 ? "+" : ""}
                  {Math.abs(diff) > 999 ? fmt(diff) : diff.toFixed(1)}
                  {m.unit}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
