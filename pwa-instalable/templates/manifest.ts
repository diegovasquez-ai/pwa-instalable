import type { MetadataRoute } from 'next'

// Next sirve esto en /manifest.webmanifest y agrega el <link> en todas las páginas.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'NOMBRE COMPLETO DE LA APP',
    short_name: 'NOMBRE CORTO', // lo que se ve bajo el ícono: 12 caracteres como mucho
    description: 'QUÉ HACE LA APP, EN UNA FRASE',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#ffffff', // el fondo de la pantalla de carga
    theme_color: '#000000', // la barra de arriba en Android
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
