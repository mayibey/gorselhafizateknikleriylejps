-- 56 — ER MEYDANI: UYGULAMAYI KAPATAN "AYRILDI" SAYILIR + MAÇ SORU KAYDI (24 Kas 2026)
--
-- Olay (24 Kas, oda 4725): 3 kişi yarıştı, biri uygulamayı kapattı. Diğer ikisi bitirdi ama sonuç
-- çıkmadı; 55'teki zaman aşımı (soru×(süre+2)+90 sn ≈ 13 dk) dolmadan bırakıp yeni oda açtılar.
--
-- 1) NABIZ: maç sırasında yeni istemci 10 sn'de bir er_meydani_oda_nabiz çağırır (son_nabiz).
--    Skoru olmayan ve son nabzı 45 sn'den eski oyuncu → skor 0 + ayrildi=true. Diğerleri bitmişse
--    oda hemen 'bitti'. ESKİ SÜRÜM nabız atmaz (son_nabiz NULL) → ona bu kural UYGULANMAZ,
--    13 dk'lık eski zaman aşımı aynen kalır (yanlışlıkla "ayrıldı" sayılmasın).
-- 2) Oyuncu listesine 'ayrildi' alanı (eski istemci bilmez, skor 0 görür).
-- 3) Oynanan odadan ayrıl (ayril RPC) → kalan herkesin skoru varsa oda 'bitti'.
-- 4) SORU KAYDI: er_meydani_cevap_log — her maçta gelen soru id'leri + işaretlenen şık + doğru mu.
--    Yazma yalnız RPC ile (kendi kaydı); okuma yalnız yönetim (servis anahtarı). RLS açık, politika yok.

alter table public.er_meydani_oda_oyuncu add column if not exists son_nabiz timestamptz;
alter table public.er_meydani_oda_oyuncu add column if not exists ayrildi boolean not null default false;

create or replace function public._er_meydani_oda_zaman_asimi(p_oda_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare o public.er_meydani_oda; v_sinir interval; v_kalan integer;
begin
  select * into o from public.er_meydani_oda where id = p_oda_id;
  if o.id is null or o.durum <> 'oynaniyor' then return; end if;
  -- Nabız atıp 45 sn'dir susan (uygulamayı kapatan) → ayrıldı, 0 puan.
  update public.er_meydani_oda_oyuncu set skor = 0, ayrildi = true
    where oda_id = o.id and skor is null and son_nabiz is not null and son_nabiz < now() - interval '45 seconds';
  select count(*) into v_kalan from public.er_meydani_oda_oyuncu where oda_id = o.id and skor is null;
  if v_kalan = 0 and exists (select 1 from public.er_meydani_oda_oyuncu where oda_id = o.id) then
    update public.er_meydani_oda set durum = 'bitti' where id = o.id and durum = 'oynaniyor';
    return;
  end if;
  -- Eski genel zaman aşımı (nabız atmayan eski sürümler için).
  v_sinir := make_interval(secs => coalesce(o.soru_sayisi, 10) * (coalesce(o.sure_sn, 60) + 2) + 90);
  if now() > coalesce(o.basladi_at, o.created_at) + v_sinir then
    update public.er_meydani_oda_oyuncu set skor = 0, ayrildi = true where oda_id = o.id and skor is null;
    update public.er_meydani_oda set durum = 'bitti' where id = o.id and durum = 'oynaniyor';
  end if;
end $$;

-- Maç sırasında "buradayım". Skoru yazılmış (ya da ayrıldı sayılmış) oyuncuyu diriltmez.
create or replace function public.er_meydani_oda_nabiz(p_oda_id uuid)
returns json
language plpgsql
security definer
set search_path to 'public'
as $$
declare v_uid uuid := auth.uid(); o public.er_meydani_oda;
begin
  if v_uid is null then return json_build_object('hata', 'oturum yok'); end if;
  update public.er_meydani_oda_oyuncu set son_nabiz = now()
    where oda_id = p_oda_id and user_id = v_uid and skor is null;
  perform public._er_meydani_oda_zaman_asimi(p_oda_id);
  select * into o from public.er_meydani_oda where id = p_oda_id;
  return json_build_object('durum', o.durum);
end $$;

create or replace function public.er_meydani_oyuncular_json(p_oda uuid, p_uid uuid)
returns json
language sql
stable
set search_path to 'public'
as $$
  select coalesce(json_agg(json_build_object('id', user_id, 'rumuz', rumuz, 'skor', skor, 'ben', user_id = p_uid,
             'ayrildi', ayrildi)
           order by (skor is null), ayrildi, skor desc, katildi_at), '[]'::json)
  from public.er_meydani_oda_oyuncu where oda_id = p_oda;
$$;

create or replace function public.er_meydani_oda_ayril(p_oda_id uuid)
returns json language plpgsql security definer set search_path to 'public' as $$
declare o public.er_meydani_oda; v_uid uuid := auth.uid();
begin
  if v_uid is null then return json_build_object('hata','oturum yok'); end if;
  select * into o from public.er_meydani_oda where id = p_oda_id;
  delete from public.er_meydani_oda_oyuncu where oda_id = p_oda_id and user_id = v_uid;
  if o.id is not null and o.kuran_id = v_uid and o.durum = 'acik' then
    update public.er_meydani_oda set durum = 'kapandi' where id = p_oda_id and durum = 'acik';
  end if;
  -- Oynanan odadan ayrılan son eksik kişiyse, kalanların sonucu hemen çıksın.
  if o.id is not null and o.durum = 'oynaniyor'
     and exists (select 1 from public.er_meydani_oda_oyuncu where oda_id = p_oda_id)
     and not exists (select 1 from public.er_meydani_oda_oyuncu where oda_id = p_oda_id and skor is null) then
    update public.er_meydani_oda set durum = 'bitti' where id = p_oda_id and durum = 'oynaniyor';
  end if;
  return json_build_object('durum','ayrildi');
end; $$;

-- ── SORU KAYDI ─────────────────────────────────────────────────────────────
create table if not exists public.er_meydani_cevap_log (
  id bigserial primary key,
  user_id uuid not null,
  mod text,
  oda_id uuid,
  seed bigint,
  cevaplar jsonb not null,           -- [{s: soru_id, k: kanun, i: isaretlenen|null, d: dogru_mu}]
  created_at timestamptz not null default now()
);
create index if not exists er_meydani_cevap_log_zaman on public.er_meydani_cevap_log (created_at desc);
create index if not exists er_meydani_cevap_log_oda on public.er_meydani_cevap_log (oda_id) where oda_id is not null;
alter table public.er_meydani_cevap_log enable row level security;

create or replace function public.er_meydani_cevap_kaydet(p_mod text, p_oda_id uuid, p_seed bigint, p_cevaplar jsonb)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if auth.uid() is null then return; end if;
  if jsonb_typeof(p_cevaplar) <> 'array' or jsonb_array_length(p_cevaplar) > 30 then return; end if;
  insert into public.er_meydani_cevap_log (user_id, mod, oda_id, seed, cevaplar)
    values (auth.uid(), left(p_mod, 20), p_oda_id, p_seed, p_cevaplar);
end $$;

grant execute on function public.er_meydani_oda_nabiz(uuid) to authenticated;
grant execute on function public.er_meydani_cevap_kaydet(text, uuid, bigint, jsonb) to authenticated;
revoke all on public.er_meydani_cevap_log from anon, authenticated;
