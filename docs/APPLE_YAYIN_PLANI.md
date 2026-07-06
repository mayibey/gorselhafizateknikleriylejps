# Apple App Store Yayın Planı — MEVZU (Görsel Hafıza Teknikleriyle JSPS)

> Hazırlanma tarihi: 6 Temmuz 2026 · Durum: Android (Google Play) kapalı testte canlı, iOS **hiç başlamadı**.
> Bu dosya, uygulamayı Apple App Store'a sokmak için gereken her şeyi adım adım anlatır.
> Her bölümde: **Ne / Neden / Nasıl / Kim yapar (ben = Claude, başkan = sen)**.
> Apple kural numaraları (App Store Review Guidelines) parantez içinde verildi.

---

## ÖNEMLİ ÖZET (önce bunu oku)

iOS yayını Android'in kopyası **değil**. Üç zorunlu değişiklik var, bunlar olmadan Apple uygulamayı **kesin reddeder**:

1. **Ödeme baştan yazılacak (Guideline 3.1.1).** iOS'ta Google Play Billing YASAK. Apple'ın kendi StoreKit sistemi zorunlu. Ürünler App Store Connect'te sıfırdan tanımlanır, komisyon Apple'a (%30, küçük geliştiride %15) gider. İyi haber: kullandığımız `expo-iap` kütüphanesi StoreKit'i zaten destekliyor, ayrı kütüphaneye gerek yok.
2. **"Apple ile Giriş" eklenecek (Guideline 4.8).** Google ile giriş sunduğumuz için Apple, "Apple ile Giriş" seçeneğini de ZORUNLU tutuyor. `expo-apple-authentication` + Supabase ile eklenir.
3. **Hesap silme gerçek silme olmalı (Guideline 5.1.1(v)).** Bizdeki "30 gün sonra sil, tekrar girince geri getir" modeli Apple'ın istediğiyle çelişme riski taşıyor. Apple "sadece devre dışı bırakma yetmez, gerçek silme" diyor. Metni ve akışı düzeltmek gerek (aşağıda detay).

Bunların dışında: Apple Developer üyeliği ($99/yıl), iOS derleme altyapısı (EAS), Jandarma/Sahil Güvenlik amblemi kullanımı riski, gizlilik beyanı ve mağaza kaydı işleri var.

---

## 1. Apple Developer Program Üyeliği

**Ne:** Apple'a uygulama yüklemek için yıllık ücretli geliştirici üyeliği. Olmadan hiçbir şey yapılamaz.

**Neden:** App Store'a yükleme, sertifika üretme, "Apple ile Giriş" ve StoreKit'i açmak için şart.

**Nasıl / karar:**
- **Bireysel mi, şirket (organization) mi?**
  - **Bireysel (Individual):** D-U-N-S numarası GEREKMEZ. Kayıt hızlı (ödeme + doğrulama genelde 24-48 saat). App Store'da geliştirici adı olarak **kişinin kendi adı** görünür (örn. "Adem Yılmaz").
  - **Şirket (Organization):** **D-U-N-S numarası ZORUNLU** (Dun & Bradstreet veriyor, başvuru 5 iş günü–2 hafta, ücretsiz alınabilir). App Store'da **şirket/marka adı** görünür (örn. "MEVZU"). Ayrıca Apple, kayıt bilgisini elle doğrular, birkaç gün sürer.
  - **Öneri:** Hızlı başlamak istiyorsan **bireysel** ile başla — sonra şirket kurulunca organizasyona transfer edilebilir. Ama markanın "MEVZU" görünmesini istiyorsan ve zaten şahıs şirketi kurulacaksa (SMS/vergi için gündemdeydi), organizasyon daha temiz olur. Google Play tarafındaki `dev.ademyilmaz@gmail.com` hesabıyla tutarlı gitmek mantıklı.
- **Ücret:** 99 USD / yıl (yıllık yenilenir). Türkiye'den kredi kartıyla ödenir, tutar TL karşılığı olarak çıkabilir.
- **Türkiye'den kayıt:** Sorun yok, Türkiye desteklenen ülke. Apple hesabında **iki adımlı doğrulama (2FA) açık** olmalı. Bireysel için kimlik/telefon; organizasyon için D-U-N-S + yetkili olduğunu beyan.
- **Ne kadar sürer:** Bireysel ~1-2 gün. Organizasyon ~1-2 hafta (D-U-N-S beklemesi dahil).

