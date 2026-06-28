# 06 — UYGULAMA GÜVENLİĞİ (istemci-içi)

> Kapsam: cihazdaki uygulama (APK/JS bundle, AsyncStorage/SQLite, izinler, deep link,
> giriş akışı, build sertleştirme). Backend RLS / anti-piracy / sunucu-entitlement
> **08/09/10**'da. Bu rapor `YAYIN_DENETIM_GUVENLIK.md §3`'ü baz alır + somutlaştırır.
> Tehdit modelleri: **(C)** cihazda kötü-niyetli kullanıcı/forensic, **(M)** MITM/ağ,
> **(K)** cloud/Supabase maruziyeti.

## Özet
- **v1 güvenlik duruşu iyi**: üyelik ana şalterle kapalı (`UYELIK_AKTIF=false`), Supabase client hiç kurulmuyor, console log temiz (tek `__DEV__` guard'lı), izinler plugin'le budanmış, SQL parametreli, dış linkler sabit. Yayın-engelleyici **kritik açık YOK**.
- **En somut iki sertleştirme (P1)**: AndroidManifest `allowBackup="true"` → `false` yapılmalı; ve `EXPO_PUBLIC_SUPABASE_*` anahtarları v1 bundle'ına gömülüyor (kullanılmasa da) — v1 release'de `.env`'i boşaltıp gerçekten offline yüzey bırak.
- Supabase anon key **public-by-design** (RLS gerçek koruma) — istemcide durması normal; ama proje (`vwmjrvolkbiofpkzzwef`) CANLI, anahtar bundle'dan çıkarılabilir → RLS/rate-limit teyidi **09'a** taşınır.
- **R8/ProGuard KAPALI** (Expo default, `android.enableMinifyInReleaseBuilds` set değil) — Hermes açık (bytecode, makul) ama JS sınıf/string'ler küçültülmemiş; düşük öncelik sertleştirme.
- **v2 hazırlığı uyarısı**: üyelik açılınca Supabase **refresh token düz metin AsyncStorage**'a yazılacak + `allowBackup` açıkken `adb backup`/rootla çıkarılabilir → token'ı `expo-secure-store`'a al + backup kapat (şimdi yapılırsa v2'de hazır).
- Cihaz-kimlik `Math.random()` ile üretiliyor (kripto değil) — yalnız forensic filigran amacı; kabul edilebilir ama bilinçli not.

## Bulgular

### P1 — `allowBackup="true"` → AsyncStorage yedeklenebilir
- **Ne**: `android/app/src/main/AndroidManifest.xml` `<application ... android:allowBackup="true">`. Tüm AsyncStorage (cihaz-kimlik `jsps.cihaz`, branş, favori, bildirim ayarı, **v2'de Supabase oturum token'ı**) `adb backup` ile root'suz cihazda dışa aktarılabilir / başka cihaza geri yüklenebilir.
- **Nerede**: `AndroidManifest.xml` (`allowBackup="true"`); etkilenen veri `src/lib/cihaz-kimlik.ts:27`, `src/lib/supabase.ts:29` (token storage).
- **Neden/Etki**: (C) Forensic filigran kimliği başka cihaza taşınabilir (caydırıcılığı düşer); v2'de auth refresh token yedekten çalınabilir → hesap ele geçirme. Klon/multi-cihaz kontrolünü zayıflatır.
- **Öneri**: `app.json android` altına config (veya prebuild plugin) ile `allowBackup:false`. Native düzenleme yapılamıyorsa `withAndroidManifest` plugin'i (`withRemovedPermissions` deseni) ile `manifest.application[0].$['android:allowBackup']='false'` yaz. Düşük maliyet, v1+v2 fayda.

