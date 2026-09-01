#!/bin/bash
cd "D:/GorselHafizaTeknikleriyleJSPS"
MESAJ="Talim testlerinde durum etiketi (cozuldu/devam ediyor/cozulmedi)"
for V in 1.0.46 1.0.45 1.0.43; do
  node -e "const fs=require('fs');const j=JSON.parse(fs.readFileSync('app.json','utf8'));j.expo.version='$V';fs.writeFileSync('app.json',JSON.stringify(j,null,2)+'\n')"
  echo "=== $V ==="
  EAS_NO_VCS=1 TMPDIR=D:/easbuild-tmp NODE_OPTIONS=--max-old-space-size=8192 \
    npx eas update --branch production --message "$MESAJ ($V)" --non-interactive 2>&1 \
    | grep -E "Runtime version|Update group ID|error|Error" || true
done
node -e "const fs=require('fs');const j=JSON.parse(fs.readFileSync('app.json','utf8'));j.expo.version='1.0.46';fs.writeFileSync('app.json',JSON.stringify(j,null,2)+'\n');console.log('app.json geri:',j.expo.version)"
