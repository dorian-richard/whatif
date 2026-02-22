"use client";

import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";
import type { ProjectionResult, ClientData, FreelanceProfile, SimulationParams } from "@/types";
import { MONTHS_SHORT, SEASONALITY } from "@/lib/constants";
import { fmt, cn } from "@/lib/utils";
import { getClientMonthlyCA, JOURS_OUVRES } from "@/lib/simulation-engine";
import { CalendarDays, Package, Target, AlertTriangle } from "@/components/ui/icons";

const BILLING_BADGE: Record<string, { Icon: ComponentType<LucideProps>; label: string; color: string }> = {
  tjm: { Icon: CalendarDays, label: "TJM", color: "bg-[#5682F2]/12 text-[#5682F2]" },
  forfait: { Icon: Package, label: "Forfait", color: "bg-[#fbbf24]/12 text-[#fbbf24]" },
  mission: { Icon: Target, label: "Mission", color: "bg-[#4ade80]/12 text-[#4ade80]" },
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
  const maxAfter = Math.max(...projection.after);

  return (
    <div className="bg-card rounded-2xl p-6 border border-border overflow-x-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-foreground">Mensuel</h3>
        <div className="flex gap-3 text-xs text-muted-foreground/60">
          <span>
            Net total :{" "}
            <strong className={totalNet >= 0 ? "text-[#4ade80]" : "text-[#f87171]"}>
              {fmt(totalNet)}&euro;
            </strong>
          </span>
        </div>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[10px] text-muted-foreground/60 uppercase tracking-wider border-b border-border">
            <th className="text-left py-2.5 pr-4 font-semibold">Mois</th>
            <th className="text-center py-2.5 px-2 font-semibold">Jours</th>
            <th className="text-right py-2.5 px-3 font-semibold">Actuel</th>
            <th className="text-right py-2.5 px-3 font-semibold">Simulé</th>
            <th className="text-right py-2.5 px-3 font-semibold">Diff.</th>
            <th className="text-right py-2.5 px-3 font-semibold">Net</th>
            <th className="py-2.5 px-3 font-semibold w-24"></th>
            <th className="text-left py-2.5 pl-3 font-semibold">Sources</th>
          </tr>
        </thead>
        <tbody>
          {MONTHS_SHORT.map((m, i) => {
            const diff = projection.after[i] - projection.before[i];
            const net = projection.after[i] - expenses;
            const barPct = maxAfter > 0 ? (projection.after[i] / maxAfter) * 100 : 0;

            const activeBillings = new Set<string>();
            clients.forEach((c, ci) => {
              if (sim.lostClientIndex === ci) return;
              const ca = getClientMonthlyCA(c, i, SEASONALITY[i]);
              if (ca > 0) activeBillings.add(c.billing);
            });

            return (
              <tr key={i} className="border-b border-border hover:bg-muted/30 transition-colors group">
                <td className="py-2.5 pr-4 font-semibold text-muted-foreground text-xs">{m}</td>
                <td className="text-center py-2.5 px-2 text-muted-foreground/60 tabular-nums text-xs">{JOURS_OUVRES[i]}j</td>
                <td className="text-right py-2.5 px-3 text-muted-foreground/60 tabular-nums">{fmt(projection.before[i])}&euro;</td>
                <td className="text-right py-2.5 px-3 font-semibold text-foreground tabular-nums">
                  {fmt(projection.after[i])}&euro;
                </td>
                <td
                  className={cn(
                    "text-right py-2.5 px-3 font-bold tabular-nums",
                    Math.abs(diff) < 0.5 ? "text-muted-foreground/60" : diff >= 0 ? "text-[#4ade80]" : "text-[#f87171]"
                  )}
                >
                  {Math.abs(diff) < 0.5 ? "-" : `${diff >= 0 ? "+" : ""}${fmt(diff)}\u20AC`}
                </td>
                <td
                  className={cn(
                    "text-right py-2.5 px-3 tabular-nums",
                    net >= 0 ? "text-muted-foreground" : "text-[#f87171] font-bold"
                  )}
                >
                  {fmt(net)}&euro;
                  {net < 0 && <AlertTriangle className="size-3 inline ml-1 text-[#f87171]" />}
                </td>
                <td className="py-2.5 px-3">
                  <div className="w-full h-1.5 rounded-full bg-muted/50">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        net >= 0 ? "bg-[#5682F2]" : "bg-[#f87171]"
                      )}
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                </td>
                <td className="py-2.5 pl-3">
                  <div className="flex gap-1">
                    {Array.from(activeBillings).map((billing) => {
                      const b = BILLING_BADGE[billing];
                      return (
                        <span
                          key={billing}
                          className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5", b.color)}
                        >
                          <b.Icon className="size-2.5" /> {b.label}
                        </span>
                      );
                    })}
                  </div>
                </td>
              </tr>
            );
          })}
          <tr className="border-t border-border font-bold bg-muted/40">
            <td className="py-3 pr-4 text-foreground text-xs">TOTAL</td>
            <td className="text-center py-3 px-2 text-muted-foreground tabular-nums text-xs">{JOURS_OUVRES.reduce((a, b) => a + b, 0)}j</td>
            <td className="text-right py-3 px-3 text-muted-foreground tabular-nums">{fmt(totalBefore)}&euro;</td>
            <td className="text-right py-3 px-3 text-foreground tabular-nums">{fmt(totalAfter)}&euro;</td>
            <td
              className={cn(
                "text-right py-3 px-3 tabular-nums",
                totalDiff >= 0 ? "text-[#4ade80]" : "text-[#f87171]"
              )}
            >
              {totalDiff >= 0 ? "+" : ""}{fmt(totalDiff)}&euro;
            </td>
            <td className={cn(
              "text-right py-3 px-3 tabular-nums",
              totalNet >= 0 ? "text-foreground" : "text-[#f87171]"
            )}>
              {fmt(totalNet)}&euro;
            </td>
            <td />
            <td />
          </tr>
        </tbody>
      </table>
    </div>
  );
}
