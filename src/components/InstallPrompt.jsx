import { useEffect, useState } from "react";
import { FiX } from "react-icons/fi";

// Detects whether the app is already running in standalone (installed) mode.
const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  window.navigator.standalone === true;

const isIOS = () =>
  /iphone|ipad|ipod/i.test(window.navigator.userAgent) && !window.MSStream;

// The install banner should only appear on phones/tablets (small + touch
// screens). On desktop the user can still install via the browser's
// 3-dot menu → "Install app" — we just don't nag them with a banner.
const isMobile = () =>
  window.matchMedia("(max-width: 768px), (pointer: coarse)").matches;

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const [mobile, setMobile] = useState(() => isMobile());

  useEffect(() => {
    // Re-evaluate when the viewport changes (e.g. desktop window resized to
    // tablet width, or rotating a phone).
    const handleResize = () => setMobile(isMobile());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!mobile) {
      // Desktop: never show the banner. The user can still install via the
      // browser's 3-dot menu → "Install app" if they want to.
      setVisible(false);
      setDeferredPrompt(null);
      return undefined;
    }

    if (isStandalone()) return undefined;

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
      setVisible(true);
    };

    const handleInstalled = () => {
      setVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    // iOS Safari has no beforeinstallprompt — show a gentle hint for it.
    if (isIOS() && !isStandalone() && mobile) {
      const timer = window.setTimeout(() => setVisible(true), 2500);
      return () => {
        window.clearTimeout(timer);
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        window.removeEventListener("appinstalled", handleInstalled);
      };
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, [mobile]);

  if (!visible) return null;

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      // A beforeinstallprompt event can only be consumed once — clear it after
      // ANY outcome so a re-shown banner never calls prompt() on a stale event.
      setDeferredPrompt(null);
      if (outcome === "accepted") {
        setVisible(false);
      }
      return;
    }

    // iOS: open the "Add to Home Screen" guide in a new tab so the user
    // stays on DEALROOT while learning how to install.
    if (isIOS()) {
      window.open(
        "https://support.apple.com/en-in/guide/iphone/iph3a9d1f1a5/ios",
        "_blank",
        "noopener"
      );
      return;
    }

    setVisible(false);
  };

  return (
    <div className="install-prompt" role="dialog" aria-label="Install DEALROOT app">
      <span className="install-prompt-icon">
        <img src="/logo.png" alt="DEALROOT" />
      </span>
      <div className="install-prompt-copy">
        <b>
          {isIOS() && !deferredPrompt
            ? "Install DEALROOT on your iPhone"
            : "Install the DEALROOT app"}
        </b>
        <small>
          {isIOS() && !deferredPrompt
            ? "Tap the Share button and choose “Add to Home Screen”"
            : "Fast, app-like shopping — works offline too"}
        </small>
      </div>
      <button type="button" className="install-prompt-btn" onClick={handleInstall}>
        {isIOS() && !deferredPrompt ? "How?" : "Install"}
      </button>
      <button
        type="button"
        className="install-prompt-close"
        onClick={() => setVisible(false)}
        aria-label="Dismiss install prompt"
      >
        <FiX />
      </button>
    </div>
  );
}
