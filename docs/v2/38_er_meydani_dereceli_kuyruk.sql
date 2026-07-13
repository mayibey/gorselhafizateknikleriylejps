-- 38: DERECELİ MAÇ CANLI KUYRUK + HAZIR-KONTROLÜ (LoL mantığı).
-- Başkan: dereceli maç anında başlamasın; gerçek rakip bulunsun, İKİSİ DE "HAZIR" versin, sonra başlasın.
-- Akış: araniyor → eslesti (ready-check) → oynaniyor (ikisi hazır) → bitti (ikisi skor → ELO).

create table if not exists public.er_meydani_dereceli_kuyruk (
  user_id uuid primary key references auth.users(id) on delete cascade,
  rumuz text not null,
  elo integer not null,
  durum text not null default 'araniyor',            -- araniyor|eslesti|oynaniyor|bitti|iptal
  mac_id uuid,                                        -- eşleşen iki oyuncuda AYNI
  seed bigint,
  hazir boolean not null default false,
  skor integer,
  rakip_id uuid,
  rakip_rumuz text,
  rakip_elo integer,
  rakip_skor integer,
  delta integer,
  yeni_rating integer,
  created_at timestamptz not null default now(),
  guncelleme timestamptz not null default now()
);
alter table public.er_meydani_dereceli_kuyruk enable row level security;
drop policy if exists dereceli_kuyruk_select_own on public.er_meydani_dereceli_kuyruk;
create policy dereceli_kuyruk_select_own on public.er_meydani_dereceli_kuyruk
  for select using (user_id = auth.uid());

