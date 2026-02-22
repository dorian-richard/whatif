"use client";

import type { ReactNode } from "react";
import type { ProjectionResult, FreelanceProfile, SimulationParams } from "@/types";
import { motion } from "framer-motion";
import { fmt, cn } from "@/lib/utils";
import {
  Wallet,
  CalendarDays,
  TrendingDown,
  TrendingUp,
  PiggyBank,
  Timer,
} from "@/components/ui/icons";

interface ImpactCardProps {
  label: string;
  before: number;
  after: number;
  unit: string;
  icon: ReactNode;
  reverse?: boolean;
  highlight?: boolean;
}

function ImpactCard({ label, before, after, unit, icon, reverse, highlight }: ImpactCardProps) {
  const diff = after - before;
  const pctChange = before !== 0 ? (diff / before) * 100 : 0;
  const isPositive = reverse ? diff < 0 : diff > 0;
  const isNeutral = Math.abs(diff) < 0.5;

  return (
    <motion.div
      layout
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      className={cn(
        "rounded-2xl p-4 border transition-all duration-200 relative overflow-hidden",
        highlight && "col-span-2 md:col-span-1",
        isNeutral
          ? "bg-card border-border"
          : isPositive
            ? "bg-[#4ade80]/8 border-[#4ade80]/15"
            : "bg-[#f87171]/8 border-[#f87171]/15"
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className={cn(
          "size-7 rounded-lg flex items-center justify-center",
          isNeutral
            ? "bg-muted"
            : isPositive
              ? "bg-[#4ade80]/12"
              : "bg-[#f87171]/12"
        )}>
          {icon}
        </div>
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="space-y-1">
        <div className="text-2xl font-bold text-foreground tracking-tight">
          {fmt(after)}
          <span className="text-sm font-normal text-muted-foreground/60 ml-0.5">{unit}</span>
        </div>
        {!isNeutral && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground/60 line-through">
              {fmt(before)}{unit}
            </span>
            <span className={cn(
              "text-xs font-bold px-1.5 py-0.5 rounded-md",
              isPositive ? "text-[#4ade80] bg-[#4ade80]/12" : "text-[#f87171] bg-[#f87171]/12"
            )}>
              {pctChange > 0 ? "+" : ""}{pctChange.toFixed(1)}%
            </span>
          </div>
        )}
        {!isNeutral && (
          <div className={cn("text-xs font-semibold", isPositive ? "text-[#4ade80]" : "text-[#f87171]")}>
            {diff > 0 ? "+" : ""}{fmt(diff)}{unit}
          </div>
        )}
      </div>
    </motion.div>
  );
}

interface ImpactCardsProps {
  projection: ProjectionResult;
  profile: FreelanceProfile;
  sim: SimulationParams;
}

export function ImpactCards({ projection, profile, sim }: ImpactCardsProps) {
  const beforeAnnual = projection.before.reduce((a, b) => a + b, 0);
  const afterAnnual = projection.after.reduce((a, b) => a + b, 0);

  const expenses = profile.monthlyExpenses + sim.expenseChange;
  const netBefore = beforeAnnual - profile.monthlyExpenses * 12;
  const netAfter = afterAnnual - expenses * 12;

  const workingDaysBefore = profile.workDaysPerWeek * 52;
  const workingDaysAfter = sim.workDaysPerWeek * (52 - sim.vacationWeeks);
  const hourlyBefore = workingDaysBefore > 0 ? beforeAnnual / (workingDaysBefore * 7.5) : 0;
  const hourlyAfter = workingDaysAfter > 0 ? afterAnnual / (workingDaysAfter * 7.5) : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      <ImpactCard
        icon={<Wallet className="size-4 text-muted-foreground" />}
        label="CA annuel"
        before={beforeAnnual}
        after={afterAnnual}
        unit="&euro;"
        highlight
      />
      <ImpactCard
        icon={<CalendarDays className="size-4 text-muted-foreground" />}
        label="Mensuel moy."
        before={beforeAnnual / 12}
        after={afterAnnual / 12}
        unit="&euro;"
      />
      <ImpactCard
        icon={<PiggyBank className="size-4 text-muted-foreground" />}
        label="Net annuel"
        before={netBefore}
        after={netAfter}
        unit="&euro;"
      />
      <ImpactCard
        icon={<Timer className="size-4 text-muted-foreground" />}
        label="Taux horaire"
        before={hourlyBefore}
        after={hourlyAfter}
        unit="&euro;/h"
      />
      <ImpactCard
        icon={<TrendingDown className="size-4 text-muted-foreground" />}
        label="Mois min"
        before={Math.min(...projection.before)}
        after={Math.min(...projection.after)}
        unit="&euro;"
      />
      <ImpactCard
        icon={<TrendingUp className="size-4 text-muted-foreground" />}
        label="Mois max"
        before={Math.max(...projection.before)}
        after={Math.max(...projection.after)}
        unit="&euro;"
      />
    </div>
  );
}
