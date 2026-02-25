"use client";

import { Building2, HandCoins, Target, FileText } from "@/components/ui/icons";
import type { HoldingEntity, HoldingFlow } from "@/types";
import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";

export type HoldingScenarioId = "current" | "all_dividends" | "optimized_salary" | "mgmt_fees";

interface ScenarioDef {
  id: HoldingScenarioId;
  label: string;
  desc: string;
  icon: ComponentType<LucideProps>;
  color: string;
}

export const SCENARIOS: ScenarioDef[] = [
  {
    id: "current",
    label: "Ma structure",
    desc: "Configuration actuelle",
    icon: Building2,
    color: "#a78bfa",
  },
  {
    id: "all_dividends",
    label: "Tout dividendes",
    desc: "Aucun salaire, 100% dividendes via holding",
    icon: HandCoins,
    color: "#4ade80",
  },
  {
    id: "optimized_salary",
    label: "Salaire optimisé",
    desc: "Salaire pour remplir la tranche IS 15%, reste en dividendes",
    icon: Target,
    color: "#5682F2",
  },
  {
    id: "mgmt_fees",
    label: "Convention de gestion",
    desc: "Frais de gestion à 10% du CA vers la holding",
    icon: FileText,
    color: "#F4BE7E",
  },
];

interface Props {
  activeScenario: HoldingScenarioId;
  onChange: (id: HoldingScenarioId) => void;
}

export function HoldingScenarios({ activeScenario, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {SCENARIOS.map((s) => {
        const active = activeScenario === s.id;
        return (
          <button
            key={s.id}
            onClick={() => onChange(s.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all border ${
              active
                ? "bg-card border-primary/40 shadow-sm"
                : "bg-card/50 border-border hover:border-primary/20 hover:bg-card"
            }`}
          >
            <s.icon
              className="size-3.5"
              style={{ color: active ? s.color : undefined }}
            />
            <div className="text-left">
              <div className={active ? "text-foreground" : "text-muted-foreground"}>
                {s.label}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Applique un scénario de simulation aux entités et flux.
 * Retourne des copies modifiées — ne modifie PAS le store.
 */
export function applyScenario(
  scenarioId: HoldingScenarioId,
  entities: HoldingEntity[],
  flows: HoldingFlow[]
): { entities: HoldingEntity[]; flows: HoldingFlow[] } {
  if (scenarioId === "current") return { entities, flows };

  const simEntities = entities.map((e) => ({ ...e }));
  const simFlows = flows.map((f) => ({ ...f }));

  switch (scenarioId) {
    case "all_dividends": {
      // Zero out all salaries — everything flows as dividends
      for (const e of simEntities) {
        e.annualSalary = 0;
      }
      for (const f of simFlows) {
        if (f.type === "salary") f.annualAmount = 0;
      }
      break;
    }

    case "optimized_salary": {
      // Keep each operating entity in the IS 15% bracket (42,500€ profit max)
      // Extract excess as salary from operating → person
      // Remaining profit flows as dividends via holding (régime mère-fille)
      for (const e of simEntities) {
        if (e.type === "operating") {
          const targetProfit = 42500;
          const excess = Math.max(0, e.annualCA - e.managementFees - targetProfit);
          e.annualSalary = Math.round(excess);
        }
        if (e.type === "holding") {
          e.annualSalary = 0;
        }
      }
      // Update salary flows to reflect new values
      for (const f of simFlows) {
        if (f.type === "salary") {
          const from = simEntities.find((e) => e.id === f.fromEntityId);
          if (from) f.annualAmount = from.annualSalary;
        }
      }
      break;
    }

    case "mgmt_fees": {
      // Add management fees at 10% of CA from operating to holding
      for (const e of simEntities) {
        if (e.type === "operating") {
          e.managementFees = Math.round(e.annualCA * 0.10);
        }
      }
      // Update management fee flows
      for (const f of simFlows) {
        if (f.type === "management_fee") {
          const from = simEntities.find((e) => e.id === f.fromEntityId);
          if (from) f.annualAmount = from.managementFees;
        }
      }
      // If no mgmt fee flows exist but operating entities have fees, add them
      const hasMgmtFlows = simFlows.some((f) => f.type === "management_fee");
      if (!hasMgmtFlows) {
        const operating = simEntities.filter((e) => e.type === "operating");
        const holding = simEntities.find((e) => e.type === "holding");
        if (holding) {
          for (const op of operating) {
            if (op.managementFees > 0) {
              simFlows.push({
                id: `sim-mgmt-${op.id}`,
                fromEntityId: op.id,
                toEntityId: holding.id,
                type: "management_fee",
                annualAmount: op.managementFees,
              });
            }
          }
        }
      }
      break;
    }
  }

  return { entities: simEntities, flows: simFlows };
}
