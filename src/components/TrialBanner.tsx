"use client";

import { useProfileStore } from "@/stores/useProfileStore";
import { getTrialDaysRemaining } from "@/lib/subscription";
import { cn } from "@/lib/utils";

export function TrialBanner() {
  const subscriptionStatus = useProfileStore((s) => s.subscriptionStatus);
  const trialEndsAt = useProfileStore((s) => s.trialEndsAt);

  // Only show for FREE users with an active trial
  if (subscriptionStatus !== "FREE") return null;
  const daysLeft = getTrialDaysRemaining(trialEndsAt);
  if (daysLeft <= 0) return null;

  const urgent = daysLeft <= 3;

  const handleUpgrade = async () => {
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "monthly" }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      // silently fail
    }
  };

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-3 px-4 py-2 text-xs font-medium",
        urgent
          ? "bg-[#f87171]/10 text-[#f87171] border-b border-[#f87171]/20"
          : "bg-[#5682F2]/10 text-[#5682F2] border-b border-[#5682F2]/20"
      )}
    >
      <span>
        Essai Pro : <strong>{daysLeft} jour{daysLeft > 1 ? "s" : ""}</strong> restant{daysLeft > 1 ? "s" : ""}
      </span>
      <button
        onClick={handleUpgrade}
        className={cn(
          "px-3 py-1 rounded-full text-[11px] font-semibold transition-opacity hover:opacity-90",
          urgent
            ? "bg-[#f87171] text-white"
            : "bg-gradient-to-r from-[#5682F2] to-[#7C5BF2] text-white"
        )}
      >
        Passer Pro
      </button>
    </div>
  );
}
