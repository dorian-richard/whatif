import type { SubscriptionStatus } from "@/stores/useProfileStore";

/**
 * Returns the effective subscription status considering trial period.
 * If user is FREE but has an active trial, they get ACTIVE features.
 */
export function getEffectiveStatus(
  status: SubscriptionStatus,
  trialEndsAt: string | null
): SubscriptionStatus {
  if (status === "ACTIVE") return "ACTIVE";
  if (status === "FREE" && trialEndsAt) {
    const end = new Date(trialEndsAt);
    if (end > new Date()) return "ACTIVE";
  }
  return status;
}

/**
 * Returns the number of trial days remaining, or 0 if expired/no trial.
 */
export function getTrialDaysRemaining(trialEndsAt: string | null): number {
  if (!trialEndsAt) return 0;
  const end = new Date(trialEndsAt);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
