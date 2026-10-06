-- 7 Eki 2026: deneme sonucunda branş (branş denemelerinde deneme_no branşlar arası aynı;
-- kartlarda "Son: x puan" sunucudan geri yüklenirken doğru branşa eşlemek için). Boş olabilir.
alter table public.deneme_sonuc add column if not exists brans text;
