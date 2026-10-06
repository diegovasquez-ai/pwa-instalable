import { NextResponse } from 'next/server'
import { enviarPush } from '@/lib/push/server'

// POST { title, body?, url?, tag?, userId? } con el header "Authorization: Bearer <PUSH_SECRET>".
// Para avisar desde tu propio código (un pedido nuevo, un recordatorio) llama enviarPush() directo.
export async function POST(req: Request) {
  const secreto = process.env.PUSH_SECRET
  if (!secreto || req.headers.get('authorization') !== `Bearer ${secreto}`) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 })
  }
  const body = (await req.json().catch(() => null)) as
    | { title?: string; body?: string; url?: string; tag?: string; userId?: string }
    | null
  if (!body?.title) return NextResponse.json({ ok: false, error: 'Falta title' }, { status: 400 })
  try {
    const resultado = await enviarPush(
      { title: body.title, body: body.body, url: body.url, tag: body.tag },
      { userId: body.userId },
    )
    return NextResponse.json({ ok: true, ...resultado })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}
