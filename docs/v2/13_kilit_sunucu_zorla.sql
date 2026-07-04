-- 13: CİHAZ KİLİDİNİ SUNUCUDA ZORLA (güvenlik incelemesi bulgusu — 5 Tem)
-- Sorun: cihaz_kilit + aktif_oturum yalnız İSTEMCİDE etkiliydi; içerik sunan Edge fn'ler
-- (imzali-url, gorsel) premium_mi'ye bakıyordu, premium_mi ise cihaz_kilit'i görmüyordu →
-- değiştirilmiş istemci kilidi atlayıp içerik çekebiliyordu. Ayrıca kullanıcı profiles UPDATE
-- RLS'iyle kendi cihaz_kilit'ini null yapabiliyordu. İkisi de kapatılıyor.

-- 1) premium_mi artık cihaz kilidini de denetler → içerik Edge fn'leri kilitli hesabı reddeder.
create or replace function public.premium_mi(p_user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.uyelik_haklari
    where user_id = p_user
      and (tip = 'omurboyu' or (tip = 'abonelik' and bitis is not null and bitis > now()))
  )
  and not exists (
    select 1 from public.profiles where id = p_user and cihaz_kilit is not null
  );
$$;

-- premium_mi yalnız service_role (Edge fn admin) tarafından çağrılsın — istemci enumeration'ı kapat.
revoke execute on function public.premium_mi(uuid) from public, anon, authenticated;
grant execute on function public.premium_mi(uuid) to service_role;

-- 2) İstemci (authenticated) cihaz_kilit'i DEĞİŞTİREMESİN → kendi kötüye-kullanım kilidini silemez.
--    cihaz_dogrula (SECURITY DEFINER, owner rolüyle çalışır) ve service_role (destek) yazabilir.
create or replace function public.profiles_kilit_koru()
returns trigger language plpgsql as $$
begin
  if current_user = 'authenticated' then
    new.cihaz_kilit := old.cihaz_kilit; -- istemcinin cihaz_kilit değişikliğini yok say
  end if;
  return new;
end;
$$;
drop trigger if exists profiles_kilit_koru_trg on public.profiles;
create trigger profiles_kilit_koru_trg
  before update on public.profiles
  for each row execute function public.profiles_kilit_koru();
