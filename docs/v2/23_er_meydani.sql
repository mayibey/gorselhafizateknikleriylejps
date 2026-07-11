-- 23: ER MEYDANI — 1v1 soru düellosu (ücretsiz oyun modu + haftalık sıralama).
-- Rumuz (takma ad) + maç kayıtları + haftalık puan (SUNUCU tarafı, anti-hile) + engel/şikayet (Apple UGC).
-- İstemci puan tablosuna YAZAMAZ; puan yalnız er_meydani_sonuc_kaydet() RPC ile (security definer) verilir.
-- Çalıştır: Supabase SQL Editor → yapıştır → RUN. Idempotent.

-- ── Rumuz (takma ad) — profiles üstünde, mahremiyet + Apple-gizli isimliler görünür olsun ──
alter table public.profiles add column if not exists rumuz text;
create unique index if not exists profiles_rumuz_benzersiz on public.profiles (lower(rumuz)) where rumuz is not null;

-- ── ISO hafta anahtarı (İstanbul; Pazartesi başlar → haftalık sıfırlama) ──
create or replace function public.er_meydani_hafta(ts timestamptz default now()) returns text
  language sql immutable as $fn$
  select to_char(ts at time zone 'Europe/Istanbul', 'IYYY"-W"IW');
$fn$;

