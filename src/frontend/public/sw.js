const CACHE_NAME = 'obracerta-v4-20261006-2';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg'
];

// Listener para comandos vindos do app (ex: forçar skip waiting ou limpar cache)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((keys) => {
      return Promise.all(keys.map((k) => caches.delete(k)));
    });
  }
});

// Instalação do Service Worker: pré-carrega os arquivos essenciais da casca da aplicação
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CORE_ASSETS);
    })
  );
  self.skipWaiting();
});

// Ativação: limpa versões antigas de caches e assume controle imediato
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Removendo cache obsoleto:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Interceptação de requisições: 100% resiliente offline
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Ignorar requisições não-GET ou esquemas não-HTTP
  if (request.method !== 'GET' || !request.url.startsWith('http')) {
    return;
  }

  const url = new URL(request.url);

  // 1. Chamadas de API Backend (/api/)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({
            error: 'offline',
            offline: true,
            message: 'Servidor local offline. Operando em modo de contingência local.'
          }),
          {
            headers: { 'Content-Type': 'application/json' },
            status: 503
          }
        );
      })
    );
    return;
  }

  // 2. Navegação de páginas HTML (ex: reload, abrir direto via PWA no celular)
  // Estratégia: Network com timeout rápido (1200ms) + Fallback instantâneo para Cache (/index.html)
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      new Promise((resolve) => {
        let timedOut = false;

        const timer = setTimeout(() => {
          timedOut = true;
          // Se demorar mais de 1.2s (rede lenta ou PC desligado), busca no cache imediatamente
          caches.match('/index.html').then((cached) => {
            if (cached) {
              resolve(cached);
            } else {
              caches.match('/').then((rootCached) => {
                if (rootCached) resolve(rootCached);
              });
            }
          });
        }, 1200);

        fetch(request)
          .then((networkResponse) => {
            clearTimeout(timer);
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            if (!timedOut) {
              resolve(networkResponse);
            }
          })
          .catch(() => {
            clearTimeout(timer);
            caches.match('/index.html').then((cached) => {
              if (cached) {
                resolve(cached);
              } else {
                caches.match('/').then((rootCached) => {
                  if (rootCached) resolve(rootCached);
                  else resolve(new Response('App ObraCerta Offline', { status: 503 }));
                });
              }
            });
          });
      })
    );
    return;
  }

  // 3. Assets estáticos imutáveis do Vite (/assets/*, .js, .css, fontes, imagens)
  // Estratégia: Cache-First (instantâneo) com atualização em background
  const isStaticAsset =
    url.pathname.startsWith('/assets/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.ico') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com');

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Retorna imediatamente do cache (0ms latency no celular)
          // Atualiza silenciosamente em background se estiver online
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
              }
            })
            .catch(() => {});
          return cachedResponse;
        }

        // Se não estava no cache, busca na rede e armazena
        return fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return networkResponse;
          })
          .catch(() => {
            return new Response('Asset indisponível offline', { status: 503 });
          });
      })
    );
    return;
  }

  // 4. Demais requisições: Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
