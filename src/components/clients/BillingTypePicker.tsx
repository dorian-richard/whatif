"use client";

import type { BillingType } from "@/types";
import { cn } from "@/lib/utils";

const BILLING_OPTIONS: { value: BillingType; label: string; icon: string; desc: string }[] = [
  { value: "tjm", label: "TJM", icon: "📅", desc: "Taux journalier" },
  { value: "forfait", label: "Forfait", icon: "📦", desc: "Mensuel fixe" },
  { value: "mission", label: "Mission", icon: "🎯", desc: "Ponctuelle" },
];

interface BillingTypePickerProps {
  value: BillingType;
  onChange: (value: BillingType) => void;
}

export function BillingTypePicker({ value, onChange }: BillingTypePickerProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {BILLING_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-center",
            value === opt.value
              ? "border-indigo-600 bg-indigo-50 text-indigo-700"
              : "border-gray-100 bg-white hover:border-gray-200 text-gray-500"
          )}
        >
          <span className="text-lg">{opt.icon}</span>
          <span className="text-xs font-semibold">{opt.label}</span>
          <span className="text-[10px] text-gray-400">{opt.desc}</span>
        </button>
      ))}
    </div>
  );
}
