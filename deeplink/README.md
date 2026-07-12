# Er Meydanı derin bağlantı (Universal / App Links) — kurulum

Amaç: WhatsApp'tan atılan `https://mevzujsps.com/oda/4271` linki → app açılır, direkt odaya girer.

## Barınma: GitHub Pages (bu repo!)
mevzujsps.com = **bu repo'nun `docs/` klasörü** (GitHub Pages, master → /docs, CNAME
mevzujsps.com, `docs/.nojekyll` var → dotfolder'lar olduğu gibi sunulur). Yani
doğrulama dosyaları `docs/.well-known/` altına konur, push'lanınca canlıya çıkar.
Hostinger/FTP GEREKMEZ.

## 1) iOS — TAMAM ✅
- `docs/.well-known/apple-app-site-association` canlı:
  https://mevzujsps.com/.well-known/apple-app-site-association (200, appID
  BPJR5S85TK.app.mevzujsps.ios, paths /oda/*). Apple CDN 200 veriyor.
- GitHub Pages extensionless dosyayı `application/octet-stream` sunar; Apple CDN
  bunu tolere eder (sorun değil).

## 2) Android — BEKLİYOR (Play App Signing SHA-256 gerek)
- `assetlinks.json`'daki placeholder yerine Play App Signing SHA-256 yazılıp
  `docs/.well-known/assetlinks.json` olarak konacak, sonra Android build.
- Parmak izi: Play Console → (uygulama) → Test and release → Setup → **App
  integrity** → **App signing key certificate** → SHA-256 (AA:BB:CC:… formatı).

## 3) Build gerekir (native)
app.json `ios.associatedDomains` + `android.intentFilters` NATIVE ayar → build ile
aktif olur (OTA yetmez). In-app yönlendirme (`/oda/[kod]` → katılım onayı) koda
gömülü; ama link'in app'i AÇMASI için build şart. iOS build 1.0.35 ile aktifleşir.

## 4) Doğrulama
- iOS: https://mevzujsps.com/.well-known/apple-app-site-association JSON dönüyor mu.
- Apple CDN: https://app-site-association.cdn-apple.com/a/v1/mevzujsps.com
- Android: https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://mevzujsps.com&relation=delegate_permission/common.handle_all_urls
