-- 6 Eki 2026: Sınav provası sonunda puan (1-5) + isteğe bağlı yorum. Anon YALNIZ ekler (onaysız).
-- Sitede yalnız: sitede_goster (kişinin izni) VE onay (bizim moderasyon) = true olanlar, kısaltılmış adla.
-- Uygularken __PANEL_ANAHTAR__ yerine scratchpad/panel-anahtar.txt içeriğini koy.
create table if not exists public.prova_yorum (
  id            uuid primary key default gen_random_uuid(),
  olusturma     timestamptz not null default now(),
  ziyaretci     text not null check (char_length(ziyaretci) between 8 and 64),
  ad            text check (ad is null or char_length(ad) <= 80),
  rutbe         text check (rutbe is null or rutbe in ('sb','asb','uzmj','uzmerb')),
  brans         text check (brans is null or char_length(brans) <= 30),
  deneme        text check (deneme is null or char_length(deneme) <= 40),
  dogru         smallint check (dogru is null or dogru between 0 and 80),
  puan          smallint not null check (puan between 1 and 5),
  yorum         text check (yorum is null or char_length(yorum) <= 600),
  sitede_goster boolean not null default false,
  onay          boolean not null default false
);
alter table public.prova_yorum enable row level security;
revoke all on public.prova_yorum from anon, authenticated;
grant insert on public.prova_yorum to anon, authenticated;
drop policy if exists prova_yorum_ekle on public.prova_yorum;
create policy prova_yorum_ekle on public.prova_yorum for insert to anon, authenticated with check (onay = false);

-- Herkese açık: onaylı yorumlar (ad + soyadın baş harfi)
create or replace function public.prova_yorumlar()
returns json language sql security definer set search_path = public as $$
  select coalesce(json_agg(x order by x.olusturma desc), '[]'::json) from (
    select split_part(trim(ad), ' ', 1) || coalesce(' ' || nullif(left(split_part(trim(ad), ' ', 2), 1), '') || '.', '') as ad,
           rutbe, brans, puan, yorum, olusturma
    from public.prova_yorum where onay and sitede_goster and yorum is not null and char_length(trim(yorum)) > 0
    order by olusturma desc limit 30) x;
$$;
revoke all on function public.prova_yorumlar() from public;
grant execute on function public.prova_yorumlar() to anon, authenticated;

-- Panel: tüm puan/yorumlar (gizli anahtarla)
create or replace function public.prova_panel_yorum(p_anahtar text)
returns json language plpgsql security definer set search_path = public as $$
begin
  if p_anahtar is distinct from '__PANEL_ANAHTAR__' then raise exception 'yetkisiz'; end if;
  return (select coalesce(json_agg(y order by y.olusturma desc), '[]'::json) from public.prova_yorum y where coalesce(ad,'') not like 'TESTPROVA%');
end $$;
revoke all on function public.prova_panel_yorum(text) from public;
grant execute on function public.prova_panel_yorum(text) to anon, authenticated;
notify pgrst, 'reload schema';
