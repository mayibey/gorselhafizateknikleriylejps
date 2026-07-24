// TikTok Business SDK (iOS) entegrasyonu — Expo config plugin.
// Amaç: App Store'dan gelen kurulum/olayları TikTok'a iletip reklam kampanyalarını ölçmek/optimize etmek.
//
// Ne yapar (prebuild'de ios/ üretilince):
//  1) Podfile: pod 'TikTokBusinessSDK','1.7.1' (resmî CocoaPod; masaüstündeki xcframework ile AYNI sürüm).
//  2) Xcode ana target: Other Linker Flags -> -ObjC ve -lc++ (TikTok'un şartı; kategoriler linklensin).
//  3) Info.plist: NSUserTrackingUsageDescription (ATT metni) + (varsa) TikTokAccessToken (env'den).
//  4) AppDelegate.swift: uygulama açılışında SDK init + ATT izni iste.
//
// GÜVENLİK: App ID ve TikTok App ID herkese açık (binary'de zaten bulunur) -> sabit.
//   Access Token (App Secret) GİZLİ -> ASLA git'e girmez; sadece process.env.TIKTOK_ACCESS_TOKEN
//   (EAS secret) varsa Info.plist'e yazılır. Yoksa token'sız (deprecated ama çalışan) init'e düşülür,
//   böylece token olmadan da build kırılmaz.
const {
  withDangerousMod,
  withInfoPlist,
  withAppDelegate,
  withXcodeProject,
  withProjectBuildGradle,
  withAppBuildGradle,
  withMainApplication,
  AndroidConfig,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const APP_ID = '6787908212'; // App Store uygulama kimliği (app.mevzujsps.ios)
const TIKTOK_APP_ID = '7666130586798063624'; // TikTok Events Manager -> iOS TikTok Uygulama Kimliği
const POD_VERSION = '1.7.1';
// Android — ayrı veri kaynağı / ayrı TikTok App ID (panelde oluşturuldu)
const ANDROID_APP_ID = 'app.mevzujsps.android'; // Play paket adı
const ANDROID_TIKTOK_APP_ID = '7666125033059762194';
const ANDROID_SDK = 'com.github.tiktok:tiktok-business-android-sdk:1.5.0'; // jitpack (panel step 02)
const ATT_MESAJ =
  'Reklamların sizinle daha alakalı olması ve uygulama performansını ölçebilmemiz için cihaz tanımlayıcınız kullanılır.';

const POD_ISARET = '# mevzu-tiktok-pod';

// 1) Podfile: TikTok pod'unu ana target'a ekle (idempotent).
function withTikTokPod(config) {
  return withDangerousMod(config, [
    'ios',
    (cfg) => {
      const podfile = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
      let c = fs.readFileSync(podfile, 'utf8');
      if (!c.includes(POD_ISARET)) {
        c = c.replace(
          /(target\s+['"][^'"]+['"]\s+do\s*\n)/,
          `$1  pod 'TikTokBusinessSDK', '${POD_VERSION}' ${POD_ISARET}\n`,
        );
        fs.writeFileSync(podfile, c);
      }
      return cfg;
    },
  ]);
}

// 2) Ana app target'ına -ObjC ve -lc++ linker flag'lerini ekle.
function withLinkerFlags(config) {
  return withXcodeProject(config, (cfg) => {
    const proj = cfg.modResults;
    const buildConfigs = proj.pbxXCBuildConfigurationSection();
    for (const key of Object.keys(buildConfigs)) {
      const bc = buildConfigs[key];
      if (!bc || typeof bc !== 'object' || !bc.buildSettings) continue;
      // Sadece uygulama target'ı (Pods değil): PRODUCT_NAME'i olan konfigürasyonlar.
      if (!bc.buildSettings.PRODUCT_NAME) continue;
      let flags = bc.buildSettings.OTHER_LDFLAGS;
      if (!flags) flags = ['"$(inherited)"'];
      if (!Array.isArray(flags)) flags = [flags];
      for (const f of ['"-ObjC"', '"-lc++"']) {
        if (!flags.includes(f)) flags.push(f);
      }
      bc.buildSettings.OTHER_LDFLAGS = flags;
    }
    return cfg;
  });
}

// 3) Info.plist: ATT metni + (varsa) gizli access token.
function withTikTokPlist(config) {
  return withInfoPlist(config, (cfg) => {
    cfg.modResults.NSUserTrackingUsageDescription = ATT_MESAJ;
    const tok = process.env.TIKTOK_ACCESS_TOKEN;
    if (tok && tok.trim()) {
      cfg.modResults.TikTokAccessToken = tok.trim(); // git'te DEĞİL; EAS secret / env'den gelir
    }
    return cfg;
  });
}

// 4) AppDelegate.swift: açılışta SDK init + ATT izni.
function withTikTokInit(config) {
  return withAppDelegate(config, (cfg) => {
    let src = cfg.modResults.contents;
    if (src.includes('mevzu-tiktok-init')) return cfg; // idempotent
    // import ekle
    if (!src.includes('import TikTokBusinessSDK')) {
      if (/^import ExpoModulesCore\s*$/m.test(src)) {
        src = src.replace(/(^import ExpoModulesCore\s*$)/m, `$1\nimport TikTokBusinessSDK`);
      } else {
        src = src.replace(/(^import .*$)/m, `$1\nimport TikTokBusinessSDK`);
      }
    }
    const initKod = [
      '',
      '    // mevzu-tiktok-init: TikTok Business SDK başlat + ATT izni iste',
      `    let ttAppId = "${APP_ID}"`,
      `    let ttTikTokAppId = "${TIKTOK_APP_ID}"`,
      '    let ttToken = Bundle.main.object(forInfoDictionaryKey: "TikTokAccessToken") as? String',
      '    var ttConfig: TikTokConfig? = nil',
      '    if let tok = ttToken, !tok.isEmpty {',
      '      ttConfig = TikTokConfig(accessToken: tok, appId: ttAppId, tiktokAppId: ttTikTokAppId)',
      '    } else {',
      '      ttConfig = TikTokConfig(appId: ttAppId, tiktokAppId: ttTikTokAppId)',
      '    }',
      '    if let cfg = ttConfig {',
      '      TikTokBusiness.initializeSdk(cfg)',
      '      TikTokBusiness.requestTrackingAuthorization(completionHandler: { _ in })',
      '    }',
      '',
    ].join('\n');
    // didFinishLaunchingWithOptions gövdesinin başına yerleştir.
    // NOT: SDK 54'te imza ÇOK SATIRLI (func application(... didFinishLaunchingWithOptions ...) -> Bool {) —
    // bu yüzden çok satırlı desen + '-> Bool {' sonuna ekle.
    const desen = /(func\s+application\([\s\S]*?didFinishLaunchingWithOptions[\s\S]*?\)\s*->\s*Bool\s*\{[ \t]*\n)/;
    if (!desen.test(src)) {
      throw new Error(
        "withTikTokBusinessSDK: AppDelegate'te didFinishLaunchingWithOptions bulunamadı — TikTok init eklenemedi. Plugin desenini güncelle.",
      );
    }
    src = src.replace(desen, `$1${initKod}`);
    cfg.modResults.contents = src;
    return cfg;
  });
}

// ===== ANDROID =====

// 5) Proje build.gradle: jitpack maven repo (TikTok Android SDK oradan gelir).
function withAndroidRepo(config) {
  return withProjectBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== 'groovy') return cfg;
    let c = cfg.modResults.contents;
    if (!c.includes('mevzu-tiktok-jitpack')) {
      // allprojects/repositories içine ekle; yoksa maven satırını repositories bloklarına yamalamak yerine
      // güvenli: 'google()' geçen ilk repositories bloğuna ekle.
      if (/maven\s*\{\s*url\s*['"]https:\/\/jitpack\.io['"]/.test(c)) {
        // zaten var
      } else {
        c = c.replace(/(repositories\s*\{)/, `$1\n        maven { url 'https://jitpack.io' } // mevzu-tiktok-jitpack`);
      }
      cfg.modResults.contents = c;
    }
    return cfg;
  });
}

// 6) app/build.gradle: TikTok SDK bağımlılığı.
function withAndroidDependency(config) {
  return withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== 'groovy') return cfg;
    let c = cfg.modResults.contents;
    if (!c.includes('mevzu-tiktok-sdk')) {
      c = c.replace(/(dependencies\s*\{)/, `$1\n    implementation '${ANDROID_SDK}' // mevzu-tiktok-sdk`);
      cfg.modResults.contents = c;
    }
    return cfg;
  });
}

