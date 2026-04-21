"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useProfileStore } from "@/stores/useProfileStore";
import { StepStatut } from "@/components/onboarding/StepStatut";
import { StepRevenu } from "@/components/onboarding/StepRevenu";
import { StepCharges } from "@/components/onboarding/StepCharges";
import { StepResult } from "@/components/onboarding/StepResult";
import { Sparkles } from "@/components/ui/icons";

const STEPS = [
  { component: StepStatut, label: "Statut" },
  { component: StepRevenu, label: "Revenu" },
  { component: StepCharges, label: "Charges" },
  { component: StepResult, label: "Résultat" },
];

export default function OnboardingPage() {
  const searchParams = useSearchParams();
  const initialStep = Number(searchParams.get("step") || 0);
  const from = searchParams.get("from");
  const [step, setStep] = useState(initialStep);
  const router = useRouter();
  const { setOnboardingCompleted } = useProfileStore();

  const StepComponent = STEPS[step].component;
  const isLast = step === STEPS.length - 1;

  const finish = () => {
    setOnboardingCompleted(true);
    router.push(from === "settings" ? "/settings" : "/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.webp" alt="Freelens" className="h-10 w-auto opacity-80 hidden dark:block" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-light.webp" alt="Freelens" className="h-10 w-auto opacity-80 block dark:hidden" />
            <h1 className="text-2xl font-bold fn-gradient-text">Freelens</h1>
          </div>
          <p className="text-xs text-muted-foreground">
            3 questions, 30 secondes. Tu sais combien tu gagnes vraiment.
          </p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 sm:p-8">
          {/* Progress bar (simpler than circles) */}
          <div className="flex items-center gap-1.5 mb-6">
            {STEPS.map((s, i) => (
              <div
                key={s.label}
                className={`flex-1 h-1 rounded-full transition-all duration-300 ${
                  i <= step ? "bg-[#5682F2]" : "bg-muted"
                }`}
              />
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
            {!isLast ? (
              <button
                onClick={() => setStep(step + 1)}
                className="px-6 py-2.5 bg-gradient-to-r from-[#5682F2] to-[#7C5BF2] text-white rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Continuer &rarr;
              </button>
            ) : (
              <button
                onClick={finish}
                className="px-6 py-2.5 bg-gradient-to-r from-[#5682F2] to-[#7C5BF2] text-white rounded-full text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                <Sparkles className="size-4" /> Aller au dashboard
              </button>
            )}
          </div>
        </div>

        {/* Skip option */}
        {step < STEPS.length - 1 && (
          <button
            onClick={finish}
            className="w-full text-center mt-4 text-xs text-muted-foreground/70 hover:text-[#5682F2] transition-colors"
          >
            Passer, je configurerai plus tard &rarr;
          </button>
        )}
      </div>
    </div>
  );
}
