-- 31: ER MEYDANI ÇOK-OYUNCULU ODA (5 kişiye kadar) — oda artık 2 kişilik değil.
-- Katılımcı tablosu (er_meydani_oda_oyuncu) + oda-içi sıralama. Kuran "Başlat"a basınca herkes oynar.
-- durum: 'acik'(oyuncu kabul) → 'oynaniyor'(başladı) → 'bitti'(herkes skorladı). Kapak: 5 oyuncu.
-- Çalıştır: Supabase SQL Editor → RUN. Idempotent.

alter table public.er_meydani_oda add column if not exists max_oyuncu integer not null default 5;

create table if not exists public.er_meydani_oda_oyuncu (
  oda_id     uuid not null references public.er_meydani_oda(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  rumuz      text not null default 'Anonim Er',
  skor       integer,
  katildi_at timestamptz not null default now(),
  primary key (oda_id, user_id)
);
alter table public.er_meydani_oda_oyuncu enable row level security;
-- İstemci doğrudan yazamaz; her şey RPC (definer). Okuma da RPC (oda_durum) ile.

-- Yardımcı: bir odanın katılımcı json'u (skora göre sıralı; sonuç sıralaması + bekleme listesi).
create or replace function public.er_meydani_oyuncular_json(p_oda uuid, p_uid uuid) returns json
  language sql stable set search_path = public as $fn$
  select coalesce(json_agg(json_build_object('rumuz', rumuz, 'skor', skor, 'ben', user_id = p_uid)
           order by (skor is null), skor desc, katildi_at), '[]'::json)
  from public.er_meydani_oda_oyuncu where oda_id = p_oda;
$fn$;

-- ODA KUR — oda + kuranı ilk oyuncu olarak ekler.
create or replace function public.er_meydani_oda_kur(p_soru_sayisi integer, p_sure_sn integer, p_kanunlar integer[])
  returns json language plpgsql security definer set search_path = public as $fn$
declare v_uid uuid := auth.uid(); v_kod text; v_seed bigint; v_id uuid; v_i integer := 0; v_kanun integer[]; v_rumuz text;
begin
  if v_uid is null then return json_build_object('hata', 'oturum yok'); end if;
  if p_soru_sayisi not in (5,10,15,20) or p_sure_sn not in (10,15,20,30) then
    return json_build_object('hata', 'geçersiz ayar');
  end if;
  select coalesce(array_agg(distinct k), '{}') into v_kanun
    from unnest(coalesce(p_kanunlar, '{}'::integer[])) k where k between 1 and 25;
  update public.er_meydani_oda set durum = 'kapandi' where kuran_id = v_uid and durum in ('acik','oynaniyor');
  loop
    v_i := v_i + 1;
    v_kod := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    exit when not exists (select 1 from public.er_meydani_oda o where o.kod = v_kod);
    if v_i > 8 then return json_build_object('hata', 'kod üretilemedi'); end if;
  end loop;
  v_seed := (random() * 2147483647)::bigint + 1;
  insert into public.er_meydani_oda (kod, kuran_id, soru_sayisi, sure_sn, seed, kanunlar)
    values (v_kod, v_uid, p_soru_sayisi, p_sure_sn, v_seed, v_kanun) returning id into v_id;
  select rumuz into v_rumuz from public.profiles where id = v_uid;
  insert into public.er_meydani_oda_oyuncu (oda_id, user_id, rumuz)
    values (v_id, v_uid, coalesce(v_rumuz, 'Anonim Er')) on conflict do nothing;
  return json_build_object('id', v_id, 'kod', v_kod, 'seed', v_seed,
    'soru_sayisi', p_soru_sayisi, 'sure_sn', p_sure_sn, 'kanunlar', v_kanun);
end; $fn$;
grant execute on function public.er_meydani_oda_kur(integer, integer, integer[]) to authenticated;

-- ÖNİZLE — katılmadan ayar/konu + oyuncu sayısı gör (kodla/listeden onay ekranı).
create or replace function public.er_meydani_oda_onizle(p_oda_id uuid, p_kod text)
  returns json language plpgsql security definer set search_path = public as $fn$
declare o public.er_meydani_oda; v_kuran_rumuz text; v_sayi integer;
begin
  if auth.uid() is null then return json_build_object('hata', 'oturum yok'); end if;
  select * into o from public.er_meydani_oda
    where (p_oda_id is not null and id = p_oda_id) or (p_kod is not null and kod = upper(btrim(p_kod))) limit 1;
  if o.id is null then return json_build_object('hata', 'oda bulunamadı'); end if;
  if o.durum = 'kapandi' or o.durum = 'bitti' then return json_build_object('hata', 'oda kapandı'); end if;
  if o.kuran_id = auth.uid() then return json_build_object('hata', 'kendi odan'); end if;
  select count(*) into v_sayi from public.er_meydani_oda_oyuncu where oda_id = o.id;
  if v_sayi >= o.max_oyuncu and not exists (select 1 from public.er_meydani_oda_oyuncu where oda_id=o.id and user_id=auth.uid())
    then return json_build_object('hata', 'oda dolu'); end if;
  select rumuz into v_kuran_rumuz from public.profiles where id = o.kuran_id;
  return json_build_object('oda_id', o.id, 'kod', o.kod, 'durum', o.durum, 'soru_sayisi', o.soru_sayisi,
    'sure_sn', o.sure_sn, 'kanunlar', o.kanunlar, 'kuran_rumuz', coalesce(v_kuran_rumuz,'Anonim Er'),
    'oyuncu_sayisi', v_sayi, 'max_oyuncu', o.max_oyuncu);
end; $fn$;
grant execute on function public.er_meydani_oda_onizle(uuid, text) to authenticated;

-- ODAYA KATIL — oyuncu olarak ekler (durum acik + dolu değil). Onaydan sonra çağrılır.
create or replace function public.er_meydani_odaya_katil(p_oda_id uuid, p_kod text)
  returns json language plpgsql security definer set search_path = public as $fn$
declare o public.er_meydani_oda; v_uid uuid := auth.uid(); v_rumuz text; v_sayi integer; v_kuran_rumuz text;
begin
  if v_uid is null then return json_build_object('hata', 'oturum yok'); end if;
  select * into o from public.er_meydani_oda
    where (p_oda_id is not null and id = p_oda_id) or (p_kod is not null and kod = upper(btrim(p_kod))) limit 1;
  if o.id is null then return json_build_object('hata', 'oda bulunamadı'); end if;
  if o.kuran_id = v_uid then return json_build_object('hata', 'kendi odan'); end if;
  if o.durum not in ('acik','oynaniyor') then return json_build_object('hata', 'oda kapandı'); end if;
  select count(*) into v_sayi from public.er_meydani_oda_oyuncu where oda_id = o.id;
  if v_sayi >= o.max_oyuncu and not exists (select 1 from public.er_meydani_oda_oyuncu where oda_id=o.id and user_id=v_uid)
    then return json_build_object('hata', 'oda dolu'); end if;
  select rumuz into v_rumuz from public.profiles where id = v_uid;
  insert into public.er_meydani_oda_oyuncu (oda_id, user_id, rumuz)
    values (o.id, v_uid, coalesce(v_rumuz,'Anonim Er')) on conflict do nothing;
  select rumuz into v_kuran_rumuz from public.profiles where id = o.kuran_id;
  return json_build_object('oda_id', o.id, 'seed', o.seed, 'soru_sayisi', o.soru_sayisi,
    'sure_sn', o.sure_sn, 'kanunlar', o.kanunlar, 'kuran_rumuz', coalesce(v_kuran_rumuz,'Anonim Er'));
end; $fn$;
grant execute on function public.er_meydani_odaya_katil(uuid, text) to authenticated;

-- ODA DURUM — bekleme odası (oyuncu listesi) + maç sonu (sıralama) için poll.
create or replace function public.er_meydani_oda_durum(p_oda_id uuid)
  returns json language plpgsql security definer set search_path = public as $fn$
declare o public.er_meydani_oda; v_uid uuid := auth.uid();
begin
  if v_uid is null then return json_build_object('hata', 'oturum yok'); end if;
  select * into o from public.er_meydani_oda where id = p_oda_id;
  if o.id is null then return json_build_object('hata', 'oda bulunamadı'); end if;
  return json_build_object('durum', o.durum, 'seed', o.seed, 'soru_sayisi', o.soru_sayisi,
    'sure_sn', o.sure_sn, 'kanunlar', o.kanunlar, 'kod', o.kod, 'max_oyuncu', o.max_oyuncu,
    'ben_kuran', (o.kuran_id = v_uid),
    'oyuncular', public.er_meydani_oyuncular_json(o.id, v_uid));
end; $fn$;
grant execute on function public.er_meydani_oda_durum(uuid) to authenticated;

-- ODA BAŞLAT — kuran, en az 2 oyuncuyla maçı başlatır (durum 'oynaniyor').
create or replace function public.er_meydani_oda_baslat(p_oda_id uuid)
  returns json language plpgsql security definer set search_path = public as $fn$
declare o public.er_meydani_oda; v_sayi integer;
begin
  if auth.uid() is null then return json_build_object('hata', 'oturum yok'); end if;
  select * into o from public.er_meydani_oda where id = p_oda_id;
  if o.id is null or o.kuran_id <> auth.uid() then return json_build_object('hata', 'yetki yok'); end if;
  if o.durum <> 'acik' then return json_build_object('durum', o.durum); end if;
  select count(*) into v_sayi from public.er_meydani_oda_oyuncu where oda_id = o.id;
  if v_sayi < 2 then return json_build_object('hata', 'en az 2 oyuncu gerek'); end if;
  update public.er_meydani_oda set durum = 'oynaniyor' where id = o.id and durum = 'acik';
  return json_build_object('durum', 'oynaniyor');
end; $fn$;
grant execute on function public.er_meydani_oda_baslat(uuid) to authenticated;

-- ODA SKOR — maç sonu kendi skorunu yaz. HERKES skorlayınca durum 'bitti'.
create or replace function public.er_meydani_oda_skor(p_oda_id uuid, p_skor integer)
  returns json language plpgsql security definer set search_path = public as $fn$
declare o public.er_meydani_oda; v_uid uuid := auth.uid(); v_skor integer := greatest(0, least(2000, coalesce(p_skor,0)));
  v_kalan integer;
begin
  if v_uid is null then return json_build_object('hata', 'oturum yok'); end if;
  update public.er_meydani_oda_oyuncu set skor = v_skor where oda_id = p_oda_id and user_id = v_uid;
  if not found then return json_build_object('hata', 'bu odada değilsin'); end if;
  select count(*) into v_kalan from public.er_meydani_oda_oyuncu where oda_id = p_oda_id and skor is null;
  if v_kalan = 0 then update public.er_meydani_oda set durum = 'bitti' where id = p_oda_id and durum <> 'bitti'; end if;
  select * into o from public.er_meydani_oda where id = p_oda_id;
  return json_build_object('durum', o.durum, 'oyuncular', public.er_meydani_oyuncular_json(p_oda_id, v_uid));
end; $fn$;
grant execute on function public.er_meydani_oda_skor(uuid, integer) to authenticated;

-- ODALARIM — kuranın aktif odaları (geri dönmek için). ODA İPTAL — kuran kapatır.
drop function if exists public.er_meydani_odalarim();
create or replace function public.er_meydani_odalarim()
  returns table(id uuid, kod text, durum text, soru_sayisi integer, sure_sn integer,
                kanunlar integer[], oyuncu_sayisi bigint, created_at timestamptz)
  language sql security definer set search_path = public as $fn$
  select o.id, o.kod, o.durum, o.soru_sayisi, o.sure_sn, o.kanunlar,
         (select count(*) from public.er_meydani_oda_oyuncu p where p.oda_id = o.id), o.created_at
  from public.er_meydani_oda o
  where o.kuran_id = auth.uid() and o.durum in ('acik','oynaniyor')
  order by o.created_at desc limit 10;
$fn$;
grant execute on function public.er_meydani_odalarim() to authenticated;

create or replace function public.er_meydani_oda_iptal(p_oda_id uuid)
  returns text language plpgsql security definer set search_path = public as $fn$
begin
  if auth.uid() is null then return 'hata: oturum yok'; end if;
  update public.er_meydani_oda set durum = 'kapandi'
    where id = p_oda_id and kuran_id = auth.uid() and durum = 'acik';
  return 'ok';
end; $fn$;
grant execute on function public.er_meydani_oda_iptal(uuid) to authenticated;
