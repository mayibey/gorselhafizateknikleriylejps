-- 17: İNDİRİM — İKİ KATMAN + YILLIK & ÖMÜR BOYU + ÜST ÜSTE BİNMEZ.
-- (A) İLK GİRİŞ: hesap açılışından itibaren N saat (vars. 24) otomatik %20 (kod GEREKMEZ).
-- (B) KOD: SUEM2020OZEL30 → %30 (devre özel). Kod > ilk giriş; ASLA toplanmaz (en yüksek TEK indirim).
-- Her indirim iki üründe de geçerli:
--   YILLIK   → Play abonelik teklifi (offerId: indirim20 / indirim30)
--   ÖMÜR BOYU→ Play'de ayrı indirimli ürün (musterek_omurboyu_i20 / _i30) — tek seferlikte % teklif yok.
-- Play nesneleri ödeme profili düzelince açılır; yoksa uygulama normal fiyata düşer (güvenli).

-- indirim_kodlari + indirim_hak'a ömür boyu indirimli ürün kolonu ekle
alter table public.indirim_kodlari add column if not exists omurboyu_urun text;
alter table public.indirim_hak     add column if not exists omurboyu_urun text;

-- Kodu kullan RPC'sini omurboyu_urun de yazacak şekilde güncelle
create or replace function public.indirim_kodu_kullan(p_kod text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_kod text := upper(trim(coalesce(p_kod, '')));
  r     public.indirim_kodlari;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'hata', 'oturum'); end if;
  if v_kod = ''   then return jsonb_build_object('ok', false, 'hata', 'bos');    end if;

  select * into r from public.indirim_kodlari where kod = v_kod for update;
  if not found then return jsonb_build_object('ok', false, 'hata', 'gecersiz'); end if;
  if not r.aktif then return jsonb_build_object('ok', false, 'hata', 'pasif'); end if;
  if r.gecerlilik_bitis is not null and r.gecerlilik_bitis < now() then
    return jsonb_build_object('ok', false, 'hata', 'suresi_doldu');
  end if;

  if not exists (select 1 from public.indirim_kullanim where kod = v_kod and user_id = v_uid) then
    if r.kullanim_limiti is not null and r.kullanim_sayisi >= r.kullanim_limiti then
      return jsonb_build_object('ok', false, 'hata', 'limit_doldu');
    end if;
    insert into public.indirim_kullanim (kod, user_id) values (v_kod, v_uid);
    update public.indirim_kodlari set kullanim_sayisi = kullanim_sayisi + 1 where kod = v_kod;
  end if;

  insert into public.indirim_hak (user_id, kod, offer_id, yuzde, omurboyu_urun)
  values (v_uid, v_kod, r.offer_id, r.yuzde, r.omurboyu_urun)
  on conflict (user_id) do update
    set kod = excluded.kod, offer_id = excluded.offer_id, yuzde = excluded.yuzde,
        omurboyu_urun = excluded.omurboyu_urun, created_at = now();

  return jsonb_build_object('ok', true, 'yuzde', r.yuzde, 'offer_id', r.offer_id);
end;
$$;

-- GÜNCEL İNDİRİM DURUMU — TEK, EN YÜKSEK indirim (üst üste binmez). Kod > ilk giriş > yok.
-- Döner: {yuzde, kaynak, yillik_offer, omurboyu_urun, bitis?} ya da null.
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

  -- 1) KOD ile kazanılmış indirim (en yüksek öncelik)
  select * into h from public.indirim_hak where user_id = v_uid;
  if found then
    return jsonb_build_object('yuzde', h.yuzde, 'kaynak', 'kod',
                              'yillik_offer', h.offer_id, 'omurboyu_urun', h.omurboyu_urun);
  end if;

  -- 2) İLK GİRİŞ indirimi (hesap yaşı < N saat) — açık ise
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
                                  'bitis', to_char(v_bitis, 'YYYY-MM-DD"T"HH24:MI:SSOF'));
      end if;
    end if;
  end if;

  return null;
end;
$$;

revoke all on function public.indirim_durumu() from public, anon;
grant execute on function public.indirim_durumu() to authenticated;

-- İlk giriş indirimi ayarları (başkan dashboard'dan değiştirebilir; build gerekmez)
insert into public.uygulama_ayar (anahtar, deger) values
  ('ilk_giris_indirim_aktif', '1'),
  ('ilk_giris_indirim_saat', '24'),
  ('ilk_giris_indirim_yuzde', '20'),
  ('ilk_giris_indirim_yillik_offer', 'indirim20'),
  ('ilk_giris_indirim_omurboyu_urun', 'musterek_omurboyu_i20')
on conflict (anahtar) do update set deger = excluded.deger;

-- Örnek HOSGELDIN20 (artık gereksiz: ilk giriş kodsuz) → kaldır
delete from public.indirim_kodlari where kod = 'HOSGELDIN20';

-- DEVRE ÖZEL %30 kodu (aktif; Play nesneleri açılınca gerçek indirim uygular)
insert into public.indirim_kodlari (kod, aciklama, offer_id, yuzde, omurboyu_urun, kullanim_limiti, aktif)
values ('SUEM2020OZEL30', 'Devre ozel %30 (yillik+omurboyu)', 'indirim30', 30, 'musterek_omurboyu_i30', null, true)
on conflict (kod) do update
  set offer_id = excluded.offer_id, yuzde = excluded.yuzde,
      omurboyu_urun = excluded.omurboyu_urun, aktif = true;
