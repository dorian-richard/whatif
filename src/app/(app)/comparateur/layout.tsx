import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Comparateur de statuts juridiques freelance",
  description: "Micro-entreprise, EI, EURL IR/IS, SASU IR/IS ou portage salarial ? Compare le net après charges et impôts selon ton CA réel. Outil gratuit Freelens.",
  alternates: { canonical: "https://freelens.io/comparateur" },
};
export default function L({ children }: { children: React.ReactNode }) { return children; }
