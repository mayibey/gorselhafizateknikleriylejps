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
const { withDangerousMod, withInfoPlist, withAppDelegate, withXcodeProject } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const APP_ID = '6787908212'; // App Store uygulama kimliği (app.mevzujsps.ios)
const TIKTOK_APP_ID = '7666130586798063624'; // TikTok Events Manager -> TikTok Uygulama Kimliği
const POD_VERSION = '1.7.1';
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

module.exports = function withTikTokBusinessSDK(config) {
  config = withTikTokPod(config);
  config = withLinkerFlags(config);
  config = withTikTokPlist(config);
  config = withTikTokInit(config);
  return config;
};
