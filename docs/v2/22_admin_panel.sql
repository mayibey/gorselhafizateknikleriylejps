-- 22: ADMIN PANEL — başkanın uygulama içinden ticket + duyuru yönetmesi.
-- Admin kimliği: admin_kullanicilar tablosu (user_id listesi). benadmin() SECURITY DEFINER
-- fonksiyonu auth.uid()'nin admin olup olmadığını döner (RLS'te kullanılır).
-- RLS: admin TÜM talepleri/mesajları görür + cevaplar + durum günceller; duyuruları yönetir.
-- Çalıştır: Supabase SQL Editor → yapıştır → RUN. Idempotent.

-- ── Admin kullanıcı listesi ────────────────────────────────────────────────
create table if not exists public.admin_kullanicilar (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  eklendi_at timestamptz not null default now()
);
alter table public.admin_kullanicilar enable row level security;
-- Politika YOK → istemci erişemez (yalnız service_role okur/yazar). benadmin() definer ile okur.

-- Başkanı admin yap (mayibey@gmail.com). İdempotent.
insert into public.admin_kullanicilar (user_id)
  select id from auth.users where email = 'mayibey@gmail.com'
  on conflict (user_id) do nothing;

-- ── benadmin(): auth.uid() admin mi? (RLS'te + istemcide kullanılır) ────────
create or replace function public.benadmin() returns boolean
  language sql security definer stable set search_path = public as $fn$
  select exists (select 1 from public.admin_kullanicilar a where a.user_id = auth.uid());
$fn$;
grant execute on function public.benadmin() to authenticated, anon;

-- ── DESTEK: admin TÜM talepleri/mesajları görür + cevaplar + durum günceller ─
drop policy if exists "destek_talebi_admin_select" on public.destek_talebi;
create policy "destek_talebi_admin_select" on public.destek_talebi
  for select using (benadmin());

drop policy if exists "destek_talebi_admin_update" on public.destek_talebi;
create policy "destek_talebi_admin_update" on public.destek_talebi
  for update using (benadmin()) with check (benadmin());

drop policy if exists "destek_mesaj_admin_select" on public.destek_mesaj;
create policy "destek_mesaj_admin_select" on public.destek_mesaj
  for select using (benadmin());

-- Admin mesaj ekleyebilir (gonderen='admin' dahil). Mevcut kullanıcı-insert politikası
-- gonderen='kullanici' şartlıydı; bu politika admin'e serbestlik verir.
drop policy if exists "destek_mesaj_admin_insert" on public.destek_mesaj;
create policy "destek_mesaj_admin_insert" on public.destek_mesaj
  for insert with check (benadmin());

-- ── DUYURULAR: admin ekler/günceller/siler (kullanıcı zaten yalnız okur) ────
-- DİKKAT: admin için duyurular'a genel bir SELECT politikası KOYMA. RLS politikaları OR'lanır;
-- benadmin() SELECT'i normal FEED'e de sızar → admin, BAŞKA kullanıcıya özel duyuruları da
-- Karargah akışında görür (kişiye-özel sızıntısı). Panel listesi için aşağıdaki RPC kullanılır.
drop policy if exists "duyurular_admin_select" on public.duyurular;

drop policy if exists "duyurular_admin_insert" on public.duyurular;
create policy "duyurular_admin_insert" on public.duyurular
  for insert with check (benadmin());

drop policy if exists "duyurular_admin_update" on public.duyurular;
create policy "duyurular_admin_update" on public.duyurular
  for update using (benadmin()) with check (benadmin());

drop policy if exists "duyurular_admin_delete" on public.duyurular;
create policy "duyurular_admin_delete" on public.duyurular
  for delete using (benadmin());

-- Admin, kişiye özel duyuru hedefi için kullanıcı email→id araması yapabilsin diye
-- basit bir GÜVENLİ görünüm/fonksiyon (email ile kullanıcı bul). Yalnız admin çağırabilir.
create or replace function public.admin_kullanici_bul(p_email text)
  returns table (user_id uuid, email text) language sql security definer stable
  set search_path = public as $fn$
  select u.id, u.email::text from auth.users u
   where benadmin() and lower(u.email) = lower(trim(p_email))
   limit 1;
$fn$;
grant execute on function public.admin_kullanici_bul(text) to authenticated;

-- Panel için TÜM duyuruları (pasif + kişiye özel dahil) listeler — YALNIZ admin. Feed RLS'i
-- admin'e sadece genel+kendine-özel gösterdiğinden panel bu RPC ile tam listeyi alır.
create or replace function public.admin_duyurular_listele()
  returns setof public.duyurular language sql security definer stable
  set search_path = public as $fn$
  select * from public.duyurular where benadmin() order by created_at desc;
$fn$;
grant execute on function public.admin_duyurular_listele() to authenticated;
