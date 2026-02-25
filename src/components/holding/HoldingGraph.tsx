"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeMouseHandler,
  type Connection,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useHoldingStore } from "@/stores/useHoldingStore";
import { HoldingEntityNode, type HoldingNodeData } from "./HoldingEntityNode";
import { NewFlowPopup } from "./NewFlowPopup";
import { EditFlowPopup } from "./EditFlowPopup";
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

  // New flow popup state
  const [pendingConnection, setPendingConnection] = useState<{ source: string; target: string } | null>(null);
  // Edit existing flow popup state
  const [editingFlowId, setEditingFlowId] = useState<string | null>(null);

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
      for (const change of changes) {
        if (change.type === "position" && change.position && change.id) {
          updateEntityPosition(change.id, change.position.x, change.position.y);
        }
      }

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

  // Drag from handle to handle → open popup to configure the new flow
  const onConnect = useCallback((connection: Connection) => {
    if (connection.source && connection.target && connection.source !== connection.target) {
      setPendingConnection({ source: connection.source, target: connection.target });
    }
  }, []);

  // Click on edge → open edit popup
  const onEdgeClick: EdgeMouseHandler = useCallback((_event, edge) => {
    setEditingFlowId(edge.id);
  }, []);

  return (
    <div className="h-[500px] bg-card rounded-2xl border border-border overflow-hidden relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onConnect={onConnect}
        onEdgeClick={onEdgeClick}
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
      </ReactFlow>

      {/* New flow popup after drag-connect */}
      {pendingConnection && (
        <NewFlowPopup
          sourceId={pendingConnection.source}
          targetId={pendingConnection.target}
          onClose={() => setPendingConnection(null)}
        />
      )}

      {/* Edit flow popup on edge click */}
      {editingFlowId && (
        <EditFlowPopup
          flowId={editingFlowId}
          onClose={() => setEditingFlowId(null)}
        />
      )}
    </div>
  );
}
