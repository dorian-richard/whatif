import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Objectif Revenu freelance — Calcule ton TJM idéal",
  description: "Quel TJM facturer pour atteindre ton revenu net cible ? Calcul automatique selon ton statut juridique, tes charges et tes vacances. Gratuit sur Freelens.",
  alternates: { canonical: "https://freelens.io/objectif" },
};
export default function L({ children }: { children: React.ReactNode }) { return children; }
