-- 15: PROMOSYON KODLARI — geliştirici (başkan) tanımlar, kullanıcı uygulamada girer → premium açılır.
-- Play Billing DIŞINDA, BEDAVA erişim verme mekanizması (kod satılmaz → Play politikasına uygun).
-- Güvenlik: kodlar istemciden OKUNAMAZ/YAZILAMAZ (geçerli kodlar sızmasın). Tüm iş `promo_kullan`
-- RPC'sinde (SECURITY DEFINER, atomik) döner. Verilen hak uyelik_haklari'na yazılır → premium_mi
-- ve istemci PREMIUM_URUNLERI (promo_yillik/promo_omurboyu) sayesinde otomatik premium sayar.

-- Kod tanımları (başkan dashboard'dan ekler)
create table if not exists public.promosyon_kodlari (
  kod              text primary key,                 -- BÜYÜK harf, örn. JSPS2026
  aciklama         text,                             -- iç not (kime/niye verildi)
  verilen_urun     text not null default 'promo_omurboyu'
                     check (verilen_urun in ('promo_omurboyu', 'promo_yillik')),
  verilen_tip      text not null default 'omurboyu'  -- uyelik_haklari.tip
                     check (verilen_tip in ('omurboyu', 'abonelik')),
  sure_gun         integer,                          -- abonelik ise kaç gün (null → 365); omurboyu'da yok sayılır
  kullanim_limiti  integer,                          -- kaç kişi kullanabilir (null → sınırsız)
  kullanim_sayisi  integer not null default 0,
  gecerlilik_bitis timestamptz,                      -- kodun kendi son kullanma tarihi (null → süresiz)
  aktif            boolean not null default true,
  created_at       timestamptz not null default now()
);

-- Kim hangi kodu kullandı (aynı kullanıcı aynı kodu 1 kez kullanır)
create table if not exists public.promo_kullanim (
  id         uuid primary key default gen_random_uuid(),
  kod        text not null references public.promosyon_kodlari(kod) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (kod, user_id)
);

-- RLS: her iki tablo da istemciye TAMAMEN kapalı (policy yok → erişim yok). Yalnız RPC (definer) ve dashboard.
alter table public.promosyon_kodlari enable row level security;
alter table public.promo_kullanim enable row level security;

-- Kodu kullan — atomik, güvenli. Doğrula → hakkı yaz → sayacı artır. jsonb {ok, hata?} döner.
create or replace function public.promo_kullan(p_kod text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_kod   text := upper(trim(coalesce(p_kod, '')));
  r       public.promosyon_kodlari;
  v_mevcut_bitis timestamptz;
  v_bitis timestamptz;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'hata', 'oturum');
  end if;
  if v_kod = '' then
    return jsonb_build_object('ok', false, 'hata', 'bos');
  end if;

  -- kodu kilitle (eşzamanlı kullanımda sayaç yarışı olmasın)
  select * into r from public.promosyon_kodlari where kod = v_kod for update;
  if not found then
    return jsonb_build_object('ok', false, 'hata', 'gecersiz');
  end if;
  if not r.aktif then
    return jsonb_build_object('ok', false, 'hata', 'pasif');
  end if;
  if r.gecerlilik_bitis is not null and r.gecerlilik_bitis < now() then
    return jsonb_build_object('ok', false, 'hata', 'suresi_doldu');
  end if;
  if r.kullanim_limiti is not null and r.kullanim_sayisi >= r.kullanim_limiti then
    return jsonb_build_object('ok', false, 'hata', 'limit_doldu');
  end if;
  if exists (select 1 from public.promo_kullanim where kod = v_kod and user_id = v_uid) then
    return jsonb_build_object('ok', false, 'hata', 'zaten_kullandin');
  end if;

  -- verilecek hakkın bitişi (omurboyu → süresiz; abonelik → mevcut hakkı UZAT)
  if r.verilen_tip = 'omurboyu' then
    v_bitis := null;
  else
    select bitis into v_mevcut_bitis
      from public.uyelik_haklari where user_id = v_uid and urun = r.verilen_urun;
    v_bitis := greatest(coalesce(v_mevcut_bitis, now()), now())
               + (coalesce(r.sure_gun, 365) || ' days')::interval;
  end if;

  insert into public.promo_kullanim (kod, user_id) values (v_kod, v_uid);

  insert into public.uyelik_haklari
    (user_id, urun, tip, baslangic, bitis, satin_alma_token, platform, son_dogrulama)
  values
    (v_uid, r.verilen_urun, r.verilen_tip, now(), v_bitis,
     'PROMO:' || r.verilen_urun || ':' || v_uid, 'promo', now())
  on conflict (user_id, urun) do update
    set tip = excluded.tip,
        bitis = excluded.bitis,
        son_dogrulama = now();

  update public.promosyon_kodlari
    set kullanim_sayisi = kullanim_sayisi + 1 where kod = v_kod;

  return jsonb_build_object('ok', true, 'urun', r.verilen_urun, 'tip', r.verilen_tip, 'bitis', v_bitis);
end;
$$;

-- Yalnız giriş yapmış kullanıcı çağırabilir.
revoke all on function public.promo_kullan(text) from public, anon;
grant execute on function public.promo_kullan(text) to authenticated;
