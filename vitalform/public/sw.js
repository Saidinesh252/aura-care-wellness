const scope = new URL(self.registration.scope);
const prefix = 'auracare-offline-v3:' + scope.pathname + ':';
importScripts(new URL('offline-assets.js', scope).href);
const { revision, assets } = self.AURA_OFFLINE;
const cacheName = prefix + revision;

async function appCache() {
  return caches.open(cacheName);
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(cacheName);
    // Every lazy route is included so it can open after the first successful install.
    await cache.addAll(assets.map(asset => new Request(new URL(asset, scope), { cache: 'reload' })));
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(prefix) && name !== cacheName).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return;
  const relative = url.pathname.slice(scope.pathname.length);
  if (relative.startsWith('api/') || relative === 'sw.js' || relative === 'offline-assets.js') return;
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      // Keep HTML and lazy chunks from the same build while this worker controls the client.
      return (await (await appCache())?.match(new URL('index.html', scope))) ?? fetch(request);
    })());
    return;
  }
  event.respondWith((async () => (await (await appCache())?.match(request)) ?? fetch(request))());
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil((async () => {
    const windows = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    const existing = windows.find(client => client.url.startsWith(scope.href));
    if (existing) return existing.focus();
    return clients.openWindow(scope.href);
  })());
});
