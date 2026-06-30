// Gereksiz/hassas Android izinlerini kaldıran Expo config plugin'i.
// Kütüphaneler (expo-audio, expo-dev-client, görsel yükleyiciler) manifest'lerine
// galeri/kayıt/overlay izinleri ekliyor; uygulama bunları KULLANMIYOR. Play Store
// foto/video iznini gördüğünde beyan ister → izni kaldırmak en temizi.
// prebuild her çalıştığında otomatik uygulanır (manuel manifest düzenlemesine gerek yok).
const { withAndroidManifest } = require('@expo/config-plugins');

const KALDIRILACAK = [
  'android.permission.READ_MEDIA_IMAGES',
  'android.permission.READ_MEDIA_VIDEO',
  'android.permission.READ_EXTERNAL_STORAGE',
  'android.permission.WRITE_EXTERNAL_STORAGE',
  'android.permission.RECORD_AUDIO',
  'android.permission.SYSTEM_ALERT_WINDOW',
  // Arka plan sesi KODDA KAPATILDI (_layout.tsx: setAudioModeAsync shouldPlayInBackground:false)
  // → ses yalnız uygulama önplandayken çalar → foreground-service iznine GEREK YOK → kaldır.
  // Böylece Play "Ön plan hizmeti izinleri" beyan zorunluluğu ortadan kalkar.
  'android.permission.FOREGROUND_SERVICE',
  'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK',
];

module.exports = function withRemovedPermissions(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    // tools: ad alanı (tools:node="remove" için şart)
    manifest.$['xmlns:tools'] = manifest.$['xmlns:tools'] || 'http://schemas.android.com/tools';
    manifest['uses-permission'] = manifest['uses-permission'] || [];
    for (const perm of KALDIRILACAK) {
      // varsa doğrudan tanımı çıkar
      manifest['uses-permission'] = manifest['uses-permission'].filter(
        (p) => p.$ && p.$['android:name'] !== perm
      );
      // merge sırasında kütüphaneden geleni de engelle
      manifest['uses-permission'].push({ $: { 'android:name': perm, 'tools:node': 'remove' } });
    }
    return cfg;
  });
};
