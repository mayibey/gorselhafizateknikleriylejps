-- v2 / Adım 20 — İçerik erişim logu (ADLİ İZ zinciri)
-- Amaç: sızan görseldeki filigran(user.id) → profiles(ad/soyad/telefon) → BU LOG(zaman+IP+UA) → kimlik.
-- Not: MAC adresi / gerçek cihaz IP'si mobilde ALINAMAZ (OS engeli). Burada tutulan `ip` = isteğin
-- ulaştığı public IP (mobil operatör CGNAT/NAT ya da Wi-Fi dış IP'si olabilir); tek başına kişiyi
-- belirlemez, operatörden yasal talple abone eşlemesi gerekir. Zincirin bir halkasıdır.
-- Yazan: edge fonksiyonlar (gorsel, imzali-url) service_role ile. Fail-open (log yazımı içeriği bloklamaz).

create table if not exists public.icerik_erisim_log (
  id       bigint generated always as identity primary key,
  user_id  uuid references auth.users(id) on delete set null,
  yol      text,                                  -- hangi görsel/içerik yolu
  ip       inet,                                  -- istek (NAT) IP'si
  ua       text,                                  -- user-agent
  kaynak   text,                                  -- 'gorsel' | 'imzali-url(N)'
  zaman    timestamptz not null default now()
);

create index if not exists icerik_erisim_log_user_idx on public.icerik_erisim_log (user_id, zaman desc);
create index if not exists icerik_erisim_log_zaman_idx on public.icerik_erisim_log (zaman desc);

-- RLS: hiçbir policy yok → anon/authenticated ERİŞEMEZ. Yalnız service_role (RLS bypass) yazar/okur.
alter table public.icerik_erisim_log enable row level security;

comment on table public.icerik_erisim_log is
  'Adli iz: hangi hesap hangi içeriğe ne zaman/hangi IP ile erişti. Yalnız service_role. Saklama önerisi ~12 ay (cron ile temizlenebilir; KVKK meşru menfaat + saklama süresi gizlilik metninde beyan edildi).';

-- (Opsiyonel, ileride) 12 aydan eski kayıtları temizleyen cron:
-- select cron.schedule('erisim-log-temizle', '0 4 * * *',
--   $$ delete from public.icerik_erisim_log where zaman < now() - interval '12 months' $$);
