-- 37: DERECELİ MAÇ — gerçek rakip önceliği (başkan: "hala Er Çelik ile eşleştiriyor").
-- Sistem zaten er_meydani_lig_kayit'ten GERÇEK oyuncu koşusu seçiyordu; ama son_rakipler
-- (son 2 rakip) hariç tutulunca ince havuzda (az oyuncu) boş kalıp GHOST'a düşüyordu.
-- Çözüm: strict havuz boşsa son_rakipler ELEMEDEN tekrar dene (gerçek rakip > sentetik ghost).
-- Ghost yalnız GERÇEKTEN başka oyuncu koşusu yoksa çıkar.

create or replace function public.er_meydani_lig_eslesme()
returns json language plpgsql security definer set search_path to 'public' as $function$
declare
  v_uid uuid := auth.uid(); l public.er_meydani_lig; g public.er_meydani_lig_kayit;
  v_seed bigint; v_skor int; v_rating int; v_rumuz text; v_owner uuid; v_id uuid; v_golge boolean := false;
begin
  if v_uid is null then return json_build_object('hata', 'oturum yok'); end if;
  perform public.er_meydani_lig_hazirla(v_uid);
  select * into l from public.er_meydani_lig where user_id = v_uid;

  -- 1) STRICT: kendisi + son rakipler + engellenenler hariç, en yakın rating.
  select * into g from public.er_meydani_lig_kayit k
   where k.sezon = l.sezon and k.user_id <> v_uid and k.user_id <> all(coalesce(l.son_rakipler, '{}'::uuid[]))
     and not exists (select 1 from public.er_meydani_engel e
        where (e.engelleyen = v_uid and e.engellenen = k.user_id)
           or (e.engelleyen = k.user_id and e.engellenen = v_uid))
   order by abs(k.rating - l.puan) asc, k.created_at desc
   limit 1;

  -- 2) GEVŞEK: strict boşsa son_rakipler elemesini KALDIR (gerçek rakibe düş, ghost'a değil).
  if not found then
    select * into g from public.er_meydani_lig_kayit k
     where k.sezon = l.sezon and k.user_id <> v_uid
       and not exists (select 1 from public.er_meydani_engel e
          where (e.engelleyen = v_uid and e.engellenen = k.user_id)
             or (e.engelleyen = k.user_id and e.engellenen = v_uid))
     order by abs(k.rating - l.puan) asc, k.created_at desc
     limit 1;
  end if;

  if found then
    v_seed := g.seed; v_skor := g.skor; v_rating := g.rating; v_owner := g.user_id; v_id := g.id;
    select rumuz into v_rumuz from public.profiles where id = g.user_id;
  else
    -- GERÇEKTEN başka oyuncu koşusu yok → sentetik rakip (ölü lig olmaz).
    v_golge := true; v_owner := null; v_id := null;
    v_seed := (random() * 2147483647)::bigint + 1;
    v_rating := greatest(100, l.puan + ((random() - 0.5) * 100)::int);
    v_skor := greatest(0, least(2000, (800 + (v_rating - 1000) * 0.6 + random() * 300)::int));
    v_rumuz := 'Er ' || (array['Yıldırım','Şahin','Bozkurt','Demir','Kartal','Poyraz','Aslan','Çelik'])[1 + floor(random() * 8)];
  end if;
  return json_build_object('kayit_id', v_id, 'golge', v_golge, 'seed', v_seed, 'rakip_skor', v_skor,
    'rakip_rating', v_rating, 'rakip_rumuz', coalesce(v_rumuz, 'Anonim Er'), 'rakip_id', v_owner,
    'benim_rating', l.puan, 'kademe', public.er_meydani_lig_kademe(l.puan));
end; $function$;
