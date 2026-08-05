const CACHE_NAME = 'bus-app-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // 保持網絡優先策略，確保資料即時更新
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
