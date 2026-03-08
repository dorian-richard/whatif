"use client";

import { SimulatorEngine } from "@/components/simulator/SimulatorEngine";
import { ProBlur } from "@/components/ProBlur";

export default function SimulatorPage() {
  return (
    <ProBlur label="Le simulateur de revenus est réservé au plan Pro">
      <div className="p-4 md:p-6 max-w-6xl mx-auto">
        <SimulatorEngine />
      </div>
    </ProBlur>
  );
}
