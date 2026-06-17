# Ürün Yol Haritası — Güvenlik + Para Modeli + Üyelik (JSPS)

> Hedef: Uygulamayı ücretli, güvenli, freemium bir ürüne dönüştürmek. Ücretsiz tadımlık + satın alınca tam erişim. Kullanıcıya özel filigran, ekran görüntüsü koruması, üst düzey tasarım.

---

## Sert gerçekler (önce bunlar)
1. **Ekrandan başka telefonla fotoğraf TAM engellenemez** ("analog açık"). Çözüm: engellemek değil, **caydırmak + kaçağı yakalamak** → kullanıcıya özel görünür filigran (forensic watermark).
2. **Native özellikler Expo Go'da çalışmaz** (FLAG_SECURE, IAP). Ücretli ürün = gerçek **development/production build** şart. iOS App Store = **Apple Developer hesabı ($99/yıl)**.
3. **Üyelik + ödeme = backend gerekiyor.** Lokal SQLite yetmez. Öneri: **Supabase** (hesap + erişim durumu) + **RevenueCat** (App Store/Play IAP yönetimi).

---

## Netleşmesi gereken iş kararları (Baki cevaplayacak)
- **Fiyat modeli:** tek seferlik satın alma mı (örn. "tüm içerik 299 TL"), yoksa abonelik mi (aylık/yıllık)?
- **Freemium sınırı:** ücretsiz ne açık olacak? (Örn: TCK ilk N kart + Müşterek'in bir kısmı tadımlık; gerisi kilitli.) "Açık konular" hangileri?
- **Platform:** önce Android mı (Play, tek seferlik düşük ücret, kolay), yoksa iOS dahil mi (Apple hesabı + Mac/EAS)? İkisi de mi?
- **Dağıtım:** App Store/Play'de herkese açık mı, yoksa jandarma personeline özel kanal mı? (İkisi farklı strateji.)
- **Backend:** Supabase onay mı? (Tayinciyim.net'te zaten kullanıyorsun, deneyim var.)

---

## Önerilen sıralama (içerikten bağımsız → bağımlı)

### FAZ 1 — Filigran (görünür, kullanıcıya özel) [HEMEN, içerikten bağımsız]
- Kartların/görsellerin üstüne yarı saydam, tekrarlayan filigran katmanı: kullanıcı kimliği (ad/ID/telefon son hane) + tarih.
- **UI overlay** olduğu için her yerde çalışır (web, native, Expo Go) — test edilebilir.
- Kimlik kaynağı: üyelik yokken cihaz ID / placeholder; üyelik gelince gerçek user ID'ye bağlanır.
- Bu, en hızlı somut güvenlik kazancı. Şimdi yapılabilir.

### FAZ 2 — Ses altyapısı [içerikten bağımsız iskelet]
- expo-audio kurulumu + ses çalma servisi + "Sesli Nöbet" oynatıcı (otomatik başlamasın).
- Ses dosyaları (içerik) sonra eklenir; iskelet şimdi.
- NOT: expo-audio native — Expo Go SDK 54'te var mı kontrol edilecek (muhtemelen var).

### FAZ 3 — Ekran görüntüsü/kayıt koruması [native, build gerekir]
- expo-screen-capture: Android FLAG_SECURE (screenshot + ekran kaydı engellenir), iOS screenshot algılama (tam engellenemez, uyarı/filigran ile desteklenir).
- Expo Go'da test EDİLEMEZ → development build gerekir. Bu yüzden FAZ 1 filigran önce (her yerde çalışır).

### FAZ 4 — Üyelik sistemi (backend) [BÜYÜK, strateji sonrası]
- Supabase: kullanıcı kayıt/giriş (e-posta veya telefon), oturum, erişim durumu (free/premium).
- Lokal SQLite içerik kalır; "kim premium" bilgisi Supabase'de.
- _layout guard'ı: giriş yoksa → giriş ekranı (branş onboarding'in yanına).

### FAZ 5 — Ödeme + freemium kilidi [build + hesaplar gerekir]
- RevenueCat (App Store/Play IAP yönetimi, receipt doğrulama).
- Freemium: ücretsiz içerik açık; kilitli içerikte "Satın al" ekranı; satın alınca tüm kanunlar açılır.
- Apple Developer ($99/yıl) + Play Console (tek seferlik $25). Gerçek build şart.

### FAZ 6 — Tasarım cilası (ürün kalitesi) [sürekli]
- Ücretli ürün hissi: onboarding akışı, satın alma ekranı, ikonlar, animasyonlar, marka tutarlılığı (askeri tema: Karargah/Mevzuat/Tatbikat/Sicil/Geri Besleme).

---

## Bağımlılık mantığı (neden bu sıra)
- Filigran (Faz 1) → kullanıcıya özel ama kimlik gelince (Faz 4) tam anlamlı; iskeleti şimdi, bağlanması sonra.
- Ekran koruması (Faz 3) + ödeme (Faz 5) → gerçek build + hesaplar gerektirir → Expo Go fazını bitirince.
- Üyelik (Faz 4) → ödemenin (Faz 5) ön koşulu (kim satın aldı = kim üye).
- Filigran + ses (Faz 1-2) içerikten ve build'den bağımsız → ŞİMDİ yapılır, gerisi büyük altyapı.

---

## Şimdi başlanabilecek (Expo Go'da test edilebilir, içerik beklemez)
1. **Filigran overlay** (Faz 1) — en hızlı güvenlik kazancı, her yerde çalışır.
2. **Ses altyapısı iskeleti** (Faz 2) — ses dosyaları sonra.

## Gerçek build + hesap + strateji gerektiren (sonraki büyük dalga)
3. Üyelik (Supabase) → Ödeme (RevenueCat) → Ekran koruması (native) → Tasarım cilası.
