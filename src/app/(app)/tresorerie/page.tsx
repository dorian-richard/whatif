"use client";

import { useMemo, useState } from "react";
import { useProfileStore } from "@/stores/useProfileStore";
import { computeCashflow } from "@/lib/cashflow-engine";
import { fmt, cn } from "@/lib/utils";
import { PiggyBank, AlertTriangle, TrendingUp, Shield, CalendarDays } from "@/components/ui/icons";
import { ProBlur } from "@/components/ProBlur";

export default function TresoreriePage() {
  const profile = useProfileStore();
  const { clients, monthlyExpenses, savings } = profile;

  const [threshold, setThreshold] = useState(Math.round(monthlyExpenses * 3));

  const cashflow = useMemo(
    () => computeCashflow(clients, profile, savings, threshold, 12),
    [clients, profile, savings, threshold]
  );

  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);

  const minBalance = Math.min(...cashflow.map((m) => m.balance));
  const criticalMonth = cashflow.find((m) => m.belowThreshold);
  const safeMonths = cashflow.filter((m) => !m.belowThreshold).length;
  const maxValue = Math.max(...cashflow.map((m) => Math.max(m.income, m.totalOut, Math.abs(m.balance))), 1);
  const hasIS = cashflow.some((m) => m.is > 0);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-1">Simulateur de trésorerie</h1>
        <p className="text-muted-foreground">
          Projette ta trésorerie sur 12 mois : entrées, sorties et solde prévisionnel.
        </p>
      </div>

      <ProBlur label="Le simulateur de trésorerie est réservé au plan Pro">
        {/* Threshold slider */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Seuil d&apos;alerte</span>
            <span className="text-sm font-bold text-foreground">{fmt(threshold)}&euro;</span>
          </div>
          <input
            type="range"
            min={0}
            max={Math.max(30000, monthlyExpenses * 6)}
            step={500}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="w-full accent-[#5682F2]"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground/60 mt-1">
            <span>0&euro;</span>
            <span>{fmt(Math.max(30000, monthlyExpenses * 6))}&euro;</span>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <PiggyBank className="size-4 text-[#5682F2]" />
              <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Solde actuel</span>
            </div>
            <div className="text-xl font-bold text-foreground">{fmt(Math.round(savings))}&euro;</div>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="size-4 text-[#4ade80]" />
              <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Solde min</span>
            </div>
            <div className={cn("text-xl font-bold", minBalance >= 0 ? "text-[#4ade80]" : "text-[#f87171]")}>
              {fmt(Math.round(minBalance))}&euro;
            </div>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <CalendarDays className="size-4 text-[#F4BE7E]" />
              <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Mois critique</span>
            </div>
            <div className={cn("text-xl font-bold", criticalMonth ? "text-[#f87171]" : "text-[#4ade80]")}>
              {criticalMonth ? criticalMonth.label : "Aucun"}
            </div>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="size-4 text-[#a78bfa]" />
              <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Marge</span>
            </div>
            <div className="text-xl font-bold text-foreground">{safeMonths}/12 mois</div>
          </div>
        </div>

        {/* Alert */}
        {criticalMonth && (
          <div className="bg-[#f87171]/10 border border-[#f87171]/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="size-4 text-[#f87171]" />
              <span className="text-sm font-bold text-[#f87171]">Alerte trésorerie</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Ton solde passe sous {fmt(threshold)}&euro; en <strong>{criticalMonth.label}</strong> ({fmt(Math.round(criticalMonth.balance))}&euro;).
              Anticipe en ajustant tes charges ou en augmentant ton CA.
            </p>
          </div>
        )}

        {/* Chart */}
        <div className="bg-card rounded-2xl border border-border p-4 md:p-6">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <h3 className="text-sm font-bold text-foreground">Projection 12 mois</h3>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground/60">
              <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-[#4ade80]" /> Entrées</span>
              <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-[#f87171]" /> Sorties</span>
              <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-1 rounded-sm bg-[#5682F2]" /> Solde</span>
              <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-0.5 rounded-sm bg-[#f87171]/50" style={{ borderTop: "1px dashed #f87171" }} /> Seuil</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <div
              className="flex items-end gap-1 h-48 min-w-[520px] relative"
              onMouseLeave={() => setHoveredMonth(null)}
            >
              {/* Tooltip rendered inside each bar column below */}
              {/* Threshold line */}
              {threshold > 0 && threshold < maxValue && (
                <div
                  className="absolute left-0 right-0 border-t border-dashed border-[#f87171]/40 pointer-events-none z-0"
                  style={{ bottom: `${(threshold / maxValue) * 100}%` }}
                />
              )}
              {cashflow.map((m, i) => {
                const incPct = (m.income / maxValue) * 100;
                const outPct = (m.totalOut / maxValue) * 100;
                const balPct = Math.max(0, (m.balance / maxValue) * 100);
                const isHovered = hoveredMonth === i;
                return (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center gap-1 relative"
                    onMouseEnter={() => setHoveredMonth(i)}
                  >
                    {/* Tooltip anchored to hovered bar */}
                    {isHovered && (
                      <div
                        className={cn(
                          "absolute top-0 z-20 bg-card border border-border rounded-lg shadow-lg p-2.5 w-[150px] pointer-events-none",
                          i <= 2 ? "left-0" : i >= 9 ? "right-0" : "left-1/2 -translate-x-1/2"
                        )}
                      >
                        <div className="text-xs font-bold text-foreground mb-1.5">{m.label}</div>
                        <div className="space-y-0.5 text-[11px]">
                          <div className="flex justify-between gap-3">
                            <span className="text-muted-foreground">Entrées</span>
                            <span className="font-medium text-[#4ade80]">{fmt(Math.round(m.income))}&euro;</span>
                          </div>
                          <div className="flex justify-between gap-3">
                            <span className="text-muted-foreground">Sorties</span>
                            <span className="font-medium text-[#f87171]">{fmt(Math.round(m.totalOut))}&euro;</span>
                          </div>
                          <div className="flex justify-between gap-3 pt-1 border-t border-border">
                            <span className="text-muted-foreground">Net</span>
                            <span className={cn("font-medium", m.netFlow >= 0 ? "text-[#4ade80]" : "text-[#f87171]")}>
                              {m.netFlow >= 0 ? "+" : ""}{fmt(Math.round(m.netFlow))}&euro;
                            </span>
                          </div>
                          <div className="flex justify-between gap-3">
                            <span className="text-muted-foreground">Solde</span>
                            <span className={cn("font-bold", m.belowThreshold ? "text-[#f87171]" : "text-foreground")}>
                              {fmt(Math.round(m.balance))}&euro;
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="w-full flex items-end justify-center gap-px" style={{ height: "160px" }}>
                      <div
                        className={cn("w-1/3 max-w-[12px] rounded-t transition-colors", isHovered ? "bg-[#4ade80]" : "bg-[#4ade80]/60")}
                        style={{ height: `${Math.max(2, incPct)}%` }}
                      />
                      <div
                        className={cn("w-1/3 max-w-[12px] rounded-t transition-colors", isHovered ? "bg-[#f87171]" : "bg-[#f87171]/60")}
                        style={{ height: `${Math.max(2, outPct)}%` }}
                      />
                      <div
                        className={cn(
                          "w-1/3 max-w-[12px] rounded-t transition-colors",
                          m.belowThreshold
                            ? isHovered ? "bg-[#f87171]/50" : "bg-[#f87171]/30"
                            : isHovered ? "bg-[#5682F2]" : "bg-[#5682F2]/60"
                        )}
                        style={{ height: `${Math.max(2, balPct)}%` }}
                      />
                    </div>
                    <span className={cn("text-[9px]", isHovered ? "text-foreground font-medium" : "text-muted-foreground/60")}>{m.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Detail table (desktop) */}
        <div className="hidden md:block bg-card rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-[10px] text-muted-foreground/60 uppercase tracking-wider font-medium">Mois</th>
                  <th className="text-right px-4 py-3 text-[10px] text-muted-foreground/60 uppercase tracking-wider font-medium">Entrées</th>
                  <th className="text-right px-4 py-3 text-[10px] text-muted-foreground/60 uppercase tracking-wider font-medium">URSSAF</th>
                  <th className="text-right px-4 py-3 text-[10px] text-muted-foreground/60 uppercase tracking-wider font-medium">IR</th>
                  {hasIS && <th className="text-right px-4 py-3 text-[10px] text-muted-foreground/60 uppercase tracking-wider font-medium">IS</th>}
                  <th className="text-right px-4 py-3 text-[10px] text-muted-foreground/60 uppercase tracking-wider font-medium">Charges</th>
                  <th className="text-right px-4 py-3 text-[10px] text-muted-foreground/60 uppercase tracking-wider font-medium">Net</th>
                  <th className="text-right px-4 py-3 text-[10px] text-muted-foreground/60 uppercase tracking-wider font-medium">Solde</th>
                </tr>
              </thead>
              <tbody>
                {cashflow.map((m, i) => (
                  <tr
                    key={i}
                    className={cn(
                      "border-b border-border last:border-0 transition-colors",
                      m.belowThreshold ? "bg-[#f87171]/5" : "hover:bg-muted/30"
                    )}
                  >
                    <td className="px-4 py-3 font-medium text-foreground">{m.label}</td>
                    <td className="px-4 py-3 text-right text-[#4ade80] font-medium">{fmt(Math.round(m.income))}&euro;</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{fmt(Math.round(m.urssaf))}&euro;</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{fmt(Math.round(m.ir))}&euro;</td>
                    {hasIS && <td className="px-4 py-3 text-right text-muted-foreground">{fmt(Math.round(m.is))}&euro;</td>}
                    <td className="px-4 py-3 text-right text-muted-foreground">{fmt(Math.round(m.expenses))}&euro;</td>
                    <td className={cn("px-4 py-3 text-right font-medium", m.netFlow >= 0 ? "text-[#4ade80]" : "text-[#f87171]")}>
                      {m.netFlow >= 0 ? "+" : ""}{fmt(Math.round(m.netFlow))}&euro;
                    </td>
                    <td className={cn("px-4 py-3 text-right font-bold", m.belowThreshold ? "text-[#f87171]" : "text-foreground")}>
                      {fmt(Math.round(m.balance))}&euro;
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-3">
          {cashflow.map((m, i) => (
            <div
              key={i}
              className={cn(
                "bg-card rounded-xl border p-4",
                m.belowThreshold ? "border-[#f87171]/30 bg-[#f87171]/5" : "border-border"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-foreground">{m.label}</span>
                <span className={cn("text-sm font-bold", m.belowThreshold ? "text-[#f87171]" : "text-foreground")}>
                  {fmt(Math.round(m.balance))}&euro;
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground/60">Entrées</span>
                  <span className="ml-1 font-medium text-[#4ade80]">{fmt(Math.round(m.income))}&euro;</span>
                </div>
                <div>
                  <span className="text-muted-foreground/60">Sorties</span>
                  <span className="ml-1 font-medium text-[#f87171]">{fmt(Math.round(m.totalOut))}&euro;</span>
                </div>
                <div>
                  <span className="text-muted-foreground/60">Net</span>
                  <span className={cn("ml-1 font-medium", m.netFlow >= 0 ? "text-[#4ade80]" : "text-[#f87171]")}>
                    {m.netFlow >= 0 ? "+" : ""}{fmt(Math.round(m.netFlow))}&euro;
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ProBlur>
    </div>
  );
}