### P1 — Supabase anahtarları kullanılmadan v1 bundle'ına gömülüyor
- **Ne**: `config.ts:41-42` `process.env.EXPO_PUBLIC_SUPABASE_URL/ANON_KEY`. Metro `EXPO_PUBLIC_*` değişkenlerini **derleme anında literal olarak inline eder** — `UYELIK_AKTIF=false` client'ı engelliyor ama URL+anon JWT yine de JS bundle'ında string olarak yer alır.
- **Nerede**: `.env:3-4` (gerçek URL + anon JWT), `src/constants/config.ts:41-42`.
- **Neden/Etki**: (K) v1 "%100 offline" beyanına rağmen APK'dan canlı Supabase ref + anon key çıkarılabilir; proje açıksa anonim API yüzeyi (auth signup spam, varsa açık tablolar) hedeflenebilir. Veri yoksa zarar düşük ama gereksiz maruziyet + gizlilik metni "sunucuya bağlanmaz" ile sembolik çelişki.
- **Öneri**: v1 release build'inden ÖNCE `.env`'deki `EXPO_PUBLIC_SUPABASE_*` satırlarını boşalt (kod zaten `?? ''` ile fallback → `supabaseHazir=false` sürer, davranış değişmez). Anahtarları v2 branch/secret'ta tut. Ayrıca Supabase Dashboard'da anon signup'ı kısıtla / RLS'i doğrula (09).

### P2 — R8/ProGuard release'de kapalı (kod sertleştirme yok)
- **Ne**: `android/app/build.gradle` `enableMinifyInReleaseBuilds = findProperty(...) ?: false`; `android/gradle.properties`'te property **set değil** → minify+shrink KAPALI. `proguard-rules.pro` 12 satır (boş şablon).
- **Nerede**: `android/app/build.gradle` (minifyEnabled), `android/gradle.properties` (eksik prop).
- **Neden/Etki**: (C) Hermes bytecode tersine mühendisliği zorlaştırır ama JS string'ler (sınıf adları, log, sabitler) küçültülmez; native taraf da shrink edilmez → APK daha okunaklı + daha büyük. Anti-piracy gerçek savunma değil ama amatörü yavaşlatır.
- **Öneri**: `gradle.properties`'e `android.enableMinifyInReleaseBuilds=true` (+ test). `withYerelBuild` plugin zaten gradle.properties yazıyor → tek `set(...)` satırı eklenebilir. DOĞRULANMADI: minify açınca reanimated/svg için keep kuralı gerekebilir; build testi şart.

### P2 — v2 oturum token'ı düz metin AsyncStorage'da (gelecek risk)
- **Ne**: `supabase.ts:29` oturum storage = `AsyncStorage` (şifrelenmemiş SQLite/dosya). PKCE doğru seçilmiş ama persist edilen refresh token düz metin.
- **Nerede**: `src/lib/supabase.ts:27-29`.
- **Neden/Etki**: (C) v2 üyelik açılınca rootlu cihaz veya backup'tan kalıcı refresh token okunabilir → uzun ömürlü hesap erişimi. v1'de token yok → şu an etkisiz, ama mimari karar şimdi veriliyor.
- **Öneri**: v2'de token storage'ı `expo-secure-store` (Android Keystore/iOS Keychain) sarmalayıcısına geçir; veya en azından `allowBackup:false` (yukarıdaki P1) ile yedek vektörünü kapat. Şimdi not düşülsün, v2 iş kalemine bağlansın.

### P2 — `android:exported="true"` MainActivity + `https` scheme intent-filter
- **Ne**: MainActivity `exported="true"`, `launchMode="singleTask"`, intent-filter'da `mevzu`, `exp+gorsel-hafiza-jsps` ve **`https`** scheme'leri. Deep link parametreleri (`lawId`, `bolumId`, `mod`, `kart`, `tip`) `useLocalSearchParams` ile okunuyor.
- **Nerede**: `AndroidManifest.xml` (intent-filter), `src/app/akis.tsx:74`, `sinav.tsx:35`, `yasal.tsx:12`, `patika.tsx:175`, `sesli-nobet.tsx:19`.
- **Neden/Etki**: (C) Harici uygulama/web `mevzu://` veya app-link ile rota açabilir. İncelendi: tüm deep-link parametreleri yalnız **salt-okuma navigasyon** (kanun/kart açma) tetikliyor; hassas aksiyon (silme, satın alma, token kabulü) YOK → istismar yüzeyi düşük. `https` filtresi App Links doğrulaması (`autoVerify`/`assetlinks.json`) olmadan başka uygulamalara da "aç" seçeneği verir.
- **Öneri**: Kullanılmıyorsa `https` data scheme'ini intent-filter'dan kaldır (yalnız `mevzu`/`exp` yeterli) — phishing/link-hijack yüzeyini küçültür. v2'de deep-link ile oturum/satın alma asla işlenmesin (auth dönüşü zaten `openAuthSessionAsync` ile sandbox'lı — doğru). DOĞRULANMADI: `https` filtresinin işlevsel bir kullanımı var mı (görünmüyor).

