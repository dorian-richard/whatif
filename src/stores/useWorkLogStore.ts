import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface WorkEntry {
  id: string;
  date: string; // YYYY-MM-DD
  clientId: string;
  hours: number;
  description?: string;
  createdAt: number; // timestamp
}

interface WorkLogState {
  entries: WorkEntry[];
  // Timer state
  timerClientId: string | null;
  timerStartedAt: number | null; // timestamp
  // Streak
  lastWorkDate: string | null;
  currentStreak: number;
  // Actions
  addEntry: (entry: Omit<WorkEntry, "id" | "createdAt">) => void;
  removeEntry: (id: string) => void;
  startTimer: (clientId: string) => void;
  stopTimer: () => WorkEntry | null;
  cancelTimer: () => void;
  updateStreak: (date: string) => void;
}

const generateId = () => `wl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const useWorkLogStore = create<WorkLogState>()(
  persist(
    (set, get) => ({
      entries: [],
      timerClientId: null,
      timerStartedAt: null,
      lastWorkDate: null,
      currentStreak: 0,

      addEntry: (entry) => {
        const newEntry: WorkEntry = {
          ...entry,
          id: generateId(),
          createdAt: Date.now(),
        };
        set((s) => ({ entries: [...s.entries, newEntry] }));
        get().updateStreak(entry.date);
      },

      removeEntry: (id) => {
        set((s) => ({ entries: s.entries.filter((e) => e.id !== id) }));
      },

      startTimer: (clientId) => {
        set({ timerClientId: clientId, timerStartedAt: Date.now() });
      },

      stopTimer: () => {
        const { timerClientId, timerStartedAt } = get();
        if (!timerClientId || !timerStartedAt) return null;
        const elapsed = (Date.now() - timerStartedAt) / (1000 * 60 * 60); // hours
        const hours = Math.round(elapsed * 4) / 4; // round to 15min
        if (hours < 0.25) {
          set({ timerClientId: null, timerStartedAt: null });
          return null;
        }
        const today = new Date().toISOString().slice(0, 10);
        const entry: WorkEntry = {
          id: generateId(),
          date: today,
          clientId: timerClientId,
          hours,
          createdAt: Date.now(),
        };
        set((s) => ({
          entries: [...s.entries, entry],
          timerClientId: null,
          timerStartedAt: null,
        }));
        get().updateStreak(today);
        return entry;
      },

      cancelTimer: () => {
        set({ timerClientId: null, timerStartedAt: null });
      },

      updateStreak: (date) => {
        const { lastWorkDate, currentStreak } = get();
        if (lastWorkDate === date) return; // already counted today

        const yesterday = new Date(date);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().slice(0, 10);

        if (lastWorkDate === yesterdayStr) {
          set({ lastWorkDate: date, currentStreak: currentStreak + 1 });
        } else {
          set({ lastWorkDate: date, currentStreak: 1 });
        }
      },
    }),
    { name: "freelens-worklog" }
  )
);