// 7) AD_ID izni (Android 13+ reklam kimliği için).
function withAndroidPermission(config) {
  return AndroidConfig.Permissions.withPermissions(config, ['com.google.android.gms.permission.AD_ID']);
}

// 8) MainApplication: açılışta TikTok SDK init + startTrack.
function withAndroidInit(config) {
  return withMainApplication(config, (cfg) => {
    let src = cfg.modResults.contents;
    if (src.includes('mevzu-tiktok-init')) return cfg; // idempotent
    const kotlin = cfg.modResults.language === 'kt' || /\.kt$/.test(cfg.modResults.path || '') || /fun onCreate\(\)/.test(src);
    // import
    if (!src.includes('com.tiktok.TikTokBusinessSdk')) {
      src = src.replace(/(^package .*$)/m, `$1\n\nimport com.tiktok.TikTokBusinessSdk`);
    }
    if (kotlin) {
      const initKod = [
        '',
        '    // mevzu-tiktok-init: TikTok Business SDK (Android) başlat',
        '    try {',
        `      val ttConfig = TikTokBusinessSdk.TTConfig(applicationContext)`,
        `        .setAppId("${ANDROID_APP_ID}")`,
        `        .setTTAppId("${ANDROID_TIKTOK_APP_ID}")`,
        '      TikTokBusinessSdk.initializeSdk(ttConfig)',
        '      TikTokBusinessSdk.startTrack()',
        '    } catch (e: Throwable) { android.util.Log.e("TikTokSDK", "init hata", e) }',
        '',
      ].join('\n');
      // super.onCreate() sonrasına ekle
      src = src.replace(/(super\.onCreate\(\)\s*\n)/, `$1${initKod}`);
    } else {
      const initKod = [
        '',
        '    // mevzu-tiktok-init: TikTok Business SDK (Android) başlat',
        '    try {',
        `      TikTokBusinessSdk.TTConfig ttConfig = new TikTokBusinessSdk.TTConfig(getApplicationContext())`,
        `        .setAppId("${ANDROID_APP_ID}")`,
        `        .setTTAppId("${ANDROID_TIKTOK_APP_ID}");`,
        '      TikTokBusinessSdk.initializeSdk(ttConfig);',
        '      TikTokBusinessSdk.startTrack();',
        '    } catch (Throwable e) { android.util.Log.e("TikTokSDK", "init hata", e); }',
        '',
      ].join('\n');
      src = src.replace(/(super\.onCreate\(\);\s*\n)/, `$1${initKod}`);
    }
    cfg.modResults.contents = src;
    return cfg;
  });
}

module.exports = function withTikTokBusinessSDK(config) {
  // iOS
  config = withTikTokPod(config);
  config = withLinkerFlags(config);
  config = withTikTokPlist(config);
  config = withTikTokInit(config);
  // Android
  config = withAndroidRepo(config);
  config = withAndroidDependency(config);
  config = withAndroidPermission(config);
  config = withAndroidInit(config);
  return config;
};
