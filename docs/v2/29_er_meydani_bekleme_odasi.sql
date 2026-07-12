-- 29: ER MEYDANI BEKLEME ODASI — Oda Kur artık bota atmaz; GERÇEK rakip bekler.
-- Durum makinesi: 'acik' (rakip bekleniyor) → 'oynaniyor' (rakip katıldı) → 'bitti' (ikisi de skorladı).
-- İki oyuncu aynı soruları oynar (aynı seed), skorlar karşılaştırılır. Bot YOK.
-- Çalıştır: Supabase SQL Editor → RUN. Idempotent.

alter table public.er_meydani_oda add column if not exists rakip_id uuid references auth.users(id) on delete set null;
alter table public.er_meydani_oda add column if not exists rakip_rumuz text;
alter table public.er_meydani_oda add column if not exists kuran_skor integer;
alter table public.er_meydani_oda add column if not exists rakip_skor integer;

-- ODAYA KATIL (yeniden) — rakip olarak ODAYI KAPAR (durum 'oynaniyor') + seed/ayar döner.
create or replace function public.er_meydani_odaya_katil(p_oda_id uuid, p_kod text)
  returns json language plpgsql security definer set search_path = public as $fn$
declare o public.er_meydani_oda; v_uid uuid := auth.uid(); v_rumuz text; v_kuran_rumuz text;
begin
  if v_uid is null then return json_build_object('hata', 'oturum yok'); end if;
  select * into o from public.er_meydani_oda
    where (p_oda_id is not null and id = p_oda_id)
       or (p_kod is not null and kod = upper(btrim(p_kod)))
    limit 1;
  if o.id is null then return json_build_object('hata', 'oda bulunamadı'); end if;
  if o.kuran_id = v_uid then return json_build_object('hata', 'kendi odana katılamazsın'); end if;
  if o.durum = 'kapandi' then return json_build_object('hata', 'oda kapandı'); end if;
  if o.rakip_id is not null and o.rakip_id <> v_uid then return json_build_object('hata', 'oda dolu'); end if;

  select rumuz into v_rumuz from public.profiles where id = v_uid;
  select rumuz into v_kuran_rumuz from public.profiles where id = o.kuran_id;
  -- Odayı kap (ilk katılan rakip): rakip_id + durum 'oynaniyor'
  update public.er_meydani_oda
    set rakip_id = v_uid, rakip_rumuz = coalesce(v_rumuz, 'Anonim Er'), durum = 'oynaniyor'
    where id = o.id and (rakip_id is null or rakip_id = v_uid);

  return json_build_object('oda_id', o.id, 'seed', o.seed, 'soru_sayisi', o.soru_sayisi,
    'sure_sn', o.sure_sn, 'kanunlar', o.kanunlar, 'kuran_rumuz', coalesce(v_kuran_rumuz, 'Anonim Er'), 'rol', 'rakip');
end; $fn$;
grant execute on function public.er_meydani_odaya_katil(uuid, text) to authenticated;

-- ODA DURUM — bekleme odası + maç sonu için poll (kuran/rakip skorları, roller).
create or replace function public.er_meydani_oda_durum(p_oda_id uuid)
  returns json language plpgsql security definer set search_path = public as $fn$
declare o public.er_meydani_oda; v_uid uuid := auth.uid(); v_rol text;
begin
  if v_uid is null then return json_build_object('hata', 'oturum yok'); end if;
  select * into o from public.er_meydani_oda where id = p_oda_id;
  if o.id is null then return json_build_object('hata', 'oda bulunamadı'); end if;
  v_rol := case when o.kuran_id = v_uid then 'kuran' when o.rakip_id = v_uid then 'rakip' else 'yok' end;
  return json_build_object('durum', o.durum, 'kuran_rumuz',
    (select coalesce(rumuz,'Anonim Er') from public.profiles where id = o.kuran_id),
    'rakip_rumuz', o.rakip_rumuz, 'seed', o.seed, 'soru_sayisi', o.soru_sayisi, 'sure_sn', o.sure_sn,
    'kanunlar', o.kanunlar, 'kuran_skor', o.kuran_skor, 'rakip_skor', o.rakip_skor, 'rol', v_rol);
end; $fn$;
grant execute on function public.er_meydani_oda_durum(uuid) to authenticated;

-- ODA SKOR — maç sonu kendi skorunu yaz (rol'e göre). İkisi de girince durum 'bitti'.
create or replace function public.er_meydani_oda_skor(p_oda_id uuid, p_skor integer)
  returns json language plpgsql security definer set search_path = public as $fn$
declare o public.er_meydani_oda; v_uid uuid := auth.uid(); v_skor integer := greatest(0, least(2000, coalesce(p_skor,0)));
begin
  if v_uid is null then return json_build_object('hata', 'oturum yok'); end if;
  select * into o from public.er_meydani_oda where id = p_oda_id;
  if o.id is null then return json_build_object('hata', 'oda bulunamadı'); end if;
  if o.kuran_id = v_uid then
    update public.er_meydani_oda set kuran_skor = v_skor where id = o.id;
  elsif o.rakip_id = v_uid then
    update public.er_meydani_oda set rakip_skor = v_skor where id = o.id;
  else
    return json_build_object('hata', 'bu odada değilsin');
  end if;
  -- İkisi de skorladıysa bitti
  update public.er_meydani_oda set durum = 'bitti'
    where id = o.id and kuran_skor is not null and rakip_skor is not null and durum <> 'bitti';
  select * into o from public.er_meydani_oda where id = p_oda_id;
  return json_build_object('durum', o.durum, 'kuran_skor', o.kuran_skor, 'rakip_skor', o.rakip_skor);
end; $fn$;
grant execute on function public.er_meydani_oda_skor(uuid, integer) to authenticated;

-- ODA İPTAL — kuran, rakip gelmeden odayı kapatır.
create or replace function public.er_meydani_oda_iptal(p_oda_id uuid)
  returns text language plpgsql security definer set search_path = public as $fn$
begin
  if auth.uid() is null then return 'hata: oturum yok'; end if;
  update public.er_meydani_oda set durum = 'kapandi'
    where id = p_oda_id and kuran_id = auth.uid() and durum = 'acik';
  return 'ok';
end; $fn$;
grant execute on function public.er_meydani_oda_iptal(uuid) to authenticated;