### P2 — Bağımlılıklarda caret (`^`) sürüm kayması
- **Ne**: `@supabase/supabase-js ^2.108.2`, `@expo/vector-icons ^15`, `@expo-google-fonts/* ^0.4`, `react-native-url-polyfill ^3`, `@likashefqet/react-native-image-zoom ^4.3` caret ile esnek; çekirdek expo/RN pinleri sabit (iyi).
- **Nerede**: `package.json` dependencies.
- **Neden/Etki**: (M/K) Floating minor → tedarik zinciri/transitif CVE penceresi. supabase-js v1'de çalışmıyor ama bundle'da (url-polyfill koşullu require). Düşük ama yönetilebilir.
- **Öneri**: `npm audit` (çalıştırılmadı — salt-okuma) + kritik paketleri tam pin'e çek. Lockfile commit'li mi teyit et. v1'de fiilen ölü olan supabase zincirini tree-shake için koşullu require zaten yardımcı.

### P3 — Cihaz-kimlik kripto-güvenli değil
- **Ne**: `cihaz-kimlik.ts:14-18` `Math.random().toString(16)` ile 10 hex char ID. Tahmin edilebilir PRNG + 40-bit alan (çakışma olası).
- **Nerede**: `src/lib/cihaz-kimlik.ts:14`.
- **Neden/Etki**: Yalnız forensic filigran (kod yorumu "kriptografik değil" diyor). Güvenlik kararı buna bağlı değil → düşük. Çakışma olursa iki kullanıcının filigranı aynı olabilir.
- **Öneri**: İsteğe bağlı `expo-crypto getRandomBytes` veya `Crypto.randomUUID()` ile değiştir (zaten import-light). v2'de gerçek user-ID'ye bağlanınca konu kapanır.

### P0/temiz — Riski olmayan, DOĞRULANMIŞ iyi noktalar
- **SQL injection YOK**: `database.native.ts` sorguları sabit string; tek template literal `PRAGMA user_version = ${version}` (`:277`) ve version dahili integer. Arama tamamen JS in-memory `filter`/`includes` (`mevzuat.tsx:155`, `ara.tsx`) → kullanıcı metni SQL'e girmiyor.
- **Loglama/PII temiz**: tüm kod tabanında tek `console.*` = `error-boundary.tsx:25` ve `if (__DEV__)` guard'lı → üretimde sessiz, PII sızdırmaz.
- **Dış link kontrollü**: `Linking.openURL` yalnız `MEVZUAT_KAYNAK_URL` (sabit .gov) ve `GIZLILIK/SARTLAR_URL` (config sabiti) ile (`madde-metni-sheet.tsx:70`, `yasal.tsx:25`) — kullanıcı/deep-link kontrollü URL açma YOK.
- **OAuth akışı sağlam**: `flowType:'pkce'`, `detectSessionInUrl:false`, `openAuthSessionAsync` (sistem tarayıcı, redirect doğrulamalı), `maybeCompleteAuthSession` koşullu. v1'de hiç çalışmıyor; v2'de güvenli temel.
- **İzinler budanmış**: `withRemovedPermissions` ile READ_MEDIA_*/RECORD_AUDIO/SYSTEM_ALERT_WINDOW/STORAGE kaldırılmış; kalan INTERNET, MODIFY_AUDIO_SETTINGS, VIBRATE — minimal, fazla izin yok. (INTERNET v1'de fiilen kullanılmıyor ama RN için standart/zararsız.)
- **Sırlar repo'da değil**: `.env` git-tracked DEĞİL (`git ls-files` boş), `.gitignore`'da. İmza credential'ları repoda değil (`~/.gradle` property'lerinden okunuyor — `withYerelBuild.js`).
- **Hermes açık** (`gradle.properties hermesEnabled=true`) → JS bytecode olarak paketlenir (düz kaynak değil).

## Hızlı kazanımlar
1. `.env`'deki `EXPO_PUBLIC_SUPABASE_*` satırlarını v1 release öncesi boşalt → gerçekten offline bundle, anon key sızıntısı sıfır (kod değişmez). **(P1, dk)**
2. `allowBackup="false"` (config plugin tek satır) → AsyncStorage/token yedek vektörü kapanır. **(P1, ~15 dk)**
3. `https` data scheme'ini AndroidManifest intent-filter'dan kaldır (kullanılmıyorsa). **(P2, dk)**
4. `gradle.properties`'e `android.enableMinifyInReleaseBuilds=true` + build testi → R8 sertleştirme + küçük APK. **(P2, build testi gerek)**

