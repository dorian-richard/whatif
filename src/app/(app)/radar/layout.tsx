import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Diagnostic Freelance",
  description: "Score de santé financière sur 6 axes : revenus, fiscalité, trésorerie, patrimoine, retraite, risque.",
};

export default function L({ children }: { children: React.ReactNode }) {
  return children;
}
