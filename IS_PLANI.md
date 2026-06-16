# İŞ PLANI — Sıralı Yapılacaklar (Mevzu-JSPS)

> Bu dosya **aksiyon listesidir** (PROJE_DURUM.md seyir defteri; bu ise "şimdi ne yapıyoruz").
> Her adım: **[SEN]** = senin yapman gereken (hesap/para/anahtar/build) · **[KOD]** = Claude yazar.
> Sırayla git; biten kutuyu `[x]` yap. Bir faz bitmeden sonrakine geçme (bağımlılık var).
> Son güncelleme: 16 Haziran 2026

---

## Nerede kaldık (özet)
Uygulama çekirdeği HAZIR: 4 sekme, SRS, patika (66 kanun), istatistik, quiz, bildirim,
filigran, içerik (TCK+Kabahatler+23 müşterek görsel + TTS), madde metni (%79), kart akışı
ileri/geri okları. **Üyelik altyapısı (Gmail giriş) KOD olarak kuruldu** — sadece
provisioning (anahtar) bekliyor. Eksik büyük parçalar: üyelik aktifleştirme → gerçek build →
satın alma → mağaza yayını.

---

## FAZ A — Üyelik aktifleştir (Gmail giriş çalışsın)  ⏳ ÖNCE BU
> Kod hazır; sadece senin hesap açıp anahtar girmen lazım. Ücretsiz. Detay: `docs/UYELIK_KURULUM.md`.

- [ ] **A1 [SEN]** supabase.com → yeni proje aç (bölge: Frankfurt/EU). Project URL + anon key kopyala.
- [ ] **A2 [SEN]** Google Cloud Console → OAuth consent screen (External) + test user olarak kendi Gmail'in.
- [ ] **A3 [SEN]** Google Cloud → Credentials → OAuth client (Web) → redirect: `https://<proje>.supabase.co/auth/v1/callback` → Client ID + Secret al.
- [ ] **A4 [SEN]** Supabase → Authentication → Providers → Google'ı aç, Client ID/Secret yapıştır. URL Configuration → Redirect URLs'e `mevzu://` ekle.
- [ ] **A5 [SEN]** Proje kökünde `.env`: `EXPO_PUBLIC_SUPABASE_URL=...` + `EXPO_PUBLIC_SUPABASE_ANON_KEY=...` → `npx expo start -c`.
- [ ] **A6 [SEN+BEN]** Telefonda Sicil → "Gmail ile giriş yap" → dene. Takılırsan (genelde redirect URL) bana söyle, birlikte ayıklarız.

**Sonuç:** Gmail girişi çalışır. Buradan sonra "kim üye" bilinir → satın alma mümkün olur.

---

## FAZ B — Geliştirici hesapları (mağaza + satın alma için ŞART)
> Süreç uzayabilir (Google kimlik doğrulaması günler sürebilir) → ERKEN başla, paralel ilerlesin.

- [ ] **B1 [SEN]** Google Play Console hesabı aç (tek seferlik **$25**). Kimlik doğrulamasını başlat.
- [ ] **B2 [SEN]** (iOS de istiyorsan) Apple Developer Program (**$99/yıl**). İstemiyorsan şimdilik atla → sadece Android.
- [ ] **B3 [KARAR]** Önce hangi platform? Öneri: **Android önce** (ucuz, hızlı), iOS sonra.

---

## FAZ C — İlk gerçek build (EAS)  → native özellikler test edilir
> Expo Go'nun ötesi: ekran-görüntüsü engeli, bildirim, ileride satın alma sadece gerçek build'de çalışır.
> `eas.json` + projectId zaten hazır.

- [ ] **C1 [KOD]** Build öncesi denetim: app.json (ikon/splash/izinler/sürüm), eas.json profilleri gözden geçir.
- [ ] **C2 [SEN]** `npx eas login` + `npx eas build -p android --profile preview` (ilk APK/AAB).
- [ ] **C3 [SEN+BEN]** Telefona kur, gez: giriş, bildirim, ekran-görüntüsü engeli, kart akışı çalışıyor mu?

---