**Kim yapar:** **Başkan.** (Kredi kartı, kimlik, telefon doğrulama, 2FA gerektirir — ben yapamam.) Ben sadece hangi bilgiyi nereye gireceğini anlatırım.

---

## 2. Bu Uygulama İçin Kritik App Store Kuralları

### 2.1 Uygulama İçi Satın Alma — StoreKit ZORUNLU (Guideline 3.1.1)

**Ne:** iOS'ta dijital içerik/premium kilidini açan her satın alma Apple'ın **StoreKit** sistemiyle yapılmalı. Google Play Billing veya harici ödeme (kredi kartı formu, "web'den al" linki) YASAK.

**Neden — Guideline 3.1.1 (kelimesi kelimesine):** *"If you want to unlock features or functionality within your app ... you must use in-app purchase. Apps may not use their own mechanisms to unlock content or functionality, such as license keys ... etc."* Bizim uygulama premium içerik kilidini açıyor → StoreKit şart. (Reader/okuyucu app istisnası bize UYMAZ; biz hesap açıp içerik satıyoruz.)

**Komisyon:** Apple satıştan **%30** alır. Yıllık gelirin 1 milyon USD altındaysa "App Store Small Business Program"a başvurarak **%15**'e düşer (bizim durumda kesin uygun). Abonelik 1. yıldan sonra da %15'e düşer.

**expo-iap iOS'u destekliyor mu?** **EVET.** `expo-iap` (v4.3.5, zaten kurulu) OpenIAP standardına uyar ve iOS'ta **StoreKit 2** kullanır. Android'de Play Billing, iOS'ta StoreKit — aynı kütüphane iki platformu da çevirir. `react-native-iap`'a GEÇMEYE GEREK YOK. Kodda platforma göre ayrım gerekir (aşağıda 5. bölüm).

**Ürünleri tanımlama:** App Store Connect'te ürünler **sıfırdan** oluşturulur — Google Play'deki ürünler taşınmaz. Bizim ürünler:
- `musterek_yillik` → App Store Connect'te **Auto-Renewable Subscription** olarak.
- `musterek_omurboyu` → **Non-Consumable** olarak.
- `musterek_omurboyu_yukseltme` → **Non-Consumable** (yükseltme; iOS'ta "farkla yükseltme" mantığı Google'dan farklı çalışır, gözden geçirmeli — **doğrulanmalı**).
- İndirimli ömür boyu SKU'lar (`musterek_omurboyu_i20/i30`) ve promo/indirim teklif mantığı iOS'ta farklı: StoreKit'te abonelik indirimleri "promotional offers / offer codes", tek seferlik indirimler farklı işler. Bu bölüm iOS'a birebir taşınmaz, **yeniden tasarlanmalı — doğrulanmalı.**
- **NOT:** Ürün ID'leri iki mağazada aynı isim olabilir ama Apple ürünleri Apple'da ayrı tanımlanır. Sunucu doğrulaması (Supabase `dogrula-satinalma` Edge Function) şu an sadece Google makbuzu doğruluyor → **iOS için Apple makbuz/App Store Server API doğrulaması eklenmeli** (bu ayrı, önemli bir sunucu işi).

**Kim yapar:** Ürün oluşturma App Store Connect'te → **başkan** (ben yanında adım adım söylerim). Kod tarafı (expo-iap iOS akışı, platform ayrımı) + sunucu Apple doğrulaması → **ben**.

---

### 2.2 "Apple ile Giriş" ZORUNLU (Guideline 4.8)

**Ne:** Google ile giriş sunuyorsak, "Apple ile Giriş"i de **eşdeğer bir seçenek** olarak sunmak zorundayız.

**Neden — Guideline 4.8 (kelimesi kelimesine):** *"Apps that use a third-party or social login service (such as ... Google Sign-In ...) to set up or authenticate the user's primary account with the app must also offer as an equivalent option another login service"* ve o servis şunları sağlamalı: sadece ad+e-posta toplar, kullanıcı e-postasını gizli tutabilir, reklam için etkileşim toplamaz. **Apple ile Giriş** bu üç şartı da karşılar → standart çözüm.

**İstisnalar (bize uymuyor):** Sadece kendi hesap sistemini kullanan, kurumsal/eğitim hesabı zorunlu kılan, ya da devlet kimlik sistemi kullanan uygulamalar muaf. Biz Google kullandığımız için muaf DEĞİLİZ.

