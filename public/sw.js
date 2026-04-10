const CACHE_NAME = 'quicknotes-shell-v3'
const APP_SHELL = [
  new URL('./index.html', self.location).href,
  new URL('./favicon.svg', self.location).href,
  new URL('./pwa-icon.svg', self.location).href,
  new URL('./manifest.json', self.location).href,
]
const ASSET_PATH_PREFIX = new URL('./assets/', self.location).pathname
const STATIC_EXTENSIONS = ['.css', '.js', '.svg', '.png', '.jpg', '.jpeg', '.webp', '.ico', '.json', '.map']

const isStaticAssetRequest = (requestUrl) => {
  if (requestUrl.origin !== self.location.origin) {
    return false
  }

  return (
    requestUrl.pathname.startsWith(ASSET_PATH_PREFIX) ||
    APP_SHELL.includes(requestUrl.href) ||
    STATIC_EXTENSIONS.some((extension) => requestUrl.pathname.endsWith(extension))
  )
}

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL).catch((error) => {
        console.warn('Failed to cache assets:', error)
        return Promise.resolve()
      })
    })
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return
  }

  const requestUrl = new URL(event.request.url)

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(async (response) => {
          if (response && response.status === 200) {
            const cache = await caches.open(CACHE_NAME)
            cache.put(new URL('./index.html', self.location).href, response.clone())
          }

          return response
        })
        .catch(async () => {
          const cachedShell = await caches.match('/index.html')
          if (cachedShell) {
            return cachedShell
          }
          return new Response('Offline - Please check your connection', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/plain',
            }),
          })
        })
    )
    return
  }

  if (!isStaticAssetRequest(requestUrl)) {
    return
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response
      }

      return fetch(event.request)
        .then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type === 'error') {
            return response
          }

          // Clone the response
          const responseToCache = response.clone()

          // Cache successful responses
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })

          return response
        })
        .catch(() => {
          // Return a custom offline response if needed
          return new Response('Offline - Please check your connection', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/plain',
            }),
          })
        })
    })
  )
})
