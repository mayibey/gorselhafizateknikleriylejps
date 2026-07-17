-- ASYNC DERECELİ MAÇ (başkan kararı): sahte rakip YOK. Havuza kayıt kalıcı (45sn penceresi kalktı) —
-- biri gelince eşleşir + BEKLEYENE PUSH ("maça başla"). Hazır-kontrolü YOK; iki taraf bağımsız çözer;
-- iki skor gelince sonuç (mevcut skor RPC async zaten çözüyor). Devam eden eşleşmiş maç KORUNUR.
CREATE OR REPLACE FUNCTION public.er_meydani_dereceli_gir()
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $f$
declare
  v_uid uuid := auth.uid(); l public.er_meydani_lig; v_rumuz text;
  cur public.er_meydani_dereceli_kuyruk; w public.er_meydani_dereceli_kuyruk;
  v_mac uuid; v_seed bigint;
begin
  if v_uid is null then return json_build_object('hata','oturum yok'); end if;
  -- Zaten eşleşmiş (sonuç çıkmamış) maç varsa onu döndür — re-entry maçı SİLMESİN (async'in kalbi).
  select * into cur from public.er_meydani_dereceli_kuyruk where user_id = v_uid;
  if cur.user_id is not null and cur.durum = 'eslesti' then
    return json_build_object('durum','eslesti','mac_id',cur.mac_id,'seed',cur.seed,
      'rakip_rumuz',cur.rakip_rumuz,'rakip_elo',cur.rakip_elo,'benim_skor',cur.skor,'rakip_skor',cur.rakip_skor,'benim_elo',cur.elo);
  end if;
  perform public.er_meydani_lig_hazirla(v_uid);
  select * into l from public.er_meydani_lig where user_id = v_uid;
  select coalesce(rumuz,'Anonim Er') into v_rumuz from public.profiles where id = v_uid;
  delete from public.er_meydani_dereceli_kuyruk where user_id = v_uid;  -- eski araniyor/bitti temizle

  -- Bekleyen gerçek rakip: 'araniyor', kendisi değil, engelli değil, yakın elo. ZAMAN PENCERESİ YOK.
  select * into w from public.er_meydani_dereceli_kuyruk k
    where k.durum = 'araniyor' and k.user_id <> v_uid
      and abs(k.elo - l.puan) <= 400
      and not exists (select 1 from public.er_meydani_engel e
        where (e.engelleyen = v_uid and e.engellenen = k.user_id) or (e.engelleyen = k.user_id and e.engellenen = v_uid))
    order by abs(k.elo - l.puan) asc, k.created_at asc
    limit 1 for update skip locked;

  if found then
    v_mac := gen_random_uuid();
    v_seed := (random() * 2147483647)::bigint + 1;
    update public.er_meydani_dereceli_kuyruk set
      durum='eslesti', mac_id=v_mac, seed=v_seed, hazir=true, skor=null,
      rakip_id=v_uid, rakip_rumuz=v_rumuz, rakip_elo=l.puan, guncelleme=now()
     where user_id = w.user_id;
    insert into public.er_meydani_dereceli_kuyruk
      (user_id, rumuz, elo, durum, mac_id, seed, hazir, rakip_id, rakip_rumuz, rakip_elo)
      values (v_uid, v_rumuz, l.puan, 'eslesti', v_mac, v_seed, true, w.user_id, w.rumuz, w.elo);
    -- Bekleyen oyuncuya PUSH: rakip bulundu, maça başla.
    perform public._er_meydani_push_gonder(w.user_id, 'Rakip bulundu! ⚔️',
      v_rumuz || ' ile dereceli maçın hazır — girip maça başla, seni bekliyor!');
    return json_build_object('durum','eslesti','mac_id',v_mac,'seed',v_seed,
      'rakip_rumuz',w.rumuz,'rakip_elo',w.elo,'benim_elo',l.puan,'benim_skor',null,'rakip_skor',null);
  else
    insert into public.er_meydani_dereceli_kuyruk (user_id, rumuz, elo, durum)
      values (v_uid, v_rumuz, l.puan, 'araniyor');
    return json_build_object('durum','araniyor','benim_elo',l.puan);
  end if;
end; $f$;

-- durum: benim_skor eklendi (app "sonuç bekleniyor" durumunu bilsin).
CREATE OR REPLACE FUNCTION public.er_meydani_dereceli_durum()
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $f$
declare v_uid uuid := auth.uid(); m public.er_meydani_dereceli_kuyruk;
begin
  if v_uid is null then return json_build_object('hata','oturum yok'); end if;
  select * into m from public.er_meydani_dereceli_kuyruk where user_id = v_uid;
  if m.user_id is null then return json_build_object('durum','yok'); end if;
  return json_build_object('durum', m.durum, 'mac_id', m.mac_id, 'seed', m.seed,
    'rakip_rumuz', m.rakip_rumuz, 'rakip_elo', m.rakip_elo,
    'benim_skor', m.skor, 'rakip_skor', m.rakip_skor, 'delta', m.delta, 'yeni_rating', m.yeni_rating,
    'kademe', case when m.yeni_rating is not null then public.er_meydani_lig_kademe(m.yeni_rating) else null end);
end; $f$;
