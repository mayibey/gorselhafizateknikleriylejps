// iOS'ta 'aps-environment' entitlement'ını KALDIRAN Expo config plugin'i.
// SORUN: expo-notifications iOS entitlements'a aps-environment (uzak/remote push) ekliyor →
// build, Push Notifications capability'li provisioning profile ister. Ama push kimlik bilgisi (APNs
// key) Apple ID + username/password + 2FA istiyor (App Store Connect API key BUNU yapamaz) → profil
// push içermiyor → Xcode "doesn't include the aps-environment entitlement" ile düşüyor.
// GERÇEK İHTİYAÇ: yalnız YEREL hatırlatma bildirimi; yerel bildirim aps-environment GEREKTİRMEZ.
// (İleride uzak push istenirse Apple ID ile APNs key kurulur + bu plugin çıkarılır.)
//
// YÖNTEM: Önce withEntitlementsPlist ile sil (config seviyesi). AMA plugin sırası/ekleme zamanı
// nedeniyle expo-notifications'ın modu sonra çalışıp geri ekleyebiliyor → EK GÜVENCE olarak
// withDangerousMod ile prebuild ÜRETTİKTEN SONRA .entitlements DOSYASINDAN da regex'le sil.
const { withEntitlementsPlist, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

function apsSil(config) {
  return withEntitlementsPlist(config, (cfg) => {
    delete cfg.modResults['aps-environment'];
    return cfg;
  });
}

function apsDosyadanSil(config) {
  return withDangerousMod(config, [
    'ios',
    (cfg) => {
      const iosDir = cfg.modRequest.platformProjectRoot; // .../ios
      // Tüm .entitlements dosyalarında aps-environment key+string çiftini kaldır.
      const gez = (dir) => {
        for (const ad of fs.readdirSync(dir)) {
          const tam = path.join(dir, ad);
          const st = fs.statSync(tam);
          if (st.isDirectory()) gez(tam);
          else if (ad.endsWith('.entitlements')) {
            let icerik = fs.readFileSync(tam, 'utf8');
            const yeni = icerik.replace(
              /\s*<key>aps-environment<\/key>\s*<string>[^<]*<\/string>/,
              '',
            );
            if (yeni !== icerik) fs.writeFileSync(tam, yeni);
          }
        }
      };
      if (fs.existsSync(iosDir)) gez(iosDir);
      return cfg;
    },
  ]);
}

module.exports = function withoutRemotePush(config) {
  return apsDosyadanSil(apsSil(config));
};
