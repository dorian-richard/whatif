"use client";

import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { useProfileStore } from "@/stores/useProfileStore";
import { getClientMonthlyCA, getAnnualCA, computeNetFromCA } from "@/lib/simulation-engine";
import { SEASONALITY } from "@/lib/constants";
import { fmt, cn } from "@/lib/utils";
import { Zap } from "@/components/ui/icons";

type ViewMode = "day" | "week" | "month";

function useAnimatedValue(target: number, duration = 600) {
  const [display, setDisplay] = useState(target);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const start = display;
    const diff = target - start;
    if (Math.abs(diff) < 0.5) { setDisplay(target); return; }
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + diff * eased);
      if (progress < 1) frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return display;
}

export function EarningsCounter() {
  const clients = useProfileStore((s) => s.clients);
  const vacationDaysPerMonth = useProfileStore((s) => s.vacationDaysPerMonth);
  const profile = useProfileStore();

  const [viewMode, setViewMode] = useState<ViewMode>("month");

  const earnings = useMemo(() => {
    if (clients.length === 0) return { daily: 0, week: 0, month: 0, daysSoFar: 0, daysInMonth: 0, dailyCA: 0, weekCA: 0, monthCA: 0, dailyTax: 0, weekTax: 0, monthTax: 0, monthCATarget: 0, monthNetTarget: 0, progressPct: 0, monthLabel: "", clientBreakdown: [] as { name: string; ca: number; pct: number; color: string }[] };

    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    const season = SEASONALITY[month];
    const vacDays = vacationDaysPerMonth?.[month] ?? 0;

    // Monthly CA with seasonality + vacation
    let monthCA = 0;
    const clientCAs: { name: string; ca: number; color: string }[] = [];
    for (const c of clients) {
      const ca = getClientMonthlyCA(c, month, season, vacDays);
      monthCA += ca;
      clientCAs.push({ name: c.name, ca, color: c.color ?? "#5682F2" });
    }

    // Net rate from annual (with seasonality)
    const annualCA = getAnnualCA(clients, vacationDaysPerMonth);
    const netAnnual = computeNetFromCA(annualCA, profile);
    const netRate = annualCA > 0 ? netAnnual / annualCA : 0;
    const monthNet = monthCA * netRate;

    // Business days
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let businessDaysInMonth = 0;
    let businessDaysSoFar = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const dow = new Date(year, month, d).getDay();
      if (dow !== 0 && dow !== 6) {
        businessDaysInMonth++;
        if (d <= now.getDate()) businessDaysSoFar++;
      }
    }

    const adjustedDays = Math.max(1, businessDaysInMonth - vacDays);
    const daily = monthNet / adjustedDays;
    const monthTax = monthCA - monthNet;
    const dailyCA = monthCA / adjustedDays;
    const dailyTax = monthTax / adjustedDays;

    // Week so far (Mon → today)
    const todayDow = now.getDay();
    const mondayOffset = (todayDow + 6) % 7;
    const mondayDate = now.getDate() - mondayOffset;
    let weekDays = 0;
    for (let d = Math.max(1, mondayDate); d <= now.getDate(); d++) {
      const dow = new Date(year, month, d).getDay();
      if (dow !== 0 && dow !== 6) weekDays++;
    }

    const progressPct = adjustedDays > 0 ? Math.min(1, businessDaysSoFar / adjustedDays) : 0;

    const clientBreakdown = clientCAs.map((c) => ({
      name: c.name,
      ca: c.ca,
      pct: monthCA > 0 ? (c.ca / monthCA) * 100 : 0,
      color: c.color,
    }));

    return {
      daily,
      week: daily * weekDays,
      month: Math.min(monthNet, daily * businessDaysSoFar),
      daysSoFar: Math.min(businessDaysSoFar, adjustedDays),
      daysInMonth: adjustedDays,
      dailyCA,
      weekCA: dailyCA * weekDays,
      monthCA: Math.min(monthCA, dailyCA * businessDaysSoFar),
      monthCATarget: monthCA,
      monthNetTarget: monthNet,
      dailyTax,
      weekTax: dailyTax * weekDays,
      monthTax: Math.min(monthTax, dailyTax * businessDaysSoFar),
      progressPct,
      monthLabel: now.toLocaleDateString("fr-FR", { month: "long" }),
      clientBreakdown,
    };
  }, [clients, vacationDaysPerMonth, profile]);

  const targetValue = viewMode === "day" ? earnings.daily : viewMode === "week" ? earnings.week : earnings.month;
  const targetCA = viewMode === "day" ? earnings.dailyCA : viewMode === "week" ? earnings.weekCA : earnings.monthCA;
  const targetTax = viewMode === "day" ? earnings.dailyTax : viewMode === "week" ? earnings.weekTax : earnings.monthTax;
  const animatedValue = useAnimatedValue(targetValue);

  if (clients.length === 0) return null;

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="flex">
        <div className="w-1 shrink-0 bg-[#5682F2]" />
        <div className="flex-1 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-xl bg-[#5682F2]/12 flex items-center justify-center">
                <Zap className="size-4 text-[#5682F2]" />
              </div>
              <span className="text-xs font-semibold text-[#5682F2] uppercase tracking-wider">
                Gagné {viewMode === "day" ? "aujourd\u2019hui" : viewMode === "week" ? "cette semaine" : "ce mois"}
              </span>
            </div>
            <div className="flex gap-1">
              {([
                { key: "day" as const, label: "Jour" },
                { key: "week" as const, label: "Semaine" },
                { key: "month" as const, label: "Mois" },
              ]).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setViewMode(key)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-medium transition-all",
                    viewMode === key
                      ? "bg-primary/15 text-primary ring-1 ring-primary/30"
                      : "bg-muted/50 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="text-3xl font-bold text-[#5682F2] tabular-nums">
            {fmt(Math.round(animatedValue))}&euro;
            <span className="text-sm font-normal text-muted-foreground/60 ml-2">net</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground/60 mt-1.5">
            <span>{fmt(Math.round(targetCA))}&euro; CA HT</span>
            <span>&middot;</span>
            <span className="text-[#f87171]/70">{fmt(Math.round(targetTax))}&euro; charges &amp; impôts</span>
          </div>
          <div className="text-[11px] text-muted-foreground/60 mt-0.5">
            {earnings.daysSoFar}/{earnings.daysInMonth} jours ouvrés &middot; {fmt(Math.round(earnings.daily))}&euro;/jour net
          </div>

          {/* Month progress bar */}
          {earnings.monthCATarget > 0 && (
            <div className="mt-4 pt-3 border-t border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-muted-foreground/80 capitalize">
                  Progression {earnings.monthLabel}
                </span>
                <span className="text-[11px] text-muted-foreground/60 tabular-nums">
                  {fmt(Math.round(earnings.monthCA))}&euro; / {fmt(Math.round(earnings.monthCATarget))}&euro; CA
                  <span className="ml-1.5 font-semibold text-foreground">{Math.round(earnings.progressPct * 100)}%</span>
                </span>
              </div>
              {/* Segmented bar by client */}
              <div className="relative w-full h-3 bg-muted rounded-full overflow-hidden">
                {/* Filled portion = progressPct, segmented by client */}
                <div
                  className="absolute inset-y-0 left-0 flex rounded-full overflow-hidden transition-all duration-700 ease-out"
                  style={{ width: `${Math.max(1, earnings.progressPct * 100)}%` }}
                >
                  {earnings.clientBreakdown.map((c, i) => (
                    <div
                      key={i}
                      className="relative h-full group/seg"
                      style={{ width: `${c.pct}%`, backgroundColor: c.color }}
                    >
                      {/* Tooltip */}
                      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 rounded-lg bg-foreground text-background text-[11px] whitespace-nowrap opacity-0 group-hover/seg:opacity-100 transition-opacity duration-150 z-50">
                        <div className="flex items-center gap-1.5">
                          <div className="size-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                          <span className="font-semibold">{c.name}</span>
                        </div>
                        <div className="mt-0.5 text-[10px] opacity-80">
                          {fmt(Math.round(c.ca))}&euro;/mois &middot; {c.pct.toFixed(0)}% du CA
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Day marker */}
                <div
                  className="absolute top-0 bottom-0 w-px bg-foreground/30"
                  style={{ left: `${earnings.progressPct * 100}%` }}
                />
              </div>
              {/* Client legend */}
              {earnings.clientBreakdown.length > 1 && (
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                  {earnings.clientBreakdown.map((c, i) => (
                    <div key={i} className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
                      <div className="size-1.5 rounded-full" style={{ backgroundColor: c.color }} />
                      <span>{c.name}</span>
                      <span className="font-semibold text-foreground/80">{c.pct.toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
