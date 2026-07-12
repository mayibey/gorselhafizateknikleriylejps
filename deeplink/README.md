# Er Meydanı derin bağlantı (Universal / App Links) — kurulum

Amaç: WhatsApp'tan atılan `https://mevzujsps.com/oda/4271` linki → app açılır, direkt odaya girer.

## 1) Bu iki dosyayı mevzujsps.com'a yükle (KESİN yol):
- `apple-app-site-association` → **https://mevzujsps.com/.well-known/apple-app-site-association**
  - Uzantı YOK, `Content-Type: application/json` sunulmalı, HTTPS, yönlendirme YOK.
- `assetlinks.json` → **https://mevzujsps.com/.well-known/assetlinks.json**

## 2) Android parmak izi (assetlinks.json'daki placeholder):
`sha256_cert_fingerprints` içine **Play App Signing** SHA-256'yı yaz:
Play Console → (uygulama) → Test and release → Setup → **App integrity** →
**App signing key certificate** → SHA-256 fingerprint (AA:BB:CC:… formatı).

## 3) Build gerekir:
app.json'a eklenen `ios.associatedDomains` + `android.intentFilters` NATIVE ayar →
bir sonraki build ile aktif olur (OTA yetmez). In-app yönlendirme (`/oda/[kod]` →
katılım onayı) OTA ile gelir; ama link'in app'i AÇMASI için build şart.

## 4) Doğrulama (yükledikten sonra):
- iOS: https://mevzujsps.com/.well-known/apple-app-site-association JSON dönüyor mu.
- Android: https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://mevzujsps.com&relation=delegate_permission/common.handle_all_urls
