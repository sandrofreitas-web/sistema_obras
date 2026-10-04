const CACHE_NAME = 'obracerta-cache-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Ignora requisições não-GET e esquemas não suportados
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }

  // Chamadas para API backend
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(JSON.stringify({ error: 'offline', message: 'Servidor backend offline' }), {
          headers: { 'Content-Type': 'application/json' },
          status: 503
        });
      })
    );
    return;
  }

  // Assets estáticos e navegação SPA: Network-first resiliente com fallback instantâneo para Cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Se resposta OK (status 200), atualiza o cache
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        }

        // Se o servidor retornou erro (ex: 502, 503, 521, 530 quando o PC está desligado),
        // recupera o app gravado no cache do celular em vez de exibir tela de erro
        if (response && response.status >= 500) {
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html') || caches.match('/');
            }
            return response;
          });
        }

        return response;
      })
      .catch(() => {
        // Sem conexão de rede ou PC desligado
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html').then((indexCached) => {
              if (indexCached) return indexCached;
              return caches.match('/');
            });
          }
          return new Response('Offline', { status: 503, statusText: 'Offline' });
        });
      })
  );
});
