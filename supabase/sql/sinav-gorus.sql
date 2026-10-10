-- 10 Eki 2026: Sınav sonrası aday görüşleri (mevzujsps.com/sinavgorus). Anon YALNIZ ekler; okumak yalnız panel anahtarıyla.
-- Uygularken __PANEL_ANAHTAR__ yerine scratchpad/panel-anahtar.txt içeriğini koy (anahtar git'e girmez).
create table if not exists public.sinav_gorus (
  id          uuid primary key default gen_random_uuid(),
  olusturma   timestamptz not null default now(),
  ziyaretci   text not null check (char_length(ziyaretci) between 8 and 64),
  ad          text not null check (char_length(trim(ad)) between 2 and 40),
  soyad       text not null check (char_length(trim(soyad)) between 2 and 40),
  rutbe       text not null check (rutbe in ('sb','asb','uzmj','uzmerb')),
  brans       text not null check (char_length(brans) between 2 and 30),
  nasil       smallint not null check (nasil between 1 and 5),   -- 5 çok iyi … 1 çok kötü
  tahmini     smallint check (tahmini is null or tahmini between 0 and 100),
  gorus       text not null check (char_length(trim(gorus)) between 3 and 1500)
);
alter table public.sinav_gorus enable row level security;
revoke all on public.sinav_gorus from anon, authenticated;
grant insert on public.sinav_gorus to anon, authenticated;
drop policy if exists sinav_gorus_ekle on public.sinav_gorus;
create policy sinav_gorus_ekle on public.sinav_gorus for insert to anon, authenticated with check (true);

-- Panel: tüm görüşler (gizli anahtarla)
create or replace function public.sinav_gorus_panel(p_anahtar text)
returns json language plpgsql security definer set search_path = public as $$
begin
  if p_anahtar is distinct from '__PANEL_ANAHTAR__' then raise exception 'yetkisiz'; end if;
  return (select coalesce(json_agg(g order by g.olusturma desc), '[]'::json) from public.sinav_gorus g where ad not like 'TESTGORUS%');
end $$;
revoke all on function public.sinav_gorus_panel(text) from public;
grant execute on function public.sinav_gorus_panel(text) to anon, authenticated;
notify pgrst, 'reload schema';
