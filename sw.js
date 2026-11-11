/**
 * Economarket - Service Worker
 * Guarda os arquivos do app no cache para que ele abra offline.
 * Ao alterar qualquer arquivo do projeto, aumente o número em CACHE_NAME
 * para que os usuários recebam a versão nova.
 */
const CACHE_NAME = 'economarket-v3';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './assets/logo.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png',
  './css/variables.css',
  './css/base.css',
  './css/navigation.css',
  './css/components.css',
  './css/home.css',
  './css/calculator-simple.css',
  './css/calculator-advanced.css',
  './css/todo-list.css',
  './css/lessons.css',
  './css/budget-calculator.css',
  './js/utils/storage.js',
  './js/utils/mathEvaluator.js',
  './js/utils/router.js',
  './js/components/Navigation.js',
  './js/components/Home.js',
  './js/components/SimpleCalculator.js',
  './js/components/AdvancedCalculator.js',
  './js/components/TodoList.js',
  './js/components/Lessons.js',
  './js/components/BudgetCalculator.js',
  './js/utils/app.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Estratégia: usa o cache na hora e atualiza em segundo plano quando houver internet.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => cached || caches.match('./index.html'));
      return cached || network;
    })
  );
});
