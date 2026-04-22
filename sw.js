const CACHE_NAME = "focusflow-v4.4.0";
const APP_SHELL = [
  "./",
  "./index.html",
  "./css/styles.css",
  "./js/app.js",
  "./js/modules/state.js",
  "./js/modules/utils.js",
  "./js/modules/timers.js",
  "./js/modules/tasks.js",
  "./js/modules/wiki.js",
  "./js/modules/dashboard.js",
  "./js/modules/history-subjects.js",
  "./js/modules/ui.js",
  "./vendor/chart.umd.min.js",
  "./manifest.webmanifest",
  "./offline.html",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./README.md",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => {
          if (event.request.mode === "navigate")
            return caches.match("./offline.html");
          return new Response("Offline", {
            status: 503,
            statusText: "Offline",
          });
        });
    }),
  );
});
