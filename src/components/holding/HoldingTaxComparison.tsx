"use client";

import { fmt } from "@/lib/utils";
import type { HoldingTaxResult } from "@/types";

interface Props {
  result: HoldingTaxResult;
}

export function HoldingTaxComparison({ result }: Props) {
  const savingsPositive = result.taxSavings >= 0;
  const savingsPct =
    result.totalNetWithoutHolding > 0
      ? Math.round((result.taxSavings / result.totalNetWithoutHolding) * 100)
      : 0;

  const totalTaxesWithout = result.totalCA - result.totalNetWithoutHolding;
  const totalTaxesWith = result.totalCA - result.totalNetWithHolding;

  return (
    <div className="grid md:grid-cols-3 gap-4">
      {/* Sans holding */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="text-sm font-semibold text-muted-foreground mb-4">
          Sans Holding
        </div>
        <div className="space-y-3">
          <Row label="CA brut" value={result.totalCA} />
          <Row
            label="Charges & impôts"
            value={-totalTaxesWithout}
            color="#f87171"
          />
          <div className="border-t border-border pt-3">
            <Row
              label="Net"
              value={result.totalNetWithoutHolding}
              bold
              color="#5682F2"
            />
          </div>
        </div>
      </div>

      {/* Économie centrale */}
      <div
        className={`flex flex-col items-center justify-center rounded-xl p-5 border ${
          savingsPositive
            ? "bg-[#4ade80]/5 border-[#4ade80]/20"
            : "bg-[#f87171]/5 border-[#f87171]/20"
        }`}
      >
        <div
          className={`text-3xl font-bold ${
            savingsPositive ? "text-[#4ade80]" : "text-[#f87171]"
          }`}
        >
          {savingsPositive ? "+" : ""}
          {fmt(Math.round(result.taxSavings))}&euro;
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          {savingsPositive ? "d'économie" : "de surcoût"} / an
        </div>
        {savingsPct !== 0 && (
          <div
            className={`text-xs font-semibold mt-2 px-2 py-0.5 rounded-full ${
              savingsPositive
                ? "bg-[#4ade80]/10 text-[#4ade80]"
                : "bg-[#f87171]/10 text-[#f87171]"
            }`}
          >
            {savingsPositive ? "+" : ""}
            {savingsPct}%
          </div>
        )}
      </div>

      {/* Avec holding */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="text-sm font-semibold text-muted-foreground mb-4">
          Avec Holding
        </div>
        <div className="space-y-3">
          <Row label="CA brut" value={result.totalCA} />
          <Row
            label="Charges & impôts"
            value={-totalTaxesWith}
            color="#f87171"
          />
          <div className="border-t border-border pt-3">
            <Row
              label="Net"
              value={result.totalNetWithHolding}
              bold
              color={savingsPositive ? "#4ade80" : "#5682F2"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  color,
}: {
  label: string;
  value: number;
  bold?: boolean;
  color?: string;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={`text-sm ${bold ? "font-bold" : "font-medium"}`}
        style={color ? { color } : undefined}
      >
        {fmt(Math.round(value))}&euro;
      </span>
    </div>
  );
}
