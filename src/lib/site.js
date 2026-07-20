// src/lib/site.js
//
// Single source of truth for site-wide identity and SEO strings. Everything
// that needs the canonical URL, title, description, etc. reads from here.
//
// index.html is static HTML and cannot import this module, so it hardcodes
// the same strings with a comment pointing back here. The OG image endpoint
// (api/og.jsx) and the SEO generator (scripts/generate-seo.mjs) live outside
// the Vite graph and likewise mirror these values.

// Production fallback used when VITE_SITE_URL is not set. Trailing slashes
// are stripped so callers can safely do `${siteUrl}/path`.
const rawSiteUrl =
  import.meta.env.VITE_SITE_URL || "https://bethere.manuru.dev";

export const siteUrl = rawSiteUrl.replace(/\/+$/, "");

export const siteConfig = {
  name: "BeThere",
  title: "BeThere - Attendance you can't fake",
  description:
    "Face verification plus 50 m geofencing: a check-in only counts from the right person, standing in the right spot.",
  author: "Nurudeen Abdul-Majeed",
  themeColor: "#f1f1f1",
  backgroundColor: "#f1f1f1",
};

export default siteConfig;
