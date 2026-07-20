// src/lib/site.js
//
// Single source of truth for site-wide identity and SEO strings. Everything
// that needs the canonical URL, title, description, etc. reads from here.
//
// index.html is static HTML and cannot import this module, so it hardcodes
// the same strings with a comment pointing back here. The OG image is a
// static screenshot of the landing hero (public/og.png); the SEO generator
// (scripts/generate-seo.mjs) lives outside the Vite graph and mirrors these
// values.

// Production fallback used when VITE_SITE_URL is not set. Trailing slashes
// are stripped so callers can safely do `${siteUrl}/path`.
const rawSiteUrl =
  import.meta.env.VITE_SITE_URL || "https://bethere.manuru.dev";

export const siteUrl = rawSiteUrl.replace(/\/+$/, "");

export const siteConfig = {
  name: "BeThere",
  title: "BeThere - Attendance you can't fake",
  description:
    "BeThere verifies live presence for events: scan the venue's rotating on-site code, then a real-time face check confirms it's you, all verified on the server.",
  author: "Nurudeen Abdul-Majeed",
  themeColor: "#f1f1f1",
  backgroundColor: "#f1f1f1",
};

export default siteConfig;
