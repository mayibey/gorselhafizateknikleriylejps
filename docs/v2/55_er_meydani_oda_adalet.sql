-- 55 — ER MEYDANI ODA ADALETİ (11 Eyl 2026)
--
-- Başkan + arkadaşı 10 Eyl gece 3 oda oynadı; üçüncüsü (0395) 'oynaniyor'da takılı kaldı:
-- bir oyuncu maçı bitirmeyince skoru NULL kalıyor, oda hiç 'bitti' olmuyor, sonuç ekranı
-- herkes bitmeden gelmiyor → diğerleri sonsuza dek "hâlâ oynuyor" görüyor.
-- Daha kötüsü: lobide "başladı" görünen odaya tekrar giren oyuncu maçı SIFIRDAN oynuyor ve
-- er_meydani_oda_skor skoru koşulsuz eziyordu (başkan: 1100 → 1934). Yarış adaletsiz.
--
-- ÜÇ DÜZELTME:
--  1) Skor yalnız İLK kez yazılır (skor is null şartı) — tekrar oynayan ilkini değiştiremez.
--  2) basladi_at kolonu (oda_baslat yazar) + zaman aşımı: soru×(süre+2 sn)+90 sn geçince
--     skoru olmayan oyuncu 0 sayılır, oda 'bitti' olur. oda_durum ve oda_skor her çağrıda
--     bunu kontrol eder → poll eden istemci kendiliğinden sonuç ekranına düşer.
--     Eski odalarda basladi_at boş → created_at esas alınır (takılı 0395 de böyle kapanır).
--  3) (istemci) skoru olan oyuncu odaya girince maç değil "sonuç bekleniyor" ekranı açılır.

alter table public.er_meydani_oda add column if not exists basladi_at timestamptz;

create or replace function public._er_meydani_oda_zaman_asimi(p_oda_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare o public.er_meydani_oda; v_sinir interval;
begin
  select * into o from public.er_meydani_oda where id = p_oda_id;
  if o.id is null or o.durum <> 'oynaniyor' then return; end if;
  v_sinir := make_interval(secs => coalesce(o.soru_sayisi, 10) * (coalesce(o.sure_sn, 60) + 2) + 90);
  if now() > coalesce(o.basladi_at, o.created_at) + v_sinir then
    update public.er_meydani_oda_oyuncu set skor = 0 where oda_id = o.id and skor is null;
    update public.er_meydani_oda set durum = 'bitti' where id = o.id and durum = 'oynaniyor';
  end if;
end $$;

create or replace function public.er_meydani_oda_baslat(p_oda_id uuid)
returns json
language plpgsql
security definer
set search_path to 'public'
as $$
declare o public.er_meydani_oda; v_sayi integer;
begin
  if auth.uid() is null then return json_build_object('hata', 'oturum yok'); end if;
  select * into o from public.er_meydani_oda where id = p_oda_id;
  if o.id is null or o.kuran_id <> auth.uid() then return json_build_object('hata', 'yetki yok'); end if;
  if o.durum <> 'acik' then return json_build_object('durum', o.durum); end if;
  select count(*) into v_sayi from public.er_meydani_oda_oyuncu where oda_id = o.id;
  if v_sayi < 2 then return json_build_object('hata', 'en az 2 oyuncu gerek'); end if;
  update public.er_meydani_oda set durum = 'oynaniyor', basladi_at = now() where id = o.id and durum = 'acik';
  return json_build_object('durum', 'oynaniyor');
end $$;

create or replace function public.er_meydani_oda_durum(p_oda_id uuid)
returns json
language plpgsql
security definer
set search_path to 'public'
as $$
declare o public.er_meydani_oda; v_uid uuid := auth.uid();
begin
  if v_uid is null then return json_build_object('hata', 'oturum yok'); end if;
  perform public._er_meydani_oda_zaman_asimi(p_oda_id);
  select * into o from public.er_meydani_oda where id = p_oda_id;
  if o.id is null then return json_build_object('hata', 'oda bulunamadı'); end if;
  return json_build_object('durum', o.durum, 'seed', o.seed, 'soru_sayisi', o.soru_sayisi,
    'sure_sn', o.sure_sn, 'kanunlar', o.kanunlar, 'kod', o.kod, 'max_oyuncu', o.max_oyuncu,
    'ben_kuran', (o.kuran_id = v_uid),
    'oyuncular', public.er_meydani_oyuncular_json(o.id, v_uid));
end $$;

create or replace function public.er_meydani_oda_skor(p_oda_id uuid, p_skor integer)
returns json
language plpgsql
security definer
set search_path to 'public'
as $$
declare o public.er_meydani_oda; v_uid uuid := auth.uid(); v_skor integer := greatest(0, least(2000, coalesce(p_skor,0)));
  v_kalan integer; v_ilk boolean;
begin
  if v_uid is null then return json_build_object('hata', 'oturum yok'); end if;
  perform public._er_meydani_oda_zaman_asimi(p_oda_id);
  select (skor is null) into v_ilk from public.er_meydani_oda_oyuncu where oda_id = p_oda_id and user_id = v_uid;
  if v_ilk is null then return json_build_object('hata', 'bu odada değilsin'); end if;
  -- ADALET: yalnız ilk skor yazılır; tekrar oynayan ilkini ezemez.
  if v_ilk then
    update public.er_meydani_oda_oyuncu set skor = v_skor where oda_id = p_oda_id and user_id = v_uid and skor is null;
    perform public._er_meydani_haftalik_ekle(v_uid, v_skor, 'oda', 0);
  end if;
  select count(*) into v_kalan from public.er_meydani_oda_oyuncu where oda_id = p_oda_id and skor is null;
  if v_kalan = 0 then update public.er_meydani_oda set durum = 'bitti' where id = p_oda_id and durum <> 'bitti'; end if;
  select * into o from public.er_meydani_oda where id = p_oda_id;
  return json_build_object('durum', o.durum, 'oyuncular', public.er_meydani_oyuncular_json(p_oda_id, v_uid));
end $$;
