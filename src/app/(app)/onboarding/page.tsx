"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useProfileStore } from "@/stores/useProfileStore";
import { StepBusiness } from "@/components/onboarding/StepBusiness";
import { StepClients } from "@/components/onboarding/StepClients";
import { StepSchedule } from "@/components/onboarding/StepSchedule";
import { StepFinances } from "@/components/onboarding/StepFinances";
import { CLIENT_COLORS } from "@/lib/constants";
import { Sparkles } from "@/components/ui/icons";

const STEPS = [
  { component: StepBusiness },
  { component: StepClients },
  { component: StepSchedule },
  { component: StepFinances },
];

export default function OnboardingPage() {
  const searchParams = useSearchParams();
  const initialStep = Number(searchParams.get("step") || 0);
  const from = searchParams.get("from");
  const [step, setStep] = useState(initialStep);
  const router = useRouter();
  const { clients, addClient, setOnboardingCompleted } = useProfileStore();

  // Seed demo clients if empty
  const seedDefaults = () => {
    if (clients.length === 0) {
      const defaults = [
        { name: "Client A", billing: "tjm" as const, dailyRate: 450, daysPerWeek: 3 },
        { name: "Client B", billing: "forfait" as const, monthlyAmount: 2000 },
        { name: "Client C", billing: "tjm" as const, dailyRate: 500, daysPerWeek: 2 },
      ];
      defaults.forEach((c) => addClient(c));
    }
  };

  const StepComponent = STEPS[step].component;

  const finish = () => {
    setOnboardingCompleted(true);
    router.push(from === "settings" ? "/settings" : "/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Freelens" className="h-14 w-auto opacity-80" />
            <h1 className="text-3xl font-bold fn-gradient-text">Freelens</h1>
          </div>
          <p className="text-muted-foreground">Simule chaque décision avant de la prendre.</p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-8">
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            {STEPS.map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    i < step
                      ? "bg-[#5682F2] text-white"
                      : i === step
                        ? "bg-[#5682F2]/15 text-[#5682F2] ring-2 ring-[#5682F2]"
                        : "bg-muted text-muted-foreground/70"
                  }`}
                >
                  {i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-8 h-0.5 ${i < step ? "bg-[#5682F2]" : "bg-border"}`} />
                )}
              </div>
            ))}
          </div>

          <StepComponent />

          <div className="flex justify-between mt-8">
            {step > 0 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                &larr; Retour
              </button>
            ) : (
              <div />
            )}
            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="px-6 py-2.5 bg-gradient-to-r from-[#5682F2] to-[#7C5BF2] text-white rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Continuer &rarr;
              </button>
            ) : (
              <button
                onClick={finish}
                className="px-6 py-2.5 bg-gradient-to-r from-[#5682F2] to-[#7C5BF2] text-white rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
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
          className="w-full text-center mt-4 text-xs text-muted-foreground/70 hover:text-[#5682F2] transition-colors"
        >
          Passer avec les données de démo &rarr;
        </button>
      </div>
    </div>
  );
}
