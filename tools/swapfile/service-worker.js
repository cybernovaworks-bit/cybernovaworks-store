// Bump CACHE_NAME whenever this list changes — cache-first means returning
// visitors keep the old cache until the name changes.
// v4: switched same-origin requests to network-first.
//
// v3 was still cache-first, which meant a fixed app.js could not reach anyone
// until CACHE_NAME was bumped again -- the deploy that fixed the duplicate-const
// SyntaxError left every returning visitor on the broken cached copy. Network-
// first makes a deploy visible on the next load, and the cache stays as the
// offline fallback, so nothing is lost but a little first-paint speed.
//
// CDN assets (unpkg/cdnjs, versioned + immutable) are left alone entirely: they
// are not intercepted, so they keep using normal HTTP caching. Nothing depends
// on a manual version bump any more.
const CACHE_NAME = "swapfile-v5";

// App shell only. Tool pages are deliberately NOT precached: there are 60+ of
// them (~1 MB), and addAll() is atomic, so one bad URL would fail the whole
// install and leave the app with no offline support at all. Instead the fetch
// handler below caches each page the first time it is visited, so a tool works
// offline once you have opened it. This list is the same for every tool, so it
// never needs updating when tools are added.
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./converts.js",
  "./app.js",
  "./manifest.json",
  "./icon.svg",
  "../../script.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  // Only same-origin is ours to manage. Cross-origin CDN requests fall through
  // to the network untouched.
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      // Offline: fall back to whatever was cached on a previous visit.
      .catch(() =>
        caches.match(event.request).then(
          (cached) =>
            cached ||
            new Response("Offline and this page was not cached yet.", {
              status: 503,
              headers: { "Content-Type": "text/plain" },
            })
        )
      )
  );
});
