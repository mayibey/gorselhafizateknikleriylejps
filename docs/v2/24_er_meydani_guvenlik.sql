-- 24: ER MEYDANI güvenlik sıkılaştırma (öz-denetim bulguları — 12 Tem 2026).
-- (1) sonuc_kaydet: kendine-karşı-maç puanı 0 + GÜNLÜK GLOBAL puan tavanı (anti-farm).
-- (2) rumuz: profiles.rumuz'a DB CHECK → doğrudan PostgREST update ile filtre atlanamaz.
-- (3) rumuz_ayarla: eşzamanlı isim çakışmasında zarif hata (unique_violation yakala).
-- (4) serbest metinlere uzunluk sınırı (depolama-istismarı).
-- Çalıştır: Supabase SQL Editor → RUN. Idempotent.

-- ── (2) Rumuz DB-düzeyi doğrulama (uzunluk + karakter + küfür) — her yol için geçerli ──
alter table public.profiles drop constraint if exists profiles_rumuz_gecerli;
alter table public.profiles add constraint profiles_rumuz_gecerli check (
  rumuz is null or (
    char_length(rumuz) between 3 and 16
    and rumuz ~ '^[A-Za-zÇĞİÖŞÜçğıöşü0-9 ]+$'
    and rumuz !~* '(orospu|piç|amk|aq|sik|yarrak|gavat|pezevenk|göt|oç)'
  )
);

-- ── (4) Serbest metin uzunluk sınırları ──
alter table public.er_meydani_sikayet drop constraint if exists er_meydani_sikayet_uzunluk;
alter table public.er_meydani_sikayet add constraint er_meydani_sikayet_uzunluk
  check (char_length(coalesce(sebep, '')) <= 300 and char_length(coalesce(rumuz, '')) <= 40);
alter table public.er_meydani_mac drop constraint if exists er_meydani_mac_rumuz_uzunluk;
alter table public.er_meydani_mac add constraint er_meydani_mac_rumuz_uzunluk
  check (char_length(coalesce(rakip_rumuz, '')) <= 40);

-- ── (3) Rumuz ayarla — eşzamanlı çakışmada zarif hata ──
create or replace function public.er_meydani_rumuz_ayarla(p_rumuz text)
  returns text language plpgsql security definer set search_path = public as $fn$
declare v text := btrim(p_rumuz);
begin
  if auth.uid() is null then return 'hata: oturum yok'; end if;
  if char_length(v) < 3 or char_length(v) > 16 then return 'hata: 3-16 karakter olmalı'; end if;
  if v !~ '^[A-Za-zÇĞİÖŞÜçğıöşü0-9 ]+$' then return 'hata: yalnız harf, rakam ve boşluk'; end if;
  if lower(v) ~ '(orospu|piç|amk|aq|sik|yarrak|gavat|pezevenk|göt|oç)' then return 'hata: uygunsuz ad'; end if;
  if exists (select 1 from public.profiles where lower(rumuz) = lower(v) and id <> auth.uid()) then
    return 'hata: bu ad alınmış';
  end if;
  begin
    update public.profiles set rumuz = v where id = auth.uid();
  exception
    when unique_violation then return 'hata: bu ad alınmış';
    when check_violation then return 'hata: uygunsuz ad';
  end;
  return 'ok';
end; $fn$;
grant execute on function public.er_meydani_rumuz_ayarla(text) to authenticated;

-- ── (1) Sonuç kaydet — kendine-karşı 0 + günlük global tavan ──
create or replace function public.er_meydani_sonuc_kaydet(
  p_mod text, p_seed bigint, p_havuz text,
  p_benim_puan integer, p_rakip_puan integer,
  p_golge boolean, p_rakip_id uuid, p_rakip_rumuz text
) returns json language plpgsql security definer set search_path = public as $fn$
declare
  v_uid uuid := auth.uid();
  v_hafta text := public.er_meydani_hafta();
  v_puan integer := greatest(0, least(coalesce(p_benim_puan, 0), 2000));
  v_gun_bas timestamptz := (date_trunc('day', now() at time zone 'Europe/Istanbul') at time zone 'Europe/Istanbul');
  v_kendi boolean := (p_rakip_id is not null and p_rakip_id = v_uid); -- kendine karşı maç
  v_bugun_ayni integer;
  v_bugun_toplam integer;
  v_verilen integer;
  v_toplam integer;
begin
  if v_uid is null then return json_build_object('hata', 'oturum yok'); end if;

  select count(*) into v_bugun_ayni from public.er_meydani_mac m
    where m.oyuncu_id = v_uid and m.created_at >= v_gun_bas
      and ((p_rakip_id is not null and m.rakip_id = p_rakip_id)
           or (p_rakip_id is null and m.rakip_id is null));
  select count(*) into v_bugun_toplam from public.er_meydani_mac m
    where m.oyuncu_id = v_uid and m.created_at >= v_gun_bas;

  -- Anti-farm: aynı rakipten günde ilk 3; gölge/rastgeleden ilk 10; kendine karşı 0;
  -- ve her hâlükârda GÜNLÜK GLOBAL 30 maç tavanı (üstü sıralamaya sayılmaz).
  v_verilen := v_puan;
  if v_kendi then
    v_verilen := 0;
  elsif p_rakip_id is not null and v_bugun_ayni >= 3 then
    v_verilen := 0;
  elsif p_rakip_id is null and v_bugun_ayni >= 10 then
    v_verilen := 0;
  end if;
  if v_bugun_toplam >= 30 then v_verilen := 0; end if;

  insert into public.er_meydani_mac
    (oyuncu_id, mod, golge, rakip_id, rakip_rumuz, seed, havuz, benim_puan, rakip_puan, kazandim, hafta)
  values
    (v_uid, coalesce(p_mod, 'hizli'), coalesce(p_golge, false),
     case when v_kendi then null else p_rakip_id end, left(coalesce(p_rakip_rumuz, ''), 40),
     p_seed, coalesce(p_havuz, 'ucretsiz'), v_puan,
     greatest(0, least(coalesce(p_rakip_puan, 0), 2000)),
     v_puan > coalesce(p_rakip_puan, 0), v_hafta);

  insert into public.er_meydani_haftalik_puan (oyuncu_id, hafta, puan, mac_sayisi, guncelleme)
    values (v_uid, v_hafta, v_verilen, 1, now())
  on conflict (oyuncu_id, hafta) do update
    set puan = public.er_meydani_haftalik_puan.puan + v_verilen,
        mac_sayisi = public.er_meydani_haftalik_puan.mac_sayisi + 1,
        guncelleme = now();

  select puan into v_toplam from public.er_meydani_haftalik_puan where oyuncu_id = v_uid and hafta = v_hafta;
  return json_build_object('verilen', v_verilen, 'haftalik_toplam', v_toplam, 'kazandim', v_puan > coalesce(p_rakip_puan, 0));
end; $fn$;
grant execute on function public.er_meydani_sonuc_kaydet(text,bigint,text,integer,integer,boolean,uuid,text) to authenticated;
