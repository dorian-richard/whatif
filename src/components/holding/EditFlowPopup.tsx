"use client";

import { useHoldingStore } from "@/stores/useHoldingStore";
import { X } from "@/components/ui/icons";
import type { HoldingFlowType } from "@/types";

const FLOW_TYPES: { value: HoldingFlowType; label: string; color: string; desc: string }[] = [
  { value: "dividend", label: "Dividendes", color: "#4ade80", desc: "Distribution de bénéfices" },
  { value: "management_fee", label: "Frais de gestion", color: "#a78bfa", desc: "Convention de prestation" },
  { value: "salary", label: "Salaire", color: "#5682F2", desc: "Rémunération dirigeant" },
];

interface EditFlowPopupProps {
  flowId: string;
  onClose: () => void;
}

export function EditFlowPopup({ flowId, onClose }: EditFlowPopupProps) {
  const entities = useHoldingStore((s) => s.entities);
  const flows = useHoldingStore((s) => s.flows);
  const updateFlow = useHoldingStore((s) => s.updateFlow);
  const removeFlow = useHoldingStore((s) => s.removeFlow);

  const flow = flows.find((f) => f.id === flowId);
  if (!flow) return null;

  const source = entities.find((e) => e.id === flow.fromEntityId);
  const target = entities.find((e) => e.id === flow.toEntityId);

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
            Modifier le flux
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
                onClick={() => updateFlow(flow.id, { type: ft.value })}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                  flow.type === ft.value
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
            value={flow.annualAmount || ""}
            onChange={(e) =>
              updateFlow(flow.id, { annualAmount: Number(e.target.value) || 0 })
            }
            className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="0"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-primary text-white hover:bg-primary/90 transition-colors"
          >
            Fermer
          </button>
          <button
            onClick={() => {
              removeFlow(flow.id);
              onClose();
            }}
            className="py-2.5 px-4 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}
