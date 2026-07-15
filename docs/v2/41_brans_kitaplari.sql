-- 41: BRANŞ PDF ÖZET KİTAPLARI listesi. PDF'ler private 'icerik' bucket'ta pdf/{brans_slug}/...
-- (görsel/ses ile aynı güvenlik: private bucket + imzalı URL + cihazda AES). Yükleyici:
-- scripts/brans-kitap-yukle.mjs. Liste okuma authenticated'a açık; PDF erişimi imzalı-URL kapılı.
create table if not exists public.brans_kitaplari (
  id bigint generated always as identity primary key,
  brans_slug text not null,
  baslik text not null,
  dosya_yolu text not null unique,   -- ör. pdf/mebs/5809_...pdf
  sira int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists brans_kitaplari_slug_idx on public.brans_kitaplari(brans_slug);
alter table public.brans_kitaplari enable row level security;
drop policy if exists brans_kitaplari_read on public.brans_kitaplari;
create policy brans_kitaplari_read on public.brans_kitaplari for select to authenticated using (true);
