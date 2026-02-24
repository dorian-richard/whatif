"use client";

import { useState } from "react";
import { useHoldingStore } from "@/stores/useHoldingStore";
import { Plus, X } from "@/components/ui/icons";
import { fmt } from "@/lib/utils";
import type { HoldingFlowType } from "@/types";

const FLOW_TYPES: { value: HoldingFlowType; label: string; color: string }[] = [
  { value: "dividend", label: "Dividendes", color: "#4ade80" },
  { value: "management_fee", label: "Frais de gestion", color: "#a78bfa" },
  { value: "salary", label: "Salaire", color: "#5682F2" },
];

export function HoldingFlowEditor() {
  const entities = useHoldingStore((s) => s.entities);
  const flows = useHoldingStore((s) => s.flows);
  const addFlow = useHoldingStore((s) => s.addFlow);
  const updateFlow = useHoldingStore((s) => s.updateFlow);
  const removeFlow = useHoldingStore((s) => s.removeFlow);

  const [adding, setAdding] = useState(false);
  const [newFrom, setNewFrom] = useState("");
  const [newTo, setNewTo] = useState("");
  const [newType, setNewType] = useState<HoldingFlowType>("dividend");
  const [newAmount, setNewAmount] = useState(0);

  const handleAdd = () => {
    if (!newFrom || !newTo || newFrom === newTo) return;
    addFlow({
      fromEntityId: newFrom,
      toEntityId: newTo,
      type: newType,
      annualAmount: newAmount,
    });
    setAdding(false);
    setNewFrom("");
    setNewTo("");
    setNewType("dividend");
    setNewAmount(0);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          Flux financiers
        </h3>
        <button
          onClick={() => setAdding(!adding)}
          className="text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
        >
          <Plus className="size-3.5" />
          Ajouter
        </button>
      </div>

      {/* Existing flows */}
      {flows.length === 0 && !adding && (
        <p className="text-xs text-muted-foreground/60">
          Aucun flux. Ajoutez des dividendes, frais de gestion ou salaires entre vos entités.
        </p>
      )}

      <div className="space-y-2">
        {flows.map((flow) => {
          const from = entities.find((e) => e.id === flow.fromEntityId);
          const to = entities.find((e) => e.id === flow.toEntityId);
          const typeConfig = FLOW_TYPES.find((t) => t.value === flow.type);

          return (
            <div
              key={flow.id}
              className="flex items-center gap-2 bg-muted/30 rounded-lg p-2.5"
            >
              <div
                className="size-2 rounded-full shrink-0"
                style={{ backgroundColor: typeConfig?.color ?? "#5682F2" }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-foreground truncate">
                  {from?.name ?? "?"} &rarr; {to?.name ?? "?"}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {typeConfig?.label ?? flow.type}
                </div>
              </div>
              <input
                type="number"
                value={flow.annualAmount || ""}
                onChange={(e) =>
                  updateFlow(flow.id, {
                    annualAmount: Number(e.target.value) || 0,
                  })
                }
                className="w-24 bg-muted/50 border border-border rounded-md px-2 py-1 text-xs text-foreground text-right focus:outline-none focus:ring-1 focus:ring-primary/50"
                placeholder="0€"
              />
              <button
                onClick={() => removeFlow(flow.id)}
                className="text-muted-foreground hover:text-red-400 transition-colors shrink-0"
              >
                <X className="size-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Add form */}
      {adding && (
        <div className="border-t border-border pt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-medium text-muted-foreground mb-1 block">
                De
              </label>
              <select
                value={newFrom}
                onChange={(e) => setNewFrom(e.target.value)}
                className="w-full bg-muted/50 border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
              >
                <option value="">Choisir...</option>
                {entities.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-medium text-muted-foreground mb-1 block">
                Vers
              </label>
              <select
                value={newTo}
                onChange={(e) => setNewTo(e.target.value)}
                className="w-full bg-muted/50 border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
              >
                <option value="">Choisir...</option>
                {entities.filter((e) => e.id !== newFrom).map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-medium text-muted-foreground mb-1 block">
                Type
              </label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as HoldingFlowType)}
                className="w-full bg-muted/50 border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
              >
                {FLOW_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-medium text-muted-foreground mb-1 block">
                Montant annuel (&euro;)
              </label>
              <input
                type="number"
                value={newAmount || ""}
                onChange={(e) => setNewAmount(Number(e.target.value) || 0)}
                className="w-full bg-muted/50 border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                placeholder="0"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={!newFrom || !newTo || newFrom === newTo}
              className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Ajouter le flux
            </button>
            <button
              onClick={() => setAdding(false)}
              className="py-1.5 px-3 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
