# Yerel Android Build (EAS kuyruğu yok)

Kendi PC'nde AAB üretir — EAS kuyruğu beklemeden. İlk build ~10-15 dk
(Gradle + bağımlılık indirme), sonrakiler **1-4 dk** (cache).

## Gerekli (tek seferlik, kurulu)
- Android Studio → JDK (JBR) `C:\Program Files\Android\Android Studio\jbr`
- Android SDK `%LOCALAPPDATA%\Android\Sdk` (build-tools 35.0.0 + platform-tools)
- Upload keystore: `credentials/upload-keystore.jks` (GİZLİ, git-dışı, şifre `credentials/KEYSTORE_BILGI.txt`)
- İmza creds: `~/.gradle/gradle.properties` (MEVZU_UPLOAD_* — **BOM'suz UTF-8 olmalı**, yoksa debug'a düşer!)

## Adımlar
```powershell
# 1) Native projeyi üret (android/ git-dışı; ilk sefer ya da app.json/ikon/isim değişince)
#    NOT: imza + arm64-v8a + heap artık config plugin'le OTOMATİK uygulanır
#    (plugins/withYerelBuild.js → app.json). Elle re-apply YOK.
npx expo prebuild -p android --no-install

# 2) Build
cd android
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
.\gradlew.bat :app:bundleRelease --no-daemon

# 3) AAB:  android/app/build/outputs/bundle/release/app-release.aab
#    → Copy-Item ile D:\mevzu-yerel.aab'ye kopyala
```

> **SDK yolu:** Build, `$env:ANDROID_HOME` set edildiği için SDK'yı bulur; `local.properties` şart değil. "SDK location not found" derse `android/local.properties`'e `sdk.dir=C:/Users/GIGABYTE/AppData/Local/Android/Sdk` ekle.
> **İmza otomatik ama creds gerekli:** Plugin imza BLOĞUNU enjekte eder; gerçek anahtar bilgileri yine `~/.gradle/gradle.properties`'teki `MEVZU_UPLOAD_*` property'lerinden gelir (BOM'suz UTF-8). O dosya yoksa AAB yine debug'a düşer.

## Önemli notlar
- **RAM:** 4 ABI birden derlenirse daemon OOM olur ("daemon disappeared"). `reactNativeArchitectures=arm64-v8a` tek ABI → çözüm. Modern telefonların hepsi arm64. Genel yayında istersen `armeabi-v7a` ekle.
- **İmza:** AAB'nin `CN=MEVZU-JSPS` ile imzalı olduğunu DOĞRULA:
  `& "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe" -printcert -jarfile <aab>`
  "Android Debug" çıkarsa `~/.gradle/gradle.properties` BOM'lu/okunmamış demektir.
- **versionCode:** Her yeni Play yüklemesinde artmalı. Kaynak `app.json > android.versionCode` (prebuild build.gradle'a yazar); her sürümde +1 (şu an **4**).
- **Yükleme:** Play Console'a `D:\mevzu-yerel.aab` yüklenir. EAS'in `D:\mevzu.aab`'si FARKLI anahtarla imzalı → onu YÜKLEME (yerel anahtara bağlı kaldık).
