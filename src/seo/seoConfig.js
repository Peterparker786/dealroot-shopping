// ============================================================
// DEALROOT — SEO CONFIGURATION
// Edit THIS ONE file to update site-wide SEO values.
// ============================================================

// Canonical production domain (no trailing slash). Used for canonical links,
// Open Graph URLs and structured data. If you change your domain, update this
// value — and the matching SITE_URL inside dealroot-backend/src/server.js.
export const SITE_URL = "https://www.dealroot.store";

export const SITE_NAME = "DEALROOT";
export const SITE_TAGLINE = "Premium Beauty, Skincare & Makeup";

export const DEFAULT_TITLE = "DEALROOT — Premium Beauty, Skincare & Makeup";

export const DEFAULT_DESCRIPTION =
  "Shop 100% original skincare, makeup, haircare & fragrance at unbeatable prices. Up to 50% OFF, free delivery above ₹499 and easy 7-day returns.";

export const DEFAULT_KEYWORDS =
  "beauty, skincare, makeup, fragrance, haircare, premium cosmetics, buy cosmetics online india, dealroot";

// Used for social sharing previews (Facebook / WhatsApp / Telegram).
// For the best look, replace with a 1200×630px brand banner when you have one.
export const DEFAULT_IMAGE = `${SITE_URL}/logo.png`;

// Google Search Console verification.
// 1. Add your site in Google Search Console.
// 2. Choose the HTML tag verification method and copy the "content" value
//    (e.g. "abc123xyz") into the quotes below.
// 3. The <meta name="google-site-verification"> tag is injected automatically
//    on every page — no other code change needed.
// Alternatively you can verify via a DNS TXT record and leave this empty.
export const GOOGLE_SITE_VERIFICATION = "";
