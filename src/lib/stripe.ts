import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

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
