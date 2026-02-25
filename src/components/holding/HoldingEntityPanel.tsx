"use client";

import { useEffect, useRef, useState } from "react";
import { useHoldingStore } from "@/stores/useHoldingStore";
import { HOLDING_ENTITY_TYPES, HOLDING_BUSINESS_STATUSES } from "@/lib/constants";
import { X } from "@/components/ui/icons";
import type { HoldingEntityType } from "@/types";

export function HoldingEntityPanel() {
  const selectedEntityId = useHoldingStore((s) => s.selectedEntityId);
  const entities = useHoldingStore((s) => s.entities);
  const flows = useHoldingStore((s) => s.flows);
  const updateEntity = useHoldingStore((s) => s.updateEntity);
  const removeEntity = useHoldingStore((s) => s.removeEntity);
  const setSelectedEntityId = useHoldingStore((s) => s.setSelectedEntityId);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const entity = entities.find((e) => e.id === selectedEntityId);

  // Reset confirm state when entity changes
  useEffect(() => {
    setConfirmDelete(false);
  }, [selectedEntityId]);

  // Close on Escape
  useEffect(() => {
    if (!entity) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedEntityId(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [entity, setSelectedEntityId]);

  if (!entity) return null;

  const linkedFlows = flows.filter(
    (f) => f.fromEntityId === entity.id || f.toEntityId === entity.id
  );

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === overlayRef.current) setSelectedEntityId(null);
      }}
    >
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground">
            Modifier l&apos;entit&eacute;
          </h3>
          <button
            onClick={() => setSelectedEntityId(null)}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Name */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            Nom
          </label>
          <input
            type="text"
            value={entity.name}
            onChange={(e) => updateEntity(entity.id, { name: e.target.value })}
            className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Type */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            Type
          </label>
          <select
            value={entity.type}
            onChange={(e) =>
              updateEntity(entity.id, {
                type: e.target.value as HoldingEntityType,
              })
            }
            className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            {HOLDING_ENTITY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Business status (only for holding/operating) */}
        {entity.type !== "person" && (
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Statut juridique
            </label>
            <select
              value={entity.businessStatus ?? ""}
              onChange={(e) =>
                updateEntity(entity.id, {
                  businessStatus: e.target.value || undefined,
                })
              }
              className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {HOLDING_BUSINESS_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* CA (only for operating) */}
        {entity.type === "operating" && (
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              CA annuel (&euro;)
            </label>
            <input
              type="number"
              value={entity.annualCA || ""}
              onChange={(e) =>
                updateEntity(entity.id, {
                  annualCA: Number(e.target.value) || 0,
                })
              }
              className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="120000"
              min={0}
            />
          </div>
        )}

        {/* Salary (for holding/operating) */}
        {entity.type !== "person" && (
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Salaire annuel vers&eacute; au dirigeant (&euro;)
            </label>
            <input
              type="number"
              value={entity.annualSalary || ""}
              onChange={(e) =>
                updateEntity(entity.id, {
                  annualSalary: Number(e.target.value) || 0,
                })
              }
              className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="0"
              min={0}
            />
          </div>
        )}

        {/* Management fees (for operating paying, or holding receiving) */}
        {entity.type !== "person" && (
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Frais de gestion annuels (&euro;)
            </label>
            <input
              type="number"
              value={entity.managementFees || ""}
              onChange={(e) =>
                updateEntity(entity.id, {
                  managementFees: Number(e.target.value) || 0,
                })
              }
              className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="0"
              min={0}
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => setSelectedEntityId(null)}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-primary text-white hover:bg-primary/90 transition-colors"
          >
            OK
          </button>
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  removeEntity(entity.id);
                  setSelectedEntityId(null);
                }}
                className="py-2.5 px-4 rounded-xl text-sm font-medium bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors"
              >
                Confirmer
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="py-2.5 px-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                Non
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="py-2.5 px-4 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
            >
              Supprimer{linkedFlows.length > 0 ? ` (${linkedFlows.length} flux)` : ""}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
