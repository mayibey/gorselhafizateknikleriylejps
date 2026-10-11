-- Ekim analiz sayfasi (mevzujsps.com/jsps2026ekimanaliz) ziyaret sayaci.
-- Kisisel veri YOK: isim/e-posta/IP tutulmaz; ziyaretci = tarayicida uretilen rastgele kimlik.
-- Anon yalniz EKLEYEBILIR; okuma yalniz servis anahtariyla.
create table if not exists public.analiz_ziyaret (
  id bigserial primary key,
  olay text not null check (olay in ('acilis','brans','sorular')),
  brans text check (char_length(brans) <= 40),
  ziyaretci text not null check (char_length(ziyaretci) between 8 and 40),
  kaynak text check (char_length(kaynak) <= 80),
  mobil boolean,
  created_at timestamptz not null default now()
);
create index if not exists analiz_ziyaret_tarih on public.analiz_ziyaret (created_at);
alter table public.analiz_ziyaret enable row level security;
drop policy if exists analiz_ziyaret_ekle on public.analiz_ziyaret;
create policy analiz_ziyaret_ekle on public.analiz_ziyaret for insert to anon, authenticated with check (true);
revoke all on public.analiz_ziyaret from anon, authenticated;
grant insert on public.analiz_ziyaret to anon, authenticated;
grant usage on sequence public.analiz_ziyaret_id_seq to anon, authenticated;
