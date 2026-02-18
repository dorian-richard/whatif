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
          "/comparateur",
          "/objectif",
          "/transition",
          "/benchmark",
          "/settings",
          "/onboarding",
        ],
      },
    ],
    sitemap: "https://freelens.io/sitemap.xml",
  };
}