"use client";

import type { ClientData } from "@/types";
import { getClientBaseCA } from "@/lib/simulation-engine";
import { fmt, cn } from "@/lib/utils";
import { CLIENT_COLORS } from "@/lib/constants";
import { CalendarDays, Package, Target } from "@/components/ui/icons";
import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";

const BILLING_BADGES: Record<string, { label: string; Icon: ComponentType<LucideProps>; color: string }> = {
  tjm: { label: "TJM", Icon: CalendarDays, color: "bg-[#5682F2]/12 text-[#5682F2]" },
  forfait: { label: "Forfait", Icon: Package, color: "bg-[#fbbf24]/12 text-[#fbbf24]" },
  mission: { label: "Mission", Icon: Target, color: "bg-[#4ade80]/12 text-[#4ade80]" },
};

interface ClientCompositionProps {
  clients: ClientData[];
  lostClientIndex: number;
}

export function ClientComposition({ clients, lostClientIndex }: ClientCompositionProps) {
  const activeClients = clients.filter((_, i) => i !== lostClientIndex);
  const totalCA = activeClients.reduce((s, c) => s + getClientBaseCA(c), 0);

  if (activeClients.length === 0) return null;

  const maxClientCA = Math.max(...activeClients.map((c) => getClientBaseCA(c)));
  const topClientPct = totalCA > 0 ? (maxClientCA / totalCA) * 100 : 0;
  const isConcentrated = topClientPct > 50;

  return (
    <div className="bg-[#12121c] rounded-2xl p-6 border border-white/[0.06]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white">Clients</h3>
        {isConcentrated && (
          <span className="text-[10px] text-[#fbbf24] bg-[#fbbf24]/12 px-2 py-1 rounded-full font-medium border border-[#fbbf24]/20">
            Client dominant : {topClientPct.toFixed(0)}%
          </span>
        )}
      </div>

      {/* Stacked bar */}
      <div className="flex h-10 rounded-xl overflow-hidden mb-5 bg-white/[0.04]">
        {activeClients.map((client, i) => {
          const ca = getClientBaseCA(client);
          const pct = totalCA > 0 ? (ca / totalCA) * 100 : 0;
          if (pct < 1) return null;
          return (
            <div
              key={client.id}
              className="relative transition-all duration-500 first:rounded-l-xl last:rounded-r-xl hover:opacity-80 group"
              style={{
                width: `${pct}%`,
                backgroundColor: client.color ?? CLIENT_COLORS[i % CLIENT_COLORS.length],
              }}
              title={`${client.name}: ${fmt(ca)}\u20AC (${pct.toFixed(0)}%)`}
            >
              {pct > 12 && (
                <span className="absolute inset-0 flex items-center justify-center text-white text-[10px] font-bold opacity-80">
                  {pct.toFixed(0)}%
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="space-y-2">
        {activeClients.map((client, i) => {
          const ca = getClientBaseCA(client);
          const pct = totalCA > 0 ? (ca / totalCA) * 100 : 0;
          const badge = BILLING_BADGES[client.billing];
          const color = client.color ?? CLIENT_COLORS[i % CLIENT_COLORS.length];
          return (
            <div key={client.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.04] transition-colors">
              <div
                className="w-3 h-3 rounded-full shrink-0 ring-2 ring-[#12121c]"
                style={{ backgroundColor: color }}
              />
              <span className="text-sm text-white font-medium truncate flex-1">{client.name}</span>
              <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5", badge.color)}>
                <badge.Icon className="size-2.5" /> {badge.label}
              </span>
              <span className="text-sm font-semibold text-[#8b8b9e] tabular-nums shrink-0">
                {fmt(ca)}&euro;
              </span>
              <div className="w-12 h-1.5 rounded-full bg-white/[0.04] shrink-0">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
              <span className="text-xs text-[#5a5a6e] shrink-0 w-8 text-right tabular-nums">
                {pct.toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>

      {/* Recurring vs ponctual summary */}
      {(() => {
        const recurring = activeClients
          .filter((c) => c.billing === "tjm" || c.billing === "forfait")
          .reduce((s, c) => s + getClientBaseCA(c), 0);
        const ponctual = totalCA - recurring;
        const recurringPct = totalCA > 0 ? (recurring / totalCA) * 100 : 0;
        return (
          <div className="mt-4 pt-4 border-t border-white/[0.06]">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-1 h-2 rounded-full bg-white/[0.04] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#5682F2] transition-all duration-500"
                  style={{ width: `${recurringPct}%` }}
                />
              </div>
            </div>
            <div className="flex justify-between text-xs text-[#8b8b9e]">
              <span>
                Récurrent : <strong className="text-[#5682F2]">{recurringPct.toFixed(0)}%</strong>{" "}
                <span className="text-[#5a5a6e]">({fmt(recurring)}&euro;)</span>
              </span>
              <span>
                Ponctuel : <strong className="text-[#F4BE7E]">{(100 - recurringPct).toFixed(0)}%</strong>{" "}
                <span className="text-[#5a5a6e]">({fmt(ponctual)}&euro;)</span>
              </span>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
