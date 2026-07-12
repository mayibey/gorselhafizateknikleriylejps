-- 26: ER MEYDANI LİG (dereceli) — ücretsiz, gölge-usulü, KENDİ KENDİNİ YÖNETEN sezonlar.
-- Normal oyun rating'e dokunmaz; SADECE lig maçı puan kazandırır/kaybettirir (ELO).
-- Eşleşme: seviyeye yakın gölge (kaydedilmiş koşu); son 2 rakip hariç (üst üste tekrar engeli).
-- SEZON = ay (takvimden türer). Sıfırlama TEMBEL (yeni ayın ilk maçında, cron YOK). Havuz kendini budar.
-- Çalıştır: Supabase SQL Editor → RUN. Idempotent.

-- Rating (kalıcı derece) — sezon bazlı, tembel sıfırlanır
create table if not exists public.er_meydani_lig (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  sezon        text not null,
  puan         integer not null default 1000,   -- ELO rating
  mac          integer not null default 0,
  galip        integer not null default 0,
  maglup       integer not null default 0,
  son_rakipler uuid[] not null default '{}',     -- son 2 rakip (3. tekrar engeli)
  guncelleme   timestamptz not null default now()
);
alter table public.er_meydani_lig enable row level security;
create index if not exists er_meydani_lig_sezon on public.er_meydani_lig (sezon, puan desc);
drop policy if exists "ermeydani_lig_select_own" on public.er_meydani_lig;
create policy "ermeydani_lig_select_own" on public.er_meydani_lig for select using (user_id = auth.uid());

-- Gölge havuzu (kaydedilmiş koşular; eşleşme buradan) — kişi başına ~20 koşu, kendini budar
create table if not exists public.er_meydani_lig_kayit (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  sezon      text not null,
  seed       bigint not null,
  skor       integer not null,
  rating     integer not null,
  created_at timestamptz not null default now()
);
alter table public.er_meydani_lig_kayit enable row level security;
create index if not exists er_meydani_lig_kayit_es on public.er_meydani_lig_kayit (sezon, rating);
-- Politika YOK → istemci erişemez; yalnız RPC (definer).

-- ── Sezon anahtarı (ay; takvimden türer) ──
create or replace function public.er_meydani_lig_sezon() returns text
  language sql stable set search_path = public as $fn$
  select to_char((now() at time zone 'Europe/Istanbul'), 'YYYY"-S"MM');
$fn$;

-- ── Kademe (rating → isim; saf) ──
create or replace function public.er_meydani_lig_kademe(p integer) returns text
  language sql immutable as $fn$
  select case
    when p < 900 then 'Demir' when p < 1050 then 'Bronz' when p < 1200 then 'Gümüş'
    when p < 1350 then 'Altın' when p < 1500 then 'Platin' when p < 1700 then 'Elmas'
    else 'Usta' end;
$fn$;

-- ── HAZIRLA — satır yoksa kur; sezon değiştiyse TEMBEL sıfırla (rating'i 1000'e yarıla) ──
create or replace function public.er_meydani_lig_hazirla(p_uid uuid) returns void
  language plpgsql security definer set search_path = public as $fn$
declare v_sezon text := public.er_meydani_lig_sezon(); l public.er_meydani_lig;
begin
  select * into l from public.er_meydani_lig where user_id = p_uid;
  if not found then
    insert into public.er_meydani_lig (user_id, sezon) values (p_uid, v_sezon)
      on conflict (user_id) do nothing;
  elsif l.sezon <> v_sezon then
    update public.er_meydani_lig set
      puan = greatest(100, round(1000 + (puan - 1000) * 0.5)::int),
      mac = 0, galip = 0, maglup = 0, son_rakipler = '{}', sezon = v_sezon, guncelleme = now()
    where user_id = p_uid;
  end if;
end; $fn$;

-- ── DURUM — kendi rating/kademe/sıra (tembel sıfırlama uygular) ──
create or replace function public.er_meydani_lig_durum() returns json
  language plpgsql security definer set search_path = public as $fn$
declare v_uid uuid := auth.uid(); l public.er_meydani_lig; v_sira integer;
begin
  if v_uid is null then return json_build_object('hata', 'oturum yok'); end if;
  perform public.er_meydani_lig_hazirla(v_uid);
  select * into l from public.er_meydani_lig where user_id = v_uid;
  select count(*) + 1 into v_sira from public.er_meydani_lig where sezon = l.sezon and puan > l.puan;
  return json_build_object('puan', l.puan, 'kademe', public.er_meydani_lig_kademe(l.puan),
    'mac', l.mac, 'galip', l.galip, 'maglup', l.maglup, 'sezon', l.sezon, 'sira', v_sira);
end; $fn$;
grant execute on function public.er_meydani_lig_durum() to authenticated;

-- ── EŞLEŞME — seviyeye yakın gölge (son rakipler + engellenenler hariç); yoksa sentetik rakip ──
create or replace function public.er_meydani_lig_eslesme() returns json
  language plpgsql security definer set search_path = public as $fn$
declare
  v_uid uuid := auth.uid(); l public.er_meydani_lig; g public.er_meydani_lig_kayit;
  v_seed bigint; v_skor int; v_rating int; v_rumuz text; v_owner uuid; v_id uuid; v_golge boolean := false;