## ⭐ KARAR NOKTASI — Yayın stratejisi (Faz C'den sonra)
> Bu kararı Faz D/E sırasını belirler. İkisinden birini seç:
- [ ] **Seçenek 1 (ÖNERİLEN): Önce ÜCRETSİZ yayınla** → kullanıcı topla/onayı al → satın almayı v2 güncellemeyle ekle. *Hızlı, düşük risk.* → Sıra: **E (yayın) → D (satın alma)**.
- [ ] **Seçenek 2: Satın almayı baştan koy, öyle yayınla.** *Geç ama tek seferde paralı.* → Sıra: **D → E**.

---

## FAZ D — Satın alma / Freemium (para modeli)  💰
> En büyük teknik parça. Gerçek build + developer hesabı + RevenueCat ister. Karar gerektiren detaylar var.

- [ ] **D1 [KARAR]** Fiyat modeli: tek seferlik mi (örn. "tüm içerik 299 TL") yoksa abonelik mi (aylık/yıllık)?
- [ ] **D2 [KARAR]** Freemium sınırı: ücretsiz ne açık? (örn. TCK ilk N kart + 1-2 müşterek tadımlık; gerisi kilitli.)
- [ ] **D3 [SEN]** RevenueCat hesabı aç + Play/App Store'da ürün(ler) tanımla.
- [ ] **D4 [KOD]** RevenueCat SDK entegrasyonu (`react-native-purchases`) + erişim durumu (free/premium) auth'a bağlı.
- [ ] **D5 [KOD]** Paywall ekranı + kilitli içerikte "Satın al" + satın alınca tüm kanunlar açılır.
- [ ] **D6 [KOD]** Filigranı/erişimi gerçek user ID'ye bağla (şu an cihaz-ID).
- [ ] **D7 [SEN+BEN]** Gerçek build'de satın alma akışını test (sandbox).

---

## FAZ E — Mağaza yayını
- [ ] **E1 [SEN]** Gizlilik metnini yayınla (GitHub Pages hazır) → `config.ts` URL'leri doğrula.
- [ ] **E2 [KOD]** Yasal/gizlilik metnini **hesap/üyelik verisini** yansıtacak şekilde güncelle (KVKK; üyelik eklendi).
- [ ] **E3 [SEN]** Mağaza görselleri: ekran görüntüleri, feature graphic, ikon (mevcut `docs/MAGAZA_LISTELEME.md`).
- [ ] **E4 [KOD]** Mağaza açıklaması/anahtar kelime/veri beyanı güncelle (`docs/` dökümanları üyelikli hale getir).
- [ ] **E5 [SEN]** `npx eas build -p android --profile production` → AAB → Play Console'a yükle.
- [ ] **E6 [SEN]** Play: kapalı test (≥14 gün, ~20 test kullanıcısı) → sonra production. (Apple ise review.)

---

## PARALEL HAT — İçerik & iyileştirme (her an, build/hesap beklemez)
- [ ] **P1 [SEN+KOD]** Madde metni boşlukları (%21): görsel madde-no ≠ master no olan kanunlar (6136 Ateşli, Bilgi Edinme) — görselleri doğru madde no'yla yeniden adlandır → `madde:uret`.
- [ ] **P2 [SEN]** 4733 görselleri gelince `assets/kartlar/4733/`'e koy → `gorsel:uret` → kartlar döner.
- [ ] **P3 [SEN+KOD]** Branş içeriği (16 branş) — görsel geldikçe; `BransYakinda` yerine gerçek liste.
- [ ] **P4 [KOD]** SRS bulut senkronu: Supabase tablo + RLS + ilerlemeyi buluta yaz/oku (cihaz değişince kayıp olmasın). *Faz A'dan sonra.*

---

## Önerilen genel sıra (özet)
**A (üyelik aktif) → B (hesaplar, paralel başlat) → C (ilk build) → [karar] → E (ücretsiz yayın) → D (satın alma v2)**
İçerik (P) hep paralel. SRS senkron (P4) Faz A biter bitmez yapılabilir.

> **Şimdi ilk adım: A1.** Supabase projesini aç, URL + anon key'i al; gerisini birlikte yaparız.
