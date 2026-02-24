"use client";

import { useState } from "react";
import { useHoldingStore } from "@/stores/useHoldingStore";
import { X } from "@/components/ui/icons";
import type { HoldingFlowType } from "@/types";

const FLOW_TYPES: { value: HoldingFlowType; label: string; color: string; desc: string }[] = [
  { value: "dividend", label: "Dividendes", color: "#4ade80", desc: "Distribution de bénéfices" },
  { value: "management_fee", label: "Frais de gestion", color: "#a78bfa", desc: "Convention de prestation" },
  { value: "salary", label: "Salaire", color: "#5682F2", desc: "Rémunération dirigeant" },
];

interface NewFlowPopupProps {
  sourceId: string;
  targetId: string;
  onClose: () => void;
}

export function NewFlowPopup({ sourceId, targetId, onClose }: NewFlowPopupProps) {
  const entities = useHoldingStore((s) => s.entities);
  const addFlow = useHoldingStore((s) => s.addFlow);

  const [type, setType] = useState<HoldingFlowType>("dividend");
  const [amount, setAmount] = useState(0);

  const source = entities.find((e) => e.id === sourceId);
  const target = entities.find((e) => e.id === targetId);

  const handleCreate = () => {
    addFlow({
      fromEntityId: sourceId,
      toEntityId: targetId,
      type,
      annualAmount: amount,
    });
    onClose();
  };

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm rounded-2xl"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-card border border-border rounded-2xl p-5 w-full max-w-sm mx-4 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            Nouveau flux
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Direction */}
        <div className="bg-muted/30 rounded-lg p-3 text-center">
          <span className="text-sm font-medium text-foreground">
            {source?.name ?? "?"}{" "}
            <span className="text-muted-foreground">&rarr;</span>{" "}
            {target?.name ?? "?"}
          </span>
        </div>

        {/* Type selector */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Type de flux
          </label>
          <div className="space-y-1.5">
            {FLOW_TYPES.map((ft) => (
              <button
                key={ft.value}
                onClick={() => setType(ft.value)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                  type === ft.value
                    ? "border-primary/50 bg-primary/5"
                    : "border-border hover:border-border/80 hover:bg-muted/30"
                }`}
              >
                <div
                  className="size-3 rounded-full shrink-0"
                  style={{ backgroundColor: ft.color }}
                />
                <div>
                  <div className="text-sm font-medium text-foreground">{ft.label}</div>
                  <div className="text-[10px] text-muted-foreground">{ft.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Amount */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            Montant annuel (&euro;)
          </label>
          <input
            type="number"
            value={amount || ""}
            onChange={(e) => setAmount(Number(e.target.value) || 0)}
            className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="0 (configurer plus tard)"
            autoFocus
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={handleCreate}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-primary text-white hover:bg-primary/90 transition-colors"
          >
            Créer le flux
          </button>
          <button
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
