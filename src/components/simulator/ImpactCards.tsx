"use client";

import type { ReactNode } from "react";
import type { ProjectionResult } from "@/types";
import { motion } from "framer-motion";
import { fmt, cn } from "@/lib/utils";
import { Wallet, CalendarDays, TrendingDown, TrendingUp } from "@/components/ui/icons";

interface ImpactCardProps {
  label: string;
  before: number;
  after: number;
  unit: string;
  icon: ReactNode;
  reverse?: boolean;
}

function ImpactCard({ label, before, after, unit, icon, reverse }: ImpactCardProps) {
  const diff = after - before;
  const pctChange = before !== 0 ? (diff / before) * 100 : 0;
  const isPositive = reverse ? diff < 0 : diff > 0;
  const isNeutral = Math.abs(diff) < 0.5;

  return (
    <motion.div
      layout
      className={cn(
        "rounded-2xl p-4 border transition-colors",
        isNeutral
          ? "bg-gray-50 border-gray-100"
          : isPositive
            ? "bg-emerald-50 border-emerald-200"
            : "bg-red-50 border-red-200"
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
          {label}
        </span>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-xs text-gray-400 line-through">
          {fmt(before)}
          {unit}
        </span>
        <span className="text-xl font-bold text-gray-900">
          {fmt(after)}
          {unit}
        </span>
      </div>
      {!isNeutral && (
        <div className={cn("text-xs font-bold mt-1", isPositive ? "text-emerald-600" : "text-red-600")}>
          {diff > 0 ? "+" : ""}
          {fmt(diff)}
          {unit} ({pctChange > 0 ? "+" : ""}
          {pctChange.toFixed(1)}%)
        </div>
      )}
    </motion.div>
  );
}

interface ImpactCardsProps {
  projection: ProjectionResult;
}

export function ImpactCards({ projection }: ImpactCardsProps) {
  const beforeAnnual = projection.before.reduce((a, b) => a + b, 0);
  const afterAnnual = projection.after.reduce((a, b) => a + b, 0);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <ImpactCard
        icon={<Wallet className="size-4 text-gray-400" />}
        label="CA annuel"
        before={beforeAnnual}
        after={afterAnnual}
        unit="&euro;"
      />
      <ImpactCard
        icon={<CalendarDays className="size-4 text-gray-400" />}
        label="CA mensuel moy."
        before={beforeAnnual / 12}
        after={afterAnnual / 12}
        unit="&euro;"
      />
      <ImpactCard
        icon={<TrendingDown className="size-4 text-gray-400" />}
        label="Mois le + faible"
        before={Math.min(...projection.before)}
        after={Math.min(...projection.after)}
        unit="&euro;"
      />
      <ImpactCard
        icon={<TrendingUp className="size-4 text-gray-400" />}
        label="Mois le + fort"
        before={Math.max(...projection.before)}
        after={Math.max(...projection.after)}
        unit="&euro;"
      />
    </div>
  );
}
