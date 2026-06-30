-- Geri bildirim tablosu — kullanıcı "Hata/Öneri Bildir" gönderince buraya yazılır.
-- (Formspree yerine kendi backend'imiz → gerçekten kaydedilir, mağaza "sahte gönderim" riski yok.)
-- Çalıştır: Supabase → SQL Editor.

create table if not exists public.geri_bildirim (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  tip text not null,
  mesaj text not null,
  card_id bigint,
  madde_no text,
  baslik text,
  kanun text,
  created_at timestamptz not null default now()
);

alter table public.geri_bildirim enable row level security;

-- Kullanıcı YALNIZ kendi adına ekleyebilir; okuma yok (geri bildirimleri sen dashboard'dan görürsün).
drop policy if exists "geri_bildirim_insert_own" on public.geri_bildirim;
create policy "geri_bildirim_insert_own" on public.geri_bildirim
  for insert with check (auth.uid() = user_id);
