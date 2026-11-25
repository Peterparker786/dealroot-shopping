import { Component } from "react";

// A render error anywhere in the tree used to unmount the whole app, which the
// visitor sees as a blank white page until they refresh. Two things cause that
// in practice: a lazy route chunk that no longer exists after a new deploy, and
// an unexpected render crash. The chunk case is recovered automatically with a
// single reload; anything else gets a visible page with a reload button.

const CHUNK_ERROR =
  /dynamically imported module|Loading chunk|Importing a module script failed|Failed to fetch|Failed to load module script|error loading dynamically imported module|Unexpected token '<'|MIME type of "text\/html"|is not a valid JavaScript|Unable to preload CSS/i;

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);

    this.state = { failed: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    // The message is shown on the fallback so a support report carries the
    // real cause instead of only "something went wrong".
    return { failed: true, message: String(error?.message || "Unknown error") };
  }

  componentDidMount() {
    window.addEventListener("popstate", this.handlePopState);
    window.addEventListener("hashchange", this.handlePopState);
  }

  componentWillUnmount() {
    window.removeEventListener("popstate", this.handlePopState);
    window.removeEventListener("hashchange", this.handlePopState);
  }

  handlePopState = () => {
    // When the visitor navigates back or forward via browser history or hash, clear
    // the failure state so the previous route can render fresh rather than
    // staying locked on the crash screen.
    if (this.state.failed) {
      this.setState({ failed: false, message: "" });
    }
  };

  componentDidCatch(error, errorInfo) {
    console.error("AppErrorBoundary caught error:", error, errorInfo);
    const message = String(error?.message || "");

    // If it's a chunk/asset load error (e.g. after a new deployment or network hiccup),
    // immediately reload the page so the browser fetches the latest bundle.
    if (!CHUNK_ERROR.test(message)) return;

    // A stale service worker is the usual reason the reload keeps serving the
    // old index.html (and therefore the old, deleted chunk names), so drop it
    // before reloading.
    const reloadFresh = () => {
      const done = () => window.location.reload();

      try {
        if ("serviceWorker" in navigator) {
          navigator.serviceWorker
            .getRegistrations()
            .then((registrations) =>
              Promise.all(registrations.map((item) => item.unregister()))
            )
            .then(done)
            .catch(done);
          return;
        }
      } catch {
        // fall through to the plain reload
      }

      done();
    };

    try {
      const key = "dealroot_chunk_reload_at";
      const last = Number(window.sessionStorage.getItem(key) || 0);

      // Only auto-reload once per 10s so a genuinely broken build cannot trap
      // the visitor in a reload loop.
      if (Date.now() - last > 10000) {
        window.sessionStorage.setItem(key, String(Date.now()));
        reloadFresh();
      }
    } catch {
      // sessionStorage unavailable (private mode) — the panel below still shows.
    }
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <div className="app-crash-fallback">
        <h1>Kuch galat ho gaya</h1>
        <p>
          Page load nahi ho paya. Neeche wale button se dobara koshish karein —
          aapka cart aur login safe rahega.
        </p>
        {this.state.message && (
          <p
            style={{
              marginTop: 12,
              fontSize: 12,
              color: "#6b7280",
              wordBreak: "break-word",
              maxWidth: 520,
            }}
          >
            {this.state.message}
          </p>
        )}
        <button
          type="button"
          onClick={() => {
            // Drop a stale service worker first — otherwise the reload can
            // serve the same old bundle and land straight back here.
            try {
              if ("serviceWorker" in navigator) {
                navigator.serviceWorker
                  .getRegistrations()
                  .then((registrations) =>
                    Promise.all(registrations.map((item) => item.unregister()))
                  )
                  .finally(() => window.location.reload());
                return;
              }
            } catch {
              // fall through
            }

            window.location.reload();
          }}
        >
          Reload page
        </button>
      </div>
    );
  }
}

export default AppErrorBoundary;
