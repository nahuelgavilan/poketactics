import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

const packageJson = JSON.parse(
  readFileSync(path.resolve(__dirname, './package.json'), 'utf-8')
) as { version: string };

const APP_VERSION = packageJson.version;

function getGitHash() {
  try {
    return execSync('git rev-parse --short HEAD', {
      cwd: __dirname,
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
  } catch {
    return 'nogit';
  }
}

const BUILD_ID = `${APP_VERSION}-${getGitHash()}-${Date.now().toString(36)}`;

function createServiceWorkerPlugin(buildId: string): Plugin {
  return {
    name: 'poketactics-generate-sw',
    apply: 'build',
    generateBundle(_, bundle) {
      const precacheAssets = new Set<string>([
        '/index.html',
        '/manifest.webmanifest',
        '/favicon.svg',
        '/apple-touch-icon.png',
        '/icon-192.png',
        '/icon-512.png',
      ]);

      Object.keys(bundle).forEach((fileName) => {
        if (fileName !== 'sw.js') {
          precacheAssets.add(`/${fileName}`);
        }
      });

      const source = `
const BUILD_ID = ${JSON.stringify(buildId)};
const CACHE_PREFIX = 'poketactics';
const SHELL_CACHE = \`\${CACHE_PREFIX}-shell-\${BUILD_ID}\`;
const RUNTIME_CACHE = \`\${CACHE_PREFIX}-runtime-\${BUILD_ID}\`;
const PRECACHE_URLS = ${JSON.stringify(Array.from(precacheAssets).sort())};
const PRECACHE_SET = new Set(PRECACHE_URLS);

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX) && key !== SHELL_CACHE && key !== RUNTIME_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  if (url.pathname.startsWith('/socket.io/')) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  if (url.origin === self.location.origin && PRECACHE_SET.has(url.pathname)) {
    event.respondWith(cacheFirst(request, SHELL_CACHE));
    return;
  }

  const shouldRuntimeCache =
    url.origin === self.location.origin ||
    url.origin === 'https://raw.githubusercontent.com' ||
    url.origin === 'https://fonts.googleapis.com' ||
    url.origin === 'https://fonts.gstatic.com';

  if (!shouldRuntimeCache) {
    return;
  }

  event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
});

async function handleNavigationRequest(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(SHELL_CACHE);
      await cache.put('/index.html', response.clone());
    }
    return response;
  } catch (error) {
    return (
      (await caches.match('/index.html')) ||
      Response.error()
    );
  }
}

async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  const response = await fetch(request);
  if (response.ok || response.type === 'opaque') {
    const cache = await caches.open(cacheName);
    await cache.put(request, response.clone());
  }
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  const networkPromise = fetch(request)
    .then((response) => {
      if (response.ok || response.type === 'opaque') {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cachedResponse || Response.error());

  return cachedResponse || networkPromise;
}
`.trim();

      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source,
      });
    },
  };
}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(APP_VERSION),
    __BUILD_ID__: JSON.stringify(BUILD_ID),
  },
  plugins: [react(), createServiceWorkerPlugin(BUILD_ID)],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@poketactics/shared': path.resolve(__dirname, './shared/src'),
    },
  },
});
