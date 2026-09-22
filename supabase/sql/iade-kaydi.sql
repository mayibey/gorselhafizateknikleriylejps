-- İADE KAYDI — iade alan kullanıcıyı kalıcı olarak işaretler ve indirim kapısını kapatır.
--
-- NEDEN (22 Eyl 2026, başkan): "ömür boyu alan adam bir ay kullanıp sınavdan sonra iade
-- alabiliyor, çok saçma değil mi?" Ölçüm: 153 satın almada 3 iade (%2), ÜÇÜ DE Apple.
-- Aslan 4 günde 1.146 içerik → 3 gün sonra iade · bir kişi 494 içerik → ertesi gün iade ·
-- Melike 13 günde 2.509 içerik + 4 deneme → sınavın ertesi günü iade.
--
-- NE YAPAR: iade eden kişi bir daha KAMPANYA/İLK GİRİŞ indiriminden ve indirim kodundan
-- yararlanamaz. Satın almayı ENGELLEMEZ — tam fiyattan alabilir. Cezalandırma değil,
-- "bedava deneyip iade et, sonra indirimli al" döngüsünü kırmak içindir.
--
-- SINIRI AÇIKÇA: kişi YENİ HESAP açarsa bu işaret onu takip etmez (bağ kurulamaz).
-- Mağaza tarafında seri iadecileri Apple/Google'ın kendisi eliyor.

create table if not exists public.iade_kaydi (
  user_id    uuid not null references auth.users(id) on delete cascade,
  tarih      timestamptz not null default now(),
  urun       text,
  platform   text,
  kaynak     text,                       -- 'bildirim' | 'denetci' | 'elle'
  primary key (user_id, tarih)
);

alter table public.iade_kaydi enable row level security;
-- Kullanıcıya AÇIK DEĞİL: yalnız sunucu (service_role) yazar/okur. Politika yok = erişim yok.

comment on table public.iade_kaydi is
  'İade alan kullanıcılar. indirim_durumu/indirim_kodu_kullan buraya bakar; satın almayı engellemez, yalnız indirimi kapatır.';

-- ---- GEÇMİŞİ DOLDUR (gece denetiminin kapattıkları + elle kapatılanlar) ----
insert into public.iade_kaydi (user_id, tarih, urun, platform, kaynak)
select (k->>'user_id')::uuid, l.created_at, k->>'urun', k->>'platform', 'denetci'
from public.uyelik_denetim_log l
cross join lateral jsonb_array_elements(coalesce(l.ozet->'kapatilan', '[]'::jsonb)) k
where (k->>'user_id') is not null
  and exists (select 1 from auth.users u where u.id = (k->>'user_id')::uuid)
on conflict do nothing;

insert into public.iade_kaydi (user_id, tarih, urun, platform, kaynak)
select s.user_id, s.created_at, s.urun, s.platform, 'elle'
from public.satin_alma_log s
where s.user_id is not null
  and (s.durum = 'iade' or (s.durum = 'reddedildi' and s.detay ilike '%iade%'))
on conflict do nothing;

-- ---- İNDİRİM KAPISI ----
create or replace function public.iade_gecmisi_var(p_uid uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (select 1 from public.iade_kaydi where user_id = p_uid);
$$;

create or replace function public.indirim_durumu()
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_uid uuid := auth.uid();
  h public.indirim_hak;
  v_created timestamptz;
  v_saat int; v_yuzde int; v_yoffer text; v_ourun text;
  v_bitis timestamptz;
  v_kamp_aktif text; v_kamp_bitis timestamptz;
begin
  if v_uid is null then return null; end if;

  -- İADE GEÇMİŞİ (22 Eyl 2026): iade alan indirimden yararlanamaz. Tam fiyattan alabilir.
  if public.iade_gecmisi_var(v_uid) then return null; end if;

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
$function$;

create or replace function public.indirim_kodu_kullan(p_kod text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_uid uuid := auth.uid();
  v_kod text := upper(trim(coalesce(p_kod, '')));
  r     public.indirim_kodlari;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'hata', 'oturum'); end if;
  if v_kod = ''   then return jsonb_build_object('ok', false, 'hata', 'bos');    end if;

  -- İADE GEÇMİŞİ (22 Eyl 2026): iade alan indirim kodu kullanamaz.
  if public.iade_gecmisi_var(v_uid) then
    return jsonb_build_object('ok', false, 'hata', 'iade_gecmisi');
  end if;

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
$function$;
