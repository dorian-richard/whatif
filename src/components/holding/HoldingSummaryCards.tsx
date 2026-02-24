"use client";

import { Banknote, TrendingUp, PiggyBank, Gauge } from "@/components/ui/icons";
import { fmt } from "@/lib/utils";
import type { HoldingTaxResult } from "@/types";

interface Props {
  result: HoldingTaxResult;
}

export function HoldingSummaryCards({ result }: Props) {
  const savingsPositive = result.taxSavings >= 0;

  const cards = [
    {
      label: "CA Total",
      value: `${fmt(Math.round(result.totalCA))}€`,
      icon: Banknote,
      color: "#5682F2",
    },
    {
      label: "Net avec holding",
      value: `${fmt(Math.round(result.totalNetWithHolding))}€`,
      icon: TrendingUp,
      color: "#4ade80",
    },
    {
      label: "Économie fiscale",
      value: `${savingsPositive ? "+" : ""}${fmt(Math.round(result.taxSavings))}€/an`,
      icon: PiggyBank,
      color: savingsPositive ? "#4ade80" : "#f87171",
    },
    {
      label: "Taux effectif",
      value: `${Math.round(result.effectiveTaxRate * 100)}%`,
      icon: Gauge,
      color: "#F4BE7E",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-card border border-border rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <div
              className="size-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${card.color}15` }}
            >
              <card.icon className="size-4" style={{ color: card.color }} />
            </div>
            <span className="text-[11px] text-muted-foreground/60 uppercase tracking-wider">
              {card.label}
            </span>
          </div>
          <div className="text-xl font-bold text-foreground">{card.value}</div>
        </div>
      ))}
    </div>
  );
}
