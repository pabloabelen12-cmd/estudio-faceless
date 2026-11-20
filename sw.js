/* Estudio Faceless: funciona sin internet. Siempre intenta traer la versión más nueva y, si no hay conexión, usa la guardada. */
const CACHE = 'efs-20261120182208';
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./js/art.js", "./js/art3d.js", "./js/boot.js", "./js/charimg.js", "./js/core.js", "./js/desktop.js", "./js/engine.js", "./js/fin.js", "./js/gym.js", "./js/gymdata.js", "./js/ideas.js", "./js/mivideo.js", "./js/production.js", "./icons/apple-touch-icon.png", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/icon-maskable-512.png"];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url); if (url.origin !== location.origin) return;
  if (/version\.js$/.test(url.pathname)) return; // el aviso de actualización siempre va a la red
  e.respondWith(fetch(req, {cache: 'no-cache'}).then(r => { if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); } return r; })
    .catch(() => caches.match(req, {ignoreSearch: true}).then(r => r || caches.match('./index.html'))));
});
