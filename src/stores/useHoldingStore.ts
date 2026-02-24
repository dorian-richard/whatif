import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { HoldingEntity, HoldingFlow, HoldingStructureData } from "@/types";

interface HoldingState {
  structureId: string | null;
  name: string;
  entities: HoldingEntity[];
  flows: HoldingFlow[];
  loaded: boolean;
  selectedEntityId: string | null;

  setStructure: (data: HoldingStructureData) => void;
  addEntity: (entity: Omit<HoldingEntity, "id">) => void;
  updateEntity: (id: string, updates: Partial<HoldingEntity>) => void;
  removeEntity: (id: string) => void;
  updateEntityPosition: (id: string, x: number, y: number) => void;
  addFlow: (flow: Omit<HoldingFlow, "id">) => void;
  updateFlow: (id: string, updates: Partial<HoldingFlow>) => void;
  removeFlow: (id: string) => void;
  setSelectedEntityId: (id: string | null) => void;
  setLoaded: (loaded: boolean) => void;
  reset: () => void;
}

const INITIAL_STATE = {
  structureId: null,
  name: "Ma structure holding",
  entities: [] as HoldingEntity[],
  flows: [] as HoldingFlow[],
  loaded: false,
  selectedEntityId: null,
};

export const useHoldingStore = create<HoldingState>()(
  persist(
    (set) => ({
      ...INITIAL_STATE,

      setStructure: (data) =>
        set({
          structureId: data.id ?? null,
          name: data.name,
          entities: data.entities,
          flows: data.flows,
        }),

      addEntity: (entity) =>
        set((s) => ({
          entities: [...s.entities, { ...entity, id: crypto.randomUUID() }],
        })),

      updateEntity: (id, updates) =>
        set((s) => ({
          entities: s.entities.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          ),
        })),

      removeEntity: (id) =>
        set((s) => ({
          entities: s.entities.filter((e) => e.id !== id),
          flows: s.flows.filter(
            (f) => f.fromEntityId !== id && f.toEntityId !== id
          ),
          selectedEntityId:
            s.selectedEntityId === id ? null : s.selectedEntityId,
        })),

      updateEntityPosition: (id, x, y) =>
        set((s) => ({
          entities: s.entities.map((e) =>
            e.id === id ? { ...e, positionX: x, positionY: y } : e
          ),
        })),

      addFlow: (flow) =>
        set((s) => ({
          flows: [...s.flows, { ...flow, id: crypto.randomUUID() }],
        })),

      updateFlow: (id, updates) =>
        set((s) => ({
          flows: s.flows.map((f) =>
            f.id === id ? { ...f, ...updates } : f
          ),
        })),

      removeFlow: (id) =>
        set((s) => ({
          flows: s.flows.filter((f) => f.id !== id),
        })),

      setSelectedEntityId: (id) => set({ selectedEntityId: id }),
      setLoaded: (loaded) => set({ loaded }),
      reset: () => set(INITIAL_STATE),
    }),
    { name: "freelens-holding" }
  )
);
