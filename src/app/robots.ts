import type { MetadataRoute } from "next";
import { publicEnv } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/", "/auth/", "/*/account", "/*/login"],
    },
    sitemap: `${publicEnv.siteUrl}/sitemap.xml`,
  };
}
