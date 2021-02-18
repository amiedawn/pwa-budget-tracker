const FILES_TO_CACHE = [
  "/index.html",
  "/css/style.css",
  "/js/idb.js",
  "/js/index.js",
  "/icons/icon-72x72.png",
  "/icons/icon-96x96.png",
  "/icons/icon-128x128.png",
  "/icons/icon-144x144.png",
  "/icons/icon-152x152.png",
  "/icons/icon-192x192.png",
  "/icons/icon-384x384.png",
  "/icons/icon-512x512.png"
];

const STATIC_CACHE_NAME = 'static-cache-v1';
const DYNAMIC_CACHE_NAME = "dynamic-cache-v1";

self.addEventListener('install', e => {
  e.waitUntil(
    caches
    .open(STATIC_CACHE_NAME)
    .then(cache => cache.addAll(FILES_TO_CACHE))
    .then(() => self.skipWaiting())
    );  
});

self.addEventListener('activate', e => {
  const currentCaches = [STATIC_CACHE_NAME, DYNAMIC_CACHE_NAME];
  e.waitUntil(
    caches
    .keys()
    .then(cacheNames =>
        cacheNames.filter(cacheName => !currentCaches.includes(cacheName))
      )
      .then(cachesToDelete =>
        Promise.all(
          cachesToDelete.map(cacheToDelete => caches.delete(cacheToDelete))
        )
      )
      .then(() => self.clients.claim())
  );  
});

self.addEventListener(`fetch`, (event) => {
  if (
    event.request.method !== `GET` ||
    !event.request.url.startsWith(self.location.origin)
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  if (event.request.url.includes(`/api/transaction`)) {
    event.respondWith(
      caches.open(DYNAMIC_CACHE_NAME).then((cache) =>
        fetch(event.request)
          .then((response) => {
            cache.put(event.request, response.clone());
            return response;
          })
          .catch(() => caches.match(event.request))
      )
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return caches
        .open(DYNAMIC_CACHE_NAME)
        .then((cache) =>
          fetch(event.request).then((response) =>
            cache.put(event.request, response.clone()).then(() => response)
          )
        );
    })
  );
});