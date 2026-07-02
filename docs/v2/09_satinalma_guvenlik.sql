-- SATIN ALMA GÜVENLİĞİ — token yeniden kullanımını (makbuz paylaşımı) DB seviyesinde engelle.
-- 2 Tem 2026 denetim bulgusu: bir satın alma token'ı birden çok hesapta doğrulanabiliyordu
-- (uyelik_haklari PK'sı (user_id, urun); token'da benzersizlik yoktu) → tek satın alma, sınırsız
-- premium hesap. Edge Function (dogrula-satinalma) artık önceden kontrol ediyor; bu index İKİNCİ
-- savunma (yarış durumunda bile DB reddeder).
-- Çalıştır: Supabase → SQL Editor.

-- Bir purchase token yalnız TEK satırda (tek hesapta) olabilir. NULL token'lar hariç.
create unique index if not exists uyelik_haklari_token_uniq
  on public.uyelik_haklari (satin_alma_token)
  where satin_alma_token is not null;

-- NOT: Kilit açılınca (yayın) Edge Function'larda premium kapısı da aktifleştirilmeli:
--   supabase secrets set KILIT_AKTIF=1 --project-ref vwmjrvolkbiofpkzzwef
--   supabase functions deploy imzali-url --project-ref vwmjrvolkbiofpkzzwef
--   supabase functions deploy gorsel     --project-ref vwmjrvolkbiofpkzzwef
--   supabase functions deploy dogrula-satinalma --project-ref vwmjrvolkbiofpkzzwef
-- (KILIT_AKTIF ayarlı değilse premium kapısı KAPALI kalır → kapalı testte herkes erişir.)
