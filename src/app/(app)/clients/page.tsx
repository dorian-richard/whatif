"use client";

import { StepClients } from "@/components/onboarding/StepClients";

export default function ClientsPage() {
  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-1">Mes clients</h1>
        <p className="text-muted-foreground">
          Ajoute, modifie ou supprime tes clients et leurs modes de facturation.
        </p>
      </div>

      <StepClients />
    </div>
  );
}
