"use client";

import Link from "next/link";
import { Lock } from "@/components/ui/icons";
import { useProfileStore } from "@/stores/useProfileStore";
import { getEffectiveStatus } from "@/lib/subscription";

/**
 * Wraps content that is only available to Pro users.
 * Free users see a banner at the top + blurred content below.
 * Pro users (subscriptionStatus === "ACTIVE" or active trial) see the content normally.
 */
export function ProBlur({
  children,
  label = "Cette fonctionnalité est réservée au plan Pro",
}: {
  children: React.ReactNode;
  label?: string;
}) {
  const subscriptionStatus = useProfileStore((s) => s.subscriptionStatus);
  const trialEndsAt = useProfileStore((s) => s.trialEndsAt);
  const isPro = getEffectiveStatus(subscriptionStatus, trialEndsAt) === "ACTIVE";

  if (isPro) return <>{children}</>;

  return (
    <div className="space-y-6">
      {/* Pro banner */}
      <div className="bg-gradient-to-r from-[#5682F2]/10 to-[#7C5BF2]/10 border border-[#5682F2]/20 rounded-2xl p-6 text-center">
        <div className="size-10 rounded-xl bg-[#5682F2]/10 flex items-center justify-center mx-auto mb-3">
          <Lock className="size-5 text-[#5682F2]" />
        </div>
        <p className="text-base font-semibold text-foreground mb-1">{label}</p>
        <p className="text-sm text-muted-foreground mb-4">
          Passe au plan Pro pour débloquer toutes les fonctionnalités avancées.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/checkout?plan=monthly"
            className="inline-flex px-6 py-2.5 bg-gradient-to-r from-[#5682F2] to-[#7C5BF2] text-white rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Passer Pro
          </Link>
          <Link
            href="/#pricing"
            className="inline-flex px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Voir les tarifs
          </Link>
        </div>
      </div>

      {/* Blurred content */}
      <div className="blur-md select-none pointer-events-none" aria-hidden>
        {children}
      </div>
    </div>
  );
}
