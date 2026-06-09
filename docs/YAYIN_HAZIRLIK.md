# Yayın Hazırlık Checklist (App Store + Play Store)

Durum: ⬜ yapılacak · ✅ yapıldı · 👤 sende (hesap/dış) · ⏳ bekleme (takvim) · ❓ karar gerek

## 0. Kararlar (VERİLDİ)
- ✅ **v1 İçtima'LI** (sosyal dahil) — UGC/hesap kuralları geçerli.
- ✅ **Uygulama adı: Mevzu** (app.json + giriş ekranı işlendi).

## 1. Yasal / metin (BENDE — başlandı)
- ✅ Gizlilik Politikası taslağı → `docs/GIZLILIK_POLITIKASI.md`
- ✅ Kullanım Şartları (EULA) taslağı → `docs/KULLANIM_SARTLARI.md`
- ✅ Mağaza listeleme metinleri → `docs/MAGAZA_LISTELEME.md`
- 👤 Yer tutucuları doldur (şirket/iletişim/şehir/tarih) + **bir web sayfasında yayınla** (URL şart)
- 👤 (Önerilen) avukat/danışman onayı

## 2. Uygulama içi (BENDE)
- ✅ Gizlilik & Şartlar erişimi: giriş ekranında onay linki + /hesap'ta linkler (config'teki URL'ye)
- ✅ **Hesap silme** ekranı + işlevi (/hesap → Hesabı Sil; rpc hesabi_sil; Apple/Google zorunlu)
- ✅ **Kullanıcı engelleme** (İçtima uzun-bas → Engelle; engellenenin mesajları gizlenir) + rapor zaten var
- ⬜ Review-risk temizliği (kırık "yakında" akışları; demo düğmeler zaten __DEV__)

## 3. Build yapılandırma (BENDE hazır, build SENDE)
- ⬜ iOS `bundleIdentifier` (örn. com.mayibey.jsps) + izin metinleri (infoPlist)
- ⬜ expo-notifications config plugin (Android kanal/ikon)
- ⬜ Uygulama adı/sürüm kesinleştir (app.json)
- 👤 `eas build -p ios/android --profile production` (senin EAS hesabınla)
- 👤 Cihazda dene (development build), kritik akışları gez

## 4. Mağaza varlıkları
- ⬜ Uygulama ikonu (cila) + (gerekirse) feature graphic (Play)
- 👤 Ekran görüntüleri: iPhone 6.7"/6.5" zorunlu, Android telefon + tablet
- ✅ Açıklama/anahtar kelime/kategori metinleri (docs/MAGAZA_LISTELEME.md)

## 5. Hesap & süreç (SENDE / BEKLEME)
- 👤 Apple Developer ($99/yıl) + Google Play Console ($25) hesabı + kimlik doğrulama ⏳
- 👤 (İçtima'lı, hesap girişli) reviewer için **demo hesap**
- 👤 Apple App Privacy + Google Data Safety formları (docs'taki tabloya göre)
- ⏳ **Google yeni hesap:** 20 test kullanıcı / 14 gün kapalı test (üretimden önce)
- ⏳ Review kuyruğu: Apple ~1–3 gün, Google saat–gün

## 6. (İçtima'lı ise) Backend
- 👤 Supabase projesi + SQL (docs/SUPABASE_KURULUM.md) + `.env` anahtarları
- ⬜ Canlı test (giriş + sohbet + rapor/engelle)

---
**Özet:** 1. ve 4.'ün metin kısmı ✅ (bende bitti). Sıradaki bende: 2. (uygulama-içi ekranlar) +
3.'ün config kısmı. Asıl takvimi belirleyen: hesap onayı + Google 14 gün test + review.
**İçeriği zenginleştirmek ayrı iş ama Apple'da "geçme"nin asıl kilidi.**
