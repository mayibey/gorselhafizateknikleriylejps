-- 14: DUYURULAR — geliştirici (başkan) tarafından yazılan, uygulama içinde görünen mesajlar.
-- Sunucudan yönetilir (build gerekmez): başkan dashboard'dan satır ekler → herkeste anında görünür.
-- hedef: 'herkes' (tüm kullanıcılar) | 'premium' (yalnız premium — istemci tarafında filtrelenir).
-- Yazma YALNIZ service_role/dashboard (istemci yalnız aktif duyuruları OKUR).

create table if not exists public.duyurular (
  id          uuid primary key default gen_random_uuid(),
  baslik      text not null,
  metin       text not null,
  hedef       text not null default 'herkes' check (hedef in ('herkes', 'premium')),
  aktif       boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table public.duyurular enable row level security;
drop policy if exists "duyuru_oku" on public.duyurular;
create policy "duyuru_oku" on public.duyurular for select using (aktif = true);

-- İlk hoş geldin duyurusu (özellik çalışıyor görünsün + boş kalmasın).
insert into public.duyurular (baslik, metin, hedef)
select 'Mevzu · JSPS''e hoş geldin! 🎖️',
       'Uygulamamız sürekli gelişiyor. Yeni kanunlar, hafıza kartları ve özellikler ekledikçe burada, Duyurular bölümünde haber vereceğiz. Başarılar dileriz!',
       'herkes'
where not exists (select 1 from public.duyurular);
