'use client'
// Registra el service worker. Va montado en el layout raíz: si lo sacas, la app deja de ser
// instalable y las notificaciones dejan de llegar, sin ningún error visible.
import { useEffect } from 'react'

export function PwaRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    // URL absoluta del mismo origen: si /sw.js redirige, el registro falla en silencio.
    navigator.serviceWorker.register(`${window.location.origin}/sw.js`, { scope: '/' }).catch((e) => {
      console.error('[pwa] no se pudo registrar el service worker', e)
    })
  }, [])
  return null
}
