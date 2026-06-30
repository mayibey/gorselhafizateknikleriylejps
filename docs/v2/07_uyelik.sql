-- ÜYELİK / PREMIUM — satın alma hakları (entitlement) + satın alma logları (#6).
-- Yazma YALNIZ service_role ile (doğrulama Edge Function'ı). Kullanıcı sadece KENDİ hakkını okur.
-- Çalıştır: Supabase → SQL Editor.

-- 1) ÜYELİK HAKLARI — kullanıcının doğrulanmış satın almaları.
--    tip: 'abonelik' (bitis dolu, yenilenir) | 'omurboyu' (bitis NULL, kalıcı).
--    premiumMi = EXISTS (omurboyu) OR EXISTS (abonelik AND bitis > now()).
create table if not exists public.uyelik_haklari (
  user_id           uuid not null references auth.users(id) on delete cascade,
  urun              text not null,                 -- Play product ID (premium_yillik / premium_omurboyu)
  tip               text not null check (tip in ('abonelik', 'omurboyu')),
  baslangic         timestamptz not null default now(),
  bitis             timestamptz,                   -- NULL = ömür boyu; dolu = abonelik bitişi
  satin_alma_token  text,                          -- Google purchase token (yeniden doğrulama için)
  platform          text not null default 'android',
  son_dogrulama     timestamptz not null default now(),
  primary key (user_id, urun)
);

alter table public.uyelik_haklari enable row level security;

-- Kullanıcı YALNIZ kendi haklarını okur (yazma yok → yazan service_role/Edge Function).
drop policy if exists "uyelik_select_own" on public.uyelik_haklari;
create policy "uyelik_select_own" on public.uyelik_haklari
  for select using (auth.uid() = user_id);

-- 2) SATIN ALMA LOGLARI (#6) — her doğrulama denemesi (başarılı/başarısız) kaydı.
create table if not exists public.satin_alma_log (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete set null,
  urun        text,
  tip         text,
  token       text,
  durum       text not null,                       -- 'dogrulandi' | 'reddedildi' | 'hata'
  detay       text,
  platform    text not null default 'android',
  ham_yanit   jsonb,                               -- Google API ham yanıtı (denetim/iade için)
  created_at  timestamptz not null default now()
);

alter table public.satin_alma_log enable row level security;
-- Kullanıcı erişimi YOK (logları sen dashboard'dan/service_role ile görürsün).

-- 3) Premium kontrolü için yardımcı (opsiyonel — istemci de hesaplayabilir).
create or replace function public.premium_mi(p_user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.uyelik_haklari
    where user_id = p_user
      and (tip = 'omurboyu' or (tip = 'abonelik' and bitis is not null and bitis > now()))
  );
$$;
