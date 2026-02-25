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
    if (clients.length === 0) return { daily: 0, week: 0, month: 0, daysSoFar: 0, daysInMonth: 0, dailyCA: 0, weekCA: 0, monthCA: 0, dailyTax: 0, weekTax: 0, monthTax: 0 };

    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    const season = SEASONALITY[month];
    const vacDays = vacationDaysPerMonth?.[month] ?? 0;

    // Monthly CA with seasonality + vacation
    let monthCA = 0;
    for (const c of clients) {
      monthCA += getClientMonthlyCA(c, month, season, vacDays);
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

    return {
      daily,
      week: daily * weekDays,
      month: Math.min(monthNet, daily * businessDaysSoFar),
      daysSoFar: Math.min(businessDaysSoFar, adjustedDays),
      daysInMonth: adjustedDays,
      dailyCA,
      weekCA: dailyCA * weekDays,
      monthCA: Math.min(monthCA, dailyCA * businessDaysSoFar),
      dailyTax,
      weekTax: dailyTax * weekDays,
      monthTax: Math.min(monthTax, dailyTax * businessDaysSoFar),
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
        <div className="w-1 shrink-0 bg-[#4ade80]" />
        <div className="flex-1 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-xl bg-[#4ade80]/12 flex items-center justify-center">
                <Zap className="size-4 text-[#4ade80]" />
              </div>
              <span className="text-xs font-semibold text-[#4ade80] uppercase tracking-wider">
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
                      ? "bg-[#4ade80]/15 text-[#4ade80] ring-1 ring-[#4ade80]/30"
                      : "bg-muted/50 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="text-3xl font-bold text-[#4ade80] tabular-nums">
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
        </div>
      </div>
    </div>
  );
}
