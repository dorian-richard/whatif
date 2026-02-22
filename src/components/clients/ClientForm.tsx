"use client";

import { useState } from "react";
import type { ClientData, BillingType } from "@/types";
import { BillingTypePicker } from "./BillingTypePicker";
import { Button } from "@/components/ui/button";
import { fmt } from "@/lib/utils";
import { MONTHS_SHORT } from "@/lib/constants";
import { AVG_JOURS_OUVRES } from "@/lib/simulation-engine";

interface ClientFormProps {
  client: ClientData;
  onUpdate: (updates: Partial<ClientData>) => void;
  onRemove: () => void;
  isOnly: boolean;
}

export function ClientForm({ client, onUpdate, onRemove, isOnly }: ClientFormProps) {
  const [expanded, setExpanded] = useState(false);

  const ca = getDisplayCA(client);

  return (
    <div className="border border-border rounded-xl p-4 space-y-3 bg-card hover:border-border transition-colors">
      <div className="flex items-center gap-3">
        <div
          className="w-3 h-3 rounded-full shrink-0"
          style={{ backgroundColor: client.color ?? "#6366f1" }}
        />
        <input
          className="flex-1 text-sm font-medium bg-transparent outline-none text-foreground placeholder:text-muted-foreground/70"
          value={client.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          placeholder="Nom du client"
        />
        <span className="text-sm font-bold text-[#5682F2] bg-[#5682F2]/10 px-2.5 py-1 rounded-lg">
          {fmt(ca)}&euro;/mois
        </span>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-muted-foreground/70 hover:text-foreground transition-colors text-sm"
        >
          {expanded ? "\u25B2" : "\u25BC"}
        </button>
        {!isOnly && (
          <button
            onClick={onRemove}
            className="text-muted-foreground/70 hover:text-red-400 transition-colors text-lg"
          >
            &times;
          </button>
        )}
      </div>

      {expanded && (
        <div className="space-y-4 pt-2">
          <BillingTypePicker
            value={client.billing}
            onChange={(billing) => onUpdate({ billing })}
          />

          {client.billing === "tjm" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground/70 mb-1 block">TJM</label>
                  <div className="relative">
                    <input
                      type="number"
                      className="w-full px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm text-foreground text-right pr-10 focus:outline-none focus:ring-2 focus:ring-[#5682F2]/40"
                      value={client.dailyRate ?? ""}
                      onChange={(e) => onUpdate({ dailyRate: Number(e.target.value) || 0 })}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/70">&euro;/j</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground/70 mb-1 block">Jours / semaine</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="5"
                      className="w-full px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm text-foreground text-right pr-10 focus:outline-none focus:ring-2 focus:ring-[#5682F2]/40"
                      value={client.daysPerWeek ?? ""}
                      onChange={(e) => onUpdate({ daysPerWeek: Number(e.target.value) || 0 })}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/70">j/sem</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground/70 mb-1 block">Jours / an (optionnel)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="260"
                    placeholder="Auto"
                    className="w-full px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm text-foreground text-right pr-10 placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-[#5682F2]/40"
                    value={client.daysPerYear ?? ""}
                    onChange={(e) => {
                      const v = e.target.value === "" ? undefined : Number(e.target.value) || 0;
                      onUpdate({ daysPerYear: v });
                    }}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/70">j/an</span>
                </div>
              </div>
              <div className="text-[11px] text-muted-foreground bg-muted/50 border border-border px-3 py-1.5 rounded-lg">
                {client.daysPerYear
                  ? `${client.daysPerYear}j/an \u2192 ~${Math.round(client.daysPerYear / 12)}j/mois \u2192 ${fmt((client.dailyRate ?? 0) * client.daysPerYear / 12)}\u20AC/mois`
                  : `~${Math.round((client.daysPerWeek ?? 0) / 5 * AVG_JOURS_OUVRES)} jours ouvres/mois (auto depuis j/sem)`}
              </div>
            </div>
          )}

          {client.billing === "forfait" && (
            <div>
              <label className="text-xs text-muted-foreground/70 mb-1 block">Montant mensuel</label>
              <div className="relative">
                <input
                  type="number"
                  className="w-full px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm text-foreground text-right pr-12 focus:outline-none focus:ring-2 focus:ring-[#5682F2]/40"
                  value={client.monthlyAmount ?? ""}
                  onChange={(e) => onUpdate({ monthlyAmount: Number(e.target.value) || 0 })}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/70">&euro;/mois</span>
              </div>
            </div>
          )}

          {client.billing === "mission" && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground/70 mb-1 block">Montant total</label>
                <div className="relative">
                  <input
                    type="number"
                    className="w-full px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm text-foreground text-right pr-6 focus:outline-none focus:ring-2 focus:ring-[#5682F2]/40"
                    value={client.totalAmount ?? ""}
                    onChange={(e) => onUpdate({ totalAmount: Number(e.target.value) || 0 })}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/70">&euro;</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground/70 mb-1 block">Debut</label>
                  <select
                    className="w-full px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#5682F2]/40"
                    value={client.startMonth ?? 0}
                    onChange={(e) => onUpdate({ startMonth: Number(e.target.value) })}
                  >
                    {MONTHS_SHORT.map((m, i) => (
                      <option key={i} value={i}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground/70 mb-1 block">Fin</label>
                  <select
                    className="w-full px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#5682F2]/40"
                    value={client.endMonth ?? 11}
                    onChange={(e) => onUpdate({ endMonth: Number(e.target.value) })}
                  >
                    {MONTHS_SHORT.map((m, i) => (
                      <option key={i} value={i}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getDisplayCA(client: ClientData): number {
  switch (client.billing) {
    case "tjm":
      if (client.daysPerYear) return (client.dailyRate ?? 0) * client.daysPerYear / 12;
      return (client.dailyRate ?? 0) * (client.daysPerWeek ?? 0) / 5 * AVG_JOURS_OUVRES;
    case "forfait":
      return client.monthlyAmount ?? 0;
    case "mission": {
      const duration = Math.max(1, (client.endMonth ?? 0) - (client.startMonth ?? 0) + 1);
      return (client.totalAmount ?? 0) / duration;
    }
    default:
      return 0;
  }
}
