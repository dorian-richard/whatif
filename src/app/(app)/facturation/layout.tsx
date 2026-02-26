import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Facturation & Devis",
  description: "Créez vos devis et factures, suivez les paiements et exportez en PDF.",
  alternates: { canonical: "https://freelens.io/facturation" },
};

export default function L({ children }: { children: React.ReactNode }) {
  return children;
}
