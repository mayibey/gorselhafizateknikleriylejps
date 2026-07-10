-- 21: DESTEK / TALEPLERİM — kullanıcı destek (ticket) sistemi.
-- Kullanıcı "Destek / Taleplerim" ekranından talep açar, mesajlaşır; başkan (admin)
-- service_role ile (dashboard/Edge fn) cevaplar ve durumu günceller.
-- Çalıştır: Supabase → SQL Editor → yapıştır → RUN. Idempotent.
--
-- Model: destek_talebi (başlık + durum) 1—N destek_mesaj (thread satırları).
--   durum: 'acik' (yanıt bekliyor) | 'cevaplandi' (admin yazdı) | 'kapandi' (çözüldü).
--   gonderen: 'kullanici' | 'admin'.
-- RLS: kullanıcı YALNIZ kendi taleplerini/mesajlarını okur+ekler; mesaj eklerken
--   gonderen='kullanici' zorunlu. Admin cevap + durum güncelleme service_role ile
--   (RLS bypass) yapılır — istemcinin admin yazma/güncelleme politikası YOK.

-- ── Talep tablosu ──────────────────────────────────────────────────────────
create table if not exists public.destek_talebi (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  konu           text not null,
  durum          text not null default 'acik' check (durum in ('acik', 'cevaplandi', 'kapandi')),
  created_at     timestamptz not null default now(),
  guncelleme_at  timestamptz not null default now()
);

create index if not exists destek_talebi_user_created_idx
  on public.destek_talebi (user_id, created_at desc);

alter table public.destek_talebi enable row level security;

-- Kullanıcı yalnız KENDİ taleplerini görür.
drop policy if exists "destek_talebi_select_own" on public.destek_talebi;
create policy "destek_talebi_select_own" on public.destek_talebi
  for select using (auth.uid() = user_id);

-- Kullanıcı yalnız KENDİ adına talep açar.
drop policy if exists "destek_talebi_insert_own" on public.destek_talebi;
create policy "destek_talebi_insert_own" on public.destek_talebi
  for insert with check (auth.uid() = user_id);

-- ── Mesaj (thread satırı) tablosu ──────────────────────────────────────────
create table if not exists public.destek_mesaj (
  id          uuid primary key default gen_random_uuid(),
  talep_id    uuid not null references public.destek_talebi(id) on delete cascade,
  gonderen    text not null check (gonderen in ('kullanici', 'admin')),
  metin       text not null,
  created_at  timestamptz not null default now()
);

create index if not exists destek_mesaj_talep_created_idx
  on public.destek_mesaj (talep_id, created_at);

alter table public.destek_mesaj enable row level security;

-- Kullanıcı yalnız SAHİBİ OLDUĞU talebin mesajlarını okur.
drop policy if exists "destek_mesaj_select_own" on public.destek_mesaj;
create policy "destek_mesaj_select_own" on public.destek_mesaj
  for select using (
    exists (
      select 1 from public.destek_talebi t
      where t.id = destek_mesaj.talep_id
        and t.user_id = auth.uid()
    )
  );

-- Kullanıcı yalnız SAHİBİ OLDUĞU talebe ve YALNIZ gonderen='kullanici' olarak mesaj ekler.
-- (Admin mesajları service_role ile eklenir → bu politika onları KAPSAMAZ, kapsamasına gerek yok.)
drop policy if exists "destek_mesaj_insert_own" on public.destek_mesaj;
create policy "destek_mesaj_insert_own" on public.destek_mesaj
  for insert with check (
    gonderen = 'kullanici'
    and exists (
      select 1 from public.destek_talebi t
      where t.id = destek_mesaj.talep_id
        and t.user_id = auth.uid()
        and t.durum <> 'kapandi'  -- admin KAPATTIYSA kullanıcı yazamaz (yeni talep açar)
    )
  );

-- ── Mesaj sonrası talebi güncelle (durum + guncelleme_at OTOMATİK) ──────────
-- Kullanıcının UPDATE politikası YOK; bu yüzden talep durumunu TRIGGER yürütür (definer,
-- RLS bypass): mesaj eklenince guncelleme_at=now + durum (admin yazdı→'cevaplandi',
-- kullanıcı yazdı→'acik'). Kapanmış talebe dokunma. Böylece istemcinin talep UPDATE'ine
-- gerek kalmaz (RLS'e takılmaz) ve durum kendiliğinden doğru akar.
create or replace function public.destek_mesaj_sonrasi() returns trigger
  language plpgsql security definer set search_path = public as $fn$
begin
  update public.destek_talebi
     set guncelleme_at = now(),
         durum = case when new.gonderen = 'admin' then 'cevaplandi' else 'acik' end
   where id = new.talep_id
     and durum <> 'kapandi';
  return new;
end;
$fn$;

drop trigger if exists destek_mesaj_sonrasi_trg on public.destek_mesaj;
create trigger destek_mesaj_sonrasi_trg
  after insert on public.destek_mesaj
  for each row execute function public.destek_mesaj_sonrasi();
