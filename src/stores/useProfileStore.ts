import { create } from "zustand";
import type { ClientData, FreelanceProfile } from "@/types";
import { CLIENT_COLORS } from "@/lib/constants";

interface ProfileState extends FreelanceProfile {
  clients: ClientData[];
  onboardingCompleted: boolean;

  setClients: (clients: ClientData[]) => void;
  addClient: (client: Omit<ClientData, "id" | "color">) => void;
  updateClient: (id: string, updates: Partial<ClientData>) => void;
  removeClient: (id: string) => void;
  setProfile: (profile: Partial<FreelanceProfile>) => void;
  setOnboardingCompleted: (completed: boolean) => void;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  // Defaults
  monthlyExpenses: 1800,
  savings: 10000,
  adminHoursPerWeek: 6,
  workDaysPerWeek: 5,
  onboardingCompleted: false,
  clients: [],

  setClients: (clients) => set({ clients }),

  addClient: (client) =>
    set((state) => ({
      clients: [
        ...state.clients,
        {
          ...client,
          id: crypto.randomUUID(),
          color: CLIENT_COLORS[state.clients.length % CLIENT_COLORS.length],
        },
      ],
    })),

  updateClient: (id, updates) =>
    set((state) => ({
      clients: state.clients.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })),

  removeClient: (id) =>
    set((state) => ({
      clients: state.clients.filter((c) => c.id !== id),
    })),

  setProfile: (profile) => set(profile),

  setOnboardingCompleted: (completed) =>
    set({ onboardingCompleted: completed }),
}));
