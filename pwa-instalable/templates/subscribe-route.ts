import { NextResponse } from 'next/server'
import { borrarSuscripcion, guardarSuscripcion, type SuscripcionJSON } from '@/lib/push/server'

/** El id del usuario con sesión, leído en el SERVIDOR (Supabase Auth, NextAuth, Clerk…).
 *  Sin login, déjalo en null: las notificaciones van a todos los dispositivos.
 *  Nunca uses un id que mande el navegador: cualquiera podría recibir los avisos de otra persona. */
async function usuarioActual(): Promise<string | null> {
  return null
}

// POST { subscription } → guarda o refresca la suscripción de este dispositivo.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { subscription?: SuscripcionJSON } | null
  const sub = body?.subscription
  if (!sub?.endpoint?.startsWith('https://') || !sub.keys?.p256dh || !sub.keys?.auth) {
    return NextResponse.json({ ok: false, error: 'Suscripción inválida' }, { status: 400 })
  }
  try {
    await guardarSuscripcion(sub, await usuarioActual())
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}

// DELETE { endpoint } → el dispositivo desactivó las notificaciones.
export async function DELETE(req: Request) {
  const body = (await req.json().catch(() => null)) as { endpoint?: string } | null
  if (!body?.endpoint) return NextResponse.json({ ok: false, error: 'Falta endpoint' }, { status: 400 })
  try {
    await borrarSuscripcion(body.endpoint)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}
