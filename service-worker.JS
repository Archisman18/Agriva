// Define a cache name for your application's assets
const CACHE_NAME = 'farmiq-cache-v1';

// List of URLs to cache during installation
const urlsToCache = [
    'Farm-IQ.HTML',
    'Farm-IQ.js'
    // Removed external CDN URLs from pre-caching due to CORS issues during install.
    // These resources will still be fetched from the network when online,
    // and the browser's standard HTTP cache or the Service Worker's fetch handler
    // might cache them dynamically if allowed by their respective servers.
    // 'https://cdn.tailwindcss.com',
    // 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    // 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
    // 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css',
    // 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    // 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js',
    // 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js',
    // 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js'
];

// Install event: Caches all listed assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Caching app shell');
                return cache.addAll(urlsToCache);
            })
            .catch((error) => {
                console.error('Service Worker: Failed to cache during install:', error);
            })
    );
});

// Fetch event: Intercepts network requests and serves from cache if available
self.addEventListener('fetch', (event) => {
    // Check if the request is for an external resource that might not be in our cache
    // or if it's a Firebase request (Firebase SDK handles its own offline persistence)
    if (event.request.url.startsWith('chrome-extension://') || event.request.url.includes('googleapis.com') || event.request.url.includes('firebasestorage.googleapis.com')) {
        // For these, try network first. If network fails, Firebase SDKs might handle it,
        // or it's an external API that we don't intend to cache for offline use.
        event.respondWith(fetch(event.request).catch(() => {
            // If network fails for these, and they are not in cache, just return an empty response or error
            return new Response(null, { status: 503, statusText: 'Service Unavailable' });
        }));
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                // No cache hit - fetch from network
                return fetch(event.request)
                    .then((networkResponse) => {
                        // Check if we received a valid response
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }

                        // IMPORTANT: Clone the response. A response is a stream
                        // and can only be consumed once. We must clone it so that
                        // we can consume one in the cache and one in the browser.
                        const responseToCache = networkResponse.clone();

                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return networkResponse;
                    })
                    .catch((error) => {
                        console.error('Service Worker: Fetch failed:', error);
                        // Fallback for when both cache and network fail
                        // You could return an offline page here
                        return new Response('<h1>You are offline!</h1>', {
                            headers: { 'Content-Type': 'text/html' }
                        });
                    });
            })
    );
});

// Activate event: Cleans up old caches
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log('Service Worker: Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
