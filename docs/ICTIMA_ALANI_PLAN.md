# İÇTİMA ALANI — Uygulama Planı (Başkan'ın 4. fikri)

> Durum: **PLANLANDI, kod BAŞLAMADI.** Sebep: sohbet + arkadaş + özel mesaj **backend
> ZORUNLU** kılar. Mevcut uygulama %100 offline/lokal (expo-sqlite + AsyncStorage, sunucu yok).
> Bu özellik için önce **altyapı kararı** verilmeli (aşağıda). Karar gelince bu plan uygulanır.

## Ne isteniyor
- **İçtima Alanı**: kullanıcılar ortak alanda **sohbet** edebilsin.
- Kullanıcılar birbirini **arkadaş** ekleyebilsin.
- **Özel mesajlaşma (DM)**.

## Neden lokal yapılamaz
Sohbet/DM = iki cihaz arasında gerçek-zamanlı veri = **sunucu** + **kimlik (kim kimdir)** +
**kalıcı ortak veritabanı** + **gerçek-zamanlı iletim** gerekir. Bunların hiçbiri telefonun
içinde olamaz. Ayrıca:
- **Üyelik/Auth**: kullanıcıların hesabı olmalı (şu an hesap YOK; branş AsyncStorage'da). Bu zaten
  yol haritasındaki "Üyelik + ödeme / gerçek user ID" kararıyla aynı kapı.
- **Moderasyon**: açık sohbet → küfür/taciz/spam denetimi (rapor/engelle/sil) ŞART.
- **KVKK / yasal**: kullanıcı mesajları kişisel veri → aydınlatma metni, veri işleme, saklama/silme
  politikası, 18+ / rıza. Sözleşme + gizlilik politikası gerekir.
- **Maliyet**: sunucu + push + depolama aylık ücret (kullanıcı sayısıyla artar).

## Önerilen yığın: **Supabase**
Expo ile en uyumlu, tek pakette: **Auth** + **Postgres** + **Realtime** (canlı sohbet) +
**Row Level Security** (kullanıcı sadece kendi DM'lerini görür) + Storage. Alternatifler:
Firebase (Google), kendi sunucun (en pahalı/uğraşlı). Öneri: Supabase.

## Veri modeli (taslak — Supabase/Postgres)
- `profiles` (id=auth.uid, kullanici_adi, brans, rutbe/rozet, olusturma)
- `arkadaslik` (isteyen_id, istenen_id, durum: beklemede/kabul/red, tarih) — RLS: taraflar görür
- `dm_konusma` (id, uye_a, uye_b) + `dm_mesaj` (konusma_id, gonderen_id, metin, tarih, okundu)
- `ictima_mesaj` (genel sohbet: id, gonderen_id, metin, tarih) + `rapor` (mesaj_id, raporlayan, sebep)
- Realtime: `dm_mesaj` ve `ictima_mesaj` tablolarına abonelik (canlı akış).
- RLS politikaları: DM yalnız taraflarına; profiller herkese okunur; mesaj silme yalnız sahibi/moderatör.

## Uygulama tarafı (Expo) — fazlar
1. **Auth/Üyelik**: kayıt/giriş (e-posta veya telefon), oturum sakla, `profiles` oluştur.
   (Filigrandaki cihaz-ID → gerçek user ID'ye burada bağlanır.)
2. **Profil & Arkadaşlık**: kullanıcı arama, istek gönder/kabul, arkadaş listesi.
3. **DM**: konuşma listesi + mesaj ekranı (realtime), okundu bilgisi.
4. **İçtima Alanı (genel sohbet)**: tek/branş bazlı oda, realtime akış, rapor/engelle.
5. **Moderasyon paneli + KVKK metinleri** (gizlilik politikası, kullanım şartları, rapor akışı).
6. **Push** (uzaktan): yeni mesaj bildirimi (expo-notifications + Supabase Edge Function/webhook).

## Senden gereken KARAR (bunlar olmadan kod başlamaz)
1. **Backend onayı**: Supabase'le gidelim mi? (önerim evet) — proje/hesap + (ücretsiz başlar, büyüyünce ücretli).
2. **Üyelik modeli**: giriş zorunlu mu (uygulamayı kullanmak için), yoksa sadece İçtima Alanı için mi?
   E-posta mı telefon mu?
3. **Kapsam v1**: önce sadece **genel İçtima sohbeti** mi, yoksa baştan **arkadaş + DM** dahil mi?
   (Öneri: v1 = Auth + genel sohbet; DM/arkadaş v2.)
4. **Moderasyon/yasal**: gizlilik politikası + kullanım şartları metnini kim hazırlayacak?
   (Hukuki sorumluluk — KVKK.)
5. **Bütçe**: aylık küçük sunucu/push maliyetini kabul ediyor musun?

> Karar verince: önce Auth + `profiles` (faz 1) iskeletini kurarım, sonra genel sohbet (faz 4),
> sonra DM/arkadaş. Her faz ayrı commit. Bu özellik diğer 3'ten (lokal) bağımsız ilerleyebilir.
