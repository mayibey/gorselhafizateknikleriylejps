#!/bin/bash
# Madde metni düzeltmeleri OTA (6 Eki 2026, başkan "düzelt ve yay"): 1.0.47 + 1.0.46 (son yayınlarla aynı filo;
# eski runtime'lara bu tur basılmadı). Başarı = çıktıda "Update group ID". Kullanım: bash scratchpad/madde-metni-ota.sh
set -u
cd "D:/GorselHafizaTeknikleriyleJSPS"
export PATH="/c/Users/GIGABYTE/AppData/Local/Programs/cursor/resources/app/resources/helpers:$PATH"
export EAS_NO_VCS=1 TMPDIR="D:/easbuild-tmp" NODE_OPTIONS="--max-old-space-size=8192 --dns-result-order=ipv4first"
EAS=~/AppData/Roaming/npm/node_modules/eas-cli/bin/run
MESAJ="Madde metni duzeltmeleri: Resmi Yazisma guncel metin, Ek 3 yurt disi izni, TMK m.21 (7594), editor notlari temizlendi"
ASIL=$(node -e "console.log(JSON.parse(require('fs').readFileSync('app.json','utf8')).expo.version)")
echo "asıl sürüm: $ASIL"
node scripts/gorsel-registry-uret.mjs --manifest && node scripts/ses-registry-uret.mjs --manifest || { echo "MANIFEST HATA"; exit 1; }
for V in 1.0.47 1.0.46; do
  node -e "const fs=require('fs');const j=JSON.parse(fs.readFileSync('app.json','utf8'));j.expo.version='$V';fs.writeFileSync('app.json',JSON.stringify(j,null,2)+'\n')"
  echo "=== $V ==="
  ok=0
  for deneme in 1 2 3 4 5; do
    OUT=$(node "$EAS" update --branch production --message "$MESAJ ($V)" --non-interactive 2>&1)
    echo "$OUT" | grep -E "Runtime version|Update group ID|Published|rror" | head -8
    if echo "$OUT" | grep -q "Update group ID"; then ok=1; break; fi
    echo "  deneme $deneme başarısız, tekrar…"; sleep 15
  done
  [ $ok = 1 ] && echo "  ✓ $V YAYINLANDI" || echo "  !!! $V YAYINLANAMADI"
done
git checkout -- src/assets/kart-gorselleri.ts src/assets/kart-sesleri.ts app.json
echo "app.json geri: $(node -e "console.log(JSON.parse(require('fs').readFileSync('app.json','utf8')).expo.version)")"
git status --short src/assets app.json
echo "HEPSI BITTI"