-- KUYRUĞA GİR: bekleyen gerçek rakip varsa EŞLEŞTİR (ready-check'e); yoksa 'araniyor' olarak bekle.
create or replace function public.er_meydani_dereceli_gir()
returns json language plpgsql security definer set search_path to 'public' as $$
declare
  v_uid uuid := auth.uid(); l public.er_meydani_lig; v_rumuz text; w public.er_meydani_dereceli_kuyruk;
  v_mac uuid; v_seed bigint;
begin
  if v_uid is null then return json_build_object('hata','oturum yok'); end if;
  perform public.er_meydani_lig_hazirla(v_uid);
  select * into l from public.er_meydani_lig where user_id = v_uid;
  select coalesce(rumuz,'Anonim Er') into v_rumuz from public.profiles where id = v_uid;
  delete from public.er_meydani_dereceli_kuyruk where user_id = v_uid;  -- taze başla

  -- Bekleyen gerçek rakip: 'araniyor', kendisi değil, engelli değil, yakın elo, son 45sn içinde. Kilitle.
  select * into w from public.er_meydani_dereceli_kuyruk k
    where k.durum = 'araniyor' and k.user_id <> v_uid
      and k.created_at > now() - interval '45 seconds'
      and abs(k.elo - l.puan) <= 400
      and not exists (select 1 from public.er_meydani_engel e
        where (e.engelleyen = v_uid and e.engellenen = k.user_id)
           or (e.engelleyen = k.user_id and e.engellenen = v_uid))
    order by abs(k.elo - l.puan) asc, k.created_at asc
    limit 1
    for update skip locked;

  if found then
    v_mac := gen_random_uuid();
    v_seed := (random() * 2147483647)::bigint + 1;
    update public.er_meydani_dereceli_kuyruk set
      durum='eslesti', mac_id=v_mac, seed=v_seed, hazir=false,
      rakip_id=v_uid, rakip_rumuz=v_rumuz, rakip_elo=l.puan, guncelleme=now()
     where user_id = w.user_id;
    insert into public.er_meydani_dereceli_kuyruk
      (user_id, rumuz, elo, durum, mac_id, seed, hazir, rakip_id, rakip_rumuz, rakip_elo)
      values (v_uid, v_rumuz, l.puan, 'eslesti', v_mac, v_seed, false, w.user_id, w.rumuz, w.elo);
    return json_build_object('durum','eslesti', 'mac_id', v_mac, 'seed', v_seed,
      'rakip_rumuz', w.rumuz, 'rakip_elo', w.elo, 'benim_elo', l.puan);
  else
    insert into public.er_meydani_dereceli_kuyruk (user_id, rumuz, elo, durum)
      values (v_uid, v_rumuz, l.puan, 'araniyor');
    return json_build_object('durum','araniyor', 'benim_elo', l.puan);
  end if;
end; $$;

-- DURUM: kuyruk/maç durumunu poll et (araniyor→eslesti; hazır; oynaniyor; bitti sonuç).
create or replace function public.er_meydani_dereceli_durum()
returns json language plpgsql security definer set search_path to 'public' as $$
declare v_uid uuid := auth.uid(); m public.er_meydani_dereceli_kuyruk; v_rh boolean;
begin
  if v_uid is null then return json_build_object('hata','oturum yok'); end if;
  select * into m from public.er_meydani_dereceli_kuyruk where user_id = v_uid;
  if m.user_id is null then return json_build_object('durum','yok'); end if;
  select hazir into v_rh from public.er_meydani_dereceli_kuyruk where user_id = m.rakip_id;
  return json_build_object('durum', m.durum, 'mac_id', m.mac_id, 'seed', m.seed,
    'rakip_rumuz', m.rakip_rumuz, 'rakip_elo', m.rakip_elo, 'ben_hazir', m.hazir,
    'rakip_hazir', coalesce(v_rh,false), 'rakip_skor', m.rakip_skor,
    'delta', m.delta, 'yeni_rating', m.yeni_rating,
    'kademe', case when m.yeni_rating is not null then public.er_meydani_lig_kademe(m.yeni_rating) else null end);
end; $$;

-- HAZIR: HAZIR'a bas; İKİSİ de hazırsa 'oynaniyor'a geç.
create or replace function public.er_meydani_dereceli_hazir()
returns json language plpgsql security definer set search_path to 'public' as $$
declare v_uid uuid := auth.uid(); m public.er_meydani_dereceli_kuyruk; v_rh boolean;
begin
  if v_uid is null then return json_build_object('hata','oturum yok'); end if;
  update public.er_meydani_dereceli_kuyruk set hazir=true, guncelleme=now()
    where user_id = v_uid and durum = 'eslesti';
  select * into m from public.er_meydani_dereceli_kuyruk where user_id = v_uid;
  if m.user_id is null then return json_build_object('durum','yok'); end if;
  select hazir into v_rh from public.er_meydani_dereceli_kuyruk where user_id = m.rakip_id;
  if m.hazir and coalesce(v_rh,false) then
    update public.er_meydani_dereceli_kuyruk set durum='oynaniyor', guncelleme=now()
      where mac_id = m.mac_id and durum = 'eslesti';
    return json_build_object('durum','oynaniyor', 'seed', m.seed);
  end if;
  return json_build_object('durum', m.durum, 'ben_hazir', true, 'rakip_hazir', coalesce(v_rh,false));
end; $$;

-- SKOR: maç bitince skorunu yaz; İKİSİ de yazınca ELO'yu HER İKİSİ için hesapla → 'bitti'.
create or replace function public.er_meydani_dereceli_skor(p_skor integer)
returns json language plpgsql security definer set search_path to 'public' as $$
declare
  v_uid uuid := auth.uid(); m public.er_meydani_dereceli_kuyruk; r public.er_meydani_dereceli_kuyruk;
  v_skor int := greatest(0, least(2000, coalesce(p_skor,0)));
begin
  if v_uid is null then return json_build_object('hata','oturum yok'); end if;
  update public.er_meydani_dereceli_kuyruk set skor = v_skor, guncelleme=now()
    where user_id = v_uid and skor is null;
  select * into m from public.er_meydani_dereceli_kuyruk where user_id = v_uid;
  if m.user_id is null then return json_build_object('durum','yok'); end if;
  select * into r from public.er_meydani_dereceli_kuyruk where user_id = m.rakip_id;
  -- İki skor da geldiyse VE henüz hesaplanmadıysa: her iki oyuncu için ELO (lig_sonuc) + haftalık.
  if m.skor is not null and r.skor is not null and m.durum <> 'bitti' then
    -- İki tarafı da tek seferde çöz (yarış önlem: mac_id kilidi ile).
    perform 1 from public.er_meydani_dereceli_kuyruk where mac_id = m.mac_id for update;
    perform public._er_meydani_dereceli_coz(m.user_id, m.skor, r.user_id, r.skor, m.seed);
    perform public._er_meydani_dereceli_coz(r.user_id, r.skor, m.user_id, m.skor, m.seed);
    update public.er_meydani_dereceli_kuyruk set durum='bitti' where mac_id = m.mac_id;
    -- rakibe bildirim (sonucun hazır)
    perform public._er_meydani_push_gonder(r.user_id, 'Dereceli maç bitti ⚔️', m.rumuz || ' ile maçın sonuçlandı — dereceni gör.');
  end if;
  select * into m from public.er_meydani_dereceli_kuyruk where user_id = v_uid;
  return json_build_object('durum', m.durum, 'rakip_skor', m.rakip_skor, 'delta', m.delta,
    'yeni_rating', m.yeni_rating,
    'kademe', case when m.yeni_rating is not null then public.er_meydani_lig_kademe(m.yeni_rating) else null end);
end; $$;

-- Yardımcı: bir oyuncu için ELO delta hesapla + lig güncelle + kuyruğa delta/yeni_rating yaz + haftalık.
create or replace function public._er_meydani_dereceli_coz(p_uid uuid, p_skor int, p_rid uuid, p_rskor int, p_seed bigint)
returns void language plpgsql security definer set search_path to 'public' as $$
declare l public.er_meydani_lig; v_e float; v_s float; v_delta int; v_yeni int; v_son uuid[];
begin
  perform public.er_meydani_lig_hazirla(p_uid);
  select * into l from public.er_meydani_lig where user_id = p_uid;
  v_s := case when p_skor > p_rskor then 1.0 when p_skor < p_rskor then 0.0 else 0.5 end;
  v_e := 1.0 / (1.0 + power(10, ((select puan from public.er_meydani_lig where user_id = p_rid) - l.puan) / 400.0));
  v_delta := round(32 * (v_s - v_e))::int;
  v_yeni := greatest(100, l.puan + v_delta);
  v_son := l.son_rakipler; v_son := array_append(v_son, p_rid);
  if array_length(v_son,1) > 2 then v_son := v_son[array_length(v_son,1)-1 : array_length(v_son,1)]; end if;
  update public.er_meydani_lig set puan=v_yeni, mac=mac+1,
    galip=galip+(case when v_s=1.0 then 1 else 0 end), maglup=maglup+(case when v_s=0.0 then 1 else 0 end),
    son_rakipler=v_son, guncelleme=now() where user_id = p_uid;
  insert into public.er_meydani_lig_kayit (user_id, sezon, seed, skor, rating)
    values (p_uid, l.sezon, p_seed, greatest(0,least(2000,p_skor)), v_yeni);
  update public.er_meydani_dereceli_kuyruk set rakip_skor=p_rskor, delta=v_delta, yeni_rating=v_yeni
    where user_id = p_uid;
  perform public._er_meydani_haftalik_ekle(p_uid, greatest(0,least(2000,p_skor)), 'lig', p_rskor);
end; $$;

-- İPTAL: kuyruktan çık; eşleştiyse rakibi tekrar aramaya al (rakip ayrıldı → yeniden eşleşsin).
create or replace function public.er_meydani_dereceli_iptal()
returns void language plpgsql security definer set search_path to 'public' as $$
declare v_uid uuid := auth.uid(); m public.er_meydani_dereceli_kuyruk;
begin
  if v_uid is null then return; end if;
  select * into m from public.er_meydani_dereceli_kuyruk where user_id = v_uid;
  delete from public.er_meydani_dereceli_kuyruk where user_id = v_uid;
  if m.rakip_id is not null and m.durum in ('eslesti','oynaniyor') then
    update public.er_meydani_dereceli_kuyruk
      set durum='iptal', guncelleme=now() where user_id = m.rakip_id and durum <> 'bitti';
  end if;
end; $$;

grant execute on function public.er_meydani_dereceli_gir() to authenticated;
grant execute on function public.er_meydani_dereceli_durum() to authenticated;
grant execute on function public.er_meydani_dereceli_hazir() to authenticated;
grant execute on function public.er_meydani_dereceli_skor(integer) to authenticated;
grant execute on function public.er_meydani_dereceli_iptal() to authenticated;
