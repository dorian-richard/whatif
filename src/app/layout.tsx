import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { PWAInstallBanner } from "@/components/PWAInstallBanner";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { ConditionalAnalytics } from "@/components/ConditionalAnalytics";
import { CookieConsent } from "@/components/CookieConsent";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://freelens.io";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Freelens \u2014 L'outil de pilotage et de suivi des freelances",
    template: "%s | Freelens",
  },
  description:
    "Pilote et suis ton activit\u00e9 freelance : net r\u00e9el apr\u00e8s URSSAF et IR, factures, tr\u00e9sorerie, pipeline commercial, calendrier fiscal. Tout en un, en temps r\u00e9el. Essai Pro 7 jours gratuit.",
  keywords: [
    "freelance",
    "simulateur freelance",
    "simulateur revenus freelance",
    "TJM",
    "TJM développeur",
    "TJM consultant",
    "comparateur statuts juridiques",
    "micro-entreprise",
    "SASU",
    "EURL",
    "portage salarial",
    "charges freelance",
    "cotisations URSSAF freelance",
    "impôts freelance",
    "revenus freelance",
    "calcul net freelance",
    "transition CDI freelance",
    "benchmark TJM",
    "calendrier fiscal freelance",
    "trésorerie freelance",
    "ACRE simulation",
    "retraite freelance",
    "devenir freelance",
    "combien facturer freelance",
  ],
  authors: [{ name: "Freelens" }],
  creator: "Freelens",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: SITE_URL,
    siteName: "Freelens",
    title: "Freelens \u2014 L'outil de pilotage et de suivi des freelances",
    description:
      "Pilote et suis ton activit\u00e9 freelance : net r\u00e9el, factures, tr\u00e9sorerie, pipeline. Tout en un, en temps r\u00e9el.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Freelens — Décide avec les chiffres, pas au feeling",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Freelens \u2014 L'outil de pilotage et de suivi des freelances",
    description:
      "Pilote et suis ton activit\u00e9 freelance : net r\u00e9el, factures, tr\u00e9sorerie, pipeline. En temps r\u00e9el.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
  category: "finance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#07070e" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>{children}</ThemeProvider>
        <PWAInstallBanner />
        <ServiceWorkerRegistration />
        <ConditionalAnalytics />
        <CookieConsent />
      </body>
    </html>
  );
}
