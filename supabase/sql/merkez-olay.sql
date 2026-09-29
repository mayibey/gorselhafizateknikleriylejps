-- HAREKÂT MERKEZİ KULLANIM OLAYLARI (30 Eyl 2026, başkan: "kim açmış, kaçı kilide takılmış göreyim")
-- Satır başına bir olay: acti (ekran açıldı) · kilit (üye olmayan kilitli düğmeye bastı) · rontgen · checkup · devam · ozet (üye başlattı)
-- Okuma yalnız servis anahtarıyla (scripts/merkez-rapor.mjs); kullanıcı yalnız kendi olayını yazar.
-- Uygulanma: Supabase Management API (scripts/sql-calistir.mjs) — 30 Eyl 2026.
create table if not exists public.merkez_olay (
  id        bigint generated always as identity primary key,
  user_id   uuid not null references auth.users(id) on delete cascade,
  olay      text not null,
  ayrinti   jsonb not null default '{}'::jsonb,
  premium   boolean,
  brans     text,
  zaman     timestamptz not null default now()
);
create index if not exists merkez_olay_zaman on public.merkez_olay (zaman desc);
create index if not exists merkez_olay_user on public.merkez_olay (user_id, zaman desc);
alter table public.merkez_olay enable row level security;
drop policy if exists "merkez olay kendi yazar" on public.merkez_olay;
create policy "merkez olay kendi yazar" on public.merkez_olay for insert to authenticated with check (auth.uid() = user_id);
grant insert on public.merkez_olay to authenticated;
