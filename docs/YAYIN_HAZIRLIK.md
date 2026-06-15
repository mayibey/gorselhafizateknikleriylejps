# Yayın Hazırlık Checklist (Google Play)

Durum: ⬜ yapılacak · ✅ yapıldı · 👤 sende (hesap/dış/para) · ⏳ bekleme (takvim)

> Hedef: **Google Play** (Android). Kod tarafı denetim+düzeltmeleri `docs/YAYIN_DENETIM_GUVENLIK.md`'de.

## 0. Kararlar (GÜNCEL)
- ✅ **v1 = İÇTİMA YOK** (sohbet/hesap/backend kaldırıldı) — uygulama %100 **çevrimdışı**, hesapsız.
- ✅ **Uygulama adı: Mevzu**.
- ✅ **Pro üyelik / satış = v2** (onaydan sonra; RevenueCat + Google Play Billing).
- ✅ **Sesli özellik + Tatbikat v1'de gizli** (içerik gelince geri açılır).

## 1. Yasal / metin (BENDE — ✅ bitti)
- ✅ Gizlilik Politikası (İçtima'sız, çevrimdışı) → `docs/GIZLILIK_POLITIKASI.md`
- ✅ Kullanım Şartları (EULA, İçtima'sız) → `docs/KULLANIM_SARTLARI.md`
- ✅ Mağaza listeleme metinleri (Google Play) → `docs/MAGAZA_LISTELEME.md`
- ✅ Uygulama içi yasal metin (canonical) → `src/constants/yasal-metin.ts` + `/yasal` ekranı
- ✅ "Resmî kurumla bağlantılı değildir" ibaresi (yasal + Sicil altı görünür)
- 👤 Yer tutucuları doldur (şirket/iletişim/şehir/tarih) + **bir web sayfasında yayınla** (URL şart)
- 👤 (Önerilen) avukat/danışman onayı

## 2. Uygulama içi (BENDE — ✅ bitti)
- ✅ Gizlilik & Şartlar erişimi: Sicil → "Gizlilik & Kullanım Şartları" → `/yasal` (URL boşken de çalışır)
- ✅ Review-risk temizliği: sahte geri bildirim gizlendi · Tatbikat tek "yakında" · Karargah sahte
  "Mini Tatbikat" kaldırıldı · "Günün Maddesi" gerçek karta bağlı · demo düğmeleri `__DEV__`
- ✅ İçerik koruması: kullanıcıya özel filigran + `expo-screen-capture` (kart akışında ekran görüntüsü engeli)

## 3. Build yapılandırma (BENDE hazır, build SENDE)
- ✅ `android.package` = com.mayibey.jsps · uygulama adı/sürüm (app.json)
- ✅ `expo-notifications` config plugin (Android kanal/ikon) eklendi
- ✅ EAS profilleri (eas.json: development/preview/production app-bundle)
- 👤 `eas build -p android --profile production` (senin EAS hesabınla → AAB)
- 👤 Development build ile cihazda dene (bildirim + ekran-görüntüsü-engeli yalnız gerçek build'de çalışır)

## 4. Mağaza varlıkları
- ✅ Uygulama ikonu (app.json adaptiveIcon)
- ⬜ **Feature graphic (1024×500)** — Play zorunlu
- 👤 Ekran görüntüleri: Android telefon (zorunlu) + 7"/10" tablet (önerilir)
- ✅ Açıklama/kategori/yaş/veri beyanı metinleri (`docs/MAGAZA_LISTELEME.md`)
- 👤 Kart görsellerinde **birebir resmî jandarma/SG logosu-amblemi olmadığını teyit et** (maskot Cüneyt terk edildi; risk karakter değil, resmî logonun aynen kopyalanması)

## 5. Hesap & süreç (SENDE / BEKLEME)
- 👤 Google Play Console ($25) hesabı + kimlik doğrulama ⏳
- 👤 Gizlilik Politikası URL'sini Console'a gir + Data Safety formu (`MAGAZA_LISTELEME.md` tablosu)
- 👤 İçerik derecelendirme anketi (IARC — UGC yok → düşük derece)
- ⏳ **Google yeni kişisel hesap:** 20 test kullanıcı / 14 gün kapalı test (üretimden önce)
- ⏳ Review kuyruğu: saat–birkaç gün

## 6. v2 (onaydan SONRA — backend gerektirir, kod bende, hesap/para sende)
- Pro üyelik (RevenueCat + Google Play Billing) · sunucu-kapılı premium içerik + imzalı URL ·
  Google Play Integrity (korsan) · 2-cihaz limiti · filigranı gerçek user ID'ye bağlama.

---
**Özet:** Yasal/metin (1), uygulama-içi (2), build config (3) **bende bitti**. Kalan bende: feature
graphic dışında yok. **Asıl takvim:** Play Console hesabı + gizlilik URL yayını + 14 gün kapalı test.
**SENDE kritik:** gizlilik URL'sini yayınla → `config.ts`'e yaz; maskot amblemini stilize et.
