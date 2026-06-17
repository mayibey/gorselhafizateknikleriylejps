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
# 1) Native projeyi üret (android/ git-dışı; ilk sefer ya da app.json değişince)
npx expo prebuild -p android --no-install

# 2) android/ içindeki AYARLARI uygula (prebuild bunları SIFIRLAR — her prebuild sonrası tekrar):
#    - android/local.properties:  sdk.dir=C:/Users/GIGABYTE/AppData/Local/Android/Sdk
#    - android/gradle.properties:  org.gradle.jvmargs=-Xmx4096m ...   ve   reactNativeArchitectures=arm64-v8a
#    - android/app/build.gradle:  release signingConfig (MEVZU_UPLOAD_* okur) — bkz. git geçmişi/bu dosya
#    (scripts/yerel-build-hazirla varsa onu çalıştır; yoksa elle)

# 3) Build
cd android
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
.\gradlew.bat :app:bundleRelease --no-daemon

# 4) AAB:  android/app/build/outputs/bundle/release/app-release.aab
```

## Önemli notlar
- **RAM:** 4 ABI birden derlenirse daemon OOM olur ("daemon disappeared"). `reactNativeArchitectures=arm64-v8a` tek ABI → çözüm. Modern telefonların hepsi arm64. Genel yayında istersen `armeabi-v7a` ekle.
- **İmza:** AAB'nin `CN=MEVZU-JSPS` ile imzalı olduğunu DOĞRULA:
  `& "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe" -printcert -jarfile <aab>`
  "Android Debug" çıkarsa `~/.gradle/gradle.properties` BOM'lu/okunmamış demektir.
- **versionCode:** Her yeni Play yüklemesinde artmalı. app.json'a `android.versionCode` ekleyip her sürümde +1 yap (şu an 1).
- **Yükleme:** Play Console'a `D:\mevzu-yerel.aab` yüklenir. EAS'in `D:\mevzu.aab`'si FARKLI anahtarla imzalı → onu YÜKLEME (yerel anahtara bağlı kaldık).
