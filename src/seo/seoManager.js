// ============================================================
// DEALROOT — SEO MANAGER
// Runtime meta-tag manager for the SPA: document.title, description,
// Open Graph / Twitter cards, canonical URLs and JSON-LD structured data.
// ============================================================
import { useEffect } from "react";
import {
  SITE_URL,
  SITE_NAME,
  DEFAULT_TITLE,
  DEFAULT_DESCRIPTION,
  DEFAULT_IMAGE,
  DEFAULT_KEYWORDS,
  GOOGLE_SITE_VERIFICATION,
} from "./seoConfig";

export { SITE_URL, SITE_NAME };

const setMeta = (attr, key, content) => {
  if (!content) return;

  let el = document.head.querySelector(`meta[${attr}="${key}"]`);

  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }

  el.setAttribute("content", content);
};

// Injects the Google Search Console verification tag once at boot when the
// code is configured. With DNS verification this stays a no-op.
function ensureVerificationTag() {
  const code = String(GOOGLE_SITE_VERIFICATION || "").trim();
  if (!code) return;

  if (document.head.querySelector('meta[name="google-site-verification"]')) {
    return;
  }

  const el = document.createElement("meta");
  el.setAttribute("name", "google-site-verification");
  el.setAttribute("content", code);
  document.head.appendChild(el);
}

// Replaces or removes the single JSON-LD block this app manages.
export function applyJsonLd(data) {
  const existing = document.getElementById("seo-jsonld");

  if (!data) {
    if (existing) existing.remove();
    return;
  }

  let script = existing;

  if (!script) {
    script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "seo-jsonld";
    document.head.appendChild(script);
  }

  script.textContent = JSON.stringify(data);
}

// Imperative SEO updater — call from any component/effect.
export function setSeo({
  title,
  description,
  image,
  url,
  type = "website",
  keywords,
  jsonLd = null,
}) {
  ensureVerificationTag();

  const pageTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;
  const pageDescription = description || DEFAULT_DESCRIPTION;
  const pageImage = image || DEFAULT_IMAGE;
  const pageUrl =
    url || `${SITE_URL}${window.location.pathname}${window.location.search}`;

  document.title = pageTitle;

  setMeta("name", "description", pageDescription);
  setMeta("name", "keywords", keywords || DEFAULT_KEYWORDS);

  setMeta("property", "og:title", pageTitle);
  setMeta("property", "og:description", pageDescription);
  setMeta("property", "og:image", pageImage);
  setMeta("property", "og:url", pageUrl);
  setMeta("property", "og:type", type);
  setMeta("property", "og:site_name", SITE_NAME);
  setMeta("property", "og:locale", "en_IN");

  setMeta("name", "twitter:card", "summary_large_image");
  setMeta("name", "twitter:title", pageTitle);
  setMeta("name", "twitter:description", pageDescription);
  setMeta("name", "twitter:image", pageImage);

  let canonical = document.head.querySelector('link[rel="canonical"]');

  if (!canonical) {
    canonical = document.createElement("link");
    canonical.setAttribute("rel", "canonical");
    document.head.appendChild(canonical);
  }

  canonical.setAttribute("href", pageUrl);

  applyJsonLd(jsonLd);
}

// React hook wrapper — pass explicit deps so the effect only re-runs when the
// SEO-relevant values actually change (never JSON.stringify of a fresh object).
export function useSeo(props, deps = []) {
  useEffect(() => {
    setSeo(props);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return null;
}

// ---------------------------------------------------------------------------
// Page metadata (title / description per route)
// ---------------------------------------------------------------------------
export const PAGE_META = {
  "/": {
    title: "",
    description: DEFAULT_DESCRIPTION,
    keywords: DEFAULT_KEYWORDS,
  },
  "/about": {
    title: "About Us",
    description:
      "DealRoot Beauty — Glow more, spend less. Premium quality skincare, makeup and haircare at pocket-friendly prices, delivered across India.",
  },
  "/brands": {
    title: "Our Brands",
    description:
      "Shop 100% original products from 30+ top beauty brands — Estée Lauder, MAC, Mamaearth, Minimalist, The Derma Co, Plum and more at unbeatable prices.",
  },
  "/contact": {
    title: "Contact Us",
    description:
      "Questions or need help with your order? Contact DEALROOT Beauty via email or Telegram — we reply fast.",
  },
  "/become-a-seller": {
    title: "Become a Seller",
    description:
      "Sell your beauty brand on DealRoot Beauty. Contact us to become a seller and reach beauty shoppers across India.",
  },
  "/privacy": {
    title: "Privacy Policy",
    description: "How DEALROOT collects, uses and protects your personal information.",
  },
  "/terms": {
    title: "Terms of Service",
    description: "The terms that govern your use of the DEALROOT Beauty website and services.",
  },
  "/shipping": {
    title: "Shipping Policy",
    description:
      "Fast, reliable delivery across India. Free delivery on orders above ₹499. Estimated delivery in 2–4 days.",
  },
  "/refund": {
    title: "Return & Refund Policy",
    description: "DEALROOT's easy 7-day return and refund policy — shop with complete confidence.",
  },
  "/account": {
    title: "My Account & Orders",
    description: "Sign in to your DEALROOT account to view orders, save addresses and manage your details.",
  },
  product: {
    title: "Product",
    description: DEFAULT_DESCRIPTION,
  },
};

// ---------------------------------------------------------------------------
// JSON-LD structured data builders
// ---------------------------------------------------------------------------
export function buildStoreJsonLd() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/logo.png`,
      email: "dealroot.store@gmail.com",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Kanpur",
        addressRegion: "Uttar Pradesh",
        addressCountry: "IN",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_URL}/?search={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  ];
}

// Expects the product in the shape already mapped by ProductDetails/Home:
// { id, name, brand, price, rating, reviews, images, description, stock }
export function buildProductJsonLd(product, id) {
  if (!product) return null;

  const price = Number(product.price);
  const rating = Number(product.rating);
  const reviewCount = Number(
    String(product.reviews || 0).replace(/[^\d]/g, "")
  );

  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: Array.isArray(product.images) && product.images.length
      ? product.images
      : product.image,
    description: product.description || `${product.name} at the best price on DEALROOT.`,
    brand: {
      "@type": "Brand",
      name: product.brand || SITE_NAME,
    },
    sku: String(id),
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/product/${id}`,
      priceCurrency: "INR",
      price: Number.isFinite(price) ? price : 0,
      availability:
        Number(product.stock) > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  if (Number.isFinite(rating) && rating > 0) {
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: rating,
      reviewCount: reviewCount > 0 ? reviewCount : 1,
    };
  }

  return data;
}
