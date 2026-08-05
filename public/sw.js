// public/sw.js
const CACHE_NAME = 'bus-app-cache-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 核心修正：若請求屬於 .json 數據檔，強制走網絡 (no-store) 避開 PWA Cache
  if (url.pathname.endsWith('.json')) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' }).catch(() => caches.match(event.request))
    );
    return;
  }

  // 一般靜態資源維持網絡優先策略
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
