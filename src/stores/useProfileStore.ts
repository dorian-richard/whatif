import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ClientData, FreelanceProfile, InvoiceSettings } from "@/types";
import { CLIENT_COLORS } from "@/lib/constants";

export type SubscriptionStatus = "FREE" | "ACTIVE" | "CANCELED" | "PAST_DUE";

interface ProfileState extends FreelanceProfile, InvoiceSettings {
  clients: ClientData[];
  onboardingCompleted: boolean;
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt: string | null;
  isDbSynced: boolean;

  setClients: (clients: ClientData[]) => void;
  addClient: (client: Omit<ClientData, "id" | "color">) => void;
  updateClient: (id: string, updates: Partial<ClientData>) => void;
  removeClient: (id: string) => void;
  setProfile: (profile: Partial<FreelanceProfile & InvoiceSettings>) => void;
  setOnboardingCompleted: (completed: boolean) => void;
  setSubscriptionStatus: (status: SubscriptionStatus) => void;
  setTrialEndsAt: (trialEndsAt: string | null) => void;
  setDbSynced: (synced: boolean) => void;
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
      nbParts: 1,
      chargesPro: 0,
      capitalSocial: 0,
      age: 35,
      onboardingCompleted: false,
      subscriptionStatus: "FREE",
      trialEndsAt: null,
      isDbSynced: false,
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

      setTrialEndsAt: (trialEndsAt) =>
        set({ trialEndsAt }),

      setDbSynced: (synced) =>
        set({ isDbSynced: synced }),
    }),
    {
      name: "freelens-profile",
    }
  )
);
