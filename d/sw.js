// 日記で育つ町 — 電波がなくても開けるようにする（記録そのものは端末の中。ここは画面の部品だけ）
const CACHE = 'machi-v2';
const FILES = ['./', 'index.html', 'app.js', 'town.js', 'manifest.json', 'icon-192.png', 'icon-512.png', 'icon-180.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
// まずネットから最新を取り、つながらない時だけ保存しておいた画面を出す
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); return r; }).catch(() => caches.match(e.request, { ignoreSearch: true })));
});
