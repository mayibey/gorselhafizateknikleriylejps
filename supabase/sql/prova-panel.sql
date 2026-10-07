-- 6 Eki 2026: sınav provası canlı takip. Sayfa her 10 işarette 'ilerleme' yazar; panel bu RPC ile okur.
-- Uygularken __PANEL_ANAHTAR__ yerine scratchpad/panel-anahtar.txt içeriğini koy (anahtar depoya girmez).
-- Okuma yalnız gizli anahtarla (anahtar fonksiyon gövdesinde; anon tabloyu yine OKUYAMAZ).
alter table public.tahmin_deneme_kayit add column if not exists isaretli smallint check (isaretli is null or isaretli between 0 and 80);
alter table public.tahmin_deneme_kayit drop constraint if exists tahmin_deneme_kayit_olay_check;
alter table public.tahmin_deneme_kayit add constraint tahmin_deneme_kayit_olay_check check (olay in ('acilis','bitir','hizlandir','ilerleme'));

create or replace function public.prova_panel(p_anahtar text)
returns json language plpgsql security definer set search_path = public as $$
begin
  if p_anahtar is distinct from '__PANEL_ANAHTAR__' then raise exception 'yetkisiz'; end if;
  return (
    select coalesce(json_agg(x order by x.son desc), '[]'::json) from (
      select ziyaretci,
             max(ad) as ad, max(rutbe) as rutbe, max(brans) as brans,
             max(deneme) filter (where deneme is not null) as deneme,
             min(olusturma) as ilk, max(olusturma) as son,
             max(isaretli) as isaretli,
             bool_or(olay = 'bitir') as bitti,
             max(dogru) as dogru, max(yanlis) as yanlis, max(bos) as bos,
             bool_or(olay = 'hizlandir') as hizlandir
      from public.tahmin_deneme_kayit
      where ad is null or ad not like 'TESTPROVA%'
      -- 7 Eki 2026: kişi + deneme (2. prova eklendi; 1. provayı bitiren 2.'yi açınca "bitirdi" görünmesin)
      group by ziyaretci, coalesce(deneme, '')
    ) x
  );
end $$;
revoke all on function public.prova_panel(text) from public;
grant execute on function public.prova_panel(text) to anon, authenticated;
notify pgrst, 'reload schema';
