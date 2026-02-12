import { create } from "zustand";
import type { SimulationParams } from "@/types";
import { DEFAULT_SIM } from "@/lib/constants";

interface SimulatorState extends SimulationParams {
  activePreset: string | null;

  setParam: <K extends keyof SimulationParams>(
    key: K,
    value: SimulationParams[K]
  ) => void;
  applyPreset: (presetId: string, changes: Partial<SimulationParams>) => void;
  reset: () => void;
}

export const useSimulatorStore = create<SimulatorState>((set, get) => ({
  ...DEFAULT_SIM,
  activePreset: null,

  setParam: (key, value) =>
    set({ [key]: value, activePreset: null }),

  applyPreset: (presetId, changes) =>
    set((state) => {
      if (state.activePreset === presetId) {
        return { ...DEFAULT_SIM, activePreset: null };
      }
      return { ...DEFAULT_SIM, ...changes, activePreset: presetId };
    }),

  reset: () => set({ ...DEFAULT_SIM, activePreset: null }),
}));
