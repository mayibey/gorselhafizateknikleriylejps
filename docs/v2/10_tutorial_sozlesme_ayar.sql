-- 10: Tutorial "görüldü" bilgisi SUNUCUYA + sözleşme onay tarihi + uzaktan ayar (feature flag)
-- Neden: tanıtım turu cihaz-yerel AsyncStorage'daydı (jsps.tanitim.tamam) → hesap/cihaz değişince
-- takip edilemiyor, test için tekrar açılamıyordu. Artık HESABA bağlı: her hesap bir kez görür.
-- Sözleşme onayı: KVKK/kullanım şartları onay ANI kanıt olarak profile yazılır (kayıtta bir kez).
-- uygulama_ayar: build almadan sunucudan açılıp kapanabilen bayraklar (ilk kullanım: telefon girişi).

-- 1) profiles yeni kolonlar (kullanıcı kendi satırını zaten güncelleyebiliyor — mevcut RLS yeterli)
alter table public.profiles add column if not exists tanitim_gordu timestamptz;
alter table public.profiles add column if not exists sozlesme_onay timestamptz;

comment on column public.profiles.tanitim_gordu is 'Tanıtım turunu tamamladığı an (null = henüz görmedi)';
comment on column public.profiles.sozlesme_onay is 'Kullanım Şartları + Gizlilik Politikası onay anı (kayıtta bir kez)';

-- 2) Uzaktan ayar/bayrak tablosu: herkes OKUR, yalnız service_role yazar (yazma policy'si YOK)
create table if not exists public.uygulama_ayar (
  anahtar text primary key,
  deger text not null,
  guncelleme timestamptz not null default now()
);
alter table public.uygulama_ayar enable row level security;
drop policy if exists "ayar_okuma" on public.uygulama_ayar;
create policy "ayar_okuma" on public.uygulama_ayar for select using (true);

-- Telefon girişi bayrağı: '0' kapalı, '1' açık (MasGSM hesabı + başlık hazır olunca '1' yapılacak)
insert into public.uygulama_ayar (anahtar, deger) values ('telefon_giris', '0')
  on conflict (anahtar) do nothing;
