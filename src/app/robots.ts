import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard",
          "/simulator",
          "/scenarios",
          "/settings",
          "/onboarding",
          "/paiements",
          "/pipeline",
          "/calendrier",
          "/tresorerie",
          "/historique",
          "/retraite",
          "/acre",
          "/api/",
          "/auth/",
          "/checkout",
        ],
      },
    ],
    sitemap: "https://freelens.io/sitemap.xml",
  };
}
