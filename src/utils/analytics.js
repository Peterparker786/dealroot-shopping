import posthog from "posthog-js";

// Product analytics for the shopping journey (pageview → add to cart →
// checkout → order). The project key lives in VITE_POSTHOG_KEY so nothing
// secret is committed; without it every helper below is a no-op and the
// storefront behaves exactly as before.
const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY || "";
const POSTHOG_HOST =
  import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com";

// A visitor who opted out (or enabled Do Not Track) must stay untracked across
// reloads, so the choice is kept in localStorage.
const CONSENT_KEY = "dealroot_analytics_consent";

let initialised = false;

const hasConsent = () => {
  if (localStorage.getItem(CONSENT_KEY) === "denied") return false;
  if (navigator.doNotTrack === "1" || navigator.doNotTrack === "yes") {
    return false;
  }
  return true;
};

export const initAnalytics = () => {
  if (initialised || !POSTHOG_KEY || !hasConsent()) return;

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    // Only signed-in customers get a person profile, so guest browsing stays
    // anonymous in PostHog.
    person_profiles: "identified_only",
    // Single-page app: RouteSeo captures $pageview on every route change.
    capture_pageview: false,
    capture_pageleave: true,
    persistence: "localStorage+cookie",
  });

  initialised = true;
};

export const captureEvent = (event, properties = {}) => {
  if (!initialised) return;
  posthog.capture(event, properties);
};

export const capturePageview = (path) => {
  if (!initialised) return;
  posthog.capture("$pageview", {
    $current_url: `${window.location.origin}${path}`,
    path,
  });
};

// Links every later event to the signed-in customer so funnels and retention
// work across sessions and devices.
export const identifyUser = (user) => {
  if (!initialised || !user) return;

  const id = user._id || user.id;
  if (!id) return;

  posthog.identify(String(id), {
    email: user.email,
    name: user.name,
  });
};

// Called on logout: forget the person so the next visitor on this browser is
// not attributed to the customer who just left.
export const resetAnalytics = () => {
  if (!initialised) return;
  posthog.reset();
};

export const setAnalyticsConsent = (granted) => {
  localStorage.setItem(CONSENT_KEY, granted ? "granted" : "denied");

  if (!granted) {
    if (!initialised) return;
    posthog.opt_out_capturing();
    posthog.reset();
    return;
  }

  if (initialised) {
    posthog.opt_in_capturing();
  } else {
    initAnalytics();
  }
};
