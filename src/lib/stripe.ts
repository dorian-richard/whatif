import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe() {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }
  return _stripe;
}

// Keep backward compat — lazy getter
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export const PLANS = {
  monthly: {
    priceId: process.env.STRIPE_PRICE_ID_MONTHLY!,
    price: 9,
    label: "Mensuel",
  },
  annual: {
    priceId: process.env.STRIPE_PRICE_ID_ANNUAL!,
    price: 79,
    label: "Annuel (2 mois offerts)",
  },
} as const;

export const LIMITS = {
  FREE: {
    maxClients: 3,
    maxScenarios: 1,
    presets: 2,
    exportPdf: false,
    monthlyTable: false,
    emotionalMetrics: false,
  },
  ACTIVE: {
    maxClients: Infinity,
    maxScenarios: Infinity,
    presets: 6,
    exportPdf: true,
    monthlyTable: true,
    emotionalMetrics: true,
  },
} as const;
