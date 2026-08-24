/* DEALROOT PWA service worker */
// Bump this whenever you ship a new deploy so the old cache generation is
// purged on activate instead of accumulating stale hashed assets forever.
const CACHE_VERSION = "v2";
const CACHE_NAME = `dealroot-${CACHE_VERSION}`;
const CORE_ASSETS = ["/", "/index.html", "/manifest.webmanifest"];

// Install: pre-cache the app shell.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean up old caches.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle same-origin GET requests.
  if (request.method !== "GET" || !request.url.startsWith(self.location.origin)) {
    return;
  }

  // API requests: stale-while-revalidate for read-heavy endpoints
  // (products, banners, categories) so the UI shows cached data instantly
  // while fetching fresh data in the background. Checkout/cart/auth stay
  // network-only.
  if (request.url.includes("/api/")) {
    const isReadOnly =
      request.url.includes("/api/products") ||
      request.url.includes("/api/banners") ||
      request.url.includes("/api/categories");

    if (isReadOnly) {
      event.respondWith(
        caches.open(CACHE_NAME).then((cache) =>
          cache.match(request).then((cached) => {
            const fresh = fetch(request)
              .then((response) => {
                if (response.ok) cache.put(request, response.clone());
                return response;
              })
              .catch(() => cached);

            return cached || fresh;
          })
        )
      );
      return;
    }

    // Checkout, cart, auth: always network-first.
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(request).then((cached) => cached || Response.error())
      )
    );
    return;
  }

  // Navigation requests: try network, fall back to the cached app shell.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches.match("/index.html").then(
            (cached) =>
              cached ||
              caches.match("/").then((home) => home || Response.error())
          )
        )
    );
    return;
  }

  // Static assets: cache-first with lazy fill (assets are fetched and cached
  // on first use; navigation stays network-first so fresh HTML wins).
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }
      return fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});