## Riskler
- **Yanlış güven**: v1 "offline/güvenli" deniyor ama bundle'a gömülü Supabase ref canlı projeye işaret ediyor → RLS yanlışsa (09) anon erişim. Ana risk burada, çözüm anahtarı boşaltmak.
- **v2 geçişi**: Üyelik açılınca token storage + allowBackup + RLS + Play Integrity hep birlikte sertleşmeli; biri eksik kalırsa hesap/entitlement bypass (08/09/10 ile koordineli).
- **Minify açmak** keep-rule eksiğinde reanimated/svg runtime hatası verebilir — kör açma değil, build doğrulamasıyla.
- İstemci-içi hiçbir önlem APK çıkarmayı engellemez (kabul edilen gerçek); gerçek içerik koruması sunucu-kapı = 09/11.

## Somut adımlar (sıralı, tahmini efor)
1. **(P1, 5 dk)** v1 release dalında `.env` Supabase satırlarını boşalt veya secret'a taşı; web/native export'ta `supabaseHazir=false` teyit. (Kod dokunmadan.)
2. **(P1, 15 dk)** `withRemovedPermissions` benzeri küçük `withAndroidManifest` plugin → `android:allowBackup=false` (+ istersen `android:fullBackupContent` boş). Prebuild + manifest teyit.
3. **(P2, 10 dk)** AndroidManifest intent-filter'dan kullanılmayan `https` scheme'ini kaldır; `mevzu` deep-link'lerinin yalnız navigasyon yaptığını (hassas aksiyon yok) regression notu olarak sabitle.
4. **(P2, 30-60 dk)** `android.enableMinifyInReleaseBuilds=true` (`withYerelBuild` set() ile) → release build + smoke test (reanimated/svg/sqlite); gerekiyorsa `proguard-rules.pro`'ya keep kuralı.
5. **(P2, 30 dk)** `npm audit` + caret bağımlılıkları (özellikle `@supabase/supabase-js`, `react-native-url-polyfill`, `image-zoom`) tam pin; lockfile commit teyidi.
6. **(P3, 15 dk)** `cihaz-kimlik.ts`'i `expo-crypto`/`randomUUID` ile değiştir (forensic kalite).
7. **(v2 backlog)** Supabase token → `expo-secure-store`; üyelik açılırken allowBackup+RLS+SecureStore+Play Integrity tek pakette (08/09/10 ile bağla).

## KARŞI-GÖRÜŞ & DOĞRULAMA (çoklu göz)
- **"allowBackup gerçek risk mi?"** — v1'de hassas veri yok (yalnız filigran ID + tercihler) → düşük; ama maliyeti ~sıfır ve v2 token'ı koruduğu için şimdi yapmak doğru. Karşı-görüş kabul: P1 ama "yayın-engelleyici değil".
- **"Anon key zaten public, boşaltmak gereksiz mi?"** — Doğru, RLS sağlamsa key sızıntısı tasarımdı. Ama v1 iddiası "%100 offline/sunucuya bağlanmaz" → bundle'da canlı endpoint bulunması gizlilik beyanıyla çelişir + gereksiz yüzey. Boşaltmak hem teknik hem uyumluluk kazancı. RLS doğrulaması yine de 09'da ZORUNLU.
- **DOĞRULANMADI olarak işaretlenenler**: minify açıldığında keep-rule ihtiyacı; `https` intent-filter'ının işlevsel kullanımı; Supabase RLS'in mevcut durumu (09 kapsamı). Bunlar build/backend testi ister.
- **Yanlış-pozitif taraması**: SQL injection, dış link, PII log, fazla izin başlıkları kod okunarak elendi (yukarıda dosya:satır kanıtlı) — bunlar bulgu DEĞİL, güçlü yön.

---
## KARŞI-GÖRÜŞ & DOĞRULAMA (kırmızı takım)

Bağımsız kod okuması ile rapordaki her ana iddia teyit edildi; bir FAKTÜEL HATA, iki önemli ATLAMA ve birkaç abartı/öncelik düzeltmesi çıktı. Aşağıda kanıt + güven notu.

