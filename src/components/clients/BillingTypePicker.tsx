"use client";

import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";
import type { BillingType } from "@/types";
import { cn } from "@/lib/utils";
import { CalendarDays, Package, Target } from "@/components/ui/icons";

const BILLING_OPTIONS: { value: BillingType; label: string; Icon: ComponentType<LucideProps>; desc: string }[] = [
  { value: "tjm", label: "TJM", Icon: CalendarDays, desc: "Taux journalier" },
  { value: "forfait", label: "Forfait", Icon: Package, desc: "Mensuel fixe" },
  { value: "mission", label: "Mission", Icon: Target, desc: "Ponctuelle" },
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
              ? "border-[#5682F2]/30 bg-[#5682F2]/15 text-[#5682F2]"
              : "border-white/[0.06] bg-white/[0.03] hover:border-white/[0.1] text-[#8b8b9e]"
          )}
        >
          <opt.Icon className={cn("size-5", value === opt.value ? "text-[#5682F2]" : "text-[#5a5a6e]")} />
          <span className="text-xs font-semibold">{opt.label}</span>
          <span className="text-[10px] text-[#5a5a6e]">{opt.desc}</span>
        </button>
      ))}
    </div>
  );
}
