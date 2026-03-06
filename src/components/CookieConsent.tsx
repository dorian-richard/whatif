"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface CookieConsentState {
  necessary: true;
  analytics: boolean;
  timestamp: string;
}

const STORAGE_KEY = "freelens-cookie-consent";

function readConsent(): CookieConsentState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveConsent(analytics: boolean) {
  const consent: CookieConsentState = {
    necessary: true,
    analytics,
    timestamp: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
}

export function CookieConsent() {
  const [show, setShow] = useState(false);
  const [details, setDetails] = useState(false);
  const [analyticsToggle, setAnalyticsToggle] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setShow(true);
    }

    const openHandler = () => {
      const current = readConsent();
      setAnalyticsToggle(current?.analytics ?? false);
      setDetails(true);
      setShow(true);
    };
    window.addEventListener("freelens-open-cookie-settings", openHandler);
    return () => window.removeEventListener("freelens-open-cookie-settings", openHandler);
  }, []);

  const accept = () => {
    saveConsent(true);
    setShow(false);
    setDetails(false);
  };

  const refuse = () => {
    saveConsent(false);
    setShow(false);
    setDetails(false);
  };

  const saveCustom = () => {
    saveConsent(analyticsToggle);
    setShow(false);
    setDetails(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[51] bg-card/95 backdrop-blur-xl border-t border-border animate-in slide-in-from-bottom duration-300">
      <div className="max-w-2xl mx-auto px-4 py-4 sm:px-6 sm:py-5">
        {!details ? (
          <>
            <p className="text-sm text-foreground font-semibold mb-1">
              Nous utilisons des cookies
            </p>
            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              Freelens utilise des cookies nécessaires au fonctionnement du site
              (authentification, préférences) et des cookies analytiques pour
              améliorer le service.{" "}
              <Link
                href="/confidentialite"
                className="text-primary hover:underline"
              >
                Politique de confidentialité
              </Link>
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={refuse}
                className="px-4 py-2 border border-border text-foreground rounded-full text-sm font-semibold hover:bg-accent transition-colors"
              >
                Tout refuser
              </button>
              <button
                onClick={accept}
                className="px-4 py-2 bg-gradient-to-r from-[#5682F2] to-[#7C5BF2] text-white rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Tout accepter
              </button>
              <button
                onClick={() => {
                  const current = readConsent();
                  setAnalyticsToggle(current?.analytics ?? false);
                  setDetails(true);
                }}
                className="ml-auto text-xs text-muted-foreground hover:text-foreground underline transition-colors"
              >
                Personnaliser
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-foreground font-semibold mb-3">
              Gérer vos préférences
            </p>

            {/* Nécessaires */}
            <div className="flex items-start gap-3 mb-3">
              <div className="mt-0.5 size-5 rounded border border-border bg-muted flex items-center justify-center shrink-0">
                <svg className="size-3 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Nécessaires{" "}
                  <span className="text-xs text-muted-foreground font-normal">
                    (toujours actifs)
                  </span>
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Authentification, thème, préférences — indispensables au
                  fonctionnement du site.
                </p>
              </div>
            </div>

            {/* Analytiques */}
            <div className="flex items-start gap-3 mb-4">
              <button
                onClick={() => setAnalyticsToggle(!analyticsToggle)}
                className={`mt-0.5 size-5 rounded border shrink-0 flex items-center justify-center transition-colors ${
                  analyticsToggle
                    ? "bg-[#5682F2] border-[#5682F2]"
                    : "border-border bg-muted hover:border-muted-foreground"
                }`}
              >
                {analyticsToggle && (
                  <svg className="size-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Analytiques
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Mesure d&apos;audience anonyme (Vercel Analytics). Aucune
                  donnée personnelle collectée, aucun cookie de suivi.
                </p>
              </div>
            </div>

            <button
              onClick={saveCustom}
              className="px-4 py-2 bg-gradient-to-r from-[#5682F2] to-[#7C5BF2] text-white rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Enregistrer mes choix
            </button>
          </>
        )}
      </div>
    </div>
  );
}
