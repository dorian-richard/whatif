"use client";

import { Analytics } from "@vercel/analytics/react";
import { useCookieConsent } from "./CookieConsent";

export function ConditionalAnalytics() {
  const consent = useCookieConsent();

  // Don't load analytics until user has explicitly accepted
  if (!consent?.analytics) return null;

  return <Analytics />;
}