### ❌ FAKTÜEL HATA (Yüksek güven) — "`https` scheme intent-filter'da" YANLIŞ; öneri zararlı
- **İddia (P2, satır 43-47 + Hızlı kazanım #3 + Adım #3)**: MainActivity intent-filter'ında `mevzu`, `exp+gorsel-hafiza-jsps` **ve `https`** var; "`https`'i intent-filter'dan kaldır, App Links/phishing yüzeyini küçültür."
- **Gerçek (DOĞRULANDI)**: `android/app/src/main/AndroidManifest.xml:11-16` — `https` **`<queries>`** bloğunda, MainActivity intent-filter'ında DEĞİL. MainActivity intent-filter (satır ~31-39, ve merged release manifest `processReleaseManifest/AndroidManifest.xml:90-98`) yalnız `mevzu` + `exp+gorsel-hafiza-jsps` içeriyor. Hiçbir yerde `android:autoVerify` YOK → App Links zaten yok.
- **`<queries><data scheme="https"/>` ne işe yarar?**: Android 11+ paket-görünürlüğü (R+ `<queries>`). Uygulamanın `Linking.openURL`/`canOpenURL` ile DIŞ tarayıcı açabilmesi için gerekli — INBOUND deep-link DEĞİL. Bu giriş, başka uygulamaların bu uygulamayı açmasına izin VERMEZ; phishing/link-hijack yüzeyi oluşturmaz.
- **Etki**: Öneri yanlış varsayıma dayanıyor; üstelik literal uygulanırsa ZARARLI — `https` query'sini silmek, uygulamanın aktif kullandığı dış link açmayı kırar (`madde-metni-sheet.tsx:70` mevzuat.gov.tr, `yasal.tsx:25` gizlilik/şartlar URL'i). **Karar**: P2 #2 bulgusu + Hızlı kazanım #3 + Adım #3 GERİ ÇEKİLMELİ/düzeltilmeli. Geriye kalan deep-link değerlendirmesi (`mevzu` paramları salt-okuma navigasyon) DOĞRU ve geçerli — `akis.tsx:74` (`lawId/bolumId/mod/kart` yalnız kuyruk seçer), `yasal.tsx:11` (`tip` yalnız metin seçer); hassas aksiyon yok. Güven: **Yüksek**.

### ➕ ATLAMA 1 (Yüksek güven) — Ekran-görüntüsü koruması var ama yalnız 1 ekranda
- **Ne / nerede**: `src/app/akis.tsx:68` `ScreenCapture.preventScreenCaptureAsync()` (kart akışında ekran görüntüsü/kayıt engelli), `:70` cleanup'ta `allowScreenCaptureAsync`. Rapor bunu HİÇ anmamış.
- **Neden önemli**: Bu, istemci-içi en somut anti-piracy/içerik-koruma kontrolü (değerli 4-panel karikatür kartları). Hem güçlü yön (raporun "istemci hiçbir şey koruyamaz" karamsarlığını kısmen çürütür) hem de EKSİK: koruma SADECE `/akis`'te. `sesli-nobet.tsx`, `sinav.tsx` ve `madde-metni-sheet` (gerçek kanun + görsel) korunmuyor → ekran kaydıyla içerik yine sızar. **Öneri (P2/P3)**: korumayı sınav/sesli-nöbet/madde-sheet ekranlarına da genişlet (kart görseli görünen her yer). Güven: **Yüksek**.

### ➕ ATLAMA 2 (Yüksek güven) — EAS Update KAPALI (OTA enjeksiyon vektörü yok) — güçlü yön
- **Ne / nerede**: `AndroidManifest.xml:19` `expo.modules.updates.ENABLED=false`. Rapor "iyi noktalar" listesinde anmamış.
- **Neden önemli**: OTA güncelleme kapalı → kötü-niyetli/uzlaşılmış bundle uzaktan enjekte edilemez; tüm kod imzalı APK'da sabit. Hermes + bu, istemci bütünlüğü için anlamlı bir artı. Güçlü yön listesine eklenmeli. Güven: **Yüksek**.

