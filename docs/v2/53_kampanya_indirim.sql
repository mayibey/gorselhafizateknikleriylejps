-- 53: KAMPANYA indirimi — HERKESE (hesap yaşı fark etmez) süreli %X indirim, ANA FİYATA DOKUNMADAN.
-- Başkan kararı (27 Tem): ana ürün fiyatı DEĞİŞMEZ. İndirim, Google Play'de base fiyatın ÜZERİNE
-- tanımlanan bir "teklif/kampanya" (offerId=indirim20, %20). Uygulama zaten bu teklif token'ıyla
-- satın aldırıyor → Google az tahsil eder, base fiyat sabit kalır. Uygulamada eski fiyat üstü çizili
-- gösterilir (ana fiyat üzerinden indirim belli olsun).
--
-- Bu migration YALNIZ sunucu mantığını ekler: indirim_durumu() artık kampanya penceresinde teklifi
-- HERKESE dağıtır (kod/ilk-giriş gibi kişiye değil). Tarih & oran uygulama_ayar'dan (build gerekmez).
--
-- ÖNCELİK: KOD (%30) > KAMPANYA (herkes %20) > İLK GİRİŞ (yeni hesaba özel) > yok.
-- (Kod %30, kampanya %20'den yüksek olduğu için kodlu birkaç kişi %30 kalır — istenen davranış.)
--
-- GÜVENLİK: Play tarafında teklif hazır DEĞİLSE uygulama sessizce tam fiyata düşer (paywall.tsx
-- indirimUygulanabilir kontrolü) → "indirim vaat edip tam çekme" OLMAZ. Kampanyayı AÇMADAN ÖNCE
-- Play Console'da indirim20 teklifi aktif olmalı.

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
  v_kamp_aktif text; v_kamp_bitis timestamptz;
begin
  if v_uid is null then return null; end if;

  -- 1) KOD ile kazanılmış indirim (en yüksek öncelik)
  select * into h from public.indirim_hak where user_id = v_uid;
  if found then
    return jsonb_build_object('yuzde', h.yuzde, 'kaynak', 'kod',
                              'yillik_offer', h.offer_id, 'omurboyu_urun', h.omurboyu_urun);
  end if;

  -- 2) KAMPANYA — herkese açık süreli indirim (hesap yaşı fark etmez), açık ve süresi dolmamışsa
  v_kamp_aktif := coalesce((select deger from uygulama_ayar where anahtar = 'kampanya_indirim_aktif'), '0');
  if v_kamp_aktif = '1' then
    v_kamp_bitis := nullif((select deger from uygulama_ayar where anahtar = 'kampanya_indirim_bitis'), '')::timestamptz;
    if v_kamp_bitis is null or now() < v_kamp_bitis then
      v_yuzde := coalesce((select deger from uygulama_ayar where anahtar = 'kampanya_indirim_yuzde'), '20')::int;
      v_yoffer:= coalesce((select deger from uygulama_ayar where anahtar = 'kampanya_indirim_yillik_offer'), 'indirim20');
      v_ourun := coalesce((select deger from uygulama_ayar where anahtar = 'kampanya_indirim_omurboyu_urun'), 'musterek_omurboyu');
      return jsonb_build_object('yuzde', v_yuzde, 'kaynak', 'kampanya',
                                'yillik_offer', v_yoffer, 'omurboyu_urun', v_ourun,
                                'bitis', case when v_kamp_bitis is null then null
                                  else to_char(v_kamp_bitis at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') end);
    end if;
  end if;

  -- 3) İLK GİRİŞ indirimi (hesap yaşı < N saat) — açık ise
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
                                  'bitis', to_char(v_bitis at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'));
      end if;
    end if;
  end if;

  return null;
end;
$$;

revoke all on function public.indirim_durumu() from public, anon;
grant execute on function public.indirim_durumu() to authenticated;

-- Kampanya ayarları — başkan dashboard'dan (uygulama_ayar) yönetir, build gerekmez.
--   kampanya_indirim_aktif        : '1' açık / '0' kapalı  (varsayılan KAPALI — Play teklifi hazır olunca aç)
--   kampanya_indirim_yuzde        : indirim oranı (gösterim; gerçek oran Play teklifinde)
--   kampanya_indirim_bitis        : ISO UTC bitiş anı (örn 2026-08-03T21:00:00Z); boş = süresiz
--   kampanya_indirim_yillik_offer : Play offerId (yıllık + ömür boyu aynı) — indirim20
--   kampanya_indirim_omurboyu_urun: ömür boyu ürün SKU'su (base; teklif token'ıyla alınır)
-- BAŞLATMAK için:  update uygulama_ayar set deger='1' where anahtar='kampanya_indirim_aktif';
--                  update uygulama_ayar set deger='2026-08-03T21:00:00Z' where anahtar='kampanya_indirim_bitis';
-- BİTİRMEK için:   update uygulama_ayar set deger='0' where anahtar='kampanya_indirim_aktif';
insert into public.uygulama_ayar (anahtar, deger) values
  ('kampanya_indirim_aktif', '0'),
  ('kampanya_indirim_yuzde', '20'),
  ('kampanya_indirim_bitis', ''),
  ('kampanya_indirim_yillik_offer', 'indirim20'),
  ('kampanya_indirim_omurboyu_urun', 'musterek_omurboyu')
on conflict (anahtar) do nothing;
