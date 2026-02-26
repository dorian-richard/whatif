import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { InvoiceDocument } from "@/types";

interface InvoiceState {
  documents: InvoiceDocument[];
  loaded: boolean;
  setDocuments: (docs: InvoiceDocument[]) => void;
  addDocument: (doc: InvoiceDocument) => void;
  updateDocument: (id: string, updates: Partial<InvoiceDocument>) => void;
  removeDocument: (id: string) => void;
  getDocument: (id: string) => InvoiceDocument | undefined;
  setLoaded: (loaded: boolean) => void;
}

export const useInvoiceStore = create<InvoiceState>()(
  persist(
    (set, get) => ({
      documents: [],
      loaded: false,

      setDocuments: (documents) => set({ documents }),
      setLoaded: (loaded) => set({ loaded }),

      addDocument: (doc) =>
        set((s) => ({ documents: [...s.documents, doc] })),

      updateDocument: (id, updates) =>
        set((s) => ({
          documents: s.documents.map((d) =>
            d.id === id ? { ...d, ...updates } : d
          ),
        })),

      removeDocument: (id) =>
        set((s) => ({
          documents: s.documents.filter((d) => d.id !== id),
        })),

      getDocument: (id) => get().documents.find((d) => d.id === id),
    }),
    { name: "freelens-invoicing" }
  )
);
