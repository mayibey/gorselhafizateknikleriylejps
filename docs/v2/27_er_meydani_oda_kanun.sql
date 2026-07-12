-- 27: ER MEYDANI oda KONU (kanun) seçimi — kuran soruların hangi kanunlardan geleceğini seçer.
-- Boş kanunlar = karışık (tüm banka). Seçilenler → maçta yalnız o kanunlardan soru.
-- Çalıştır: Supabase SQL Editor → RUN. Idempotent.

alter table public.er_meydani_oda add column if not exists kanunlar integer[] not null default '{}';

-- ODA KUR — artık kanun seçimi de alır (boş = karışık).
drop function if exists public.er_meydani_oda_kur(integer, integer);
create or replace function public.er_meydani_oda_kur(p_soru_sayisi integer, p_sure_sn integer, p_kanunlar integer[])
  returns json language plpgsql security definer set search_path = public as $fn$
declare
  v_uid uuid := auth.uid();
  v_kod text; v_seed bigint; v_id uuid; v_i integer := 0; v_kanun integer[];
begin
  if v_uid is null then return json_build_object('hata', 'oturum yok'); end if;
  if p_soru_sayisi not in (5,10,15,20) or p_sure_sn not in (10,15,20,30) then
    return json_build_object('hata', 'geçersiz ayar');
  end if;
  -- Kanunları temizle (yalnız 1..25, tekilleştir); boş → karışık
  select coalesce(array_agg(distinct k), '{}') into v_kanun
    from unnest(coalesce(p_kanunlar, '{}'::integer[])) k where k between 1 and 25;
  update public.er_meydani_oda set durum = 'kapandi' where kuran_id = v_uid and durum = 'acik';
  loop
    v_i := v_i + 1;
    v_kod := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    exit when not exists (select 1 from public.er_meydani_oda o where o.kod = v_kod);
    if v_i > 8 then return json_build_object('hata', 'kod üretilemedi'); end if;
  end loop;
  v_seed := (random() * 2147483647)::bigint + 1;
  insert into public.er_meydani_oda (kod, kuran_id, soru_sayisi, sure_sn, seed, kanunlar)
    values (v_kod, v_uid, p_soru_sayisi, p_sure_sn, v_seed, v_kanun)
    returning id into v_id;
  return json_build_object('id', v_id, 'kod', v_kod, 'seed', v_seed,
    'soru_sayisi', p_soru_sayisi, 'sure_sn', p_sure_sn, 'kanunlar', v_kanun);
end; $fn$;
grant execute on function public.er_meydani_oda_kur(integer, integer, integer[]) to authenticated;

-- AÇIK ODALAR — kanunlar da döner.
drop function if exists public.er_meydani_acik_odalar(integer);
create or replace function public.er_meydani_acik_odalar(p_limit integer default 30)
  returns table(id uuid, kod text, kuran_rumuz text, soru_sayisi integer, sure_sn integer,
                kanunlar integer[], created_at timestamptz, benimki boolean)
  language sql security definer set search_path = public as $fn$
  select o.id, o.kod, coalesce(p.rumuz, 'Anonim Er') as kuran_rumuz,
         o.soru_sayisi, o.sure_sn, o.kanunlar, o.created_at, (o.kuran_id = auth.uid()) as benimki
  from public.er_meydani_oda o
  join public.profiles p on p.id = o.kuran_id
  where o.durum = 'acik'
    and o.created_at > now() - interval '1 hour'
    and not exists (select 1 from public.er_meydani_engel e
                    where (e.engelleyen = auth.uid() and e.engellenen = o.kuran_id)
                       or (e.engelleyen = o.kuran_id and e.engellenen = auth.uid()))
  order by o.created_at desc
  limit greatest(1, least(coalesce(p_limit, 30), 100));
$fn$;
grant execute on function public.er_meydani_acik_odalar(integer) to authenticated;

-- ODAYA KATIL — kanunlar da döner.
create or replace function public.er_meydani_odaya_katil(p_oda_id uuid, p_kod text)
  returns json language plpgsql security definer set search_path = public as $fn$
declare o public.er_meydani_oda; v_rumuz text;
begin
  if auth.uid() is null then return json_build_object('hata', 'oturum yok'); end if;
  select * into o from public.er_meydani_oda
    where (p_oda_id is not null and id = p_oda_id)
       or (p_kod is not null and kod = upper(btrim(p_kod)))
    limit 1;
  if o.id is null then return json_build_object('hata', 'oda bulunamadı'); end if;
  if o.durum <> 'acik' then return json_build_object('hata', 'oda kapandı'); end if;
  select rumuz into v_rumuz from public.profiles where id = o.kuran_id;
  return json_build_object('seed', o.seed, 'soru_sayisi', o.soru_sayisi, 'sure_sn', o.sure_sn,
    'kanunlar', o.kanunlar, 'havuz', o.havuz, 'kuran_id', o.kuran_id,
    'kuran_rumuz', coalesce(v_rumuz, 'Anonim Er'));
end; $fn$;
grant execute on function public.er_meydani_odaya_katil(uuid, text) to authenticated;
