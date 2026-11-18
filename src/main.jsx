import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { SpeedInsights } from "@vercel/speed-insights/react";
import "./index.css";
import App from "./App";
import AppErrorBoundary from "./components/AppErrorBoundary";
import InstallPrompt from "./components/InstallPrompt";
import { initAnalytics } from "./utils/analytics";

// Start product analytics once for the whole session (no-op when no PostHog
// key is configured or the visitor has opted out).
initAnalytics();

// Vite fires `vite:preloadError` when a dynamic import fails (e.g. when a new deploy
// purges old hashed JS chunks while a user is browsing). Auto-reload once to fetch
// the latest assets smoothly instead of crashing with a blank/error screen.
window.addEventListener("vite:preloadError", (event) => {
  event?.preventDefault?.();
  try {
    const key = "dealroot_vite_preload_retry";
    const last = Number(window.sessionStorage.getItem(key) || 0);
    if (Date.now() - last > 10000) {
      window.sessionStorage.setItem(key, String(Date.now()));
      window.location.reload();
    }
  } catch {
    window.location.reload();
  }
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <InstallPrompt />
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>
      <SpeedInsights />
    </BrowserRouter>
  </StrictMode>
);

// Register the PWA service worker in production builds only, so it never
// interferes with the Vite dev server's fast refresh / HMR.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
