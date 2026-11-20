import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Every routable page. Add a row here when a new page ships.
const routes: { path: string; priority: number }[] = [
  { path: "/", priority: 1 },
  { path: "/summary", priority: 0.9 },
  { path: "/pipeline", priority: 0.8 },
  { path: "/forecast", priority: 0.8 },
  { path: "/unit-economics", priority: 0.8 },
  { path: "/funnel", priority: 0.8 },
  { path: "/inputs", priority: 0.7 },
  { path: "/methodology", priority: 0.6 },
  { path: "/glossary", priority: 0.5 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map(({ path, priority }) => ({
    url: path === "/" ? SITE_URL : `${SITE_URL}${path}`,
    priority,
  }));
}
