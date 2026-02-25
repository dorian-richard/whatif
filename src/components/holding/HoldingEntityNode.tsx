"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Building2, Briefcase, UserRound } from "@/components/ui/icons";
import { HOLDING_BUSINESS_STATUSES } from "@/lib/constants";
import { fmt } from "@/lib/utils";
import type { HoldingEntityType } from "@/types";

export interface HoldingNodeData {
  label: string;
  entityType: HoldingEntityType;
  businessStatus?: string;
  annualCA: number;
  annualSalary: number;
  managementFees: number;
  color?: string;
  netCash?: number;
  onEdit: (id: string) => void;
  [key: string]: unknown;
}

const TYPE_CONFIG: Record<HoldingEntityType, { icon: typeof Building2; badge: string; defaultColor: string }> = {
  holding: { icon: Building2, badge: "Holding", defaultColor: "#a78bfa" },
  operating: { icon: Briefcase, badge: "Opérationnelle", defaultColor: "#5682F2" },
  person: { icon: UserRound, badge: "Fondateur", defaultColor: "#4ade80" },
};

const STATUS_LABELS: Record<string, string> = Object.fromEntries(
  HOLDING_BUSINESS_STATUSES.filter((s) => s.value).map((s) => [s.value, s.label])
);

function HoldingEntityNodeInner({ id, data }: NodeProps) {
  const d = data as unknown as HoldingNodeData;
  const config = TYPE_CONFIG[d.entityType] ?? TYPE_CONFIG.operating;
  const Icon = config.icon;
  const color = d.color ?? config.defaultColor;

  return (
    <div
      className="bg-card border border-border rounded-xl p-4 min-w-[200px] max-w-[240px] shadow-lg cursor-pointer hover:border-primary/50 transition-colors"
      onDoubleClick={() => d.onEdit(id)}
    >
      {/* Handles — visible connectors for drag-to-connect */}
      <Handle type="target" position={Position.Top} className="!bg-muted-foreground/40 hover:!bg-primary !w-4 !h-2 !rounded-full !border-0 !-top-1 transition-colors" />
      <Handle type="source" position={Position.Bottom} className="!bg-muted-foreground/40 hover:!bg-primary !w-4 !h-2 !rounded-full !border-0 !-bottom-1 transition-colors" />

      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div
          className="size-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="size-4" style={{ color }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-foreground truncate">{d.label}</div>
          <div className="flex items-center gap-1.5">
            <span
              className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{ backgroundColor: `${color}15`, color }}
            >
              {config.badge}
            </span>
            {d.businessStatus && (
              <span className="text-[9px] font-medium text-muted-foreground">
                {STATUS_LABELS[d.businessStatus] ?? d.businessStatus}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Financial info */}
      {d.entityType === "person" ? (
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Net total</span>
            <span className="font-semibold text-foreground">{fmt(Math.round(d.netCash ?? 0))}&euro;/an</span>
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          {d.annualCA > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">CA</span>
              <span className="font-medium text-foreground">{fmt(Math.round(d.annualCA))}&euro;</span>
            </div>
          )}
          {d.annualSalary > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Salaire</span>
              <span className="font-medium text-foreground">{fmt(Math.round(d.annualSalary))}&euro;</span>
            </div>
          )}
          {d.managementFees > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Frais gestion</span>
              <span className="font-medium text-foreground">{fmt(Math.round(d.managementFees))}&euro;</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export const HoldingEntityNode = memo(HoldingEntityNodeInner);
