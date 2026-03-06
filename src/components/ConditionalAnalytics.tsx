"use client";

import { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/react";

export function ConditionalAnalytics() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("freelens-cookie-consent");
      if (raw) setEnabled(JSON.parse(raw)?.analytics === true);
    } catch { /* ignore */ }
  }, []);

  if (!enabled) return null;
  return <Analytics />;
}
