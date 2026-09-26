// Bump CACHE_NAME whenever this list changes — cache-first means returning
// visitors keep the old cache until the name changes.
// v3: forced bump. v2 had cached the app.js that crashed on load (duplicate
// top-level const vs converts.js), so returning visitors were pinned to the
// broken copy and would not pick up the fix without this rename.
const CACHE_NAME = "swapfile-v3";

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
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && event.request.url.startsWith(self.location.origin)) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
