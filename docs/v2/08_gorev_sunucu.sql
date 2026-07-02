-- 08 — Görev bilgisi (branş/rütbe) SUNUCUYA taşınır (hesaba bağlı).
-- Neden: branş/rütbe yalnız cihazdaydı → uygulama silinince kayboluyor, hesap
-- değişiminde önceki kullanıcınınki görünüyordu. Artık profiles'ta durur:
-- girişte sunucudan gelir; seçim yapılınca sunucuya da yazılır.
-- Çalıştır: Supabase Dashboard → SQL Editor (idempotent, tekrar çalıştırılabilir).

alter table public.profiles
  add column if not exists brans text,
  add column if not exists rutbe text;

comment on column public.profiles.brans is 'Seçili branş slug''ı (örn. jandarma). Uygulama girişte okur, seçimde yazar.';
comment on column public.profiles.rutbe is 'Seçili rütbe slug''ı (sb/asb/uzmj/uzmerb).';

-- RLS: mevcut profiles politikaları (kendi satırını okuma/güncelleme) bu kolonları da kapsar; ek politika gerekmez.
