import { Component } from "react";

// A render error anywhere in the tree used to unmount the whole app, which the
// visitor sees as a blank white page until they refresh. Two things cause that
// in practice: a lazy route chunk that no longer exists after a new deploy, and
// an unexpected render crash. The chunk case is recovered automatically with a
// single reload; anything else gets a visible page with a reload button.

const CHUNK_ERROR =
  /dynamically imported module|Loading chunk|Importing a module script failed|Failed to fetch/i;

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);

    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    const message = String(error?.message || "");

    if (!CHUNK_ERROR.test(message)) return;

    try {
      const key = "dealroot_chunk_reload_at";
      const last = Number(window.sessionStorage.getItem(key) || 0);

      // Only auto-reload once per 10s so a genuinely broken build cannot trap
      // the visitor in a reload loop.
      if (Date.now() - last > 10000) {
        window.sessionStorage.setItem(key, String(Date.now()));
        window.location.reload();
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
        <button type="button" onClick={() => window.location.reload()}>
          Reload page
        </button>
      </div>
    );
  }
}

export default AppErrorBoundary;
