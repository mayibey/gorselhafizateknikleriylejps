-- ============================================================================
-- v2 / Adım 2 — Bulut senkron: kullanıcı ilerleme snapshot'ı (JSON)
-- Supabase panel → SQL Editor → yapıştır → RUN. Idempotent.
-- ============================================================================

-- Her kullanıcının ilerleme anlık görüntüsü (srs/performans/sicil/sınav/branş/rütbe) tek JSON.
-- Granüler tablo yerine snapshot: en az hata yüzeyi; girişte çek + güvenli birleştir (app tarafı).
create table if not exists public.kullanici_ilerleme (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  veri        jsonb not null default '{}'::jsonb,
  -- snapshot'ın üretildiği AN (app saati). Hangi tarafın daha yeni olduğunu bununla kıyaslarız.
  guncelleme  timestamptz not null default now()
);

alter table public.kullanici_ilerleme enable row level security;

-- Herkes yalnız KENDİ satırını okur/yazar (RLS gerçek koruma; anon key public).
drop policy if exists "ilerleme_select_own" on public.kullanici_ilerleme;
create policy "ilerleme_select_own" on public.kullanici_ilerleme
  for select using (auth.uid() = user_id);

drop policy if exists "ilerleme_insert_own" on public.kullanici_ilerleme;
create policy "ilerleme_insert_own" on public.kullanici_ilerleme
  for insert with check (auth.uid() = user_id);

drop policy if exists "ilerleme_update_own" on public.kullanici_ilerleme;
create policy "ilerleme_update_own" on public.kullanici_ilerleme
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
