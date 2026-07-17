-- BUG 1 FIX (yarış): gir() eski kaydı silerken 'eslesti'yi KORU (koşullu delete) + silme sonrası
-- yeniden-oku (eşzamanlı eşleşme yakalansın). Aksi halde iki kişi aynı anda ara'ya basınca birinin
-- taze eşleşmiş kaydı silinip kalıcı "sonuç bekleniyor"da takılıyordu.
CREATE OR REPLACE FUNCTION public.er_meydani_dereceli_gir()
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $f$
declare
  v_uid uuid := auth.uid(); l public.er_meydani_lig; v_rumuz text;
  cur public.er_meydani_dereceli_kuyruk; w public.er_meydani_dereceli_kuyruk;
  v_mac uuid; v_seed bigint;
begin
  if v_uid is null then return json_build_object('hata','oturum yok'); end if;
  select * into cur from public.er_meydani_dereceli_kuyruk where user_id = v_uid;
  if cur.user_id is not null and cur.durum = 'eslesti' then
    return json_build_object('durum','eslesti','mac_id',cur.mac_id,'seed',cur.seed,
      'rakip_rumuz',cur.rakip_rumuz,'rakip_elo',cur.rakip_elo,'benim_skor',cur.skor,'rakip_skor',cur.rakip_skor,'benim_elo',cur.elo);
  end if;
  perform public.er_meydani_lig_hazirla(v_uid);
  select * into l from public.er_meydani_lig where user_id = v_uid;
  select coalesce(rumuz,'Anonim Er') into v_rumuz from public.profiles where id = v_uid;
  -- SADECE araniyor/bitti sil (eslesti'ye DOKUNMA — eşzamanlı eşleşmiş olabilir).
  delete from public.er_meydani_dereceli_kuyruk where user_id = v_uid and durum in ('araniyor','bitti');
  -- Silme sonrası: eşzamanlı bir rakip beni eşleştirdiyse (eslesti) → onu döndür.
  select * into cur from public.er_meydani_dereceli_kuyruk where user_id = v_uid;
  if cur.user_id is not null and cur.durum = 'eslesti' then
    return json_build_object('durum','eslesti','mac_id',cur.mac_id,'seed',cur.seed,
      'rakip_rumuz',cur.rakip_rumuz,'rakip_elo',cur.rakip_elo,'benim_skor',cur.skor,'rakip_skor',cur.rakip_skor,'benim_elo',cur.elo);
  end if;

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
      values (v_uid, v_rumuz, l.puan, 'eslesti', v_mac, v_seed, true, w.user_id, w.rumuz, w.elo)
      on conflict (user_id) do update set
        durum='eslesti', mac_id=v_mac, seed=v_seed, hazir=true, skor=null,
        rakip_id=w.user_id, rakip_rumuz=w.rumuz, rakip_elo=w.elo, guncelleme=now();
    perform public._er_meydani_push_gonder(w.user_id, 'Rakip bulundu! ⚔️',
      v_rumuz || ' ile dereceli maçın hazır — girip maça başla, seni bekliyor!');
    return json_build_object('durum','eslesti','mac_id',v_mac,'seed',v_seed,
      'rakip_rumuz',w.rumuz,'rakip_elo',w.elo,'benim_elo',l.puan,'benim_skor',null,'rakip_skor',null);
  else
    insert into public.er_meydani_dereceli_kuyruk (user_id, rumuz, elo, durum)
      values (v_uid, v_rumuz, l.puan, 'araniyor')
      on conflict (user_id) do update set elo=l.puan, durum='araniyor', guncelleme=now();
    return json_build_object('durum','araniyor','benim_elo',l.puan);
  end if;
end; $f$;
