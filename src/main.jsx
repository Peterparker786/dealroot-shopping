import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { SpeedInsights } from "@vercel/speed-insights/react";
import "./index.css";
import App from "./App";
import InstallPrompt from "./components/InstallPrompt";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <InstallPrompt />
      <App />
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
