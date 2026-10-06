// SOLO SERVIDOR. Guarda los dispositivos suscritos y les manda notificaciones con web-push.
// Viene hecho con Supabase. Con otra base (Prisma, Drizzle…) cambia solo guardarSuscripcion,
// borrarSuscripcion y la consulta de enviarPush; el resto queda igual.
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

export type SuscripcionJSON = { endpoint: string; keys: { p256dh: string; auth: string } }
export type Aviso = { title: string; body?: string; url?: string; tag?: string }

const TABLA = 'push_subscriptions'
// Si el teléfono está apagado, el servicio de push guarda el aviso hasta 24 horas.
const TTL_SEGUNDOS = 60 * 60 * 24

let configurado = false
function configurar() {
  if (configurado) return
  const publica = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privada = process.env.VAPID_PRIVATE_KEY
  const contacto = process.env.VAPID_SUBJECT
  if (!publica || !privada || !contacto) {
    throw new Error('Faltan NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY o VAPID_SUBJECT')
  }
  webpush.setVapidDetails(contacto, publica, privada)
  configurado = true
}

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const clave = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !clave) throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  return createClient(url, clave, { auth: { persistSession: false, autoRefreshToken: false } })
}

/** Guarda o refresca un dispositivo (una fila por endpoint). */
export async function guardarSuscripcion(sub: SuscripcionJSON, userId: string | null): Promise<void> {
  const { error } = await db()
    .from(TABLA)
    .upsert(
      { endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth, user_id: userId, updated_at: new Date().toISOString() },
      { onConflict: 'endpoint' },
    )
  if (error) throw error
}

export async function borrarSuscripcion(endpoint: string): Promise<void> {
  const { error } = await db().from(TABLA).delete().eq('endpoint', endpoint)
  if (error) throw error
}

/** Manda el aviso a todos los dispositivos (o solo a los de un usuario) y borra los que ya no existen. */
export async function enviarPush(aviso: Aviso, opciones: { userId?: string } = {}) {
  configurar()
  let consulta = db().from(TABLA).select('endpoint, p256dh, auth')
  if (opciones.userId) consulta = consulta.eq('user_id', opciones.userId)
  const { data, error } = await consulta
  if (error) throw error

  const filas = (data ?? []) as { endpoint: string; p256dh: string; auth: string }[]
  const contenido = JSON.stringify(aviso)
  let enviados = 0
  let borrados = 0
  await Promise.all(
    filas.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, contenido, {
          TTL: TTL_SEGUNDOS,
        })
        enviados++
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode
        // 404 o 410: el dispositivo desinstaló la app o el navegador cambió la suscripción.
        if (status === 404 || status === 410) {
          await borrarSuscripcion(s.endpoint)
          borrados++
        } else {
          console.error('[push] falló un envío', status, e)
        }
      }
    }),
  )
  return { enviados, borrados, total: filas.length }
}
