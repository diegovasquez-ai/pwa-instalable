# Notificaciones push: cómo funciona

```
Activar (un dispositivo)
  botón → Notification.requestPermission() → pushManager.subscribe(clave pública VAPID)
        → POST /api/push/subscribe → tabla push_subscriptions (una fila por endpoint)

Mandar
  POST /api/push/send (Bearer PUSH_SECRET)  o  enviarPush() desde tu código
        → web-push firma con la clave privada → servicio de push del navegador (Apple, Google, Mozilla)
        → sw.js recibe el evento "push" → showNotification → al tocarla abre la URL
```

## Las claves

- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`: va al navegador para suscribirse. Es pública.
- `VAPID_PRIVATE_KEY` y `PUSH_SECRET`: solo en el servidor, nunca con `NEXT_PUBLIC_`.
- `VAPID_SUBJECT`: un `mailto:` de contacto; los servicios de push lo usan si hay problemas.
- Se generan una vez. Si cambias el par de claves VAPID, todas las suscripciones guardadas dejan de
  servir y cada usuario tiene que volver a activar las notificaciones.

## El contenido de cada aviso

```json
{ "title": "Pedido nuevo", "body": "Mesa 4: 2 cafés", "url": "/pedidos/123", "tag": "pedido-123" }
```

- `title` es obligatorio; `body`, `url` y `tag` son opcionales.
- `url`: la página que abre al tocar la notificación (relativa a tu dominio).
- `tag`: dos avisos con el mismo `tag` se reemplazan en vez de apilarse.

## Mandar desde tu propio código

Para avisar cuando pasa algo (un pedido, un mensaje, un recordatorio), llama `enviarPush` en el
servidor en vez de pasar por la API:

```ts
import { enviarPush } from '@/lib/push/server'

await enviarPush({ title: 'Pedido nuevo', body: 'Mesa 4: 2 cafés', url: '/pedidos/123' })
await enviarPush({ title: 'Tu turno es mañana' }, { userId: cliente.id }) // solo a una persona
```

Devuelve `{ enviados, borrados, total }`: `borrados` son los dispositivos que ya no existían.

## Por persona

Para mandarle a un usuario en particular, `usuarioActual()` en la ruta de suscripción tiene que
devolver su id desde la sesión del servidor. La columna `user_id` es texto, así que sirve el id de
cualquier sistema de login.
