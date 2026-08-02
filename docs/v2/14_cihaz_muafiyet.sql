-- 14: CİHAZ KİLİDİ MUAFİYETİ (yönetici + mağaza inceleme hesabı) — 2 Ağu 2026
-- Sorun: 12_cihaz_kilit.sql'deki "7 günde en fazla 2 cihaz" kuralı, doğal olarak çok cihazda
-- test eden YÖNETİCİ hesabını ve mağaza İNCELEME hesabını da kilitliyor (başkanın hesabı
-- 31 Tem'de kilitlendi). Kural herkes için aynı sıkılıkta kalsın; yalnız bu iki hesap muaf olsun.

alter table public.profiles add column if not exists cihaz_muaf boolean not null default false;
comment on column public.profiles.cihaz_muaf is
  'true = cihaz sayısı kilidinden muaf (yönetici / mağaza inceleme hesabı). Yalnız service_role yazabilir.';

-- Muaf hesaplar: varsa kilidi de kaldır, cihaz geçmişini temizle (yoksa ilk açılışta yeniden kilitlenir).
update public.profiles
   set cihaz_muaf = true, cihaz_kilit = null
 where email in ('mayibey@gmail.com', 'inceleme@mevzujsps.com');
delete from public.cihaz_gecmisi
 where user_id in (select id from public.profiles where cihaz_muaf);

-- cihaz_dogrula: muaf hesapta cihaz geçmişi TUTULMAZ ve kilit UYGULANMAZ.
create or replace function public.cihaz_dogrula(p_cihaz_id text)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_max int;
  v_gun int;
  v_sayi int;
  v_kilit timestamptz;
  v_muaf boolean;
begin
  if v_uid is null or p_cihaz_id is null or length(p_cihaz_id) = 0 then
    return null;
  end if;

  select coalesce(cihaz_muaf, false), cihaz_kilit
    into v_muaf, v_kilit
    from public.profiles where id = v_uid;

  -- MUAFİYET: yönetici/inceleme hesabı çok cihazda kullanılır; sayaca hiç girmesin.
  if coalesce(v_muaf, false) then
    return null;
  end if;

  select coalesce((select deger::int from public.uygulama_ayar where anahtar = 'cihaz_max'), 2) into v_max;
  select coalesce((select deger::int from public.uygulama_ayar where anahtar = 'cihaz_gun'), 7) into v_gun;

  insert into public.cihaz_gecmisi (user_id, cihaz_id, son_gorulme)
  values (v_uid, p_cihaz_id, now())
  on conflict (user_id, cihaz_id) do update set son_gorulme = now();

  select count(distinct cihaz_id) into v_sayi
  from public.cihaz_gecmisi
  where user_id = v_uid and son_gorulme > now() - (v_gun || ' days')::interval;

  if v_sayi > v_max and v_kilit is null then
    update public.profiles set cihaz_kilit = now() where id = v_uid;
    v_kilit := now();
  end if;

  return v_kilit;
end;
$$;
grant execute on function public.cihaz_dogrula(text) to authenticated;

-- İstemci kendi muafiyetini AÇAMASIN (13'teki kilit koruma trigger'ına cihaz_muaf da eklendi).
create or replace function public.profiles_kilit_koru()
returns trigger language plpgsql as $$
begin
  if current_user = 'authenticated' then
    new.cihaz_kilit := old.cihaz_kilit; -- istemcinin cihaz_kilit değişikliğini yok say
    new.cihaz_muaf  := old.cihaz_muaf;  -- istemci kendini muaf ilan edemez
  end if;
  return new;
end;
$$;

-- DOĞRULAMA (elle):
--   select email, cihaz_muaf, cihaz_kilit from public.profiles where cihaz_muaf;
-- YENİ MUAF EKLEME (destek):
--   update public.profiles set cihaz_muaf = true where email = '<eposta>';
