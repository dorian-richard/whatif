"use client";

import type { ProjectionResult, ClientData, FreelanceProfile, SimulationParams } from "@/types";
import { MONTHS_SHORT, SEASONALITY } from "@/lib/constants";
import { fmt, cn } from "@/lib/utils";
import { getClientMonthlyCA } from "@/lib/simulation-engine";

const BILLING_BADGE: Record<string, { icon: string; label: string; color: string }> = {
  tjm: { icon: "📅", label: "TJM", color: "bg-indigo-100 text-indigo-700" },
  forfait: { icon: "📦", label: "Forfait", color: "bg-amber-100 text-amber-700" },
  mission: { icon: "🎯", label: "Mission", color: "bg-emerald-100 text-emerald-700" },
};

interface MonthlyBreakdownProps {
  projection: ProjectionResult;
  clients: ClientData[];
  profile: FreelanceProfile;
  sim: SimulationParams;
}

export function MonthlyBreakdown({ projection, clients, profile, sim }: MonthlyBreakdownProps) {
  const expenses = profile.monthlyExpenses + sim.expenseChange;
  const totalBefore = projection.before.reduce((a, b) => a + b, 0);
  const totalAfter = projection.after.reduce((a, b) => a + b, 0);
  const totalDiff = totalAfter - totalBefore;
  const totalNet = totalAfter - expenses * 12;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 overflow-x-auto">
      <h3 className="text-sm font-bold text-gray-800 mb-3">Detail mois par mois</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
            <th className="text-left py-2 pr-4">Mois</th>
            <th className="text-right py-2 px-3">Actuel</th>
            <th className="text-right py-2 px-3">Simule</th>
            <th className="text-right py-2 px-3">Diff.</th>
            <th className="text-right py-2 px-3">Net estime</th>
            <th className="text-left py-2 pl-3">Sources</th>
          </tr>
        </thead>
        <tbody>
          {MONTHS_SHORT.map((m, i) => {
            const diff = projection.after[i] - projection.before[i];
            const net = projection.after[i] - expenses;

            // Determine which billing types are active this month
            const activeBillings = new Set<string>();
            clients.forEach((c, ci) => {
              if (sim.lostClientIndex === ci) return;
              const ca = getClientMonthlyCA(c, i, SEASONALITY[i]);
              if (ca > 0) activeBillings.add(c.billing);
            });

            return (
              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="py-2 pr-4 font-medium text-gray-700">{m}</td>
                <td className="text-right py-2 px-3 text-gray-500">{fmt(projection.before[i])}&euro;</td>
                <td className="text-right py-2 px-3 font-semibold text-gray-800">
                  {fmt(projection.after[i])}&euro;
                </td>
                <td
                  className={cn(
                    "text-right py-2 px-3 font-bold",
                    diff >= 0 ? "text-emerald-600" : "text-red-600"
                  )}
                >
                  {diff >= 0 ? "+" : ""}
                  {fmt(diff)}&euro;
                </td>
                <td
                  className={cn(
                    "text-right py-2 px-3",
                    net >= 0 ? "text-gray-700" : "text-red-600 font-bold"
                  )}
                >
                  {fmt(net)}&euro; {net < 0 && "⚠️"}
                </td>
                <td className="py-2 pl-3">
                  <div className="flex gap-1">
                    {Array.from(activeBillings).map((billing) => {
                      const b = BILLING_BADGE[billing];
                      return (
                        <span
                          key={billing}
                          className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full", b.color)}
                        >
                          {b.icon} {b.label}
                        </span>
                      );
                    })}
                  </div>
                </td>
              </tr>
            );
          })}
          <tr className="border-t-2 border-gray-200 font-bold">
            <td className="py-3 pr-4 text-gray-900">TOTAL</td>
            <td className="text-right py-3 px-3 text-gray-600">{fmt(totalBefore)}&euro;</td>
            <td className="text-right py-3 px-3 text-gray-900">{fmt(totalAfter)}&euro;</td>
            <td
              className={cn(
                "text-right py-3 px-3",
                totalDiff >= 0 ? "text-emerald-600" : "text-red-600"
              )}
            >
              {totalDiff >= 0 ? "+" : ""}
              {fmt(totalDiff)}&euro;
            </td>
            <td className="text-right py-3 px-3 text-gray-900">{fmt(totalNet)}&euro;</td>
            <td />
          </tr>
        </tbody>
      </table>
    </div>
  );
}
