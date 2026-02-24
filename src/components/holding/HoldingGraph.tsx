"use client";

import { useCallback, useMemo, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useHoldingStore } from "@/stores/useHoldingStore";
import { HoldingEntityNode, type HoldingNodeData } from "./HoldingEntityNode";
import { fmt } from "@/lib/utils";
import type { HoldingEntityType, HoldingFlowType, EntityTaxResult } from "@/types";

const nodeTypes = {
  holdingNode: HoldingEntityNode,
};

const FLOW_STYLES: Record<HoldingFlowType, { stroke: string; strokeDasharray?: string; strokeWidth: number }> = {
  dividend: { stroke: "#4ade80", strokeWidth: 2 },
  management_fee: { stroke: "#a78bfa", strokeDasharray: "5 5", strokeWidth: 2 },
  salary: { stroke: "#5682F2", strokeWidth: 2 },
};

const FLOW_LABELS: Record<HoldingFlowType, string> = {
  dividend: "Dividendes",
  management_fee: "Frais gestion",
  salary: "Salaire",
};

interface HoldingGraphProps {
  entityResults: Map<string, EntityTaxResult>;
}

export function HoldingGraph({ entityResults }: HoldingGraphProps) {
  const entities = useHoldingStore((s) => s.entities);
  const flows = useHoldingStore((s) => s.flows);
  const updateEntityPosition = useHoldingStore((s) => s.updateEntityPosition);
  const setSelectedEntityId = useHoldingStore((s) => s.setSelectedEntityId);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onEditEntity = useCallback(
    (id: string) => {
      setSelectedEntityId(id);
    },
    [setSelectedEntityId]
  );

  const nodes: Node[] = useMemo(
    () =>
      entities.map((entity) => {
        const result = entityResults.get(entity.id);
        return {
          id: entity.id,
          type: "holdingNode",
          position: { x: entity.positionX, y: entity.positionY },
          data: {
            label: entity.name,
            entityType: entity.type as HoldingEntityType,
            businessStatus: entity.businessStatus,
            annualCA: entity.annualCA,
            annualSalary: entity.annualSalary,
            managementFees: entity.managementFees,
            color: entity.color,
            netCash: result?.netCash ?? 0,
            onEdit: onEditEntity,
          } satisfies HoldingNodeData,
        };
      }),
    [entities, entityResults, onEditEntity]
  );

  const edges: Edge[] = useMemo(
    () =>
      flows.map((flow) => {
        const style = FLOW_STYLES[flow.type] ?? FLOW_STYLES.dividend;
        return {
          id: flow.id,
          source: flow.fromEntityId,
          target: flow.toEntityId,
          type: "smoothstep",
          style: {
            stroke: style.stroke,
            strokeWidth: style.strokeWidth,
            strokeDasharray: style.strokeDasharray,
          },
          markerEnd: { type: MarkerType.ArrowClosed, color: style.stroke },
          label: flow.annualAmount > 0
            ? `${FLOW_LABELS[flow.type]} ${fmt(Math.round(flow.annualAmount))}€`
            : FLOW_LABELS[flow.type],
          labelStyle: { fontSize: 11, fontWeight: 500, fill: style.stroke },
          labelBgStyle: { fill: "var(--color-card)", stroke: "var(--color-border)" },
          labelBgPadding: [6, 4] as [number, number],
          labelBgBorderRadius: 6,
        };
      }),
    [flows]
  );

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // Apply position changes to store
      for (const change of changes) {
        if (change.type === "position" && change.position && change.id) {
          updateEntityPosition(change.id, change.position.x, change.position.y);
        }
      }

      // Debounced API save for positions
      if (changes.some((c) => c.type === "position" && "dragging" in c && !c.dragging)) {
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
          const positions = entities.map((e) => ({
            id: e.id,
            positionX: e.positionX,
            positionY: e.positionY,
          }));
          fetch("/api/holding/positions", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ positions }),
          }).catch(() => {});
        }, 1000);
      }
    },
    [entities, updateEntityPosition]
  );

  // We handle node changes via our store, not xyflow's internal state
  const onNodesChangeInternal = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);
    },
    [onNodesChange]
  );

  return (
    <div className="h-[500px] bg-card rounded-2xl border border-border overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChangeInternal}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
        className="holding-graph"
      >
        <Background gap={20} size={1} color="var(--color-border)" />
        <Controls
          showInteractive={false}
          className="!bg-card !border-border !rounded-xl !shadow-lg [&>button]:!bg-card [&>button]:!border-border [&>button]:!text-foreground"
        />
        <MiniMap
          className="!bg-card !border-border !rounded-xl"
          maskColor="rgba(0,0,0,0.1)"
          nodeColor={(n) => {
            const d = n.data as HoldingNodeData;
            return d.color ?? "#5682F2";
          }}
        />
      </ReactFlow>
    </div>
  );
}
