-- 42: PDF kitap NOT/ÇİZİM saklama — KİŞİYE ÖZEL + KALICI (başkan: PDF'e çizilen/yazılan
-- şeyler tekrar açınca gelsin, kişiye özel). Her (kullanıcı, kitap, sayfa) için o sayfanın
-- çizim/not verisi (freehand path'ler, işaretlemeler, metin notları) jsonb olarak tutulur.
-- App açılışta kullanıcının satırlarını yükleyip overlay çizer; değişince upsert eder.
create table if not exists public.kitap_notlari (
  user_id     uuid not null references auth.users(id) on delete cascade,
  dosya_yolu  text not null,        -- pdf/{brans}/...pdf (brans_kitaplari.dosya_yolu)
  sayfa       int  not null,
  veri        jsonb not null default '[]'::jsonb,
  guncelleme  timestamptz not null default now(),
  primary key (user_id, dosya_yolu, sayfa)
);
alter table public.kitap_notlari enable row level security;
drop policy if exists kitap_notlari_own_select on public.kitap_notlari;
create policy kitap_notlari_own_select on public.kitap_notlari for select to authenticated using (user_id = auth.uid());
drop policy if exists kitap_notlari_own_write on public.kitap_notlari;
create policy kitap_notlari_own_write on public.kitap_notlari for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
