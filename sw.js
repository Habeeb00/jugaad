/**
 * Service Worker for Add to Calendar PWA
 * Handles offline caching and share target routing
 */

const CACHE_NAME = 'add2cal-v27';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/manifest.json',
    '/icon.png',
    '/hulk.png'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Caching app assets');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Handle share target - redirect to index with params
    if (url.pathname === '/share' || url.pathname === '/share.html') {
        event.respondWith(
            caches.match('/index.html').then((response) => {
                if (response) {
                    // Return index.html but keep the URL params
                    return response;
                }
                return fetch('/index.html');
            })
        );
        return;
    }

    // Network first for API/proxy calls
    if (url.hostname !== self.location.hostname) {
        event.respondWith(fetch(event.request));
        return;
    }

    // Cache first for local assets, then network
    event.respondWith(
        caches.match(event.request).then((response) => {
            if (response) {
                return response;
            }

            return fetch(event.request).then((networkResponse) => {
                // Don't cache non-successful responses
                if (!networkResponse || networkResponse.status !== 200) {
                    return networkResponse;
                }

                // Cache the fetched resource
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });

                return networkResponse;
            });
        }).catch(() => {
            // Offline fallback
            if (event.request.mode === 'navigate') {
                return caches.match('/index.html');
            }
        })
    );
});
