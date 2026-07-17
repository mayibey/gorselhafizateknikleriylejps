-- ANTI-FARM (denetim #4): p_rakip_rating istemciden geliyordu → uydurma yüksek rating ile her
-- çağrıda ~+32. Rakip rating'i eşleşme aralığına (±400) KIRP → meşru maçlar (zaten yakın rating)
-- etkilenmez; uydurma "3000 rakip" sömürüsü engellenir. (Skor değeri güveni ayrı konu — sunucu-
-- taraflı puanlama gelene kadar kabul-risk; haftalık liderlik kendi 30/gün capine sahip.)
CREATE OR REPLACE FUNCTION public.er_meydani_lig_sonuc(p_seed bigint, p_benim_skor integer, p_rakip_skor integer, p_rakip_rating integer, p_rakip_id uuid)
 RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
declare
  v_uid uuid := auth.uid(); l public.er_meydani_lig;
  v_my int; v_skor int; v_e float; v_s float; v_delta int; v_yeni int; v_son uuid[]; v_rr int;
begin
  if v_uid is null then return json_build_object('hata', 'oturum yok'); end if;
  perform public.er_meydani_lig_hazirla(v_uid);
  select * into l from public.er_meydani_lig where user_id = v_uid;
  v_my := l.puan;
  v_skor := greatest(0, least(2000, coalesce(p_benim_skor, 0)));
  -- rakip rating'i kendi rating'imin ±400'üne kırp (anti-farm).
  v_rr := least(v_my + 400, greatest(v_my - 400, coalesce(p_rakip_rating, v_my)));
  v_s := case when v_skor > coalesce(p_rakip_skor,0) then 1.0
              when v_skor < coalesce(p_rakip_skor,0) then 0.0 else 0.5 end;
  v_e := 1.0 / (1.0 + power(10, (v_rr - v_my) / 400.0));
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
  delete from public.er_meydani_lig_kayit k where k.user_id = v_uid and k.id not in (
    select id from public.er_meydani_lig_kayit where user_id = v_uid order by created_at desc limit 20);
  perform public._er_meydani_haftalik_ekle(v_uid, v_skor, 'lig', coalesce(p_rakip_skor,0));
  return json_build_object('delta', v_delta, 'rating', v_yeni, 'kademe', public.er_meydani_lig_kademe(v_yeni),
    'galip_mu', v_s = 1.0, 'berabere', v_s = 0.5);
end; $function$;
