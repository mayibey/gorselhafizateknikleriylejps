-- 40: ER MEYDANI ODA — (1) odadan ATMA (kick, sadece kuran), (2) HERKESE AÇIK/ŞİFRELİ oda
-- (gizli oda açık listede görünmez, sadece kodla girilir; davet kodu = şifre), (3) oyuncu KİMLİĞİ
-- (kick için client hedef id bilsin).
-- GERİYE UYUM: oda_kur p_gizli DEFAULT'lu (eski app 3 argümanla çağırsa da çalışır); eski 3-argümanlı
-- sürüm DROP edilir ki tek fonksiyon kalsın (aksi halde PostgREST 3-arg çağrısında AMBIGUOUS verir).
-- Çalıştır: Supabase SQL Editor → RUN. Idempotent.

-- 1) Gizli (şifreli) oda kolonu.
alter table public.er_meydani_oda add column if not exists gizli boolean not null default false;

-- 2) oyuncular_json → user_id ('id') eklendi (kick hedefi). Eski app fazladan 'id'yi yok sayar.
create or replace function public.er_meydani_oyuncular_json(p_oda uuid, p_uid uuid) returns json
  language sql stable set search_path = public as $fn$
  select coalesce(json_agg(json_build_object('id', user_id, 'rumuz', rumuz, 'skor', skor, 'ben', user_id = p_uid)
           order by (skor is null), skor desc, katildi_at), '[]'::json)
  from public.er_meydani_oda_oyuncu where oda_id = p_oda;
$fn$;

-- 3) ODADAN AT — yalnız kuran, kendisi hariç bir oyuncuyu çıkarır (oda 'acik' iken).
create or replace function public.er_meydani_oda_at(p_oda_id uuid, p_hedef_id uuid)
  returns json language plpgsql security definer set search_path = public as $fn$
declare o public.er_meydani_oda; v_uid uuid := auth.uid();
begin
  if v_uid is null then return json_build_object('hata','oturum yok'); end if;
  select * into o from public.er_meydani_oda where id = p_oda_id;
  if o.id is null then return json_build_object('hata','oda bulunamadı'); end if;
  if o.kuran_id <> v_uid then return json_build_object('hata','yetki yok'); end if;
  if p_hedef_id = v_uid then return json_build_object('hata','kendini atamazsın'); end if;
  if o.durum <> 'acik' then return json_build_object('hata','oda başladı'); end if;
  delete from public.er_meydani_oda_oyuncu where oda_id = p_oda_id and user_id = p_hedef_id;
  return json_build_object('durum','atildi', 'oyuncular', public.er_meydani_oyuncular_json(p_oda_id, v_uid));
end; $fn$;
grant execute on function public.er_meydani_oda_at(uuid, uuid) to authenticated;

-- 4) ODA KUR — p_gizli DEFAULT false. (Eski 3-argümanlı sürümü düşür → tek fonksiyon, ambiguity yok.)
drop function if exists public.er_meydani_oda_kur(integer, integer, integer[]);
create or replace function public.er_meydani_oda_kur(
  p_soru_sayisi integer, p_sure_sn integer, p_kanunlar integer[], p_gizli boolean default false)
  returns json language plpgsql security definer set search_path = public as $fn$
declare v_uid uuid := auth.uid(); v_kod text; v_seed bigint; v_id uuid; v_i integer := 0; v_kanun integer[]; v_rumuz text;
begin
  if v_uid is null then return json_build_object('hata', 'oturum yok'); end if;
  if p_soru_sayisi not in (5,10,15,20) or p_sure_sn not in (10,15,20,30) then
    return json_build_object('hata', 'geçersiz ayar');
  end if;
  select coalesce(array_agg(distinct k), '{}') into v_kanun
    from unnest(coalesce(p_kanunlar, '{}'::integer[])) k where k between 1 and 25;
  perform public._er_meydani_oda_temizle(v_uid, null);  -- TEK-ODA: eski odalardan çık + kurduklarını kapat
  loop
    v_i := v_i + 1;
    v_kod := lpad((floor(random() * 10000))::int::text, 4, '0');
    exit when not exists (select 1 from public.er_meydani_oda o where o.kod = v_kod and o.durum in ('acik','oynaniyor'));
    if v_i > 30 then return json_build_object('hata', 'kod üretilemedi'); end if;
  end loop;
  v_seed := (random() * 2147483647)::bigint + 1;
  insert into public.er_meydani_oda (kod, kuran_id, soru_sayisi, sure_sn, seed, kanunlar, gizli)
    values (v_kod, v_uid, p_soru_sayisi, p_sure_sn, v_seed, v_kanun, coalesce(p_gizli, false)) returning id into v_id;
  select rumuz into v_rumuz from public.profiles where id = v_uid;
  insert into public.er_meydani_oda_oyuncu (oda_id, user_id, rumuz)
    values (v_id, v_uid, coalesce(v_rumuz, 'Anonim Er')) on conflict do nothing;
  return json_build_object('id', v_id, 'kod', v_kod, 'seed', v_seed,
    'soru_sayisi', p_soru_sayisi, 'sure_sn', p_sure_sn, 'kanunlar', v_kanun, 'gizli', coalesce(p_gizli, false));
end; $fn$;
grant execute on function public.er_meydani_oda_kur(integer, integer, integer[], boolean) to authenticated;

-- 5) AÇIK ODALAR — gizli (şifreli) odalar listede GÖRÜNMEZ (sadece kodla girilir).
create or replace function public.er_meydani_acik_odalar(p_limit integer default 30)
  returns table(id uuid, kod text, kuran_rumuz text, soru_sayisi integer, sure_sn integer,
                kanunlar integer[], created_at timestamptz, benimki boolean)
  language sql security definer set search_path = public as $fn$
  select o.id, o.kod, coalesce(p.rumuz, 'Anonim Er') as kuran_rumuz,
         o.soru_sayisi, o.sure_sn, o.kanunlar, o.created_at, (o.kuran_id = auth.uid()) as benimki
  from public.er_meydani_oda o
  join public.profiles p on p.id = o.kuran_id
  where o.durum = 'acik'
    and not coalesce(o.gizli, false)                       -- ŞİFRELİ ODALAR GİZLİ
    and o.created_at > now() - interval '1 hour'
    and not exists (select 1 from public.er_meydani_engel e
                    where (e.engelleyen = auth.uid() and e.engellenen = o.kuran_id)
                       or (e.engelleyen = o.kuran_id and e.engellenen = auth.uid()))
  order by o.created_at desc
  limit greatest(1, least(coalesce(p_limit, 30), 100));
$fn$;
grant execute on function public.er_meydani_acik_odalar(integer) to authenticated;
