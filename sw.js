/**
 * STEMMate Namibia — Service Worker (Tailwind version)
 * Caches the app shell AND CDN resources (Tailwind, Google Fonts) for offline use.
 *
 * Strategy:
 * - Pre-cache local files on install (index.html, manifest.json)
 * - Runtime cache for CDN resources (Tailwind CDN, Google Fonts) — cache-first
 * - Same-origin: cache-first with network fallback
 * - Cross-origin (CDN): stale-while-revalidate
 */

const CACHE_VERSION = 'stemmate-v0.3.0';
const CACHE_LOCAL = `${CACHE_VERSION}-local`;
const CACHE_CDN = `${CACHE_VERSION}-cdn`;

// Local files to pre-cache on install
const LOCAL_FILES = [
  './',
  './index.html',
  './manifest.json',
  './Logo_192.png',
  './Logo_512.png',
  './activities.json',
];

// CDN origins to cache at runtime
const CDN_ORIGINS = [
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com',
];

// ── Install: pre-cache local files ──
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_LOCAL)
      .then((cache) => cache.addAll(LOCAL_FILES))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: clean up old caches ──
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((k) => !k.startsWith(CACHE_VERSION))
          .map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch: route by origin ──
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Only handle GET requests
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Skip chrome-extension and non-http(s) requests
  if (!url.protocol.startsWith('http')) return;

  // Same-origin (local files): cache-first
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_LOCAL).then((cache) => cache.put(req, clone));
          }
          return response;
        }).catch(() => caches.match('./index.html'));
      })
    );
    return;
  }

  // Cross-origin CDN resources (Tailwind, Google Fonts): stale-while-revalidate
  const isCDN = CDN_ORIGINS.some((origin) => url.origin === origin);
  if (isCDN) {
    event.respondWith(
      caches.open(CACHE_CDN).then((cache) =>
        cache.match(req).then((cached) => {
          // Return cached immediately if available
          if (cached) {
            // Revalidate in background
            fetch(req).then((response) => {
              if (response.ok) cache.put(req, response.clone());
            }).catch(() => {});
            return cached;
          }
          // Not cached: fetch, cache, return
          return fetch(req).then((response) => {
            if (response.ok) {
              cache.put(req, response.clone());
            }
            return response;
          }).catch(() => cached);
        })
      )
    );
    return;
  }

  // Other cross-origin requests: just fetch (no caching)
  // (e.g., analytics, third-party APIs)
});

// ── Message: allow page to trigger cache update ──
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting();
  if (event.data === 'clearCache') {
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => caches.delete(k)))
    );
  }
});
