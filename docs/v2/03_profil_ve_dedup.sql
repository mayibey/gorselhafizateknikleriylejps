-- ============================================================================
-- v2 / Adım 3 — Profil bilgileri (ad/soyad/telefon) + mükerrer hesap engeli
-- Supabase panel → SQL Editor → yapıştır → RUN. Idempotent.
-- ============================================================================

-- 1) profiles'a kişisel bilgi kolonları (kayıt sonrası "profil tamamla" adımı doldurur).
alter table public.profiles add column if not exists ad      text;
alter table public.profiles add column if not exists soyad   text;
alter table public.profiles add column if not exists telefon text;

-- 2) Mükerrer hesap engeli: bir e-posta zaten kayıtlıysa, ikinci yöntemle (örn. şifre)
--    tekrar kayıt açtırma. Client signup ÖNCESİ bunu RPC ile çağırır.
--    SECURITY DEFINER → auth.users'ı okuyabilir (normal kullanıcı okuyamaz).
create or replace function public.eposta_kullanimda(p_eposta text)
returns boolean
language sql
security definer
set search_path = public, auth
as $$
  select exists (select 1 from auth.users where lower(email) = lower(trim(p_eposta)));
$$;

-- Client (giriş yapmamış = anon) signup öncesi çağırabilsin.
grant execute on function public.eposta_kullanimda(text) to anon, authenticated;
-- NOT: bu, e-posta "kayıtlı mı" bilgisini açar (enumeration). Küçük uygulama için kabul;
-- istismar olursa rate-limit / captcha eklenir.

-- 3) (TEMİZLİK — elle) Mevcut MÜKERRER hesaplar: aynı e-postadan 2 satır varsa
--    Supabase → Authentication → Users'tan FAZLA olanı sil (genelde şifreyle açılan,
--    sonradan eklenen). Hangisini tutacağına dikkat: Google'la açılan + verisi olan kalsın.
--    (Otomatik silme RİSKLİ — elle, kontrol ederek.)
