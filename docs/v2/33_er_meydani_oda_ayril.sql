-- 33: ODA ÜYELİĞİ — tek-oda kuralı + ayrıl (başkan: "çıkınca düş, 1 kişi aynı anda 1 oda").
-- Sorun: ayrıl RPC'si yoktu → çıkınca üyelik silinmiyordu (hayalet oyuncu); katıl başka
-- odalardan çıkarmıyordu → aynı anda çok odada görünme; maç başlayınca hayalet "bekleniyor".

-- Yardımcı: kullanıcıyı TÜM odalardan çıkar (p_keep hariç) + kurduğu AÇIK odaları kapat.
create or replace function public._er_meydani_oda_temizle(p_uid uuid, p_keep uuid)
returns void language plpgsql security definer set search_path to 'public' as $$
begin
  delete from public.er_meydani_oda_oyuncu
    where user_id = p_uid and (p_keep is null or oda_id <> p_keep);
  update public.er_meydani_oda set durum = 'kapandi'
    where kuran_id = p_uid and durum = 'acik' and (p_keep is null or id <> p_keep);
end; $$;

-- Ayrıl: çağıranı odadan çıkar; kuran ise ve oda hâlâ 'acik' ise odayı kapat (kuransız kalmasın).
create or replace function public.er_meydani_oda_ayril(p_oda_id uuid)
returns json language plpgsql security definer set search_path to 'public' as $$
declare o public.er_meydani_oda; v_uid uuid := auth.uid();
begin
  if v_uid is null then return json_build_object('hata','oturum yok'); end if;
  select * into o from public.er_meydani_oda where id = p_oda_id;
  delete from public.er_meydani_oda_oyuncu where oda_id = p_oda_id and user_id = v_uid;
  if o.id is not null and o.kuran_id = v_uid and o.durum = 'acik' then
    update public.er_meydani_oda set durum = 'kapandi' where id = p_oda_id and durum = 'acik';
  end if;
  return json_build_object('durum','ayrildi');
end; $$;

-- KATIL: tek-oda temizliği eklendi (bu odaya girmeden önce diğerlerinden çık).
create or replace function public.er_meydani_odaya_katil(p_oda_id uuid, p_kod text)
returns json language plpgsql security definer set search_path to 'public' as $$
declare o public.er_meydani_oda; v_uid uuid := auth.uid(); v_rumuz text; v_sayi integer; v_kuran_rumuz text;
begin
  if v_uid is null then return json_build_object('hata', 'oturum yok'); end if;
  select * into o from public.er_meydani_oda
    where (p_oda_id is not null and id = p_oda_id)
       or (p_kod is not null and kod = btrim(p_kod) and durum in ('acik','oynaniyor'))
    order by created_at desc limit 1;
  if o.id is null then return json_build_object('hata', 'oda bulunamadı'); end if;
  if o.kuran_id = v_uid then return json_build_object('hata', 'kendi odan'); end if;
  if o.durum not in ('acik','oynaniyor') then return json_build_object('hata', 'oda kapandı'); end if;
  select count(*) into v_sayi from public.er_meydani_oda_oyuncu where oda_id = o.id;
  if v_sayi >= o.max_oyuncu and not exists (select 1 from public.er_meydani_oda_oyuncu where oda_id=o.id and user_id=v_uid)
    then return json_build_object('hata', 'oda dolu'); end if;
  perform public._er_meydani_oda_temizle(v_uid, o.id);  -- TEK-ODA: diğer odalardan çık
  select rumuz into v_rumuz from public.profiles where id = v_uid;
  insert into public.er_meydani_oda_oyuncu (oda_id, user_id, rumuz)
    values (o.id, v_uid, coalesce(v_rumuz,'Anonim Er')) on conflict do nothing;
  select rumuz into v_kuran_rumuz from public.profiles where id = o.kuran_id;
  return json_build_object('oda_id', o.id, 'seed', o.seed, 'soru_sayisi', o.soru_sayisi,
    'sure_sn', o.sure_sn, 'kanunlar', o.kanunlar, 'kuran_rumuz', coalesce(v_kuran_rumuz,'Anonim Er'));
end; $$;

-- KUR: tek-oda temizliği (katıldığı odalardan da çık, sadece kurduklarını değil).
create or replace function public.er_meydani_oda_kur(p_soru_sayisi integer, p_sure_sn integer, p_kanunlar integer[])
returns json language plpgsql security definer set search_path to 'public' as $$
declare v_uid uuid := auth.uid(); v_kod text; v_seed bigint; v_id uuid; v_i integer := 0; v_kanun integer[]; v_rumuz text;
begin
  if v_uid is null then return json_build_object('hata', 'oturum yok'); end if;
  if p_soru_sayisi not in (5,10,15,20) or p_sure_sn not in (10,15,20,30) then
    return json_build_object('hata', 'geçersiz ayar');
  end if;
  select coalesce(array_agg(distinct k), '{}') into v_kanun
    from unnest(coalesce(p_kanunlar, '{}'::integer[])) k where k between 1 and 25;
  perform public._er_meydani_oda_temizle(v_uid, null);  -- TEK-ODA: tüm eski odalardan çık + kurduklarını kapat
  loop
    v_i := v_i + 1;
    v_kod := lpad((floor(random() * 10000))::int::text, 4, '0');
    exit when not exists (select 1 from public.er_meydani_oda o where o.kod = v_kod and o.durum in ('acik','oynaniyor'));
    if v_i > 30 then return json_build_object('hata', 'kod üretilemedi'); end if;
  end loop;
  v_seed := (random() * 2147483647)::bigint + 1;
  insert into public.er_meydani_oda (kod, kuran_id, soru_sayisi, sure_sn, seed, kanunlar)
    values (v_kod, v_uid, p_soru_sayisi, p_sure_sn, v_seed, v_kanun) returning id into v_id;
  select rumuz into v_rumuz from public.profiles where id = v_uid;
  insert into public.er_meydani_oda_oyuncu (oda_id, user_id, rumuz)
    values (v_id, v_uid, coalesce(v_rumuz, 'Anonim Er')) on conflict do nothing;
  return json_build_object('id', v_id, 'kod', v_kod, 'seed', v_seed,
    'soru_sayisi', p_soru_sayisi, 'sure_sn', p_sure_sn, 'kanunlar', v_kanun);
end; $$;

grant execute on function public.er_meydani_oda_ayril(uuid) to authenticated;
