"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useProfileStore } from "@/stores/useProfileStore";
import { StepClients } from "@/components/onboarding/StepClients";
import { StepSchedule } from "@/components/onboarding/StepSchedule";
import { StepFinances } from "@/components/onboarding/StepFinances";
import { CLIENT_COLORS } from "@/lib/constants";
import { Sparkles } from "@/components/ui/icons";

const STEPS = [
  { component: StepClients },
  { component: StepSchedule },
  { component: StepFinances },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const router = useRouter();
  const { clients, addClient, setOnboardingCompleted } = useProfileStore();

  // Seed demo clients if empty
  const seedDefaults = () => {
    if (clients.length === 0) {
      const defaults = [
        { name: "Client A", billing: "tjm" as const, dailyRate: 450, daysPerMonth: 6 },
        { name: "Client B", billing: "forfait" as const, monthlyAmount: 2000 },
        { name: "Client C", billing: "tjm" as const, dailyRate: 500, daysPerMonth: 4 },
      ];
      defaults.forEach((c) => addClient(c));
    }
  };

  const StepComponent = STEPS[step].component;

  const finish = () => {
    setOnboardingCompleted(true);
    router.push("/simulator");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <Sparkles className="size-6" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">WhatIf</h1>
          </div>
          <p className="text-gray-500">Simule chaque decision avant de la prendre.</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8 border border-gray-100">
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            {STEPS.map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    i < step
                      ? "bg-indigo-600 text-white"
                      : i === step
                        ? "bg-indigo-100 text-indigo-600 ring-2 ring-indigo-600"
                        : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-8 h-0.5 ${i < step ? "bg-indigo-600" : "bg-gray-200"}`} />
                )}
              </div>
            ))}
          </div>

          <StepComponent />

          <div className="flex justify-between mt-8">
            {step > 0 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="px-5 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
              >
                &larr; Retour
              </button>
            ) : (
              <div />
            )}
            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
              >
                Continuer &rarr;
              </button>
            ) : (
              <button
                onClick={finish}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
              >
                <Sparkles className="size-4 inline" /> Lancer le simulateur
              </button>
            )}
          </div>
        </div>

        <button
          onClick={() => {
            seedDefaults();
            finish();
          }}
          className="w-full text-center mt-4 text-xs text-gray-400 hover:text-indigo-500 transition-colors"
        >
          Passer avec les donnees de demo &rarr;
        </button>
      </div>
    </div>
  );
}