### ✎ ABARTI / DÜZELTME — `proguard-rules.pro` "boş şablon" DEĞİL
- **İddia (P2, satır 32)**: "proguard-rules.pro 12 satır (boş şablon)".
- **Gerçek**: `android/app/proguard-rules.pro` zaten reanimated + turbomodule keep kuralları içeriyor (`-keep class com.swmansion.reanimated.**`, `-keep class com.facebook.react.turbomodule.**`). Tamamen boş değil. Bu, "minify açınca reanimated için keep gerekebilir (DOĞRULANMADI)" uyarısını kısmen karşılıyor — temel keep'ler mevcut; yine de svg/sqlite/expo-modules için ek kural + build smoke-test gerekir. Bulgu yönü doğru (minify KAPALI — `build.gradle:69,127` `enableMinifyInReleaseBuilds ?: false`, gradle.properties'te set değil DOĞRULANDI), sadece şablon betimi yanlış. Güven: **Yüksek**.

### Öncelik eleştirisi
- **`allowBackup` P1 mi?** — Rapor P1 demiş; `<application ... android:allowBackup="true">` DOĞRULANDI. Ama v1'de yedeklenebilen tek veri filigran ID + tercihler (hassas değil); gerçek değer v2 token'ında. **Önerilen düzeltme**: v1 için **P2/defense-in-depth**, v2 açılışında **P0-blocker**. Maliyet ~sıfır olduğu için şimdi yapmak yine mantıklı — sadece etiket "v1 yayın-engelleyici" izlenimi vermesin (mevcut çoklu-göz notu bunu zaten yumuşatıyor).
- **Anon key bundle'da (P1)** — DOĞRULANDI: `.env` git-tracked DEĞİL (`git ls-files .env` boş) ama yerel `.env`'de GERÇEK `EXPO_PUBLIC_SUPABASE_URL` (https://vwmjr...) + anon JWT var; Metro bunları release bundle'a literal inline eder; `UYELIK_AKTIF=false` (`config.ts:58`) client'ı kursa da string bundle'da kalır. Asıl meşru P1 gerekçesi **teknik exploit değil** (o RLS'e=09 bağlı), **"%100 offline" gizlilik beyanıyla çelişki**. `.env`'i boşaltmak en yüksek getirili, sıfır-kod quick-win — KATILIYORUM, P1 doğru. Güven: **Yüksek**.
- **Cihaz-kimlik `Math.random` (P3)** — DOĞRULANDI (`cihaz-kimlik.ts:14-18`, 40-bit). Yalnız filigran; P3 doğru. Güven: **Yüksek**.

### Diğer ana iddiaların güven notları (bağımsız doğrulandı)
- Tek `console.*` = `error-boundary.tsx:25` `__DEV__` guard'lı → **DOĞRU, Yüksek**. (`src/` tam tarandı.)
- Dış link yalnız sabitlerle (`MEVZUAT_KAYNAK_URL` + `GIZLILIK/SARTLAR_URL`; `yasal.tsx:25` url=config sabiti, kullanıcı kontrollü değil) → **DOĞRU, Yüksek**.
- OAuth PKCE / `openAuthSessionAsync` / `detectSessionInUrl:false` (`supabase.ts:31-39`, `auth.ts:71`) → **DOĞRU, Yüksek** (v1'de fiilen ölü).
- İzin budama `withRemovedPermissions` ile READ_MEDIA_*/RECORD_AUDIO/SYSTEM_ALERT_WINDOW/STORAGE kaldırılmış, kalan INTERNET/MODIFY_AUDIO_SETTINGS/VIBRATE → **DOĞRU, Yüksek** (manifest okundu).
- Token storage = AsyncStorage düz metin (v2 riski, `supabase.ts:27-33`) → **DOĞRU, Yüksek**.

### Küçük not (güvenlik dışı)
- `config.ts:39` yorumu "Env varsa onu kullanır, yoksa aşağıdaki sabitler" diyor ama altta sabit yok, yalnız `?? ''` fallback var → zararsız doküman kayması; düzeltilebilir.

### Özet karar
Rapor genel olarak SAĞLAM ve kanıtlı; "kritik yayın-engelleyici yok" sonucu **doğru (Yüksek güven)**. Tek ciddi kusur: **`https` intent-filter faktüel hatası** (öneri zararlı, geri çekilmeli). İki değerli atlama (**ScreenCapture içerik-koruması** — kısmi; **EAS Update kapalı** — güçlü yön) eklenmeli. Öncelikte tek düzeltme: `allowBackup` v1 için P1 değil P2/defense-in-depth.
