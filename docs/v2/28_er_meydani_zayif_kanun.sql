-- 28: ER MEYDANI düello zayıflıkları → zayıf KANUN sayacı (premium hunisi için).
-- Düelloda yanlış yapılan sorular kanun bazında toplanır. Ücretsizde de çalışır (cloud).
-- KUTSAL SRS'e (kart-bazlı zayıf havuz) DOKUNMAZ — bu AYRI, kanun-bazlı bir sayaç.
-- Çalıştır: Supabase SQL Editor → RUN. Idempotent.

create table if not exists public.er_meydani_zayif_kanun (
  user_id    uuid not null references auth.users(id) on delete cascade,
  kanun      integer not null,
  yanlis     integer not null default 0,
  guncelleme timestamptz not null default now(),
  primary key (user_id, kanun)
);
alter table public.er_meydani_zayif_kanun enable row level security;
-- Kullanıcı KENDİ zayıf kanunlarını okur; yazma yalnız RPC (definer) ile.
drop policy if exists "ermeydani_zayif_select_own" on public.er_meydani_zayif_kanun;
create policy "ermeydani_zayif_select_own" on public.er_meydani_zayif_kanun
  for select using (user_id = auth.uid());

-- EKLE — maç sonu yanlış yapılan kanunları (tekrarlı dizi) sayaca ekler.
create or replace function public.er_meydani_zayif_ekle(p_kanunlar integer[])
  returns void language plpgsql security definer set search_path = public as $fn$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null or p_kanunlar is null or array_length(p_kanunlar, 1) is null then return; end if;
  insert into public.er_meydani_zayif_kanun (user_id, kanun, yanlis)
    select v_uid, k, count(*)::int
    from unnest(p_kanunlar) k
    where k between 1 and 25
    group by k
  on conflict (user_id, kanun) do update
    set yanlis = public.er_meydani_zayif_kanun.yanlis + excluded.yanlis,
        guncelleme = now();
end; $fn$;
grant execute on function public.er_meydani_zayif_ekle(integer[]) to authenticated;
