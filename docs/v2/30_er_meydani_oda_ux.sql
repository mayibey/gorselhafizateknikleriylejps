-- 30: ER MEYDANI oda UX — "Odalarım" (kuran geri dönebilsin) + "önizleme" (katılmadan gör).
-- Çalıştır: Supabase SQL Editor → RUN. Idempotent.

-- ODALARIM — kuranın aktif odaları (bekliyor/oynaniyor) → lobiden geri dönmek için.
create or replace function public.er_meydani_odalarim()
  returns table(id uuid, kod text, durum text, soru_sayisi integer, sure_sn integer,
                kanunlar integer[], rakip_rumuz text, created_at timestamptz)
  language sql security definer set search_path = public as $fn$
  select o.id, o.kod, o.durum, o.soru_sayisi, o.sure_sn, o.kanunlar, o.rakip_rumuz, o.created_at
  from public.er_meydani_oda o
  where o.kuran_id = auth.uid() and o.durum in ('acik', 'oynaniyor')
  order by o.created_at desc
  limit 10;
$fn$;
grant execute on function public.er_meydani_odalarim() to authenticated;

-- ÖNİZLEME — odayı KAPMADAN ayar/konu bilgisini döner (kodla/listeden katılmadan önce onay ekranı).
create or replace function public.er_meydani_oda_onizle(p_oda_id uuid, p_kod text)
  returns json language plpgsql security definer set search_path = public as $fn$
declare o public.er_meydani_oda; v_kuran_rumuz text;
begin
  if auth.uid() is null then return json_build_object('hata', 'oturum yok'); end if;
  select * into o from public.er_meydani_oda
    where (p_oda_id is not null and id = p_oda_id)
       or (p_kod is not null and kod = upper(btrim(p_kod)))
    limit 1;
  if o.id is null then return json_build_object('hata', 'oda bulunamadı'); end if;
  if o.durum = 'kapandi' then return json_build_object('hata', 'oda kapandı'); end if;
  if o.kuran_id = auth.uid() then return json_build_object('hata', 'kendi odan'); end if;
  if o.rakip_id is not null and o.rakip_id <> auth.uid() then return json_build_object('hata', 'oda dolu'); end if;
  select rumuz into v_kuran_rumuz from public.profiles where id = o.kuran_id;
  return json_build_object('oda_id', o.id, 'kod', o.kod, 'durum', o.durum, 'soru_sayisi', o.soru_sayisi,
    'sure_sn', o.sure_sn, 'kanunlar', o.kanunlar, 'kuran_rumuz', coalesce(v_kuran_rumuz, 'Anonim Er'));
end; $fn$;
grant execute on function public.er_meydani_oda_onizle(uuid, text) to authenticated;
