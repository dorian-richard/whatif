import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PaymentStatus = "pending" | "paid" | "late" | "partial";

export interface PaymentRecord {
  id: string;
  clientId: string;
  month: number; // 0-11
  year: number;
  expected: number;
  received: number;
  status: PaymentStatus;
  paidAt?: string; // ISO date
}

interface PaymentState {
  payments: PaymentRecord[];
  loaded: boolean;
  setPayments: (payments: PaymentRecord[]) => void;
  upsertPayment: (p: Omit<PaymentRecord, "id"> & { id?: string }) => void;
  getPayment: (clientId: string, month: number, year: number) => PaymentRecord | undefined;
  setLoaded: (loaded: boolean) => void;
}

export const usePaymentStore = create<PaymentState>()(
  persist(
    (set, get) => ({
      payments: [],
      loaded: false,

      setPayments: (payments) => set({ payments }),
      setLoaded: (loaded) => set({ loaded }),

      upsertPayment: (p) => {
        const existing = get().payments.find(
          (x) => x.clientId === p.clientId && x.month === p.month && x.year === p.year
        );
        if (existing) {
          set((s) => ({
            payments: s.payments.map((x) =>
              x.clientId === p.clientId && x.month === p.month && x.year === p.year
                ? { ...x, ...p, id: x.id }
                : x
            ),
          }));
        } else {
          set((s) => ({
            payments: [...s.payments, { ...p, id: p.id ?? crypto.randomUUID() }],
          }));
        }
      },

      getPayment: (clientId, month, year) =>
        get().payments.find(
          (p) => p.clientId === clientId && p.month === month && p.year === year
        ),
    }),
    { name: "freelens-payments" }
  )
);