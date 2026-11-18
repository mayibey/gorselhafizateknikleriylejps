#!/bin/bash
# Tur sonu odeme ekrani OTA — 18 Kas 2026. 1.0.47 + 1.0.46.
set -u
cd "D:/Mevzu/JSPS/uygulama"
export EAS_NO_VCS=1 TMPDIR="D:/Mevzu/ortak/easbuild-tmp" TEMP="D:/Mevzu/ortak/easbuild-tmp" TMP="D:/Mevzu/ortak/easbuild-tmp" NODE_OPTIONS="--max-old-space-size=8192 --dns-result-order=ipv4first"
MESAJ="Tur sonu odeme ekrani (bayrakli odeme-tur-sonu, kapali)"
node scripts/gorsel-registry-uret.mjs --manifest && node scripts/ses-registry-uret.mjs --manifest || { echo "MANIFEST HATA"; exit 1; }
for V in 1.0.47 1.0.46; do
  node -e "const fs=require('fs');const j=JSON.parse(fs.readFileSync('app.json','utf8'));j.expo.version='$V';fs.writeFileSync('app.json',JSON.stringify(j,null,2)+'\n')"
  echo "=== $V ==="
  ok=0
  for deneme in 1 2 3 4 5; do
    OUT=$(npx eas update --branch production --message "$MESAJ ($V)" --non-interactive 2>&1)
    echo "$OUT" | grep -E "Runtime version|Update group ID|Published|rror" | head -8
    if echo "$OUT" | grep -q "Update group ID"; then ok=1; break; fi
    echo "  deneme $deneme basarisiz, tekrar…"; sleep 15
  done
  [ $ok = 1 ] && echo "  ✓ $V YAYINLANDI" || echo "  !!! $V YAYINLANAMADI"
done
git checkout -- src/assets/kart-gorselleri.ts src/assets/kart-sesleri.ts app.json
git status --short src/assets app.json
echo "HEPSI BITTI"
