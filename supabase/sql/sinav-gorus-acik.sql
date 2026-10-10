-- 10 Eki 2026 (2): Görüşler herkese açık sayfada (mevzujsps.com/sinavgorus/gorusler). Başkan: "herkes diğerlerinin yorumlarını görsün".
-- İsim yalnız kişi izin verirse (isim_goster) "Ad S." olarak görünür; yoksa yalnız rütbe/branş. Başkan panelden gizleyebilir (gizli).
-- Uygularken __PANEL_ANAHTAR__ yerine scratchpad/panel-anahtar.txt içeriğini koy.
alter table public.sinav_gorus add column if not exists isim_goster boolean not null default false;
alter table public.sinav_gorus add column if not exists gizli boolean not null default false;
drop policy if exists sinav_gorus_ekle on public.sinav_gorus;
create policy sinav_gorus_ekle on public.sinav_gorus for insert to anon, authenticated with check (gizli = false);

-- Herkese açık liste
create or replace function public.sinav_gorusler()
returns json language sql security definer set search_path = public as $$
  select coalesce(json_agg(x order by x.olusturma desc), '[]'::json) from (
    select case when isim_goster then trim(ad) || ' ' || upper(left(trim(soyad), 1)) || '.' end as ad,
           rutbe, brans, nasil, tahmini, gorus, olusturma
    from public.sinav_gorus where not gizli and ad not like 'TESTGORUS%'
    order by olusturma desc limit 1000) x;
$$;
revoke all on function public.sinav_gorusler() from public;
grant execute on function public.sinav_gorusler() to anon, authenticated;

-- Panel: gizle / göster
create or replace function public.sinav_gorus_gizle(p_anahtar text, p_id uuid, p_gizli boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_anahtar is distinct from '__PANEL_ANAHTAR__' then raise exception 'yetkisiz'; end if;
  update public.sinav_gorus set gizli = p_gizli where id = p_id;
end $$;
revoke all on function public.sinav_gorus_gizle(text, uuid, boolean) from public;
grant execute on function public.sinav_gorus_gizle(text, uuid, boolean) to anon, authenticated;
notify pgrst, 'reload schema';
