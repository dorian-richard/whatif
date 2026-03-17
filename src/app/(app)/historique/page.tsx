"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useProfileStore } from "@/stores/useProfileStore";
import { usePaymentStore } from "@/stores/usePaymentStore";
import { getClientMonthlyCA, getAnnualCA, computeNetFromCA } from "@/lib/simulation-engine";
import { SEASONALITY, MONTHS_SHORT } from "@/lib/constants";
import { fmt, cn } from "@/lib/utils";
import { TrendingUp, BarChart3, Users, Banknote } from "@/components/ui/icons";
import { ProBlur } from "@/components/ProBlur";

type Metric = "ca" | "net" | "clientCount" | "avgTJM" | "paymentRate";

interface Snapshot {
  month: number;
  year: number;
  ca: number;
  net: number;
  clientCount: number;
  avgTJM: number;
  paymentRate: number;
  expenses: number;
}

const METRIC_CONFIG: Record<Metric, { label: string; format: (v: number) => string; color: string }> = {
  ca: { label: "CA mensuel", format: (v) => `${fmt(Math.round(v))}\u20AC`, color: "#5682F2" },
  net: { label: "Net mensuel", format: (v) => `${fmt(Math.round(v))}\u20AC`, color: "#4ade80" },
  clientCount: { label: "Clients actifs", format: (v) => String(Math.round(v)), color: "#a78bfa" },
  avgTJM: { label: "TJM moyen", format: (v) => `${fmt(Math.round(v))}\u20AC`, color: "#F4BE7E" },
  paymentRate: { label: "Taux encaissement", format: (v) => `${Math.round(v * 100)}%`, color: "#f97316" },
};

