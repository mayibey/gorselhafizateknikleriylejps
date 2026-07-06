# Apple (iOS) İndirim & Promo Kod Planı

> Amaç: Google'daki iki özelliği iPhone'a taşımak → (1) ilk 48 saat indirimi (`ilk_giris`),
> (2) kullanıcı kodu (ör. `suem2020ozel30`). Durum: **iOS'ta şu an İKİSİ DE çalışmıyor**
> (paywall iOS dalı base/indirimsiz). Bu plan "nasıl eklenir"i çıkarır. Aciliyet: DÜŞÜK
> (çekirdek test/yayın önce; test'te kilit kapalı).

## 1. Neden Google'daki sistem birebir taşınmaz
- **Google:** sunucu "bu kişiye %X indirim" der; ürüne bağlı **teklif (offerToken)** ile
  indirimli fiyat Play'den çekilir. `ilk_giris` + promo kod buna dayanır (paywall
  `yillikIndirimliTeklif` / `omurboyuIndirimliTeklif`, `subscriptionOfferDetailsAndroid`).
- **Apple:** IAP **fiyatları sabit**; sunucudan dinamik indirim UYGULANAMAZ. Apple'ın kendi
  araçları var, hepsi farklı ve kısıtlı. Kullanıcının **uygulama içi kutuya kod yazıp** Apple'dan
  %indirim alması yerleşik olarak YOK (Apple kodları App Store redeem ekranından geçer).

## 2. Apple'ın araçları (gerçek kısıtlar)
### Abonelik (yıllık — `musterek_yillik`, auto-renewable)
- **Introductory Offer (tanıtım teklifi):** İLK KEZ abone olana indirim/deneme (free trial /
  pay-up-front / pay-as-you-go). Apple yönetir, kod/sunucu gerekmez. Ama "ilk kez" = *o gruba hiç
  abone olmamış*, **"ilk 48 saat" DEĞİL** (zaman penceresi kurulamaz).
- **Promotional Offer:** MEVCUT/ayrılmış abonelere; **sunucu imzalı teklif** (ASC'den özel anahtar)
  gerektirir. Win-back için; yeni kullanıcı 48h senaryosuna uymaz.
- **Offer Code (teklif kodu):** ÖZEL kod (ör. `suem2020ozel30`) üretilebilir (tek özel kod ~500k
  kullanım). Redeem **App Store ekranından** olur; uygulama içinden `presentCodeRedemptionSheet`
  ile o ekran açılabilir. **Yalnız abonelik** (non-consumable'a yok).

### Ömür boyu (`musterek_omurboyu`, non-consumable)
- Apple'da **indirim mekanizması YOK** (intro/promo/offer-code hiçbiri non-consumable'a çalışmaz).
- Tek pratik yol: **indirimli fiyatlı İKİNCİ ürün** oluşturup hangisini göstereceğine sunucu karar verir.

## 3. ÖNERİLEN: Birleşik "indirimli kopya ürün" yaklaşımı
Mantık: mevcut sunucu indirim motorunu (48h penceresi + promo kod doğrulama) AYNEN koru; sadece
"indirimi nasıl teslim ederiz" kısmını Apple'a uydur.
- ASC'de her ürünün indirim kademesi kopyalarını oluştur: `musterek_yillik_ind20/30`,
  `musterek_omurboyu_ind20/30` (+ branş varyantları).
- `indirim_durumu` sunucu mantığı DEĞİŞMEZ (48h + kod → `{yuzde, kaynak}`).
- iOS paywall: sunucu "%X indirim" dediğinde **base yerine ilgili indirimli ürünü** `requestPurchase` et.
- Promo kod: **uygulama içi kutu** (Android'deki gibi) → sunucu doğrular → indirimli ürün sunulur.
- **Artı:** sunucu mantığı + UX Android'le aynı; hem abonelik hem ömür boyu; kod uygulama içinde yazılır;
  "ilk 48 saat" AYNEN çalışır (pencereyi sunucu hesaplar).
- **Eksi:** ASC'de ürün sayısı artar; abonelikte aynı grupta ekstra ürünler grup yükselt/düşür
  semantiğini karıştırabilir → dikkatli kurulmalı. Fiyat kademeleri Apple picker'dan seçilir (başkan).

## 4. ALTERNATİF: Apple-yerlisi (daha "temiz", Android'den farklı UX)
- Yıllık: **Introductory Offer** (ilk kez indirimi) + **Offer Code** (özel kod, App Store ekranından).
- Ömür boyu: yine indirimli kopya ürün (Apple'da başka yol yok).
- **Artı:** Apple'ın önerdiği yol.
- **Eksi:** "ilk 48 saat" tam kurulamaz; kod App Store ekranından girilir (senin kutuna değil); iki
  platform farklı davranır; `presentCodeRedemptionSheet` için küçük native ekleme gerekebilir.

## 5. Öneri & efor
- **Öneri: Birleşik kopya-ürün yaklaşımı** (en az sürpriz, Android'le tutarlı, 48h + kod birebir çalışır).
- Efor (orta): ASC'de indirimli ürünler (başkan + ben) · iOS paywall ürün-seçim mantığı (ben) ·
  promo kutuyu iOS'a bağla (ben) · satın-alma doğrulamada indirimli ürün ID'lerini tanı (ben).
- **Zamanlama:** çekirdek test + yayın bitince. Şimdilik kilit kapalı → aciliyet yok.

## 6. Başkandan gereken (iş vakti gelince)
- ASC'de indirimli ürünlerin **fiyat kademesi seçimi** (Apple "Choose a Price" picker → otomasyon
  kısıtlı, başkan elle seçer; ürün oluşturma + localize otomasyonla yapılabilir).
