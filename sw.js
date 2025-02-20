self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open('kaikei-app-v1').then((cache) => {
            return cache.addAll([
                './',
                './index.html',
                './kaikeisoft.js',
                './manifest.json',
                './style.css'
            ]);
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.filter((cacheName) => {
                    return cacheName.startsWith('kaikei-app-') && cacheName !== 'kaikei-app-v1';
                }).map((cacheName) => {
                    return caches.delete(cacheName);
                })
            );
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
}); 