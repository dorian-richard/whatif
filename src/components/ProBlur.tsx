"use client";

import Link from "next/link";
import { Lock } from "@/components/ui/icons";
import { useProfileStore } from "@/stores/useProfileStore";

/**
 * Wraps content that is only available to Pro users.
 * Free users see the content blurred with an upgrade CTA overlay.
 * Pro users (subscriptionStatus === "ACTIVE") see the content normally.
 */
export function ProBlur({
  children,
  label = "Cette fonctionnalité est réservée au plan Pro",
}: {
  children: React.ReactNode;
  label?: string;
}) {
  const subscriptionStatus = useProfileStore((s) => s.subscriptionStatus);
  const isPro = subscriptionStatus === "ACTIVE";

  if (isPro) return <>{children}</>;

  return (
    <div className="relative">
      <div className="blur-md select-none pointer-events-none" aria-hidden>
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className="text-center max-w-xs px-4">
          <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Lock className="size-6 text-primary" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">{label}</p>
          <p className="text-xs text-muted-foreground mb-4">
            Passe au plan Pro pour débloquer toutes les fonctionnalités avancées.
          </p>
          <Link
            href="/#pricing"
            className="inline-flex px-5 py-2.5 bg-gradient-to-r from-[#5682F2] to-[#7C5BF2] text-white rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Voir les tarifs
          </Link>
        </div>
      </div>
    </div>
  );
}
