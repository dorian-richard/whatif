import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
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
    default: "Freelens \u2014 Le copilote financier des freelances",
    template: "%s | Freelens",
  },
  description:
    "Simulateur de revenus, comparateur de statuts juridiques, benchmark TJM et outils de d\u00e9cision pour freelances. Gratuit et 100% confidentiel.",
  keywords: [
    "freelance",
    "simulateur freelance",
    "TJM",
    "comparateur statuts",
    "micro-entreprise",
    "SASU",
    "EURL",
    "charges freelance",
    "imp\u00f4ts freelance",
    "revenus freelance",
    "calcul net freelance",
    "transition CDI freelance",
    "benchmark TJM",
  ],
  authors: [{ name: "Freelens" }],
  creator: "Freelens",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: SITE_URL,
    siteName: "Freelens",
    title: "Freelens \u2014 Le copilote financier des freelances",
    description:
      "Simulateur de revenus, comparateur de statuts, benchmark TJM march\u00e9. Prends les bonnes d\u00e9cisions pour ton activit\u00e9 freelance.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Freelens \u2014 Le copilote financier des freelances",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Freelens \u2014 Le copilote financier des freelances",
    description:
      "Simulateur de revenus, comparateur de statuts, benchmark TJM. Gratuit et confidentiel.",
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
      </body>
    </html>
  );
}
