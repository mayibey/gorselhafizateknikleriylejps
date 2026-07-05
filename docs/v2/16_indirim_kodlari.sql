-- 16: İNDİRİM KODLARI — YILLIK üyelikte GERÇEK %X indirim (kişi yine öder, ama az; parayı Google alır).
-- Bedava kod (docs/v2/15) DEĞİL: burada hak verilmez, kişi indirimli FİYATA satın alma hakkı kazanır.
-- MEKANİZMA: Play Console'da yıllık base plana bir "promosyon teklifi" (offerId = örn. 'indirim20',
-- uygunluk = 'developer determined') tanımlanır. Kişi uygulamada kodu girer → sunucu doğrular →
-- uygulama satın almada TEMEL teklif yerine bu indirimli teklifi (offerToken) kullanır → Google az tahsil eder.
-- NOT: Ömür Boyu (tek seferlik) için Google'da kodla % indirim YOK — bu sistem yalnız YILLIK içindir.
-- ÖDEME PROFİLİ AKTİF olunca Play'de teklif açılıp test edilir; tablo/RPC şimdiden hazır.

-- Kod tanımları (başkan dashboard'dan ekler)
create table if not exists public.indirim_kodlari (
  kod              text primary key,                 -- BÜYÜK harf, örn. HOSGELDIN20
  aciklama         text,
  offer_id         text not null default 'indirim20',-- Play'deki promosyon teklifinin offerId'si (EŞLEŞMELİ)
  yuzde            integer not null default 20,       -- yalnız gösterim (%20); gerçek indirim Play teklifinde
  kullanim_limiti  integer,                           -- kaç kişi (null → sınırsız)
  kullanim_sayisi  integer not null default 0,
  gecerlilik_bitis timestamptz,                       -- kodun son kullanma (null → süresiz)
  aktif            boolean not null default true,
  created_at       timestamptz not null default now()
);

-- Kim hangi kodu kullandı (kişi başı 1 kez sayılsın)
create table if not exists public.indirim_kullanim (
  id         uuid primary key default gen_random_uuid(),
  kod        text not null references public.indirim_kodlari(kod) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (kod, user_id)
);

-- Kullanıcının GÜNCEL indirim hakkı (tek satır) — uygulama satın almadan önce bunu okur.
create table if not exists public.indirim_hak (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  kod        text not null references public.indirim_kodlari(kod) on delete cascade,
  offer_id   text not null,
  yuzde      integer not null,
  created_at timestamptz not null default now()
);

alter table public.indirim_kodlari  enable row level security;  -- istemciye kapalı (kodlar sızmasın)
alter table public.indirim_kullanim enable row level security;  -- istemciye kapalı
alter table public.indirim_hak      enable row level security;

-- Kullanıcı YALNIZ kendi indirim hakkını okuyabilir (uygulama satın almada offer_id'yi buradan alır).
drop policy if exists "indirim_hak_oku" on public.indirim_hak;
create policy "indirim_hak_oku" on public.indirim_hak for select using (user_id = auth.uid());

-- Kodu kullan — atomik. Doğrula → indirim hakkını yaz/güncelle → sayaç. jsonb {ok, hata?, yuzde?, offer_id?}.
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

  -- kişi başı 1 kez say; limit yalnız YENİ kullanıcıları kısıtlar (tekrar giren aynı kişi değil)
  if not exists (select 1 from public.indirim_kullanim where kod = v_kod and user_id = v_uid) then
    if r.kullanim_limiti is not null and r.kullanim_sayisi >= r.kullanim_limiti then
      return jsonb_build_object('ok', false, 'hata', 'limit_doldu');
    end if;
    insert into public.indirim_kullanim (kod, user_id) values (v_kod, v_uid);
    update public.indirim_kodlari set kullanim_sayisi = kullanim_sayisi + 1 where kod = v_kod;
  end if;

  -- güncel indirim hakkını yaz (varsa değiştir)
  insert into public.indirim_hak (user_id, kod, offer_id, yuzde)
  values (v_uid, v_kod, r.offer_id, r.yuzde)
  on conflict (user_id) do update
    set kod = excluded.kod, offer_id = excluded.offer_id, yuzde = excluded.yuzde, created_at = now();

  return jsonb_build_object('ok', true, 'yuzde', r.yuzde, 'offer_id', r.offer_id);
end;
$$;

revoke all on function public.indirim_kodu_kullan(text) from public, anon;
grant execute on function public.indirim_kodu_kullan(text) to authenticated;
