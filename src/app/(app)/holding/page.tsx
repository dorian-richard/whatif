"use client";

import { useEffect, useMemo, useCallback, useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { useHoldingStore } from "@/stores/useHoldingStore";
import { useProfileStore } from "@/stores/useProfileStore";
import { computeHoldingStructure } from "@/lib/holding-engine";
import { ProBlur } from "@/components/ProBlur";
import { HoldingGraph } from "@/components/holding/HoldingGraph";
import { HoldingSummaryCards } from "@/components/holding/HoldingSummaryCards";
import { HoldingTaxComparison } from "@/components/holding/HoldingTaxComparison";
import { HoldingEntityPanel } from "@/components/holding/HoldingEntityPanel";
import { HoldingFlowEditor } from "@/components/holding/HoldingFlowEditor";
import { Plus, Building2 } from "@/components/ui/icons";
import type { HoldingEntity, HoldingEntityType, EntityTaxResult, FreelanceProfile } from "@/types";

const DEFAULT_ENTITIES: Omit<HoldingEntity, "id">[] = [
  {
    name: "Ma Société",
    type: "operating",
    businessStatus: "sasu_is",
    annualCA: 120000,
    annualSalary: 0,
    managementFees: 0,
    positionX: 250,
    positionY: 0,
  },
  {
    name: "Ma Holding",
    type: "holding",
    businessStatus: "sasu_is",
    annualCA: 0,
    annualSalary: 0,
    managementFees: 0,
    positionX: 250,
    positionY: 200,
  },
  {
    name: "Moi",
    type: "person",
    annualCA: 0,
    annualSalary: 0,
    managementFees: 0,
    positionX: 250,
    positionY: 400,
  },
];

export default function HoldingPage() {
  const entities = useHoldingStore((s) => s.entities);
  const flows = useHoldingStore((s) => s.flows);
  const loaded = useHoldingStore((s) => s.loaded);
  const selectedEntityId = useHoldingStore((s) => s.selectedEntityId);
  const setStructure = useHoldingStore((s) => s.setStructure);
  const addEntity = useHoldingStore((s) => s.addEntity);
  const setLoaded = useHoldingStore((s) => s.setLoaded);
  const addFlow = useHoldingStore((s) => s.addFlow);

  const profile = useProfileStore((s) => s);
  const [saving, setSaving] = useState(false);

  // Load from API on mount
  useEffect(() => {
    if (loaded) return;
    fetch("/api/holding")
      .then((r) => r.json())
      .then((data) => {
        if (data && data.entities) {
          setStructure({
            id: data.id,
            name: data.name,
            entities: data.entities.map((e: Record<string, unknown>) => ({
              id: e.id,
              name: e.name,
              type: (e.type as string).toLowerCase(),
              businessStatus: e.businessStatus,
              annualCA: e.annualCA,
              annualSalary: e.annualSalary,
              managementFees: e.managementFees,
              positionX: e.positionX,
              positionY: e.positionY,
              color: e.color,
            })),
            flows: data.flows.map((f: Record<string, unknown>) => ({
              id: f.id,
              fromEntityId: f.fromEntityId,
              toEntityId: f.toEntityId,
              type: (f.type as string).toLowerCase(),
              annualAmount: f.annualAmount,
            })),
          });
        } else if (!data || !data.id) {
          // No structure exists — create default template
          initDefaultStructure();
        }
        setLoaded(true);
      })
      .catch(() => {
        // Fallback: create default locally
        if (entities.length === 0) {
          initDefaultStructure();
        }
        setLoaded(true);
      });
  }, [loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  const initDefaultStructure = useCallback(() => {
    for (const entity of DEFAULT_ENTITIES) {
      addEntity(entity);
    }
    // Flows will be added after entities are created (need IDs from the store)
    // We'll set them up in a subsequent effect
  }, [addEntity]);

  // Once default entities are in the store but no flows exist, set up default flows
  useEffect(() => {
    if (entities.length === 3 && flows.length === 0 && loaded) {
      const operating = entities.find((e) => e.type === "operating");
      const holding = entities.find((e) => e.type === "holding");
      const person = entities.find((e) => e.type === "person");
      if (operating && holding && person) {
        addFlow({ fromEntityId: operating.id, toEntityId: holding.id, type: "dividend", annualAmount: 0 });
        addFlow({ fromEntityId: holding.id, toEntityId: person.id, type: "salary", annualAmount: 0 });
      }
    }
  }, [entities, flows.length, loaded, addFlow]);

  // Build profile for engine
  const freelanceProfile: FreelanceProfile = useMemo(
    () => ({
      monthlyExpenses: profile.monthlyExpenses,
      savings: profile.savings,
      adminHoursPerWeek: profile.adminHoursPerWeek,
      workDaysPerWeek: profile.workDaysPerWeek,
      businessStatus: profile.businessStatus ?? "sasu_is",
      remunerationType: profile.remunerationType,
      customUrssafRate: profile.customUrssafRate,
      customIrRate: profile.customIrRate,
      monthlySalary: profile.monthlySalary,
      mixtePartSalaire: profile.mixtePartSalaire,
    }),
    [profile]
  );

  // Compute tax results
  const taxResult = useMemo(
    () => computeHoldingStructure(entities, flows, freelanceProfile),
    [entities, flows, freelanceProfile]
  );

  const entityResultsMap = useMemo(() => {
    const m = new Map<string, EntityTaxResult>();
    for (const r of taxResult.entityResults) {
      m.set(r.entityId, r);
    }
    return m;
  }, [taxResult]);

  // Save to API (debounced)
  useEffect(() => {
    if (!loaded || entities.length === 0) return;
    const timer = setTimeout(() => {
      setSaving(true);
      const body = {
        name: "Ma structure holding",
        entities: entities.map((e) => ({
          id: e.id,
          name: e.name,
          type: e.type,
          businessStatus: e.businessStatus,
          annualCA: e.annualCA,
          annualSalary: e.annualSalary,
          managementFees: e.managementFees,
          positionX: e.positionX,
          positionY: e.positionY,
          color: e.color,
        })),
        flows: flows.map((f) => ({
          id: f.id,
          fromEntityId: f.fromEntityId,
          toEntityId: f.toEntityId,
          type: f.type,
          annualAmount: f.annualAmount,
        })),
      };
      fetch("/api/holding", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        .catch(() => {})
        .finally(() => setSaving(false));
    }, 2000);
    return () => clearTimeout(timer);
  }, [entities, flows, loaded]);

  const handleAddEntity = () => {
    addEntity({
      name: "Nouvelle entité",
      type: "operating" as HoldingEntityType,
      businessStatus: "sasu_is",
      annualCA: 0,
      annualSalary: 0,
      managementFees: 0,
      positionX: 100 + Math.random() * 200,
      positionY: 100 + Math.random() * 200,
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-[#a78bfa]/10 flex items-center justify-center">
            <Building2 className="size-5 text-[#a78bfa]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Structure Holding</h1>
            <p className="text-sm text-muted-foreground">
              Visualise ta structure et optimise ta fiscalité
              {saving && <span className="ml-2 text-primary animate-pulse">Sauvegarde...</span>}
            </p>
          </div>
        </div>
        <button
          onClick={handleAddEntity}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="size-4" />
          <span className="hidden sm:inline">Ajouter une entité</span>
        </button>
      </div>

      <ProBlur label="La simulation holding est réservée au plan Pro">
        {/* KPI Cards */}
        <HoldingSummaryCards result={taxResult} />

        {/* Graph + side panels (desktop) */}
        <div className="hidden md:grid md:grid-cols-[1fr_300px] gap-4">
          <ReactFlowProvider>
            <HoldingGraph entityResults={entityResultsMap} />
          </ReactFlowProvider>
          <div className="space-y-4">
            <HoldingFlowEditor />
            {selectedEntityId && <HoldingEntityPanel />}
          </div>
        </div>

        {/* Mobile entity list */}
        <div className="md:hidden space-y-3">
          {entities.map((entity) => {
            const result = entityResultsMap.get(entity.id);
            return (
              <button
                key={entity.id}
                onClick={() => useHoldingStore.getState().setSelectedEntityId(entity.id)}
                className="w-full text-left bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-foreground">{entity.name}</div>
                    <div className="text-xs text-muted-foreground capitalize">{entity.type}</div>
                  </div>
                  {entity.type === "operating" && (
                    <div className="text-sm font-bold text-foreground">
                      {new Intl.NumberFormat("fr-FR").format(Math.round(entity.annualCA))}&euro;
                    </div>
                  )}
                  {entity.type === "person" && result && (
                    <div className="text-sm font-bold text-[#4ade80]">
                      {new Intl.NumberFormat("fr-FR").format(Math.round(result.netCash))}&euro; net
                    </div>
                  )}
                </div>
              </button>
            );
          })}
          <HoldingFlowEditor />
          {selectedEntityId && <HoldingEntityPanel />}
        </div>

        {/* Tax comparison */}
        <HoldingTaxComparison result={taxResult} />
      </ProBlur>
    </div>
  );
}
