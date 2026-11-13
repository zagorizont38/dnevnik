/* Дневник спортсмена — работа без интернета.
   Если меняете файлы приложения, увеличьте номер версии ниже (v1 → v2),
   тогда телефоны подтянут обновление. */
const VERSION = 'soyuz-diary-v1';
const FONT_CACHE = 'soyuz-diary-fonts';
const FONT_CSS = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Unbounded:wght@500;700;800&display=swap';

const CORE = [
  './',
  'index.html',
  'styles.css',
  'app.js',
  'manifest.webmanifest'
];

// Необязательные файлы: если какого-то нет, приложение всё равно установится
const OPTIONAL = [
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png',
  'assets/logo.png',
  'assets/coach.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    await cache.addAll(CORE);
    await Promise.all(OPTIONAL.map((url) => cache.add(url).catch(() => {})));
    const fonts = await caches.open(FONT_CACHE);
    await fonts.add(FONT_CSS).catch(() => {});
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== VERSION && k !== FONT_CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  const isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!sameOrigin && !isFont) return;

  // Шрифты не меняются: берём сохранённые, в сеть идём только за новыми
  if (isFont) {
    event.respondWith((async () => {
      const cache = await caches.open(FONT_CACHE);
      const cached = await cache.match(req);
      if (cached) return cached;
      try {
        const res = await fetch(req);
        if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
        return res;
      } catch (e) {
        return Response.error();
      }
    })());
    return;
  }

  // Файлы приложения: отдаём сохранённое сразу, свежую версию подтягиваем в фоне
  event.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const cached = await cache.match(req, { ignoreSearch: true });
    const fresh = fetch(req).then((res) => {
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    }).catch(() => null);

    if (cached) {
      event.waitUntil(fresh);
      return cached;
    }
    const res = await fresh;
    if (res) return res;
    if (req.mode === 'navigate') {
      const shell = await cache.match('index.html');
      if (shell) return shell;
    }
    return Response.error();
  })());
});
