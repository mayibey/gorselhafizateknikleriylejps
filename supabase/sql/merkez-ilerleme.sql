-- HAREKÂT MERKEZİ İLERLEMESİ (29 Eyl 2026, başkan: "yayınladığımızda kullanıcıların ilerlemelerini kaydetmen lazım")
-- Röntgen/check-up cevapları, kayıtlı özetler, yarım kalan test: kullanıcı başına tek JSON.
-- Ayrı tablo (kullanici_ilerleme'ye KARIŞMAZ: o tablo senkron.ts'in son-yazan-kazanır JSON'u; buraya yazsak ezilirdi).
-- Uygulanma: Supabase Management API (scripts/sql-calistir.mjs) — 29 Eyl 2026.
create table if not exists public.merkez_ilerleme (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  veri       jsonb not null default '{}'::jsonb,
  guncelleme timestamptz not null default now()
);
alter table public.merkez_ilerleme enable row level security;
drop policy if exists "merkez kendi satirini okur" on public.merkez_ilerleme;
create policy "merkez kendi satirini okur" on public.merkez_ilerleme for select to authenticated using (auth.uid() = user_id);
drop policy if exists "merkez kendi satirini yazar" on public.merkez_ilerleme;
create policy "merkez kendi satirini yazar" on public.merkez_ilerleme for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "merkez kendi satirini gunceller" on public.merkez_ilerleme;
create policy "merkez kendi satirini gunceller" on public.merkez_ilerleme for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
grant select, insert, update on public.merkez_ilerleme to authenticated;
