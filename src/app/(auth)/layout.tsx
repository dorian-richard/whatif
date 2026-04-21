import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Connexion",
  description:
    "Connecte-toi à Freelens pour accéder à ton tableau de bord financier : net réel, statuts, trésorerie et pilotage de ton activité freelance.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