export default function HistoriquePage() {
  const profile = useProfileStore();
  const { clients } = profile;
  const payments = usePaymentStore((s) => s.payments);

  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [metric, setMetric] = useState<Metric>("ca");
  const [loaded, setLoaded] = useState(false);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  // Compute current month snapshot
  const computeSnapshot = useCallback((month: number, year: number): Snapshot => {
    const season = SEASONALITY[month];
    const vacDays = profile.vacationDaysPerMonth?.[month] ?? 0;

    let ca = 0;
    for (const c of clients) {
      ca += getClientMonthlyCA(c, month, season, vacDays);
    }

    const annualCA = getAnnualCA(clients, profile.vacationDaysPerMonth);
    const netAnnual = computeNetFromCA(annualCA, profile);
    // Ratio net/CA annuel appliqué uniformément. Approximation acceptable :
    // IR et charges sont calculés annuellement. Pour IS, la répartition est indicative.
    const netRate = annualCA > 0 ? netAnnual / annualCA : 0;
    const net = ca * netRate - (profile.monthlyExpenses ?? 0);

    const activeClients = clients.filter((c) => {
      if (c.isActive === false) return false;
      const start = c.startMonth ?? 0;
      const end = c.endMonth ?? 11;
      return month >= start && month <= end;
    });
    const tjmClients = activeClients.filter((c) => c.billing === "tjm");
    const avgTJM = tjmClients.length > 0
      ? tjmClients.reduce((s, c) => s + (c.dailyRate ?? 0), 0) / tjmClients.length
      : 0;

    const monthPayments = payments.filter((p) => p.month === month && p.year === year);
    const totalExpected = monthPayments.reduce((s, p) => s + p.expected, 0);
    const totalReceived = monthPayments.reduce((s, p) => s + p.received, 0);
    const paymentRate = totalExpected > 0 ? totalReceived / totalExpected : 0;

    return { month, year, ca, net, clientCount: activeClients.length, avgTJM, paymentRate, expenses: profile.monthlyExpenses };
  }, [clients, payments, profile]);

  // Load snapshots from API
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/snapshots?year=all");
        if (!res.ok) return;
        const data = await res.json();
        setSnapshots(data);

        // Auto-snapshot current month if missing
        const hasCurrentMonth = data.some(
          (s: Snapshot) => s.month === currentMonth && s.year === currentYear
        );
        if (!hasCurrentMonth && clients.length > 0) {
          const snap = computeSnapshot(currentMonth, currentYear);
          try {
            await fetch("/api/snapshots", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(snap),
            });
            setSnapshots((prev) => [...prev, snap]);
          } catch { /* ignore */ }
        }
      } catch { /* ignore */ }
      setLoaded(true);
    }
    load();
  }, [currentMonth, currentYear, clients.length, computeSnapshot]);

  // Data for charts
  const thisYearData = useMemo(() => {
    const data: (Snapshot | null)[] = Array(12).fill(null);
    for (const s of snapshots) {
      if (s.year === currentYear && s.month >= 0 && s.month < 12) {
        data[s.month] = s;
      }
    }
    return data;
  }, [snapshots, currentYear]);

  const lastYearData = useMemo(() => {
    const data: (Snapshot | null)[] = Array(12).fill(null);
    for (const s of snapshots) {
      if (s.year === currentYear - 1 && s.month >= 0 && s.month < 12) {
        data[s.month] = s;
      }
    }
    return data;
  }, [snapshots, currentYear]);

  // YoY summaries
  const getYearTotal = (data: (Snapshot | null)[], key: Metric) => {
    const values = data.filter(Boolean) as Snapshot[];
    if (values.length === 0) return 0;
    if (key === "paymentRate" || key === "clientCount" || key === "avgTJM") {
      return values.reduce((s, v) => s + v[key], 0) / values.length;
    }
    return values.reduce((s, v) => s + v[key], 0);
  };

  const thisYearCA = getYearTotal(thisYearData, "ca");
  const lastYearCA = getYearTotal(lastYearData, "ca");
  const caDelta = lastYearCA > 0 ? ((thisYearCA - lastYearCA) / lastYearCA) * 100 : 0;

  const thisYearTJM = getYearTotal(thisYearData, "avgTJM");
  const lastYearTJM = getYearTotal(lastYearData, "avgTJM");
  const tjmDelta = lastYearTJM > 0 ? ((thisYearTJM - lastYearTJM) / lastYearTJM) * 100 : 0;

  const thisYearClients = getYearTotal(thisYearData, "clientCount");
  const lastYearClients = getYearTotal(lastYearData, "clientCount");

  const thisYearPayRate = getYearTotal(thisYearData, "paymentRate");

  // Chart max
  const metricCfg = METRIC_CONFIG[metric];
  const allValues = [...thisYearData, ...lastYearData]
    .filter(Boolean)
    .map((s) => (s as Snapshot)[metric]);
  const chartMax = Math.max(...allValues, 1);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-1">Historique & Tendances</h1>
        <p className="text-muted-foreground">
          Compare tes performances année par année.
        </p>
      </div>

      <ProBlur label="L'historique est réservé au plan Pro">
        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <Banknote className="size-4 text-[#5682F2]" />
              <span className="text-[10px] text-muted-foreground/80 uppercase tracking-wider">CA {currentYear}</span>
            </div>
            <div className="text-xl font-bold text-foreground">{fmt(Math.round(thisYearCA))}&euro;</div>
            {lastYearCA > 0 && (
              <div className={cn("text-[11px] font-medium mt-0.5", caDelta >= 0 ? "text-[#4ade80]" : "text-[#f87171]")}>
                {caDelta >= 0 ? "+" : ""}{caDelta.toFixed(0)}% vs {currentYear - 1}
              </div>
            )}
          </div>
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="size-4 text-[#F4BE7E]" />
              <span className="text-[10px] text-muted-foreground/80 uppercase tracking-wider">TJM moyen</span>
            </div>
            <div className="text-xl font-bold text-foreground">{fmt(Math.round(thisYearTJM))}&euro;</div>
            {lastYearTJM > 0 && (
              <div className={cn("text-[11px] font-medium mt-0.5", tjmDelta >= 0 ? "text-[#4ade80]" : "text-[#f87171]")}>
                {tjmDelta >= 0 ? "+" : ""}{tjmDelta.toFixed(0)}% vs {currentYear - 1}
              </div>
            )}
          </div>
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <Users className="size-4 text-[#a78bfa]" />
              <span className="text-[10px] text-muted-foreground/80 uppercase tracking-wider">Clients moy.</span>
            </div>
            <div className="text-xl font-bold text-foreground">{thisYearClients.toFixed(1)}</div>
            {lastYearClients > 0 && (
              <div className="text-[11px] text-muted-foreground/80 mt-0.5">
                {lastYearClients.toFixed(1)} en {currentYear - 1}
              </div>
            )}
          </div>
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="size-4 text-[#f97316]" />
              <span className="text-[10px] text-muted-foreground/80 uppercase tracking-wider">Encaissement</span>
            </div>
            <div className="text-xl font-bold text-foreground">{Math.round(thisYearPayRate * 100)}%</div>
          </div>
        </div>

        {/* Metric toggle */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {(Object.keys(METRIC_CONFIG) as Metric[]).map((key) => (
            <button
              key={key}
              onClick={() => setMetric(key)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap shrink-0",
                metric === key
                  ? "bg-primary/15 text-primary ring-1 ring-primary/30"
                  : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {METRIC_CONFIG[key].label}
            </button>
          ))}
        </div>

        {/* Chart */}
        <div className="bg-card rounded-2xl border border-border p-4 md:p-6">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <h3 className="text-sm font-bold text-foreground">{metricCfg.label}</h3>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground/80">
              <span className="flex items-center gap-1">
                <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: metricCfg.color }} /> {currentYear}
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2.5 h-2.5 rounded-sm bg-muted-foreground/30" /> {currentYear - 1}
              </span>
            </div>
          </div>

          {snapshots.length === 0 && loaded ? (
            <div className="text-center py-12 text-muted-foreground">
              <BarChart3 className="size-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Pas encore de données historiques.</p>
              <p className="text-xs text-muted-foreground/80 mt-1">Les snapshots mensuels se créent automatiquement.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="flex items-end gap-1 h-48 min-w-[520px]">
                {MONTHS_SHORT.map((m, i) => {
                  const thisVal = thisYearData[i]?.[metric] ?? 0;
                  const lastVal = lastYearData[i]?.[metric] ?? 0;
                  const thisPct = chartMax > 0 ? (thisVal / chartMax) * 100 : 0;
                  const lastPct = chartMax > 0 ? (lastVal / chartMax) * 100 : 0;
                  const isFuture = i > currentMonth;

                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex items-end justify-center gap-1" style={{ height: "160px" }}>
                        <div
                          className="w-2/5 max-w-[14px] rounded-t bg-muted-foreground/20 transition-all"
                          style={{ height: `${Math.max(lastVal > 0 ? 2 : 0, lastPct)}%` }}
                          title={`${currentYear - 1}: ${metricCfg.format(lastVal)}`}
                        />
                        <div
                          className={cn("w-2/5 max-w-[14px] rounded-t transition-all", isFuture ? "opacity-30" : "")}
                          style={{
                            height: `${Math.max(thisVal > 0 ? 2 : 0, thisPct)}%`,
                            backgroundColor: metricCfg.color,
                          }}
                          title={`${currentYear}: ${metricCfg.format(thisVal)}`}
                        />
                      </div>
                      <span className={cn("text-[9px]", i === currentMonth ? "text-foreground font-semibold" : "text-muted-foreground/80")}>
                        {m}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Detail table */}
        {snapshots.length > 0 && (
          <div className="hidden md:block bg-card rounded-2xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-[10px] text-muted-foreground/80 uppercase tracking-wider font-medium">Mois</th>
                  <th className="text-right px-4 py-3 text-[10px] text-muted-foreground/80 uppercase tracking-wider font-medium">{currentYear}</th>
                  <th className="text-right px-4 py-3 text-[10px] text-muted-foreground/80 uppercase tracking-wider font-medium">{currentYear - 1}</th>
                  <th className="text-right px-4 py-3 text-[10px] text-muted-foreground/80 uppercase tracking-wider font-medium">Delta</th>
                </tr>
              </thead>
              <tbody>
                {MONTHS_SHORT.map((m, i) => {
                  const thisVal = thisYearData[i]?.[metric] ?? 0;
                  const lastVal = lastYearData[i]?.[metric] ?? 0;
                  const delta = lastVal > 0 ? ((thisVal - lastVal) / lastVal) * 100 : 0;
                  const hasData = thisVal > 0 || lastVal > 0;
                  if (!hasData) return null;

                  return (
                    <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">{m}</td>
                      <td className="px-4 py-3 text-right font-medium" style={{ color: metricCfg.color }}>
                        {metricCfg.format(thisVal)}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {lastVal > 0 ? metricCfg.format(lastVal) : "-"}
                      </td>
                      <td className={cn("px-4 py-3 text-right font-medium", delta >= 0 ? "text-[#4ade80]" : "text-[#f87171]")}>
                        {lastVal > 0 ? `${delta >= 0 ? "+" : ""}${delta.toFixed(0)}%` : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </ProBlur>
    </div>
  );
}
