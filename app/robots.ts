import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Signed-in areas and API routes have nothing useful to index, and the
      // portal contains client data.
      disallow: ["/portal", "/admin", "/api/"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
