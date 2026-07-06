// iOS Podfile'a modular_headers ekleyen Expo config plugin'i.
// SORUN: @react-native-google-signin/google-signin, Firebase 'AppCheckCore' (Swift pod) çeker;
// bu da 'GoogleUtilities' + 'RecaptchaInterop'a bağlı ama onlar modül tanımlamıyor → statik
// kütüphane olarak entegre EDİLEMEZ ("pod install exited with non-zero code: 1"). Çözüm (CocoaPods'un
// önerdiği): bu iki bağımlılığı :modular_headers => true ile bildir (global use_modular_headers!'a
// göre daha cerrahi — diğer RN pod'larını etkilemez).
// Prebuild ios/Podfile'ı ürettikten SONRA bu plugin yamalar → pod install başarılı.
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const ISARET = '# mevzu-modular-headers';
const EK =
  `  pod 'GoogleUtilities', :modular_headers => true ${ISARET}\n` +
  `  pod 'RecaptchaInterop', :modular_headers => true ${ISARET}\n`;

module.exports = function withModularHeaders(config) {
  return withDangerousMod(config, [
    'ios',
    (cfg) => {
      const podfile = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(podfile, 'utf8');
      if (contents.includes(ISARET)) return cfg; // idempotent
      // Ana uygulama target'ının hemen içine ekle (ilk `target '...' do` satırından sonra).
      contents = contents.replace(/(target\s+['"][^'"]+['"]\s+do\s*\n)/, `$1${EK}`);
      fs.writeFileSync(podfile, contents);
      return cfg;
    },
  ]);
};
