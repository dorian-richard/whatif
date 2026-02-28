import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Simulateur Patrimoine freelance",
  description:
    "Projette ta capacit\u00E9 d\u2019\u00E9pargne et ton patrimoine sur 5 \u00E0 30 ans selon ton statut juridique. Compare les v\u00E9hicules d\u2019investissement accessibles par structure.",
};

export default function L({ children }: { children: React.ReactNode }) {
  return children;
}
