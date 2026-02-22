import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ClientData, FreelanceProfile } from "@/types";
import { CLIENT_COLORS } from "@/lib/constants";

export type SubscriptionStatus = "FREE" | "ACTIVE" | "CANCELED" | "PAST_DUE";

interface ProfileState extends FreelanceProfile {
  clients: ClientData[];
  onboardingCompleted: boolean;
  subscriptionStatus: SubscriptionStatus;

  setClients: (clients: ClientData[]) => void;
  addClient: (client: Omit<ClientData, "id" | "color">) => void;
  updateClient: (id: string, updates: Partial<ClientData>) => void;
  removeClient: (id: string) => void;
  setProfile: (profile: Partial<FreelanceProfile>) => void;
  setOnboardingCompleted: (completed: boolean) => void;
  setSubscriptionStatus: (status: SubscriptionStatus) => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      // Defaults
      monthlyExpenses: 1800,
      savings: 10000,
      adminHoursPerWeek: 6,
      workDaysPerWeek: 5,
      workedDaysPerYear: 218,
      businessStatus: "micro",
      monthlySalary: 0,
      mixtePartSalaire: 50,
      age: 35,
      onboardingCompleted: false,
      subscriptionStatus: "FREE",
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

      setSubscriptionStatus: (status) =>
        set({ subscriptionStatus: status }),
    }),
    {
      name: "freelens-profile",
    }
  )
);
