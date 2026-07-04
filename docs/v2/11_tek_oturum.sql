-- 11: TEK OTURUM (her hesap aynı anda tek cihazda) — kendi mekanizmamız (Supabase Pro'suz)
-- Girişte cihaz benzersiz bir oturum kimliği üretir → profiles.aktif_oturum'a yazar (sahiplenir).
-- Diğer cihaz uygulamayı öne getirince kimliğini sunucuyla karşılaştırır; farklıysa oturumu düşer.
-- Kullanıcı kendi satırını güncelleyebildiği için mevcut RLS yeterli.

alter table public.profiles add column if not exists aktif_oturum text;

comment on column public.profiles.aktif_oturum is 'Bu hesabı en son sahiplenen cihazın oturum kimliği (tek-oturum kuralı; null = henüz sahiplenilmedi)';
