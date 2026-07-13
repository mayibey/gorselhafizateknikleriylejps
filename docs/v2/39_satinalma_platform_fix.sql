-- 39: SATIŞ PLATFORM ETİKETİ FIX (iOS satışları 'android' yazılıyordu).
-- Kök sebep: uyelik_haklari + satin_alma_log platform kolonu DEFAULT 'android' idi;
-- edge fn (dogrula-satinalma) upsert'lerde platform SET etmiyordu → iOS de 'android'.
-- Fix: (1) default kaldırıldı (aşağıda, CANLI uygulandı), (2) edge fn platform=magaza
-- (ios/android) açıkça yazar (index.ts, deploy edildi).
alter table public.uyelik_haklari alter column platform drop default;
alter table public.satin_alma_log alter column platform drop default;