-- ── Maç kayıtları — her satır BİR oyuncunun kendi bakışı (async'te ayrı kaydeder) ──
create table if not exists public.er_meydani_mac (
  id           uuid primary key default gen_random_uuid(),
  oyuncu_id    uuid not null references auth.users(id) on delete cascade,
  mod          text not null default 'hizli',      -- 'hizli' | 'canli' | 'arkadas'
  golge        boolean not null default false,     -- rakip gölge/bot muydu
  rakip_id     uuid references auth.users(id) on delete set null,
  rakip_rumuz  text,                               -- gösterim/anlık kopya (gölge/rastgele)
  seed         bigint not null,
  havuz        text not null default 'ucretsiz',
  benim_puan   integer not null,
  rakip_puan   integer not null,
  kazandim     boolean not null,
  hafta        text not null,
  created_at   timestamptz not null default now()
);
alter table public.er_meydani_mac enable row level security;
create index if not exists er_meydani_mac_oyuncu on public.er_meydani_mac (oyuncu_id, created_at desc);

-- Oyuncu yalnız KENDİ maçlarını görür. (İstemci INSERT etmez → sonuç RPC ile yazılır.)
drop policy if exists "ermeydani_mac_select_own" on public.er_meydani_mac;
create policy "ermeydani_mac_select_own" on public.er_meydani_mac
  for select using (oyuncu_id = auth.uid());

-- ── Haftalık puan (agrega) — istemci YAZAMAZ; yalnız RPC günceller ──
create table if not exists public.er_meydani_haftalik_puan (
  oyuncu_id  uuid not null references auth.users(id) on delete cascade,
  hafta      text not null,
  puan       integer not null default 0,
  mac_sayisi integer not null default 0,
  guncelleme timestamptz not null default now(),
  primary key (oyuncu_id, hafta)
);
alter table public.er_meydani_haftalik_puan enable row level security;
-- SELECT/insert/update politikası YOK → istemci erişemez. Sıralama RPC (definer) ile okunur.

-- ── Engelleme (Apple UGC şartı) — engellenen rakip eşleşmede gösterilmez ──
create table if not exists public.er_meydani_engel (
  engelleyen  uuid not null references auth.users(id) on delete cascade,
  engellenen  uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (engelleyen, engellenen)
);
alter table public.er_meydani_engel enable row level security;
drop policy if exists "ermeydani_engel_kendi" on public.er_meydani_engel;
create policy "ermeydani_engel_kendi" on public.er_meydani_engel
  for all using (engelleyen = auth.uid()) with check (engelleyen = auth.uid());

-- ── Şikayet (Apple UGC şartı) — admin görür ──
create table if not exists public.er_meydani_sikayet (
  id             uuid primary key default gen_random_uuid(),
  sikayet_eden   uuid not null references auth.users(id) on delete cascade,
  sikayet_edilen uuid references auth.users(id) on delete set null,
  rumuz          text,
  sebep          text,
  created_at     timestamptz not null default now()
);
alter table public.er_meydani_sikayet enable row level security;
drop policy if exists "ermeydani_sikayet_insert_own" on public.er_meydani_sikayet;
create policy "ermeydani_sikayet_insert_own" on public.er_meydani_sikayet
  for insert with check (sikayet_eden = auth.uid());
drop policy if exists "ermeydani_sikayet_admin_select" on public.er_meydani_sikayet;
create policy "ermeydani_sikayet_admin_select" on public.er_meydani_sikayet
  for select using (public.benadmin());

-- ── RUMUZ AYARLA (RPC) — doğrulama + benzersizlik + küfür kara listesi ──
create or replace function public.er_meydani_rumuz_ayarla(p_rumuz text)
  returns text language plpgsql security definer set search_path = public as $fn$
declare v text := btrim(p_rumuz);
begin
  if auth.uid() is null then return 'hata: oturum yok'; end if;
  if char_length(v) < 3 or char_length(v) > 16 then return 'hata: 3-16 karakter olmalı'; end if;
  if v !~ '^[A-Za-zÇĞİÖŞÜçğıöşü0-9 ]+$' then return 'hata: yalnız harf, rakam ve boşluk'; end if;
  if lower(v) ~ '(orospu|piç|amk|aq|sik|yarrak|gavat|pezevenk|göt|oç)' then return 'hata: uygunsuz ad'; end if;
  if exists (select 1 from public.profiles where lower(rumuz) = lower(v) and id <> auth.uid()) then
    return 'hata: bu ad alınmış';
  end if;
  update public.profiles set rumuz = v where id = auth.uid();
  return 'ok';
end; $fn$;
grant execute on function public.er_meydani_rumuz_ayarla(text) to authenticated;

-- ── SONUÇ KAYDET (RPC) — maçı yazar + haftalık puanı SUNUCUDA verir (anti-hile/anti-farm) ──
create or replace function public.er_meydani_sonuc_kaydet(
  p_mod text, p_seed bigint, p_havuz text,
  p_benim_puan integer, p_rakip_puan integer,
  p_golge boolean, p_rakip_id uuid, p_rakip_rumuz text
) returns json language plpgsql security definer set search_path = public as $fn$
declare
  v_uid uuid := auth.uid();
  v_hafta text := public.er_meydani_hafta();
  v_puan integer := greatest(0, least(coalesce(p_benim_puan,0), 2000)); -- makullük [0,2000]
  v_gun_bas timestamptz := (date_trunc('day', now() at time zone 'Europe/Istanbul') at time zone 'Europe/Istanbul');
  v_bugun_ayni integer;
  v_verilen integer;
  v_toplam integer;
begin
  if v_uid is null then return json_build_object('hata','oturum yok'); end if;

  -- Bu oyuncunun BUGÜN aynı rakiple (veya gölgeyle) oynadığı maç sayısı (anti-farm)
  select count(*) into v_bugun_ayni from public.er_meydani_mac m
    where m.oyuncu_id = v_uid and m.created_at >= v_gun_bas
      and ( (p_rakip_id is not null and m.rakip_id = p_rakip_id)
            or (p_rakip_id is null and m.rakip_id is null) );

  -- Anti-farm: aynı rakipten günde ilk 3 maç puanlar; gölge/rastgeleden ilk 10; üstü 0.
  v_verilen := v_puan;
  if p_rakip_id is not null and v_bugun_ayni >= 3 then v_verilen := 0; end if;
  if p_rakip_id is null and v_bugun_ayni >= 10 then v_verilen := 0; end if;

  insert into public.er_meydani_mac
    (oyuncu_id, mod, golge, rakip_id, rakip_rumuz, seed, havuz, benim_puan, rakip_puan, kazandim, hafta)
  values
    (v_uid, coalesce(p_mod,'hizli'), coalesce(p_golge,false), p_rakip_id, p_rakip_rumuz,
     p_seed, coalesce(p_havuz,'ucretsiz'), v_puan, greatest(0,least(coalesce(p_rakip_puan,0),2000)),
     v_puan > coalesce(p_rakip_puan,0), v_hafta);

  insert into public.er_meydani_haftalik_puan (oyuncu_id, hafta, puan, mac_sayisi, guncelleme)
    values (v_uid, v_hafta, v_verilen, 1, now())
  on conflict (oyuncu_id, hafta) do update
    set puan = public.er_meydani_haftalik_puan.puan + v_verilen,
        mac_sayisi = public.er_meydani_haftalik_puan.mac_sayisi + 1,
        guncelleme = now();

  select puan into v_toplam from public.er_meydani_haftalik_puan where oyuncu_id = v_uid and hafta = v_hafta;
  return json_build_object('verilen', v_verilen, 'haftalik_toplam', v_toplam, 'kazandim', v_puan > coalesce(p_rakip_puan,0));
end; $fn$;
grant execute on function public.er_meydani_sonuc_kaydet(text,bigint,text,integer,integer,boolean,uuid,text) to authenticated;

-- ── LİDERLİK (RPC) — bu haftanın ilk N'i (rumuz + puan + sıra); user_id sızmaz ──
create or replace function public.er_meydani_liderlik(p_limit integer default 20)
  returns table(sira integer, rumuz text, puan integer, mac_sayisi integer, ben boolean)
  language sql security definer set search_path = public as $fn$
  select row_number() over (order by h.puan desc, h.guncelleme asc)::int as sira,
         coalesce(p.rumuz, 'Anonim Er') as rumuz, h.puan, h.mac_sayisi,
         (h.oyuncu_id = auth.uid()) as ben
  from public.er_meydani_haftalik_puan h
  join public.profiles p on p.id = h.oyuncu_id
  where h.hafta = public.er_meydani_hafta() and h.puan > 0
  order by h.puan desc, h.guncelleme asc
  limit greatest(1, least(coalesce(p_limit,20), 100));
$fn$;
grant execute on function public.er_meydani_liderlik(integer) to authenticated;

-- ── SIRAM (RPC) — çağıranın bu haftaki sırası + puanı ──
create or replace function public.er_meydani_siram()
  returns table(sira integer, puan integer, mac_sayisi integer)
  language sql security definer set search_path = public as $fn$
  with sirali as (
    select oyuncu_id, puan, mac_sayisi,
           row_number() over (order by puan desc, guncelleme asc)::int as sira
    from public.er_meydani_haftalik_puan where hafta = public.er_meydani_hafta() and puan > 0
  )
  select sira, puan, mac_sayisi from sirali where oyuncu_id = auth.uid();
$fn$;
grant execute on function public.er_meydani_siram() to authenticated;

-- ── GEÇEN HAFTA ŞAMPİYONU (RPC) — onur köşesi ──
create or replace function public.er_meydani_gecen_hafta_sampiyon()
  returns table(rumuz text, puan integer)
  language sql security definer set search_path = public as $fn$
  select coalesce(p.rumuz,'Anonim Er') as rumuz, h.puan
  from public.er_meydani_haftalik_puan h
  join public.profiles p on p.id = h.oyuncu_id
  where h.hafta = public.er_meydani_hafta(now() - interval '7 days') and h.puan > 0
  order by h.puan desc, h.guncelleme asc
  limit 1;
$fn$;
grant execute on function public.er_meydani_gecen_hafta_sampiyon() to authenticated;
