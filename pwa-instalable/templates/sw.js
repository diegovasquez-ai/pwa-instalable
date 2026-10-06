// Service worker de la PWA: solo notificaciones.
// NO tiene handler de "fetch" a propósito: no cachea nada, así la app nunca queda en una versión
// vieja y el login sigue funcionando en la app instalada de iPhone.

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  // Borra lo que haya cacheado una versión anterior y toma control de las pestañas abiertas.
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { body: event.data ? event.data.text() : '' }
  }
  // En iPhone cada push TIENE que mostrar una notificación: si no, Safari corta la suscripción.
  event.waitUntil(
    self.registration.showNotification(data.title || 'Tienes una notificación nueva', {
      body: data.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-72.png',
      tag: data.tag,
      data: { url: data.url || '/' },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = new URL(event.notification.data?.url || '/', self.location.origin).href
  event.waitUntil(
    (async () => {
      // Si la app ya está abierta, la trae al frente en la página del aviso; si no, la abre.
      const ventanas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      const abierta = ventanas.find((v) => v.url.startsWith(self.location.origin))
      if (!abierta) return self.clients.openWindow(url)
      await abierta.focus()
      if (abierta.url !== url) await abierta.navigate(url).catch(() => self.clients.openWindow(url))
    })(),
  )
})