**Nasıl:**
- `expo-apple-authentication` paketi eklenir (SDK 54 uyumlu). `app.json` → `ios.usesAppleSignIn: true`.
- Native Apple butonu (Apple'ın tasarım kurallarına uygun — siyah/beyaz, "Apple ile Giriş Yap" yazısı; şu anki `saglayici-butonlari.tsx` yalnız Google butonu içeriyor, buraya iOS'ta Apple butonu eklenir).
- Akış: Apple'dan `identityToken` alınır → Supabase'e `supabase.auth.signInWithIdToken({ provider: 'apple', token })` ile verilir. Supabase'de Apple provider açılır.
- **Önemli tuzak:** Apple, kullanıcının **adını-soyadını YALNIZCA ilk giriş** anında verir, sonraki girişlerde vermez. Ad-soyad ilk seferde yakalanıp `profiles` tablosuna kaydedilmeli (bizde ad-soyad zorunlu + Takdir Belgesi'ni kişiselleştiriyor → bu kritik). Native yöntemde 6 ayda bir "secret key" yenileme derdi YOK (OAuth yönteminin aksine) — native tercih edilmeli.
- Apple Developer'da **"Sign In with Apple" capability** ve bir **Services ID / key** kurulur.

**Kim yapar:** Kod + Supabase provider ayarı → **ben.** Apple Developer'da capability açma → **başkan** (ben ekran ekran anlatırım).

---

### 2.3 Hesap Silme — Gerçek Silme Olmalı (Guideline 5.1.1(v))

**Ne:** Hesap oluşturmaya izin veren uygulama, **uygulama içinden hesap silmeyi** de sunmak zorunda.

**Neden — Guideline 5.1.1(v):** *"If your app supports account creation, you must also offer account deletion within the app."* Apple destek sayfası net: *"sadece geçici devre dışı bırakma/deaktivasyon YETMEZ; hesabın tamamı + kişisel veriler silinmeli."*

**Bizim durum + risk:** Bizde **30 günlük yumuşak silme** var: kullanıcı siler → işaretlenir → 30 gün içinde girerse geri gelir → 30 gün sonra kalıcı silinir. **Bu tam çelişki değil ama risk taşıyor:**
- Apple destek sayfası şunu AÇIKÇA kabul ediyor: *"If your process for account deletion is manual or otherwise takes time to complete, this is acceptable. Inform the user how long it will take ..."* → yani silmenin **zaman alması** (30 gün) SORUN DEĞİL.
- SORUN OLABİLECEK kısım: bizde silme, kullanıcı **tekrar girince "geri getiriliyor"** (reaktivasyon). Bu, Apple'ın "yalnızca deaktivasyon" dediği şeye benzeyip reddi tetikleyebilir.
- **Çözüm (önerilen):** iOS'ta silme akışını şöyle çerçevele: kullanıcı "Hesabı Sil" der → "Hesabın ve tüm verilerin **30 gün içinde kalıcı olarak silinecek**. Bu süre sonunda geri alınamaz. Satın alımların da silinecek." Reaktivasyon özelliğini **öne çıkarma** (sessiz bir güvenlik ağı olarak kalabilir ama arayüzde "istediğin an geri getir" diye pazarlanmamalı). Silme talebi anında oturum kapanmalı, hesap gerçekten silme kuyruğuna girmeli. Bu haliyle uygunluk **çok yüksek olasılıkla** sağlanır. **Yine de reddi %100 elemek için**: "silme = anında kalıcı" seçeneği en temizi olurdu; ama başkanın 30 gün kararı korunacaksa yukarıdaki çerçeveleme kullanılmalı. **Bu noktayı ilk incelemede riskli kabul et — doğrulanmalı.**
- Silme uygulama içinden, **ayarlar/profil** ekranında kolay bulunur olmalı (bizde altyapı var: `profiles` + `silme_talep_tarihi` + cron; `docs/v2/01_profiles_soft_delete.sql`, `06_hesap_silme_cron.sql`).

**Kim yapar:** Metin/akış düzeltmesi → **ben.** Karar (30 gün korunacak mı, çerçeveleme onayı) → **başkan.**

---

### 2.4 Gizlilik Beyanı — App Privacy "Nutrition Labels" (Guideline 5.1.1, 5.1.2)

**Ne:** App Store Connect'te uygulamanın **hangi veriyi topladığını** tek tek beyan etmek (App Privacy bölümü). Kullanıcı mağaza sayfasında "gizlilik etiketi" olarak görür.

**Neden:** Zorunlu; eksik/yanlış beyan reddin yaygın sebebi. Ayrıca uygulama içinden erişilebilir bir **gizlilik politikası URL'i** şart.

**Bizde toplanan veri (beyan edilecek):**
- **E-posta adresi** (Google/Apple giriş) → "Hesap yönetimi", kullanıcıya bağlı.
- **Ad, soyad, telefon** (profil, zorunlu) → hesap yönetimi.
- **Kullanıcı içeriği/ilerleme** (SRS, deneme sonuçları) → uygulama işlevi.
- **Cihaz kimliği** (`cihaz_dogrula` paylaşım koruması) → dolandırıcılık önleme.
- **Satın alma** (üyelik hakları) → uygulama işlevi.
- **Reklam için veri toplamıyoruz** (bunu net beyan et → 4.8 uyumu da güçlenir).
- Ayrıca **filigran** için kullanıcı e-postası görsele basılıyor (`gorsel` Edge fn) → bu "veri kullanımı" olarak iç değerlendirmede not edilmeli, gizlilik politikasında şeffaf anlatılmalı.

**Gizlilik politikası URL'i:** Şu an `config.ts` içinde `GIZLILIK_URL=''` ve `SARTLAR_URL=''` **BOŞ**. Yayından önce `mevzujsps.com/gizlilik` ve `/sartlar` doldurulmalı (Play tarafında da bekliyordu). `docs/GIZLILIK_POLITIKASI.md` ve `docs/KULLANIM_SARTLARI.md` mevcut → web'e konur.

**Kim yapar:** URL yayınlama + App Privacy formu → **başkan** (ben hangi kutu işaretlenecek listesini veririm). Politika metni güncel → **ben.**

---

### 2.5 İhracat/Şifreleme Uyumu (Export Compliance)

**Ne:** Her iOS gönderiminde Apple "uygulaman şifreleme kullanıyor mu?" sorar. `app.json`'da `ios.config.usesNonExemptEncryption` ile önceden cevaplanır.

**Neden + BİZDEKİ ÇELİŞKİ:** Şu an `app.json` → `"usesNonExemptEncryption": false`. Ama biz içeriği **kendi yazdığımız AES-256** ile şifreliyoruz (`@noble/ciphers`, `gorsel-coz.ts`). Apple'ın kuralı: sadece HTTPS/sistem şifrelemesi (URLSession, Supabase TLS, Sign in with Apple) kullanıyorsan `false` doğru; ama **kendi özel AES/şifreleme rutinini** (CryptoKit/Keychain yerine kendi kodun) çalıştırıyorsan `true` olabilir.
- **Sonuç:** `false` beyanı **riskli olabilir** — bizde özel AES var. İki yol:
  1. `usesNonExemptEncryption: true` yap → Apple ek soru sorar; büyük ihtimalle **"muaf/exempt"** kategoriye gireriz (içeriği korumak için standart AES = kitlesel pazar istisnası, 5D992). O zaman yıllık bir self-classification raporu (BIS/ERN) gerekebilir. Çoğu uygulama bu istisnayı seçip geçer.
  2. Hukuki olarak "AES kullanımımız muafiyet kapsamında" değerlendirilip `false` bırakılır — ama yanlışsa sorumluluk geliştiricide.
- **Öneri:** iOS gönderiminde bu soruyu dikkatli cevapla; büyük olasılıkla "evet şifreleme var ama muafiyet kapsamında" yolu doğru. **Kesin sınıflandırma doğrulanmalı** (gerekirse Apple'ın export compliance sihirbazındaki adımlar izlenir).

**Kim yapar:** Karar + App Store Connect'teki cevap → **başkan** (ben olası cevapları hazırlarım). `app.json` düzeltmesi → **ben.**

---

## 3. Expo SDK 54 iOS Derleme Gereksinimleri

**Ne:** iOS uygulamasının `.ipa` dosyasını üretip App Store'a göndermek.

**Neden:** Windows'ta yerel iOS derlemesi YAPILAMAZ (Xcode sadece Mac'te). Bu yüzden **EAS Build (Expo'nun bulut derlemesi)** neredeyse zorunlu — bizim durumda tek pratik yol (elde Mac yok).

**Nasıl:**
- **EAS Build (bulut):** `eas build --platform ios --profile production`. Apple sertifikaları/provisioning profillerini **EAS otomatik yönetir** (Apple hesabına giriş yapınca kendi üretir). Mac gerekmez. `eas.json` zaten var; iOS için production profiline gerek yok, mevcut `production` çalışır (autoIncrement açık → `buildNumber` otomatik artar).
- **Gönderim:** `eas submit --platform ios --profile production` → App Store Connect'e yükler.
- **Gerekenler:**
  - **Bundle Identifier** (örn. `com.mevzujsps.app` veya `app.mevzujsps.ios`) — şu an `app.json`'da iOS için TANIMSIZ, eklenecek. App Store Connect'te aynısıyla uygulama kaydı açılır. (Android paketi `app.mevzujsps.android`; iOS ayrı olabilir.)
  - **buildNumber** — EAS remote/autoIncrement yönetir.
  - **Push notification sertifikası (APNs):** `expo-notifications` kullanıyoruz → iOS bildirimleri için Apple'da bir **APNs Key (.p8)** gerekir; EAS bunu da otomatik üretip yönetebilir. (Bildirimler iOS'ta "izin iste" akışı gerektirir.)
- **Deployment target:** StoreKit/expo-iap için iOS **15.0+** hedeflenmeli (varsayılan SDK 54 zaten uygun; kontrol edilecek).

**iPhone Expo Go SDK 54 kısıtı ne demek?** Apple App Store'daki Expo Go **en fazla SDK 54** destekliyor. Bu iki şeyi etkiler:
- **Geliştirme/test:** SDK 54'te sabit kaldığımız için Expo Go ile hızlı test EDEBİLİRİZ — AMA `expo-iap`, native Google/Apple giriş, `expo-notifications` gibi **native modüller Expo Go'da ÇALIŞMAZ**. Bunlar için bir **development build** (dev-client, EAS ile) gerekir. Yani ödeme/giriş testi Expo Go'da değil, gerçek dev-build'de yapılır. (Android'de de böyleydi.)
- **Sonuç:** SDK 54 sabiti bir sorun değil; Expo Go sadece arayüz/mantık testine yarar, para/giriş testi dev-build ile.
- **Fiziksel iPhone şart:** IAP simülatörde tam çalışmaz; test için gerçek iPhone + Sandbox test hesabı gerekir.

**Kim yapar:** EAS komutları + `app.json` iOS ayarları → **ben.** Apple hesabına EAS'i bağlama (giriş/2FA) + fiziksel iPhone ile test → **başkan.**

---

## 4. İçerik / Politika Riskleri

### 4.1 Jandarma / Sahil Güvenlik Amblemi ve Adı (Guideline 5.2.1, 5.2.5 + 4.1 kopyacı)

**Risk:** Türk devlet kurumlarının (Jandarma Genel Komutanlığı, Sahil Güvenlik) **resmi amblem/logo/adını** uygulama ikonunda, ekran görüntülerinde veya içerikte kullanmak → Apple'ın **fikri mülkiyet (5.2.1: sahibi olmadığın içeriği kullanma)** ve **resmi kurum izlenimi** kurallarına takılır. Apple, "resmi/devlet uygulaması gibi görünen ama olmayan" uygulamaları reddeder.

**Neden düşük-orta risk bizde:**
- Uygulama adı **"MEVZU — JSPS Hazırlık"** → kurum adı değil, sınavın adı (JSPS = Jandarma ve Sahil Güvenlik Personel Sınavı). Sınav adını anmak genelde sorun değil (tıpkı "YKS hazırlık" gibi), AMA logo/amblem KULLANMAK sorun.
- Eski "Jandarma Cüneyt" maskotu zaten **terk edildi** (iyi — o karakter resmi izlenim riskini artırıyordu).
- Görsel kartlarımız **kendi ürettiğimiz** özgün karikatürler → telif bizde, sorun yok.

**Yapılacaklar (koruyucu):**
- Uygulama ikonunda, ekran görüntülerinde, açıklamada **resmi Jandarma/Sahil Güvenlik amblemi/forması/logosu KULLANMA.** Şu anki ikon (`mevzu-icon-1024.png`) marka ikonu → uygun, kontrol et.
- Mağaza açıklamasına ve uygulama içine **feragat (disclaimer)** koy: *"Bu uygulama bağımsız bir sınav hazırlık uygulamasıdır; Jandarma Genel Komutanlığı, Sahil Güvenlik Komutanlığı veya herhangi bir resmi kurumla bağlantılı, onaylı ya da onların resmi uygulaması DEĞİLDİR."* Bu tek cümle çoğu "resmi izlenim" reddini önler.
- Askeri/resmi forma giymiş, ambleme benzeyen görseller kart içeriğinde varsa gözden geçir.

**Telif — kanun metinleri (Guideline 5.2):** Kanun metinleri **kamuya açık** (Resmî Gazete/mevzuat.gov.tr) → telif sorunu yok, serbestçe kullanılır. Kendi görsel kartlarımız + sesli anlatımlar bizim → sorun yok.

**Kim yapar:** İkon/görsel/ekran görüntüsü kontrolü + disclaimer metni → **ben hazırlarım, başkan onaylar.** Amblem kullanılmadığından emin olmak → **birlikte.**

### 4.2 Diğer içerik kuralları
- **Yaş derecelendirmesi:** Eğitim/sınav içeriği → düşük yaş sorunları yok (aşağıda 6. bölüm).
- **Reklam yok, kumar yok, uygunsuz içerik yok** → temiz.

---

## 5. Uygulamada Gereken Kod / Config Değişiklikleri (net liste)

Aşağıdakiler iOS için **eklenmesi/değişmesi** gerekenler. Hepsi "ben yaparım" (kod), başkan sadece hesap/panel işlerini onaylar.

### 5.1 `app.json` → `ios` bölümü genişletilecek
Şu an sadece `icon` + `usesNonExemptEncryption` var. Eklenecekler:
```jsonc
"ios": {
  "bundleIdentifier": "com.mevzujsps.app",   // KARAR: net bir ID seç (App Store Connect ile birebir aynı)
  "buildNumber": "1",                          // EAS autoIncrement yönetir
  "icon": "./assets/images/mevzu-icon-1024.png",
  "usesAppleSignIn": true,                      // 4.8 için ZORUNLU
  "config": {
    "usesNonExemptEncryption": false            // 2.5'e göre GÖZDEN GEÇİR (AES var → belki true+muafiyet)
  },
  "infoPlist": {
    // Aşağıya bak — hangi usage string'ler gerekli
  }
}
```

**infoPlist usage string'leri (izin açıklamaları) — hangileri gerekli?**
- **Kamera / Foto kütüphanesi:** Uygulama fotoğraf/kamera KULLANMIYOR (içerik hazır kartlar) → `NSCameraUsageDescription` / `NSPhotoLibraryUsageDescription` **GEREKMEZ.** (Kütüphanelerden biri istemiyorsa eklenmez; gereksiz izin açıklaması bile redde yol açabilir — sadece gerçekten kullanılan izinler.)
- **Bildirim:** `expo-notifications` iOS'ta ayrı usage string istemez; runtime izin diyaloğu gösterir. Ama "arka planda bildirim" için `UIBackgroundModes` gerekebilir (yerel bildirim ise gerekmez — bizimki yerel hatırlatma → muhtemelen gerekmez, **doğrulanmalı**).
- **App Tracking Transparency (ATT):** Bkz. 5.5 — reklam/izleme yapmadığımız için **GEREKMEZ** (usage string eklenmez).
- **expo-secure-store / expo-file-system / expo-audio:** iOS'ta ek izin string'i gerektirmez (dosya erişimi uygulama sandbox'ı içinde).
- Sonuç: **muhtemelen hiç usage string gerekmiyor** (kamera/foto/konum/mikrofon/kişiler yok). Sadece giriş, ödeme, bildirim var → onlar string istemez.

### 5.2 "Apple ile Giriş" ekleme
- `npx expo install expo-apple-authentication` (SDK 54 uyumlu sürüm).
- `saglayici-butonlari.tsx`'e iOS'ta görünen Apple butonu (`AppleAuthenticationButton`, Apple tasarım kuralı).
- `auth.ts`/`auth-context`'e Apple akışı: `AppleAuthentication.signInAsync` → `identityToken` → `supabase.auth.signInWithIdToken({ provider: 'apple', ... })`.
- İlk giriş ad-soyadını yakala → `profiles`'a yaz.
- Supabase Dashboard → Auth → Providers → **Apple** açılır (Services ID + key).

### 5.3 StoreKit / expo-iap iOS yapılandırması
- `paywall.tsx` şu an tamamen Google Play'e göre yazılmış (`google:` request objeleri, `subscriptionOfferDetailsAndroid`, `oneTimePurchaseOfferDetailsAndroid`). iOS için **platform ayrımı** gerekir: `Platform.OS === 'ios'` dalında StoreKit request formatı (`requestPurchase({ ios: {...} })` veya OpenIAP'in iOS API'si) kullanılır.
- İndirim/teklif mantığı iOS'ta Android'den çok farklı (Android'deki offerToken/offerId sistemi iOS'ta yok) → iOS'ta indirimler **offer codes / promotional offers** ile ya da başta indirimsiz basit paywall ile başlanır. **Bu bölüm iOS için yeniden yazılacak — doğrulanmalı.**
- **Sunucu doğrulama:** `dogrula-satinalma` Edge Function'a **Apple tarafı** eklenecek (App Store Server API ile makbuz/transaction doğrulama). Şu an sadece Google. Bu ayrı, kritik iş.
- Ürünler App Store Connect'te oluşturulacak (2.1'e bak).

### 5.4 Hesap silme metni/akışı (2.3'e göre)
- iOS'ta silme onay ekranı metni "30 gün içinde kalıcı silinecek, geri alınamaz, satın alımlar gider" olarak netleşir; reaktivasyon arayüzde öne çıkarılmaz.

### 5.5 App Tracking Transparency (ATT) — gerekli mi?
- **GEREKMEZ.** ATT sadece uygulama, kullanıcıyı **başka şirketlerin uygulama/siteleri arasında reklam için izlerse** gerekir (IDFA kullanımı, reklam SDK'sı). Bizde reklam SDK'sı yok, izleme yok → `AppTrackingTransparency` eklenmez. (App Privacy formunda "izleme yapmıyoruz" işaretlenir.)

### 5.6 Diğer
- Bundle ID seçimi + Supabase Auth'ta iOS redirect/scheme (`mevzu://`) kontrolü.
- Google Sign-In iOS tarafı: `@react-native-google-signin/google-signin` iOS'ta ayrı bir **iOS client ID** ister (GoogleService-Info.plist / URL scheme). Şu an sadece `google-services.json` (Android) var → **iOS için Firebase/Google iOS client + `GoogleService-Info.plist`** eklenmeli.

---

## 6. App Store Connect Kurulum Adımları

**Ne:** Apple'ın mağaza yönetim panelinde uygulamayı kaydetmek, materyalleri yüklemek, incelemeye göndermek.

**Adımlar:**
1. **Uygulama kaydı:** App Store Connect → My Apps → **+ New App**. Platform: iOS. Bundle ID: yukarıda seçilen (`app.json` ile birebir). SKU: serbest bir iç kod (örn. `mevzu-jsps-001`). Birincil dil: Türkçe.
2. **Ürünler (In-App Purchases):** Monetization → In-App Purchases → yıllık aboneliği (subscription group içinde) + ömür boyu (non-consumable) oluştur. Fiyatları belirle. **İlk gönderimle birlikte en az bir ürün "Ready to Submit" olmalı**, yoksa IAP incelenmez.
3. **Ekran görüntüleri (zorunlu boyutlar):**
   - **6.9" iPhone** (iPhone 16 Pro Max sınıfı): **1290 × 2796 px** (dikey) — bu zorunlu ana boyut.
   - **6.5" iPhone** (opsiyonel ama önerilir): 1242 × 2688 veya 1284 × 2778.
   - iPad zorunlu **değil** (uygulama sadece iPhone'a hedeflenebilir; iPad desteği kapatılırsa iPad görseli istenmez). En az **1-3, en fazla 10** görsel/boyut.
   - **NOT:** Boyutlar Apple ara ara güncelliyor — gönderim anında App Store Connect'in istediği güncel boyut esastır, **doğrulanmalı.**
4. **Metadata:** Uygulama adı (30 karakter), alt başlık (30), açıklama, anahtar kelimeler (100 karakter), **destek URL'i**, **pazarlama URL'i (ops.)**, **gizlilik politikası URL'i (zorunlu)**.
5. **Kategori:** Birincil → **Education** (Eğitim). İkincil (ops.) → Reference. (Sınav hazırlık = Education en uygun.)
6. **Yaş derecelendirmesi:** Anket doldurulur → içerik uygunsuz kategori içermediğinden büyük ihtimalle **4+**. (Şiddet/kumar/yetişkin içeriği yok.)
7. **App Privacy:** 2.4'teki veri listesi girilir; "izleme yapılmıyor" işaretlenir.
8. **Export Compliance:** 2.5'teki cevap.
9. **Demo hesabı:** Apple inceleyicisi için **çalışan bir test hesabı** (giriş bilgisi) verilmeli — uygulama girişli olduğu için ZORUNLU. Ayrıca premium içeriği inceleyebilmesi için ya bir promo/test hesabı ya da Sandbox açıklaması. "Notes for Review" alanına: giriş bilgisi + "içerik sunucudan indirilir, ilk açılışta indirme olur" gibi açıklama.
10. **Gönder:** Build (EAS'ten yüklenen) seçilir → **Submit for Review**. İnceleme genelde 24-48 saat.

**Kim yapar:** Panel işleri (kayıt, ürün, ekran görüntüsü yükleme, metadata, gönderim) → **başkan** (ben her alanın ne yazılacağını + ekran görüntüsü boyut/içeriğini hazırlarım). Ekran görüntülerini üretme (tasarım) → **ben yardımcı olurum.**

---

## İLK 5 ADIM (buradan başla)

1. **Apple Developer üyeliğine karar ver ve kaydol** (bireysel = hızlı / organizasyon = D-U-N-S + marka adı) — $99/yıl, 2FA açık Apple hesabı. → **Başkan.** (Bölüm 1)
2. **Bundle Identifier'a karar ver** (örn. `com.mevzujsps.app`) — hem `app.json` hem App Store Connect kaydında birebir aynı olacak. → **Başkan onaylar, ben app.json'a yazarım.** (Bölüm 3, 5.1)
3. **"Apple ile Giriş"i ekle** (`expo-apple-authentication` + Supabase Apple provider + iOS'ta Apple butonu). Guideline 4.8 zorunlusu — bu olmadan kesin red. → **Ben (kod) + başkan (Supabase/Apple panel).** (Bölüm 2.2, 5.2)
4. **Ödemeyi iOS/StoreKit'e uyarla:** `paywall.tsx` platform ayrımı + `dogrula-satinalma` Edge Function'a Apple makbuz doğrulaması + App Store Connect'te ürünleri oluştur. Guideline 3.1.1. → **Ben (kod/sunucu) + başkan (ürün oluşturma).** (Bölüm 2.1, 5.3)
5. **Hesap silme metnini düzelt + gizlilik URL'lerini yayınla** (`mevzujsps.com/gizlilik`, `/sartlar`; `config.ts` doldur) — 5.1.1(v) ve App Privacy için. → **Ben (metin/kod) + başkan (web yayını).** (Bölüm 2.3, 2.4)

> Sonra: EAS ile ilk iOS dev-build → gerçek iPhone'da giriş+ödeme testi → ekran görüntüleri → App Store Connect kaydı → gönderim.

---

## "DOĞRULANMALI" İşaretli Belirsizlikler (kod/panel anında teyit edilecek)
- iOS'ta "yıllık → ömür boyu farkla yükseltme" ve indirim teklifleri StoreKit'te farklı çalışır → yeniden tasarım gerekir.
- `usesNonExemptEncryption` doğru cevabı (özel AES var) — muafiyet kapsamı netleştirilecek.
- 30 gün soft-delete + reaktivasyonun 5.1.1(v) karşısında kesin kabulü — ilk incelemede riskli, çerçeveleme ile geçmesi bekleniyor.
- Ekran görüntüsü zorunlu boyutları gönderim anındaki güncel App Store Connect değerine göre.
- `expo-apple-authentication`, `expo-iap` iOS akışının SDK 54'te tam sürüm uyumu — kurulumda `npx expo install` ile teyit.
- iOS bildirim için `UIBackgroundModes` gerekliliği (yerel bildirimse gerekmez).

---

## Kaynaklar (Apple resmi + Expo)
- Apple App Store Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Guideline 4.8 (Login Services) — Apple Developer Forums tartışması: https://developer.apple.com/forums/thread/750911
- Hesap silme (5.1.1(v)) resmi rehber: https://developer.apple.com/support/offering-account-deletion-in-your-app/
- Apple Developer Program kayıt: https://developer.apple.com/programs/enroll/ · D-U-N-S: https://developer.apple.com/help/account/membership/D-U-N-S/
- Sign in with Apple + Supabase: https://supabase.com/docs/guides/auth/social-login/auth-apple
- expo-apple-authentication: https://docs.expo.dev/versions/latest/sdk/apple-authentication/
- expo-iap (OpenIAP, StoreKit 2): https://hyochan.github.io/expo-iap/ · https://github.com/hyochan/expo-iap
- Export compliance / ITSAppUsesNonExemptEncryption: https://developer.apple.com/documentation/security/complying-with-encryption-export-regulations
- EAS iOS gönderim: https://docs.expo.dev/submit/ios/
</content>
</invoke>
