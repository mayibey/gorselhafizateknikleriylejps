-- 10 Ekim tahmin denemeleri (mevzujsps.com/tahmin) — açılış ve bitirme kaydı.
-- Sayfa anon anahtarla YALNIZ ekleme yapar; okuma sadece servis anahtarıyla (sunucu tarafı).
create table if not exists public.tahmin_deneme_kayit (
  id          bigint generated always as identity primary key,
  olusturma   timestamptz not null default now(),
  ziyaretci   text not null check (char_length(ziyaretci) between 8 and 64),
  ad          text check (ad is null or char_length(ad) <= 60),
  olay        text not null check (olay in ('acilis', 'bitir')),
  deneme      text check (deneme is null or deneme in ('jan', 'mebs')),
  dogru       smallint check (dogru is null or dogru between 0 and 80),
  yanlis      smallint check (yanlis is null or yanlis between 0 and 80),
  bos         smallint check (bos is null or bos between 0 and 80)
);

alter table public.tahmin_deneme_kayit enable row level security;

-- Herkes ekleyebilir; SELECT/UPDATE/DELETE politikası YOK → anon hiçbir satırı göremez, değiştiremez.
drop policy if exists "tahmin kayit ekle" on public.tahmin_deneme_kayit;
create policy "tahmin kayit ekle" on public.tahmin_deneme_kayit
  for insert to anon, authenticated with check (true);

revoke all on public.tahmin_deneme_kayit from anon, authenticated;
grant insert on public.tahmin_deneme_kayit to anon, authenticated;

-- 6 Eki: mevzujsps.com/sinavprovasi — rütbe/branş ve çoklu deneme kimliği
alter table public.tahmin_deneme_kayit add column if not exists rutbe text check (rutbe is null or rutbe in ('sb', 'asb', 'uzmj', 'uzmerb'));
alter table public.tahmin_deneme_kayit add column if not exists brans text check (brans is null or char_length(brans) <= 30);
alter table public.tahmin_deneme_kayit drop constraint if exists tahmin_deneme_kayit_deneme_check;
alter table public.tahmin_deneme_kayit add constraint tahmin_deneme_kayit_deneme_check check (deneme is null or char_length(deneme) <= 40);
alter table public.tahmin_deneme_kayit drop constraint if exists tahmin_deneme_kayit_ad_check;
alter table public.tahmin_deneme_kayit add constraint tahmin_deneme_kayit_ad_check check (ad is null or char_length(ad) <= 80);

-- 6 Eki 2026: branşı hazır olmayanlar "hızlandır" talebi bırakabilir
alter table public.tahmin_deneme_kayit drop constraint if exists tahmin_deneme_kayit_olay_check;
alter table public.tahmin_deneme_kayit add constraint tahmin_deneme_kayit_olay_check check (olay in ('acilis','bitir','hizlandir'));
notify pgrst, 'reload schema';
