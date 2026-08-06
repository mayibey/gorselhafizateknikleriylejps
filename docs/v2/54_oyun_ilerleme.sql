-- 54 — OYUN MERKEZİ İLERLEMESİ (6 Ağu 2026)
--
-- Oyun merkezi (gömülü web sayfası) ilerlemesini tarayıcı deposuna yazıyor: açılan bölüm,
-- yıldız, rekor, günlük tur hakkı, oyuncu adı. Cihazda kalırsa telefon değişince gider —
-- bu tablo onu kullanıcıya bağlar.
--
-- NEDEN kullanici_ilerleme'ye EKLENMEDİ: o tablo sürümlü tek bir çalışma anlık görüntüsü
-- taşıyor ve sahiplik/karışma korumaları ona göre kurulu. Oyun kaydı bambaşka bir şey ve
-- çok daha sık yazılıyor; ayrı tutmak ikisini de basit tutuyor.

create table if not exists public.oyun_ilerleme (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  veri       jsonb not null default '{}'::jsonb,
  guncelleme timestamptz not null default now()
);

alter table public.oyun_ilerleme enable row level security;

-- Herkes YALNIZ kendi kaydını görür/yazar.
drop policy if exists oyun_ilerleme_kendi_oku on public.oyun_ilerleme;
create policy oyun_ilerleme_kendi_oku on public.oyun_ilerleme
  for select using (auth.uid() = user_id);

drop policy if exists oyun_ilerleme_kendi_yaz on public.oyun_ilerleme;
create policy oyun_ilerleme_kendi_yaz on public.oyun_ilerleme
  for insert with check (auth.uid() = user_id);

drop policy if exists oyun_ilerleme_kendi_guncelle on public.oyun_ilerleme;
create policy oyun_ilerleme_kendi_guncelle on public.oyun_ilerleme
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant select, insert, update on public.oyun_ilerleme to authenticated;
