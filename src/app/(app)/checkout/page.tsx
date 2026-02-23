"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") ?? "monthly";
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function startCheckout() {
      try {
        const res = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan }),
        });
        const data = await res.json();
        if (!cancelled && data.url) {
          window.location.href = data.url;
        } else if (!cancelled) {
          setError(data.error ?? "Impossible de créer la session de paiement.");
        }
      } catch {
        if (!cancelled) setError("Erreur réseau. Réessaye.");
      }
    }

    startCheckout();
    return () => { cancelled = true; };
  }, [plan]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-sm">
          <p className="text-sm text-[#f87171] mb-4">{error}</p>
          <Link
            href="/settings"
            className="inline-flex px-5 py-2.5 bg-gradient-to-r from-[#5682F2] to-[#7C5BF2] text-white rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Retour aux paramètres
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="size-8 border-2 border-[#5682F2] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-muted-foreground">Redirection vers le paiement…</p>
      </div>
    </div>
  );
}
