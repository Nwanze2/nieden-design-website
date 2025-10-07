const CACHE_NAME = 'nieden-design-v1';
// List of all files to cache on first load (install)
const urlsToCache = [
    '/',
    '/index.html',
    // Local Images (Ensure these files are in the same directory)
    '1000478630.jpg',
    '1000432766.jpg',
    '1000698463.jpg',
    '1000525241.jpg',
    '1000738516.jpg',
    '1000774081.jpg',
    '1000774082.jpg',
    // PWA files
    '/manifest.json',
    // External Resources (Tailwind & Google Fonts CDN)
    'https://cdn.tailwindcss.com',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
    'https://fonts.gstatic.com' // Caching the preconnect origin
];

// Installation: Cache all essential files
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache, pre-caching essential files');
                return cache.addAll(urlsToCache).catch(error => {
                    console.error('Failed to cache resources:', error);
                });
            })
    );
});

// Activation: Clean up old caches (to update the PWA)
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Fetch: Serve files from cache first, then fall back to network
self.addEventListener('fetch', event => {
    // We only want to handle http/https requests
    if (event.request.url.startsWith('http')) {
        event.respondWith(
            caches.match(event.request)
                .then(response => {
                    // Cache hit - return response
                    if (response) {
                        return response;
                    }
                    
                    // Clone the request to fetch from the network
                    const fetchRequest = event.request.clone();

                    return fetch(fetchRequest).then(
                        networkResponse => {
                            // Check if we received a valid response
                            if(!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && networkResponse.type !== 'opaque') {
                                return networkResponse;
                            }

                            // Clone the response. A response is a stream and can only be consumed once.
                            const responseToCache = networkResponse.clone();

                            caches.open(CACHE_NAME)
                                .then(cache => {
                                    // Cache the response for future offline use
                                    cache.put(event.request, responseToCache);
                                });

                            return networkResponse;
                        }
                    );
                })
        );
    }
});
