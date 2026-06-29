# Bildirim Kurulumu — Kalıcı / Production-Doğru (Firebase + expo-notifications)

> Başkan kararı: bildirim gerçek olacak, gerekirse google-services.json kurulacak.
> Bu, **kalıcı** mimaridir: lokal hatırlatma ŞİMDİ çalışır, uzak push (FCM) ileride hazır.

## Mimari (en doğru hamle)
- **Lokal bildirim (ŞİMDİ aktif):** Günlük hatırlatmalar (Sabah İçtiması / Gece Eğitimi / Fırsat
  Eğitimi) — cihazın kendi zamanlayıcısı, **sunucu gerekmez**. `src/lib/bildirim.ts`. Kullanıcı
  Eğitim Planı ekranından saat/açık-kapalı ayarlar; uygulama açılışında otomatik (yeniden) planlanır.
- **Uzak push (v2, backend gelince):** `uzakPushTokenAl()` Expo push token üretir → Supabase'e
  yazılır → sunucudan **Expo Push API** (FCM/APNs proxy) ile gönderilir. Şimdilik yalnız token
  üretimi var, gönderim YOK.

## Neden google-services.json ZORUNLU
Android'de `expo-notifications` native Firebase Messaging içerir; `google-services.json` olmadan
standalone build **başlangıçta çöker** (eski sorunun kök nedeni buydu). Dosya eklenince **kalıcı
çözülür**. `app.json` zaten `android.googleServicesFile: "./google-services.json"` + `expo-notifications`
plugin'i ile yapılandırıldı.

## SENİN YAPACAĞIN (5 dk, ücretsiz) — Firebase Console
1. https://console.firebase.google.com → **Add project** (örn. "Mevzu JSPS"). Analytics kapatabilirsin.
2. Proje içinde **Add app → Android**.
   - **Android package name:** `app.mevzujsps.android`  *(app.json'daki ile BİREBİR aynı — şart)*
   - Nickname/SHA-1 opsiyonel (push için SHA-1 ileride faydalı; şimdilik atla).
3. **google-services.json indir.**
4. İndirilen dosyayı **repo kök dizinine** koy: `D:\GorselHafizaTeknikleriyleJSPS\google-services.json`
   *(gitignore'da — commit edilmez, her makinede elle durur.)*
5. Build al (yerel gradle / EAS) ve telefonda test et.

## Test
- **Expo Go (hızlı):** `npx expo start` → telefonda Expo Go ile aç. LOKAL bildirim Expo Go'da
  (Android) çalışır → izin sor + Eğitim Planı'ndan saatleri yakın bir vakte ayarla, "Kaydet".
  (google-services.json Expo Go için GEREKMEZ; yalnız native build için.)
- **Native build (gerçek/standalone):** Önce google-services.json'u ekle (yoksa build çöker),
  sonra build al. Arka planda zamanında bildirim düşmeli.

## Kod tarafı (HAZIR)
- `src/lib/bildirim.ts` — izinIste / planla (günlük zamanlama) / uzakPushTokenAl (iskele).
- `src/app/_layout.tsx` — açılışta `getAyar().then(planla)`.
- `src/app/egitim-plani.tsx` — ayar değişince `planla` (zaten bağlıydı, artık gerçek çalışıyor).
- `app.json` — expo-notifications plugin + googleServicesFile.

## İleride (v2, backend ile)
- Auth/Supabase gelince: açılışta `uzakPushTokenAl()` → token'ı `kullanici_push_token` tablosuna yaz.
- Sunucudan (Supabase Edge Function / cron) Expo Push API'ye POST → toplu/kişisel push
  ("yeni içerik", "sınava 7 gün kaldı", "premium bitiyor"). FCM kimlik bilgisi EAS'a yüklenir.
- İYİLEŞTİRME: Android bildirim ikonu için beyaz-silüet PNG ekle (şu an varsayılan); kanal sesi opsiyonel.
