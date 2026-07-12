-- 34: HAFTALIK PUAN tüm modlardan (başkan: oda + dereceli maçlar da sayılsın).
-- Şu an sadece Hızlı Eşleş (sonuc_kaydet) haftalık puan veriyordu → arkadaşlar sıralamada çıkmıyordu.
-- Ortak helper (anti-farm: günlük global 30 maç tavanı, er_meydani_mac üzerinden).

create or replace function public._er_meydani_haftalik_ekle(p_uid uuid, p_puan int, p_mod text, p_rakip_puan int)
returns void language plpgsql security definer set search_path to 'public' as $$
declare
  v_hafta text := public.er_meydani_hafta();
  v_gun_bas timestamptz := (date_trunc('day', now() at time zone 'Europe/Istanbul') at time zone 'Europe/Istanbul');
  v_puan int := greatest(0, least(2000, coalesce(p_puan,0)));
  v_rp int := greatest(0, least(2000, coalesce(p_rakip_puan,0)));
  v_bugun int; v_verilen int;
begin
  if p_uid is null then return; end if;
  select count(*) into v_bugun from public.er_meydani_mac where oyuncu_id = p_uid and created_at >= v_gun_bas;
  v_verilen := case when v_bugun >= 30 then 0 else v_puan end;  -- günlük tavan aşıldıysa sıralamaya sayma
  insert into public.er_meydani_mac
    (oyuncu_id, mod, golge, rakip_id, rakip_rumuz, seed, havuz, benim_puan, rakip_puan, kazandim, hafta)
    values (p_uid, coalesce(p_mod,'oda'), false, null, '', 0, 'ucretsiz', v_puan, v_rp, v_puan > v_rp, v_hafta);
  insert into public.er_meydani_haftalik_puan (oyuncu_id, hafta, puan, mac_sayisi, guncelleme)
    values (p_uid, v_hafta, v_verilen, 1, now())
  on conflict (oyuncu_id, hafta) do update
    set puan = public.er_meydani_haftalik_puan.puan + v_verilen,
        mac_sayisi = public.er_meydani_haftalik_puan.mac_sayisi + 1, guncelleme = now();
end; $$;

-- ODA skoru: ilk skorda haftalık puana ekle.
create or replace function public.er_meydani_oda_skor(p_oda_id uuid, p_skor integer)
returns json language plpgsql security definer set search_path to 'public' as $$
declare o public.er_meydani_oda; v_uid uuid := auth.uid(); v_skor integer := greatest(0, least(2000, coalesce(p_skor,0)));
  v_kalan integer; v_ilk boolean;
begin
  if v_uid is null then return json_build_object('hata', 'oturum yok'); end if;
  select (skor is null) into v_ilk from public.er_meydani_oda_oyuncu where oda_id = p_oda_id and user_id = v_uid;
  if v_ilk is null then return json_build_object('hata', 'bu odada değilsin'); end if;
  update public.er_meydani_oda_oyuncu set skor = v_skor where oda_id = p_oda_id and user_id = v_uid;
  if v_ilk then perform public._er_meydani_haftalik_ekle(v_uid, v_skor, 'oda', 0); end if;
  select count(*) into v_kalan from public.er_meydani_oda_oyuncu where oda_id = p_oda_id and skor is null;
  if v_kalan = 0 then update public.er_meydani_oda set durum = 'bitti' where id = p_oda_id and durum <> 'bitti'; end if;
  select * into o from public.er_meydani_oda where id = p_oda_id;
  return json_build_object('durum', o.durum, 'oyuncular', public.er_meydani_oyuncular_json(p_oda_id, v_uid));
end; $$;

-- DERECELİ (lig) sonucu: ELO + haftalık puana ekle.
create or replace function public.er_meydani_lig_sonuc(p_seed bigint, p_benim_skor integer, p_rakip_skor integer, p_rakip_rating integer, p_rakip_id uuid)
returns json language plpgsql security definer set search_path to 'public' as $$
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
  delete from public.er_meydani_lig_kayit k where k.user_id = v_uid and k.id not in (
    select id from public.er_meydani_lig_kayit where user_id = v_uid order by created_at desc limit 20);
  perform public._er_meydani_haftalik_ekle(v_uid, v_skor, 'lig', coalesce(p_rakip_skor,0));
  return json_build_object('delta', v_delta, 'rating', v_yeni, 'kademe', public.er_meydani_lig_kademe(v_yeni),
    'galip_mu', v_s = 1.0, 'berabere', v_s = 0.5);
end; $$;
