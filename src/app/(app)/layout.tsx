import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "WhatIf — Simulateur",
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
