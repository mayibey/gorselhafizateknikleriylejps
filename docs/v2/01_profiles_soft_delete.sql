-- ============================================================================
-- v2 / Adım 1 — profiles tablosu + 30 günlük yumuşak hesap silme (soft delete)
-- Supabase panel → SQL Editor → bu dosyanın TAMAMINI yapıştır → RUN.
-- Bir kez çalıştırılır. Idempotent (tekrar çalıştırmak güvenli).
-- ============================================================================

-- 1) profiles: her kullanıcının temel satırı (auth.users ile 1:1).
--    İleride premium/entitlement BURAYA DEĞİL ayrı tabloya/servis-yazımına gider
--    (kullanıcı kendi premium'unu açamasın diye). Burada yalnız kendi yönetebileceği alanlar.
create table if not exists public.profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  email               text,
  created_at          timestamptz not null default now(),
  -- null = aktif hesap; dolu = silme talep edildi → 30 gün sonra KALICI silinecek.
  silme_talep_tarihi  timestamptz
);

-- 2) RLS: herkes yalnız KENDİ satırını görür/günceller.
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
-- NOT: INSERT politikası YOK — satır trigger ile (service_role) açılır, kullanıcı eklemez.

-- 3) Yeni kullanıcı kaydolunca otomatik profil satırı (signup trigger).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4) Mevcut kullanıcılar için geriye dönük profil (sen zaten giriş yaptın → satırın olsun).
insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;

-- ============================================================================
-- 5) (SONRAKİ ADIM — şimdi ÇALIŞTIRMA) 30 gün dolanları KALICI sil — pg_cron.
--    Soft-delete + reaktivasyon yukarıdakiyle çalışır; kalıcı temizlik bu cron'la olur.
--    Supabase → Database → Extensions → pg_cron'u etkinleştir, sonra:
--
--    select cron.schedule(
--      'hesap-kalici-sil', '0 3 * * *',   -- her gün 03:00
--      $$ delete from auth.users
--         where id in (select id from public.profiles
--                      where silme_talep_tarihi is not null
--                        and silme_talep_tarihi < now() - interval '30 days') $$
--    );
--    (auth.users silinince profiles satırı ON DELETE CASCADE ile gider.)
-- ============================================================================
