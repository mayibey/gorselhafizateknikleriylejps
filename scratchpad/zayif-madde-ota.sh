#!/bin/bash
cd "D:/Mevzu/JSPS/uygulama"
MESAJ="Evsaf Er Meydani zayif madde -> kart (bayrak zayif-madde-kart, yalniz baskan)"
node scripts/gorsel-registry-uret.mjs --manifest && node scripts/ses-registry-uret.mjs --manifest || exit 1
for V in 1.0.47 1.0.46; do
  node -e "const fs=require('fs');const j=JSON.parse(fs.readFileSync('app.json','utf8'));j.expo.version='$V';fs.writeFileSync('app.json',JSON.stringify(j,null,2)+'\n')"
  echo "=== $V ==="
  for d in 1 2 3; do
    EAS_NO_VCS=1 TMPDIR=D:/Mevzu/ortak/easbuild-tmp NODE_OPTIONS="--max-old-space-size=8192 --dns-result-order=ipv4first" \
      npx eas update --branch production --message "$MESAJ ($V)" --non-interactive > /d/Mevzu/ortak/easbuild-tmp/ota-$V.log 2>&1
    grep -E "Runtime version|Update group ID" /d/Mevzu/ortak/easbuild-tmp/ota-$V.log && break
    echo "deneme $d basarisiz"; tail -3 /d/Mevzu/ortak/easbuild-tmp/ota-$V.log
  done
done
git checkout -- app.json src/assets/kart-gorselleri.ts src/assets/kart-sesleri.ts
echo "BITTI: $(git status --short app.json src/assets | wc -l) degisik dosya"
