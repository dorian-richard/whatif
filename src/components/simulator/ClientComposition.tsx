"use client";

import type { ClientData } from "@/types";
import { getClientBaseCA } from "@/lib/simulation-engine";
import { fmt } from "@/lib/utils";
import { CLIENT_COLORS } from "@/lib/constants";
import { CalendarDays, Package, Target } from "@/components/ui/icons";
import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";

const BILLING_BADGES: Record<string, { label: string; Icon: ComponentType<LucideProps> }> = {
  tjm: { label: "TJM", Icon: CalendarDays },
  forfait: { label: "Forfait", Icon: Package },
  mission: { label: "Mission", Icon: Target },
};

interface ClientCompositionProps {
  clients: ClientData[];
  lostClientIndex: number;
}

export function ClientComposition({ clients, lostClientIndex }: ClientCompositionProps) {
  const activeClients = clients.filter((_, i) => i !== lostClientIndex);
  const totalCA = activeClients.reduce((s, c) => s + getClientBaseCA(c), 0);

  if (activeClients.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <h3 className="text-sm font-bold text-gray-800 mb-3">Repartition du CA par client</h3>

      {/* Stacked bar */}
      <div className="flex h-8 rounded-xl overflow-hidden mb-4">
        {activeClients.map((client, i) => {
          const ca = getClientBaseCA(client);
          const pct = totalCA > 0 ? (ca / totalCA) * 100 : 0;
          if (pct < 1) return null;
          return (
            <div
              key={client.id}
              className="transition-all duration-300 first:rounded-l-xl last:rounded-r-xl"
              style={{
                width: `${pct}%`,
                backgroundColor: client.color ?? CLIENT_COLORS[i % CLIENT_COLORS.length],
              }}
              title={`${client.name}: ${fmt(ca)}\u20AC (${pct.toFixed(0)}%)`}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {activeClients.map((client, i) => {
          const ca = getClientBaseCA(client);
          const pct = totalCA > 0 ? (ca / totalCA) * 100 : 0;
          const badge = BILLING_BADGES[client.billing];
          return (
            <div key={client.id} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: client.color ?? CLIENT_COLORS[i % CLIENT_COLORS.length] }}
              />
              <span className="text-gray-700 font-medium truncate">{client.name}</span>
              <span className="text-xs text-gray-400 shrink-0 flex items-center gap-0.5">
                <badge.Icon className="size-3" /> {fmt(ca)}&euro; ({pct.toFixed(0)}%)
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
          <div className="mt-3 pt-3 border-t border-gray-100 flex justify-center gap-6 text-xs text-gray-500">
            <span>
              Recurrent : <strong className="text-indigo-600">{recurringPct.toFixed(0)}%</strong> ({fmt(recurring)}&euro;)
            </span>
            <span>
              Ponctuel : <strong className="text-orange-500">{(100 - recurringPct).toFixed(0)}%</strong> ({fmt(ponctual)}&euro;)
            </span>
          </div>
        );
      })()}
    </div>
  );
}
