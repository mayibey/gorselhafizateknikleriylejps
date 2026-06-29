-- ============================================================================
-- v2 / Adım 4 — Profil genişletme: doğum tarihi + cinsiyet
-- Supabase → SQL Editor → RUN. Idempotent. (03'ten sonra çalıştır.)
-- ============================================================================

alter table public.profiles add column if not exists dogum_tarihi date;   -- YYYY-MM-DD
alter table public.profiles add column if not exists cinsiyet     text;   -- 'kadin' | 'erkek' | 'belirtmek_istemiyorum'
