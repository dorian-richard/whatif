import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mes clients",
  description: "G\u00E8re tes clients, leurs modes de facturation et leurs tarifs.",
};

export default function L({ children }: { children: React.ReactNode }) {
  return children;
}
