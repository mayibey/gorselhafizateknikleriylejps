// iOS'ta 'aps-environment' entitlement'ını KALDIRAN Expo config plugin'i.
// SORUN: expo-notifications iOS entitlements'a aps-environment (uzak/remote push) ekliyor →
// build, Push Notifications capability'li bir provisioning profile ister. Ama push kimlik bilgisi
// (APNs key) Apple ID + username/password + 2FA istiyor (App Store Connect API key BUNU yapamaz) →
// profil push içermiyor → Xcode "doesn't include the aps-environment entitlement" ile düşüyor.
// GERÇEK İHTİYAÇ: uygulama yalnız YEREL hatırlatma bildirimi kullanıyor; yerel bildirim aps-environment
// GEREKTİRMEZ (o sadece uzak push için). Bu yüzden entitlement kaldırılır → build push profili istemez.
// (Uzak push ileride istenirse: Apple ID ile APNs key kurulur + bu plugin çıkarılır.)
const { withEntitlementsPlist } = require('@expo/config-plugins');

module.exports = function withoutRemotePush(config) {
  return withEntitlementsPlist(config, (cfg) => {
    delete cfg.modResults['aps-environment'];
    return cfg;
  });
};
