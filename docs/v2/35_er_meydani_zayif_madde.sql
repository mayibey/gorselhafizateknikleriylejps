-- 35: ZAYIF MADDE takibi (başkan: "TCK madde 4'te yanlış yaptın" detayı + premium karta git).
-- Şu an sadece kanun-başı yanlış sayısı vardı (er_meydani_zayif_kanun). Madde bazlı ekliyoruz.

create table if not exists public.er_meydani_zayif_madde (
  user_id uuid not null references auth.users(id) on delete cascade,
  kanun integer not null,
  madde text not null,
  yanlis integer not null default 0,
  guncelleme timestamptz not null default now(),
  primary key (user_id, kanun, madde)
);
alter table public.er_meydani_zayif_madde enable row level security;
drop policy if exists zayif_madde_select_own on public.er_meydani_zayif_madde;
create policy zayif_madde_select_own on public.er_meydani_zayif_madde
  for select using (user_id = auth.uid());

-- Yanlış yapılan maddeleri ekle (paralel diziler: kanunlar[i] + maddeler[i]).
create or replace function public.er_meydani_zayif_madde_ekle(p_kanunlar integer[], p_maddeler text[])
returns void language plpgsql security definer set search_path to 'public' as $$
declare v_uid uuid := auth.uid(); i int;
begin
  if v_uid is null or p_kanunlar is null then return; end if;
  for i in 1 .. coalesce(array_length(p_kanunlar,1),0) loop
    if p_kanunlar[i] is not null and p_kanunlar[i] > 0 and coalesce(btrim(p_maddeler[i]),'') <> '' then
      insert into public.er_meydani_zayif_madde (user_id, kanun, madde, yanlis)
        values (v_uid, p_kanunlar[i], btrim(p_maddeler[i]), 1)
      on conflict (user_id, kanun, madde) do update
        set yanlis = public.er_meydani_zayif_madde.yanlis + 1, guncelleme = now();
    end if;
  end loop;
end; $$;

-- Bir kanunun zayıf maddeleri (çok yanlıştan aza).
create or replace function public.er_meydani_zayif_maddeler(p_kanun integer)
returns table(madde text, yanlis integer)
language sql security definer set search_path to 'public' as $$
  select madde, yanlis from public.er_meydani_zayif_madde
    where user_id = auth.uid() and kanun = p_kanun
    order by yanlis desc, madde limit 30;
$$;

grant execute on function public.er_meydani_zayif_madde_ekle(integer[], text[]) to authenticated;
grant execute on function public.er_meydani_zayif_maddeler(integer) to authenticated;
