-- 12: CİHAZ KÖTÜYE KULLANIM KİLİDİ (hesap paylaşımı önleme, otomatik)
-- Model: hesap 7 günlük pencerede en fazla 2 farklı cihazda kullanılabilir (uzak ayar cihaz_max/gun).
-- Aşılırsa hesap OTOMATİK kilitlenir (profiles.cihaz_kilit) → premium reddedilir, kullanıcı
-- iletisim@ ile açtırır. Normal telefon değişimi (eski+yeni = 2 cihaz) sınıra takılmaz.
-- Tek-oturum (aktif_oturum) + çevrimdışı heartbeat + bu = katmanlı paylaşım koruması.

create table if not exists public.cihaz_gecmisi (
  user_id uuid not null references auth.users(id) on delete cascade,
  cihaz_id text not null,
  son_gorulme timestamptz not null default now(),
  primary key (user_id, cihaz_id)
);
alter table public.cihaz_gecmisi enable row level security;
drop policy if exists "cihaz_kendi_oku" on public.cihaz_gecmisi;
create policy "cihaz_kendi_oku" on public.cihaz_gecmisi for select using (auth.uid() = user_id);

alter table public.profiles add column if not exists cihaz_kilit timestamptz;
comment on column public.profiles.cihaz_kilit is 'Çok fazla cihazda kullanım → otomatik kilit anı (null=açık); manuel açılır (destek)';

insert into public.uygulama_ayar (anahtar, deger) values ('cihaz_max', '2'), ('cihaz_gun', '7')
  on conflict (anahtar) do nothing;

-- Cihazı kaydet + pencere içi farklı cihaz sayısını denetle. Aşımda kilitler. Kilit anını döner
-- (null = açık). SECURITY DEFINER: yazma yalnız bu fonksiyonla (istemci tabloyu manipüle edemez).
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
begin
  if v_uid is null or p_cihaz_id is null or length(p_cihaz_id) = 0 then
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

  select cihaz_kilit into v_kilit from public.profiles where id = v_uid;

  if v_sayi > v_max and v_kilit is null then
    update public.profiles set cihaz_kilit = now() where id = v_uid;
    v_kilit := now();
  end if;

  return v_kilit;
end;
$$;
grant execute on function public.cihaz_dogrula(text) to authenticated;

-- MANUEL AÇMA (destek): kilidi kaldır + eski cihaz kayıtlarını temizle (yoksa hemen tekrar kilitlenir).
--   update public.profiles set cihaz_kilit = null where id = '<user_id>';
--   delete from public.cihaz_gecmisi where user_id = '<user_id>';
