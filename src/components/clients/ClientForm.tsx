"use client";

import { useState } from "react";
import type { ClientData, BillingType } from "@/types";
import { BillingTypePicker } from "./BillingTypePicker";
import { Button } from "@/components/ui/button";
import { fmt } from "@/lib/utils";
import { MONTHS_SHORT } from "@/lib/constants";

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
    <div className="border border-gray-100 rounded-xl p-4 space-y-3 bg-white hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-3">
        <div
          className="w-3 h-3 rounded-full shrink-0"
          style={{ backgroundColor: client.color ?? "#6366f1" }}
        />
        <input
          className="flex-1 text-sm font-medium bg-transparent outline-none placeholder:text-gray-300"
          value={client.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          placeholder="Nom du client"
        />
        <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
          {fmt(ca)}&euro;/mois
        </span>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-gray-300 hover:text-gray-500 transition-colors text-sm"
        >
          {expanded ? "▲" : "▼"}
        </button>
        {!isOnly && (
          <button
            onClick={onRemove}
            className="text-gray-300 hover:text-red-500 transition-colors text-lg"
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">TJM</label>
                <div className="relative">
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-right pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    value={client.dailyRate ?? ""}
                    onChange={(e) => onUpdate({ dailyRate: Number(e.target.value) || 0 })}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-300">&euro;/j</span>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Jours / mois</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-right pr-6 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    value={client.daysPerMonth ?? ""}
                    onChange={(e) => onUpdate({ daysPerMonth: Number(e.target.value) || 0 })}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-300">j</span>
                </div>
              </div>
            </div>
          )}

          {client.billing === "forfait" && (
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Montant mensuel</label>
              <div className="relative">
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-right pr-12 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  value={client.monthlyAmount ?? ""}
                  onChange={(e) => onUpdate({ monthlyAmount: Number(e.target.value) || 0 })}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-300">&euro;/mois</span>
              </div>
            </div>
          )}

          {client.billing === "mission" && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Montant total</label>
                <div className="relative">
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-right pr-6 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    value={client.totalAmount ?? ""}
                    onChange={(e) => onUpdate({ totalAmount: Number(e.target.value) || 0 })}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-300">&euro;</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Debut</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white"
                    value={client.startMonth ?? 0}
                    onChange={(e) => onUpdate({ startMonth: Number(e.target.value) })}
                  >
                    {MONTHS_SHORT.map((m, i) => (
                      <option key={i} value={i}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Fin</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white"
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
      return (client.dailyRate ?? 0) * (client.daysPerMonth ?? 0);
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
