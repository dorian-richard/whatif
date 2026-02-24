import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Transition CDI → Freelance — Combien facturer ?",
  description: "Compare ton salaire CDI à un revenu freelance équivalent. Calcule le TJM minimum pour maintenir ton niveau de vie après charges et impôts. Gratuit.",
  alternates: { canonical: "https://freelens.io/transition" },
};
export default function L({ children }: { children: React.ReactNode }) { return children; }
