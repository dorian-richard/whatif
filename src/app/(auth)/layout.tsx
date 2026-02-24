import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Connexion",
  description:
    "Connecte-toi à Freelens pour accéder à ton simulateur de revenus freelance, tes projections et tes outils de décision.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
