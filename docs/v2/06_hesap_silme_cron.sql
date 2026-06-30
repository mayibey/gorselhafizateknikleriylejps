-- 30 GÜNLÜK OTOMATİK KALICI HESAP SİLME (pg_cron) — "tam otomatik" silme için.
-- Uygulama içi "Hesabı Sil" → profiles.silme_talep_tarihi dolar. Bu cron, 30 günü geçenleri
-- her gün OTOMATİK kalıcı siler (auth.users silinince profiles + kullanici_ilerleme cascade gider).
-- Çalıştır: Supabase → SQL Editor (bir kez). Önce pg_cron extension'ı etkinleştirir.

create extension if not exists pg_cron;

-- Var olan aynı isimli job'ı temizle (idempotent)
select cron.unschedule('hesap-kalici-sil')
where exists (select 1 from cron.job where jobname = 'hesap-kalici-sil');

-- Her gün 03:00 (UTC) → 30 günü geçen silme taleplerini KALICI sil.
select cron.schedule(
  'hesap-kalici-sil',
  '0 3 * * *',
  $$
    delete from auth.users
    where id in (
      select id from public.profiles
      where silme_talep_tarihi is not null
        and silme_talep_tarihi < now() - interval '30 days'
    )
  $$
);

-- Kontrol: select * from cron.job where jobname = 'hesap-kalici-sil';
