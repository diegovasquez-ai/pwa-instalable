'use client'
// Estado de las notificaciones en este dispositivo, más activar y desactivar.
// Cada vez que la app abre con el permiso ya dado, vuelve a guardar la suscripción: el navegador
// la puede cambiar sin avisar (sobre todo en iPhone) y así nunca queda una vieja en la base.
import { useCallback, useEffect, useState } from 'react'

export type EstadoPush = 'cargando' | 'no-soportado' | 'instalar-primero' | 'bloqueado' | 'inactivo' | 'activo'

const CLAVE_PUBLICA = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''

// La clave VAPID viene en base64url; el navegador la pide en bytes.
function claveEnBytes(base64url: string): ArrayBuffer {
  const base64 = (base64url + '='.repeat((4 - (base64url.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/')
  const texto = atob(base64)
  const bytes = new ArrayBuffer(texto.length)
  const vista = new Uint8Array(bytes)
  for (let i = 0; i < texto.length; i++) vista[i] = texto.charCodeAt(i)
  return bytes
}

async function guardar(sub: PushSubscription): Promise<void> {
  const res = await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription: sub.toJSON() }),
  })
  if (!res.ok) throw new Error('No se pudo guardar la suscripción')
}

function detectar(): EstadoPush | null {
  const soporta = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
  const esIphone = /iPhone|iPad|iPod/.test(navigator.userAgent)
  const instalada =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  // En iPhone, PushManager solo existe con la app agregada a la pantalla de inicio.
  if (!soporta) return esIphone && !instalada ? 'instalar-primero' : 'no-soportado'
  if (Notification.permission === 'denied') return 'bloqueado'
  return null
}

export function usePush() {
  const [estado, setEstado] = useState<EstadoPush>('cargando')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelado = false
    const revisar = async () => {
      const fijo = detectar()
      if (fijo) return fijo
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (!sub || Notification.permission !== 'granted') return 'inactivo'
      await guardar(sub).catch(() => {})
      return 'activo'
    }
    revisar().then((e) => !cancelado && setEstado(e))
    return () => {
      cancelado = true
    }
  }, [])

  // Llamar SOLO desde un toque del usuario: iPhone no deja pedir el permiso de otra forma.
  const activar = useCallback(async () => {
    setError(null)
    try {
      const permiso = await Notification.requestPermission()
      if (permiso !== 'granted') return setEstado(permiso === 'denied' ? 'bloqueado' : 'inactivo')
      const reg = await navigator.serviceWorker.ready
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: claveEnBytes(CLAVE_PUBLICA) }))
      await guardar(sub)
      setEstado('activo')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron activar las notificaciones')
    }
  }, [])

  const desactivar = useCallback(async () => {
    setError(null)
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (sub) {
      await fetch('/api/push/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      }).catch(() => {})
      await sub.unsubscribe()
    }
    setEstado('inactivo')
  }, [])

  return { estado, error, activar, desactivar }
}
