# pwa-instalable

Skill para **Claude Code** que convierte tu app en una **app de celular sin App Store ni Play Store**.
Se instala desde un link, queda con su ícono, abre en pantalla completa y le llegan notificaciones
push, también en iPhone.

Sin pagar los 99 USD al año de Apple y sin esperar que te aprueben.

---

## Instalación

```bash
npx skills add diegovasquez-ai/pwa-instalable
```

¿Prefieres a mano? Copia la carpeta [`pwa-instalable/`](pwa-instalable) dentro de `.claude/skills/`
de tu proyecto.

## Uso: un solo prompt

Abre Claude Code en tu proyecto y escribe:

> Convierte mi app en una PWA instalable con notificaciones push que funcione en iPhone

Claude hace el resto:

| | |
|---|---|
| 1 | Los íconos a partir de tu logo (Android, iPhone y la barra de notificaciones) |
| 2 | El manifest y los datos que iPhone necesita para instalarla |
| 3 | El service worker, solo para notificaciones: no cachea nada, así nunca te queda una versión vieja |
| 4 | El botón para activar las notificaciones, que en iPhone explica cómo agregar la app al inicio |
| 5 | La tabla y la API para guardar los dispositivos y mandar avisos |

## Requisitos

- Next.js con App Router.
- Para las notificaciones, una base de datos. Viene lista para Supabase; con Prisma, Drizzle u otra,
  Claude la adapta. Sin base de datos, la app queda igual de instalable, pero sin notificaciones.
- HTTPS al publicarla (en tu computadora funciona en `localhost`).
- Para notificaciones en iPhone: iOS 16.4 o más.

## Cómo se instala en el celular

- **iPhone:** Safari → Compartir → **Agregar a inicio**. Ábrela desde el ícono.
- **Android:** Chrome → menú → **Instalar app**.

## Mandar una notificación

```bash
curl -X POST https://tu-app.com/api/push/send \
  -H "Authorization: Bearer TU_PUSH_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"title":"Hola","body":"Tu primera notificación","url":"/"}'
```

O desde tu código, cuando pasa algo (un pedido nuevo, un recordatorio):

```ts
import { enviarPush } from '@/lib/push/server'

await enviarPush({ title: 'Pedido nuevo', body: 'Mesa 4: 2 cafés', url: '/pedidos/123' })
```

## Lo que ya viene resuelto

Son los errores que te hacen perder una tarde porque no muestran ningún mensaje:

- El service worker sin caché: no sirve versiones viejas ni rompe el login en la app instalada de iPhone.
- El registro sin redirecciones, y el middleware de login sin bloquear el manifest ni el service worker.
- El permiso pedido con un toque, como exige iPhone, y un aviso en cada push para que Safari no corte la suscripción.
- La suscripción guardada de nuevo cada vez que se abre la app, y las que mueren se borran solas.
- El ícono de iPhone sin transparencia, el maskable dentro de la zona segura y el badge en blanco.

---

Hecha por **Diego Vásquez** · [@diegovasquez_ai](https://instagram.com/diegovasquez_ai)

¿Construyes con IA y quieres conseguir tu primer cliente? Entra a la lista de espera de
**IA Builder Lab**: https://comunidad.iabuilderlab.com/
