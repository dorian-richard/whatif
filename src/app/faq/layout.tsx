import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ freelance — questions fréquentes",
  description:
    "Réponses aux questions les plus fréquentes sur Freelens : fonctionnalités, calculs, sécurité, tarifs, statuts juridiques et outils pour freelances.",
  alternates: { canonical: "https://freelens.io/faq" },
};

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  return children;
}
