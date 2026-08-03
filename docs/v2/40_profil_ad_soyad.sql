-- 40) SOSYAL GİRİŞTE GELEN AD SOYAD PROFİLE YAZILSIN (kalıcı çözüm + geriye dönük doldurma)
--
-- SORUN: handle_new_user() yalnızca (id, email) yazıyordu. Apple/Google girişte adı
--        gönderiyor ama bu ad auth.users.raw_user_meta_data içinde kalıyor, profiles.ad
--        ve profiles.soyad boş kalıyordu. Bu yüzden "kim satın aldı" gibi sorularda
--        kullanıcılar "(isimsiz)" görünüyordu.
-- ÖLÇÜM (3 Ağu 2026): 716 kullanıcı · 163'ünde profil adı boş · bunların 64'ünün adı
--        kimlik kaydında MEVCUT (yani boşuna boş).
-- NOT:    Apple adı YALNIZCA ilk izin verildiğinde gönderir; bu yüzden hem INSERT hem de
--         meta güncellemesi yakalanır. Var olan ad ASLA ezilmez (kullanıcı kendi yazdıysa korunur).
-- Çalıştır: Supabase → SQL Editor.

-- 1) Yardımcılar ------------------------------------------------------------------
create or replace function public.meta_tam_ad(m jsonb)
returns text language sql immutable as $$
  select coalesce(
    nullif(btrim(m->>'full_name'), ''),
    nullif(btrim(m->>'name'), ''),
    nullif(btrim(concat_ws(' ', m->>'given_name', m->>'family_name')), '')
  );
$$;

create or replace function public.ad_soyad_ayir(tam text, parca text)
returns text language sql immutable as $$
  select case
    when tam is null or btrim(tam) = '' then null
    when parca = 'ad' then nullif(btrim(split_part(btrim(tam), ' ', 1)), '')
    when position(' ' in btrim(tam)) = 0 then null
    else nullif(btrim(substring(btrim(tam) from position(' ' in btrim(tam)) + 1)), '')
  end;
$$;

-- 2) Yeni kullanıcı / meta güncellemesi -> profile ad soyad --------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  tam text;
begin
  tam := public.meta_tam_ad(new.raw_user_meta_data);
  insert into public.profiles (id, email, ad, soyad)
  values (new.id, new.email,
          public.ad_soyad_ayir(tam, 'ad'),
          public.ad_soyad_ayir(tam, 'soyad'))
  on conflict (id) do update
    set email = coalesce(profiles.email, excluded.email),
        ad    = coalesce(nullif(btrim(profiles.ad), ''),    excluded.ad),
        soyad = coalesce(nullif(btrim(profiles.soyad), ''), excluded.soyad);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Ad sonradan gelirse de yakala (Apple ilk izinde, Google zaman zaman günceller).
drop trigger if exists on_auth_user_meta_guncel on auth.users;
create trigger on_auth_user_meta_guncel
  after update of raw_user_meta_data on auth.users
  for each row execute function public.handle_new_user();

-- 3) GERİYE DÖNÜK DOLDURMA ----------------------------------------------------------
update public.profiles p
set ad    = public.ad_soyad_ayir(public.meta_tam_ad(u.raw_user_meta_data), 'ad'),
    soyad = public.ad_soyad_ayir(public.meta_tam_ad(u.raw_user_meta_data), 'soyad')
from auth.users u
where u.id = p.id
  and coalesce(btrim(p.ad), '') = ''
  and coalesce(btrim(p.soyad), '') = ''
  and public.meta_tam_ad(u.raw_user_meta_data) is not null;

-- 4) DOĞRULAMA ----------------------------------------------------------------------
select
  count(*) filter (where coalesce(btrim(ad), '') = '' and coalesce(btrim(soyad), '') = '')
    as hala_isimsiz,
  count(*) as toplam_profil
from public.profiles;
