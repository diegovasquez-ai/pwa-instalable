-- Dispositivos suscritos a las notificaciones push: una fila por endpoint (teléfono + navegador).
create table if not exists push_subscriptions (
  endpoint    text primary key,
  p256dh      text not null,
  auth        text not null,
  user_id     text,                -- opcional, para mandarle a una persona (sirve cualquier id de login)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists push_subscriptions_user_idx on push_subscriptions (user_id);

-- Solo el servidor lee y escribe (con la service role): RLS activo y sin políticas.
alter table push_subscriptions enable row level security;