begin
  if v_uid is null then return json_build_object('hata', 'oturum yok'); end if;
  perform public.er_meydani_lig_hazirla(v_uid);
  select * into l from public.er_meydani_lig where user_id = v_uid;
  select * into g from public.er_meydani_lig_kayit k
   where k.sezon = l.sezon and k.user_id <> v_uid and k.user_id <> all(l.son_rakipler)
     and not exists (select 1 from public.er_meydani_engel e
        where (e.engelleyen = v_uid and e.engellenen = k.user_id)
           or (e.engelleyen = k.user_id and e.engellenen = v_uid))
   order by abs(k.rating - l.puan) asc, k.created_at desc
   limit 1;
  if found then
    v_seed := g.seed; v_skor := g.skor; v_rating := g.rating; v_owner := g.user_id; v_id := g.id;
    select rumuz into v_rumuz from public.profiles where id = g.user_id;
  else
    -- Havuz boş/uygun rakip yok → sentetik rakip (lig HEP maç bulur, ölü lig olmaz)
    v_golge := true; v_owner := null; v_id := null;
    v_seed := (random() * 2147483647)::bigint + 1;
    v_rating := greatest(100, l.puan + ((random() - 0.5) * 100)::int);
    v_skor := greatest(0, least(2000, (800 + (v_rating - 1000) * 0.6 + random() * 300)::int));
    v_rumuz := 'Er ' || (array['Yıldırım','Şahin','Bozkurt','Demir','Kartal','Poyraz','Aslan','Çelik'])[1 + floor(random() * 8)];
  end if;
  return json_build_object('kayit_id', v_id, 'golge', v_golge, 'seed', v_seed, 'rakip_skor', v_skor,
    'rakip_rating', v_rating, 'rakip_rumuz', coalesce(v_rumuz, 'Anonim Er'), 'rakip_id', v_owner,
    'benim_rating', l.puan, 'kademe', public.er_meydani_lig_kademe(l.puan));
end; $fn$;
grant execute on function public.er_meydani_lig_eslesme() to authenticated;

-- ── SONUÇ — ELO güncelle (tek taraflı) + koşumu gölge havuzuna ekle + havuzu buda ──
create or replace function public.er_meydani_lig_sonuc(
  p_seed bigint, p_benim_skor integer, p_rakip_skor integer, p_rakip_rating integer, p_rakip_id uuid
) returns json language plpgsql security definer set search_path = public as $fn$
declare
  v_uid uuid := auth.uid(); l public.er_meydani_lig;
  v_my int; v_skor int; v_e float; v_s float; v_delta int; v_yeni int; v_son uuid[];
begin
  if v_uid is null then return json_build_object('hata', 'oturum yok'); end if;
  perform public.er_meydani_lig_hazirla(v_uid);
  select * into l from public.er_meydani_lig where user_id = v_uid;
  v_my := l.puan;
  v_skor := greatest(0, least(2000, coalesce(p_benim_skor, 0)));
  v_s := case when v_skor > coalesce(p_rakip_skor,0) then 1.0
              when v_skor < coalesce(p_rakip_skor,0) then 0.0 else 0.5 end;
  v_e := 1.0 / (1.0 + power(10, (coalesce(p_rakip_rating, 1000) - v_my) / 400.0));
  v_delta := round(32 * (v_s - v_e))::int;
  v_yeni := greatest(100, v_my + v_delta);
  v_son := l.son_rakipler;
  if p_rakip_id is not null then
    v_son := array_append(v_son, p_rakip_id);
    if array_length(v_son, 1) > 2 then v_son := v_son[array_length(v_son,1)-1 : array_length(v_son,1)]; end if;
  end if;
  update public.er_meydani_lig set
    puan = v_yeni, mac = mac + 1,
    galip = galip + (case when v_s = 1.0 then 1 else 0 end),
    maglup = maglup + (case when v_s = 0.0 then 1 else 0 end),
    son_rakipler = v_son, guncelleme = now()
  where user_id = v_uid;
  insert into public.er_meydani_lig_kayit (user_id, sezon, seed, skor, rating)
    values (v_uid, l.sezon, p_seed, v_skor, v_yeni);
  -- Havuz kendini budar: kişi başına en yeni 20 koşu kalır (bakım YOK)
  delete from public.er_meydani_lig_kayit k where k.user_id = v_uid and k.id not in (
    select id from public.er_meydani_lig_kayit where user_id = v_uid order by created_at desc limit 20);
  return json_build_object('delta', v_delta, 'rating', v_yeni, 'kademe', public.er_meydani_lig_kademe(v_yeni),
    'galip_mu', v_s = 1.0, 'berabere', v_s = 0.5);
end; $fn$;
grant execute on function public.er_meydani_lig_sonuc(bigint,integer,integer,integer,uuid) to authenticated;

-- ── LİG TABLOSU — bu sezonun en yüksek rating'leri (rumuz + kademe; user_id sızmaz) ──
create or replace function public.er_meydani_lig_tablo(p_limit integer default 50)
  returns table(sira integer, rumuz text, puan integer, kademe text, mac integer, galip integer, ben boolean)
  language sql security definer set search_path = public as $fn$
  select row_number() over (order by h.puan desc, h.guncelleme asc)::int,
         coalesce(p.rumuz, 'Anonim Er'), h.puan, public.er_meydani_lig_kademe(h.puan),
         h.mac, h.galip, (h.user_id = auth.uid())
  from public.er_meydani_lig h join public.profiles p on p.id = h.user_id
  where h.sezon = public.er_meydani_lig_sezon() and h.mac > 0
  order by h.puan desc, h.guncelleme asc
  limit greatest(1, least(coalesce(p_limit, 50), 100));
$fn$;
grant execute on function public.er_meydani_lig_tablo(integer) to authenticated;
