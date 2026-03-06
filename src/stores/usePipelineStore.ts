import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ProspectStage = "lead" | "devis_envoye" | "signe" | "actif";

export interface Prospect {
  id: string;
  name: string;
  estimatedCA: number;
  probability: number;
  stage: ProspectStage;
  notes?: string;
  expectedClose?: string;
  contactEmail?: string;
  company?: string;
  contactPhone?: string;
  billing?: string;
  dailyRate?: number;
  source?: string;
}

interface PipelineState {
  prospects: Prospect[];
  loaded: boolean;
  setProspects: (prospects: Prospect[]) => void;
  addProspect: (p: Omit<Prospect, "id">) => void;
  updateProspect: (id: string, updates: Partial<Prospect>) => void;
  removeProspect: (id: string) => void;
  setLoaded: (loaded: boolean) => void;
}

export const usePipelineStore = create<PipelineState>()(
  persist(
    (set) => ({
      prospects: [],
      loaded: false,
      setProspects: (prospects) => set({ prospects }),
      addProspect: (p) =>
        set((s) => ({
          prospects: [...s.prospects, { ...p, id: crypto.randomUUID() }],
        })),
      updateProspect: (id, updates) =>
        set((s) => ({
          prospects: s.prospects.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),
      removeProspect: (id) =>
        set((s) => ({
          prospects: s.prospects.filter((p) => p.id !== id),
        })),
      setLoaded: (loaded) => set({ loaded }),
    }),
    { name: "freelens-pipeline" }
  )
);
