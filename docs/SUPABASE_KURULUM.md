# Supabase Kurulumu — İçtima Alanı

İçtima Alanı (üyelik + genel sohbet) için backend. **3 adım, ~10 dakika.** Bu adımlar
tamamlanana kadar uygulama eskisi gibi offline çalışır (giriş kapısı uyur).

## 1) Proje aç
1. [supabase.com](https://supabase.com) → ücretsiz hesap → **New project**.
2. İsim ver, güçlü bir veritabanı şifresi belirle, bölge **Frankfurt (eu-central)** seç (Türkiye'ye yakın).
3. Proje hazır olunca: **Project Settings → API** sayfasından şunları kopyala:
   - **Project URL** (örn. `https://xxxx.supabase.co`)
   - **anon public** anahtarı (uzun `eyJ...` jetonu)

## 2) Anahtarları uygulamaya gir
Proje kökünde `.env` dosyası oluştur (yoksa) ve şunu yaz (`.env.example`'ı kopyalayabilirsin):

```
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

Sonra `npx expo start` yeniden başlat. (anon anahtar herkese açıktır, güvenli — RLS verir korumayı.)

## 3) Veritabanı şemasını kur
Supabase panelinde **SQL Editor → New query** → aşağıdakini yapıştır → **Run**:

```sql
-- PROFİLLER (herkese açık kimlik) ----------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  kullanici_adi text unique not null,
  brans text,
  olusturma timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "profiller herkese okunur" on public.profiles for select using (true);
create policy "kendi profilini gunceller" on public.profiles for update using (auth.uid() = id);

-- Yeni kullanıcı → otomatik profil (kullanıcı adı kayıt metadata'sından)
create or replace function public.handle_new_user() returns trigger
  language plpgsql security definer as $$
begin
  insert into public.profiles (id, kullanici_adi)
  values (new.id, coalesce(new.raw_user_meta_data->>'kullanici_adi', 'er_' || substr(new.id::text, 1, 8)));
  return new;
end; $$;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- İÇTİMA MESAJLARI (genel sohbet) -----------------------------------------
create table public.ictima_mesaj (
  id bigint generated always as identity primary key,
  gonderen_id uuid not null references public.profiles(id) on delete cascade,
  metin text not null check (char_length(metin) between 1 and 1000),
  tarih timestamptz default now()
);
alter table public.ictima_mesaj enable row level security;
create policy "mesajlar herkese okunur" on public.ictima_mesaj for select using (true);
create policy "giris yapan mesaj atar" on public.ictima_mesaj
  for insert with check (auth.uid() = gonderen_id);
create policy "kendi mesajini siler" on public.ictima_mesaj
  for delete using (auth.uid() = gonderen_id);

-- Canlı akış (realtime)
alter publication supabase_realtime add table public.ictima_mesaj;

-- RAPOR (moderasyon) ------------------------------------------------------
create table public.rapor (
  id bigint generated always as identity primary key,
  mesaj_id bigint references public.ictima_mesaj(id) on delete cascade,
  raporlayan_id uuid references public.profiles(id),
  sebep text,
  tarih timestamptz default now()
);
alter table public.rapor enable row level security;
create policy "rapor ekle" on public.rapor
  for insert with check (auth.uid() = raporlayan_id);

-- HESAP SİLME (kullanıcı kendi hesabını siler; profiles + mesajlar cascade ile gider) --
create or replace function public.hesabi_sil() returns void
  language sql security definer set search_path = public as $$
  delete from auth.users where id = auth.uid();
$$;

-- KULLANICI ENGELLEME (UGC kuralı) ---------------------------------------
create table public.engellenenler (
  engelleyen_id uuid not null references public.profiles(id) on delete cascade,
  engellenen_id uuid not null references public.profiles(id) on delete cascade,
  tarih timestamptz default now(),
  primary key (engelleyen_id, engellenen_id)
);
alter table public.engellenenler enable row level security;
create policy "kendi engellerini gorur" on public.engellenenler
  for select using (auth.uid() = engelleyen_id);
create policy "engelle ekle" on public.engellenenler
  for insert with check (auth.uid() = engelleyen_id);
create policy "engel kaldir" on public.engellenenler
  for delete using (auth.uid() = engelleyen_id);
```

## 4) (Önerilen) E-posta doğrulama
İlk testte hız için: **Authentication → Providers → Email → "Confirm email" KAPALI** yapabilirsin
(kayıt olur olmaz giriş). Canlıya çıkarken aç.

---
Bittiğinde haber ver — giriş kapısı + İçtima sohbeti otomatik aktifleşir, birlikte test ederiz.
**Not (KVKK):** canlıya çıkmadan önce gizlilik politikası + kullanım şartları metni gerekir
(sohbet = kişisel veri). Moderasyon: rapor tablosu hazır; v2'de panel + engelle/sil eklenir.

## v2 (sonra) — DM + arkadaşlık
`arkadaslik`, `dm_konusma`, `dm_mesaj` tabloları + RLS; plan: `docs/ICTIMA_ALANI_PLAN.md`.
