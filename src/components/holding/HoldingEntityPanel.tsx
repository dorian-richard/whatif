"use client";

import { useHoldingStore } from "@/stores/useHoldingStore";
import { X } from "@/components/ui/icons";
import type { HoldingEntityType } from "@/types";

const ENTITY_TYPES: { value: HoldingEntityType; label: string }[] = [
  { value: "holding", label: "Holding" },
  { value: "operating", label: "Société opérationnelle" },
  { value: "person", label: "Personne physique" },
];

const BUSINESS_STATUSES = [
  { value: "", label: "— Aucun —" },
  { value: "sasu_is", label: "SASU IS" },
  { value: "eurl_is", label: "EURL IS" },
];

export function HoldingEntityPanel() {
  const selectedEntityId = useHoldingStore((s) => s.selectedEntityId);
  const entities = useHoldingStore((s) => s.entities);
  const updateEntity = useHoldingStore((s) => s.updateEntity);
  const removeEntity = useHoldingStore((s) => s.removeEntity);
  const setSelectedEntityId = useHoldingStore((s) => s.setSelectedEntityId);

  const entity = entities.find((e) => e.id === selectedEntityId);
  if (!entity) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          Modifier l&apos;entité
        </h3>
        <button
          onClick={() => setSelectedEntityId(null)}
          className="text-muted-foreground hover:text-foreground transition-colors"
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
          {ENTITY_TYPES.map((t) => (
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
            {BUSINESS_STATUSES.map((s) => (
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
          />
        </div>
      )}

      {/* Salary (for holding/operating) */}
      {entity.type !== "person" && (
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            Salaire annuel versé (&euro;)
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
          />
        </div>
      )}

      {/* Delete */}
      <button
        onClick={() => {
          removeEntity(entity.id);
          setSelectedEntityId(null);
        }}
        className="w-full py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
      >
        Supprimer cette entité
      </button>
    </div>
  );
}
