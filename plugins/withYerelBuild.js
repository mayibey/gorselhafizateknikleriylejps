// Yerel Android build ayarlarını prebuild'e kalıcı olarak işleyen Expo config plugin'i.
// Prebuild, android/ klasörünü template'ten yeniden üretirken aşağıdakileri SIFIRLAR:
//   - app/build.gradle release imza yapılandırması (debug'a düşer → Play reddeder)
//   - gradle.properties (4 ABI birden → daemon OOM; düşük heap)
// Bu plugin her prebuild'de bunları OTOMATİK geri uygular → elle düzenleme yok.
// (İmza KİMLİK BİLGİLERİ repoda değil; ~/.gradle/gradle.properties'teki MEVZU_UPLOAD_*
//  property'lerinden okunur. Plugin yalnızca bu property'leri kullanan bloğu enjekte eder.)
const { withAppBuildGradle, withGradleProperties } = require('@expo/config-plugins');

// 1) app/build.gradle → release imza bloğu + buildTypes.release koşullu imza
function withReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    let g = cfg.modResults.contents;

    // Zaten uygulanmışsa (idempotent) dokunma
    if (g.includes('MEVZU_UPLOAD_STORE_FILE')) {
      return cfg;
    }

    // (a) buildTypes.release: imzayı koşullu yap (debug buildType'tan ÖNCE bunu yap,
    //     çünkü o aşamada signingConfigs içinde yalnız tek "release {" yok)
    g = g.replace(
      /(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)signingConfig signingConfigs\.debug/,
      "$1signingConfig project.hasProperty('MEVZU_UPLOAD_STORE_FILE') ? signingConfigs.release : signingConfigs.debug"
    );

    // (b) signingConfigs içine release bloğunu ekle (debug bloğunun hemen ardına)
    g = g.replace(
      /(keyPassword 'android'\s*\n\s*\})/,
      "$1\n        release {\n" +
      "            // MEVZU yerel upload imzası — creds ~/.gradle/gradle.properties (MEVZU_UPLOAD_*)\n" +
      "            if (project.hasProperty('MEVZU_UPLOAD_STORE_FILE')) {\n" +
      "                storeFile file(MEVZU_UPLOAD_STORE_FILE)\n" +
      "                storePassword MEVZU_UPLOAD_STORE_PASSWORD\n" +
      "                keyAlias MEVZU_UPLOAD_KEY_ALIAS\n" +
      "                keyPassword MEVZU_UPLOAD_KEY_PASSWORD\n" +
      "            }\n" +
      "        }"
    );

    cfg.modResults.contents = g;
    return cfg;
  });
}

// 2) gradle.properties → tek ABI (arm64) + yüksek heap (OOM fix)
function withBuildTuning(config) {
  return withGradleProperties(config, (cfg) => {
    const set = (key, value) => {
      const item = cfg.modResults.find((i) => i.type === 'property' && i.key === key);
      if (item) item.value = value;
      else cfg.modResults.push({ type: 'property', key, value });
    };
    set('org.gradle.jvmargs', '-Xmx5120m -XX:MaxMetaspaceSize=512m');
    set('reactNativeArchitectures', 'arm64-v8a');
    // OOM fix (vCode 6 build deneyiminden): paralel JS-bundle + native + ayrı Kotlin daemon
    // aynı anda bellek tepesi → daemon çöküyordu. Paralel kapalı + Kotlin gradle-içinde + işçi 2.
    set('org.gradle.parallel', 'false');
    set('org.gradle.workers.max', '2');
    set('kotlin.compiler.execution.strategy', 'in-process');
    return cfg;
  });
}

module.exports = function withYerelBuild(config) {
  config = withReleaseSigning(config);
  config = withBuildTuning(config);
  return config;
};
