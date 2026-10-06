---
name: pwa-instalable
description: Convierte una app Next.js (App Router) en una PWA que se instala en iPhone y Android sin App Store ni Play Store, con ícono propio, pantalla completa y notificaciones push opcionales que también llegan a iPhone. Usar cuando el usuario pida "PWA", "app instalable", "agregar a inicio", "app en el celular sin App Store", "instalar en iPhone o Android", "notificaciones push" o "web push".
---

# PWA instalable

Deja la app instalable desde el navegador y, si el proyecto tiene base de datos, con notificaciones
push que llegan también a iPhone. Hazlo todo de corrido: el usuario pidió esto con un solo prompt.
Pregunta solo lo que no puedes averiguar (el logo, si no hay ninguno en el proyecto).

Las plantillas están en `templates/` y el script de íconos en `scripts/`, dentro de la carpeta de
esta skill. Ajusta los imports (`@/…`) y los estilos a la estructura y al diseño del proyecto.

## Paso 0 — Revisar el proyecto

- Next.js con App Router (`app/` o `src/app/`). Con Pages Router u otro framework la lógica es la
  misma: adapta solo dónde va cada archivo.
- Nombre de la app, color principal, color de fondo y logo: búscalos en el layout, la configuración
  de estilos y `public/`. Con el logo en SVG o PNG cuadrado alcanza.
- Base de datos: Supabase (`@supabase/supabase-js` + `SUPABASE_SERVICE_ROLE_KEY`), Prisma, Drizzle u
  otra. **Sin base de datos, haz solo los pasos 1 a 3** y avisa al final que las notificaciones la necesitan.
- Login: ¿cómo se obtiene el usuario actual en el servidor (Supabase Auth, NextAuth, Clerk…)?
- `middleware.ts` o `proxy.ts` (Next 16) que redirige a login: lo arreglas en el paso 3.

## Paso 1 — Íconos

```bash
node <carpeta-de-esta-skill>/scripts/icons.mjs <ruta-del-logo> "<color-de-fondo>"
```

Corre desde la raíz del proyecto. Crea en `public/icons/`: `icon-192.png`, `icon-512.png`,
`icon-maskable-512.png`, `apple-touch-icon.png` (180) y `badge-72.png`. Si avisa que falta sharp:
`npm i -D sharp` y vuelve a correrlo.

## Paso 2 — Manifest y metadata

1. `templates/manifest.ts` → `app/manifest.ts`. Completa nombre, nombre corto, descripción y colores.
   Next lo sirve en `/manifest.webmanifest` y agrega el `<link>` solo.
2. En el layout raíz, suma a la `metadata` que ya exista (no la reemplaces):
   ```ts
   appleWebApp: { capable: true, title: '<nombre corto>', statusBarStyle: 'default' },
   icons: { apple: '/icons/apple-touch-icon.png' },
   ```
   y exporta `export const viewport: Viewport = { themeColor: '<color principal>' }` (o súmalo al que haya).

## Paso 3 — Service worker

1. `templates/sw.js` → `public/sw.js`, tal cual.
2. `templates/pwa-register.tsx` → junto a los demás componentes. Móntalo dentro del `<body>` del layout raíz.
3. En `next.config`, agrega los headers de `/sw.js`:
   ```ts
   async headers() {
     return [{ source: '/sw.js', headers: [
       { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
       { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
     ] }]
   },
   ```
4. Si hay middleware o proxy de login, saca del `matcher` estas rutas: `/sw.js`,
   `/manifest.webmanifest` y `/icons/`. Si las redirige a login, el navegador no puede instalar la
   app ni registrar el service worker, y no muestra ningún error.

Reglas que no se cambian (el porqué está en [reference/iphone.md](reference/iphone.md)):
- El service worker **no tiene handler de `fetch`** y no cachea nada.
- Se registra con la URL absoluta (`location.origin + '/sw.js'`) y scope `/`.

Con esto la app ya se instala. Si no hay base de datos, salta al paso 5.

## Paso 4 — Notificaciones push

Cómo funciona por dentro: [reference/push.md](reference/push.md).

1. `npm i web-push` y, con TypeScript, `npm i -D @types/web-push`.
2. Claves (UNA sola vez: si se regeneran, todos los dispositivos dejan de recibir):
   ```bash
   npx web-push generate-vapid-keys --json
   ```
   Escribe en `.env.local`: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`,
   `VAPID_SUBJECT=mailto:<email del dueño>` y `PUSH_SECRET` (32 caracteres al azar).
3. Tabla: con Supabase, aplica `templates/push-subscriptions.sql` como el proyecto aplique sus
   migraciones. Con otra base, crea la misma tabla en su ORM.
4. `templates/push-server.ts` → `lib/push/server.ts`. Con otra base, cambia solo las tres funciones
   que tocan la tabla.
5. `templates/subscribe-route.ts` → `app/api/push/subscribe/route.ts`. Si hay login, implementa
   `usuarioActual()` con la sesión del servidor. Nunca uses un id de usuario que mande el navegador.
6. `templates/send-route.ts` → `app/api/push/send/route.ts`. No les agregues
   `export const runtime`: las rutas ya corren en Node, y en Next 16 con `cacheComponents` rompe el build.
7. `templates/use-push.ts` → con los hooks; `templates/push-button.tsx` → con los componentes.
   Pon `<PushButton />` donde el usuario lo vea (encabezado o ajustes), con el estilo del proyecto.

## Paso 5 — Probar

- `npm run build && npm start` → DevTools de Chrome → Application → Manifest sin errores de
  instalación, y en Service Workers `sw.js` activo.
- Fuera de localhost hace falta HTTPS. Carga en el hosting las variables del paso 4.
- iPhone (iOS 16.4 o más): Safari → Compartir → Agregar a inicio → abrir desde el ícono → botón.
- Android: Chrome → menú → Instalar app.
- Notificación de prueba:
  ```bash
  curl -X POST https://<tu-app>/api/push/send \
    -H "Authorization: Bearer <PUSH_SECRET>" -H "Content-Type: application/json" \
    -d '{"title":"Hola","body":"Tu primera notificación","url":"/"}'
  ```

## Al terminar

Dile al usuario, corto: qué archivos creaste, qué variables tiene que cargar en el hosting, cómo se
instala en iPhone y en Android, y el comando para mandar la primera notificación.
