import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Freelens — Connexion",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
