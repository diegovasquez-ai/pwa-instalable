'use client'
// Botón para activar las notificaciones. En un iPhone sin instalar explica cómo agregar la app al
// inicio, que es la única forma de recibirlas ahí. Adapta los estilos al diseño del proyecto.
import { usePush } from '@/hooks/use-push'

export function PushButton() {
  const { estado, error, activar, desactivar } = usePush()

  if (estado === 'cargando' || estado === 'no-soportado') return null
  if (estado === 'instalar-primero') {
    return (
      <p style={{ fontSize: 14 }}>
        Para recibir notificaciones en iPhone: toca <strong>Compartir</strong> y después <strong>Agregar a inicio</strong>.
        Luego abre la app desde el ícono.
      </p>
    )
  }
  if (estado === 'bloqueado') {
    return <p style={{ fontSize: 14 }}>Bloqueaste las notificaciones. Actívalas en los ajustes del navegador.</p>
  }
  return (
    <div>
      <button type="button" onClick={estado === 'activo' ? desactivar : activar}>
        {estado === 'activo' ? 'Desactivar notificaciones' : 'Activar notificaciones'}
      </button>
      {error && <p style={{ fontSize: 14, color: '#dc2626' }}>{error}</p>}
    </div>
  )
}
