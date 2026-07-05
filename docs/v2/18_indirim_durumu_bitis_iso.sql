-- 18: indirim_durumu geri sayım BUG düzeltmesi + ilk giriş süresi 48 saat.
-- SORUN: bitis "2026-07-06T13:24:22+00" (to_char OF → "+00") olarak dönüyordu; JS new Date() bunu
--        parse edemeyip NaN yapıyordu → uygulamada "NaN dk NaN sn". ÇÖZÜM: UTC + "Z" ISO formatı.
-- (Sunucu düzeltmesi → mevcut build'lerde bile anında çalışır, yeni build gerekmez.)
-- Ayrıca ilk giriş indirim süresi 24 → 48 saat (uygulama_ayar).

create or replace function public.indirim_durumu()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  h public.indirim_hak;
  v_created timestamptz;
  v_saat int; v_yuzde int; v_yoffer text; v_ourun text;
  v_bitis timestamptz;
begin
  if v_uid is null then return null; end if;

  select * into h from public.indirim_hak where user_id = v_uid;
  if found then
    return jsonb_build_object('yuzde', h.yuzde, 'kaynak', 'kod',
                              'yillik_offer', h.offer_id, 'omurboyu_urun', h.omurboyu_urun);
  end if;

  if coalesce((select deger from uygulama_ayar where anahtar = 'ilk_giris_indirim_aktif'), '1') = '1' then
    select created_at into v_created from public.profiles where id = v_uid;
    v_saat  := coalesce((select deger from uygulama_ayar where anahtar = 'ilk_giris_indirim_saat'), '24')::int;
    v_yuzde := coalesce((select deger from uygulama_ayar where anahtar = 'ilk_giris_indirim_yuzde'), '20')::int;
    v_yoffer:= coalesce((select deger from uygulama_ayar where anahtar = 'ilk_giris_indirim_yillik_offer'), 'indirim20');
    v_ourun := coalesce((select deger from uygulama_ayar where anahtar = 'ilk_giris_indirim_omurboyu_urun'), 'musterek_omurboyu_i20');
    if v_created is not null then
      v_bitis := v_created + (v_saat || ' hours')::interval;
      if now() < v_bitis then
        return jsonb_build_object('yuzde', v_yuzde, 'kaynak', 'ilk_giris',
                                  'yillik_offer', v_yoffer, 'omurboyu_urun', v_ourun,
                                  -- ISO 8601 UTC + "Z" → JS new Date() güvenle parse eder (NaN yok)
                                  'bitis', to_char(v_bitis at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'));
      end if;
    end if;
  end if;

  return null;
end;
$$;

revoke all on function public.indirim_durumu() from public, anon;
grant execute on function public.indirim_durumu() to authenticated;

-- İlk giriş indirim süresi 24 → 48 saat
update public.uygulama_ayar set deger = '48' where anahtar = 'ilk_giris_indirim_saat';
