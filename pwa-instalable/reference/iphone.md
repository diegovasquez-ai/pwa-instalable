# Por qué la PWA se hace así (sobre todo por iPhone)

Cada regla de la skill evita un error que no muestra ningún mensaje: la app simplemente no se
instala o las notificaciones dejan de llegar.

## El service worker no intercepta `fetch`

- Un handler de `fetch` que cachea o reescribe respuestas puede servir una versión vieja de la app
  después de cada deploy, y en la app instalada de iPhone rompe redirecciones y cookies de login.
- Chrome ya no exige un handler de `fetch` para instalar: alcanza con el manifest y un service worker.
- `sw.js` solo maneja `push` y `notificationclick`, y al activarse borra cachés de versiones anteriores.

## Registro sin redirecciones

- El registro falla en silencio si `/sw.js` responde con una redirección (middleware de login,
  barra final, otro dominio). Por eso se registra con `location.origin + '/sw.js'` y se excluye del
  middleware junto con el manifest y los íconos.
- `Cache-Control: no-cache` en `/sw.js` hace que cada deploy llegue a los dispositivos ya instalados.

## Notificaciones en iPhone

- Solo funcionan con la app **agregada a la pantalla de inicio**, desde iOS 16.4. En Safari normal
  `PushManager` no existe: por eso el botón explica cómo instalarla cuando detecta un iPhone sin instalar.
- El permiso solo se puede pedir **con un toque del usuario**. Nunca al cargar la página, y sin
  esperar otra cosa antes de `Notification.requestPermission()`.
- **Cada push tiene que mostrar una notificación.** Safari corta la suscripción si llegan pushes que
  no muestran nada. Por eso `sw.js` muestra un aviso incluso si el contenido llega mal.
- Las suscripciones de Apple mueren sin avisar. El servidor borra las que responden 404 o 410, y la
  app vuelve a guardar la suya cada vez que abre (el navegador puede haberla cambiado).

## Íconos

- `apple-touch-icon` no puede tener transparencia: iOS rellena lo transparente con negro. El script
  le pone el color de fondo.
- El ícono maskable deja el logo dentro de la zona segura (70% del lado): Android lo recorta en
  círculo, gota o cuadrado según el teléfono.
- `badge-72.png` es la silueta blanca del logo que Android muestra en la barra de estado. Sale bien
  solo si el logo tiene fondo transparente; si no, queda un cuadrado blanco.
