#!/usr/bin/env bash
# OTA'yı CANLIDAKİ HER SÜRÜME ayrı ayrı gönderir.
#
# NEDEN DÖNGÜ: runtimeVersion politikası "appVersion" — yayın, app.json'daki sürüm numarasına
# gider. Canlıda dört sürüm var; tek yayın yalnız birine ulaşır, ötekiler eski kodda kalır.
# (6 Ağu 2026: Oyun Merkezi yalnız 1.0.43'e atılmıştı, Android eski sürümdeydi ve sekmede
# hâlâ Er Meydanı açılıyordu — hata sanıldı, sebebi buydu.)
#
# Kullanım:  bash scripts/ota-yayinla.sh "yayin mesaji"
# ŞART: önce `npm run icerik:manifest`, sonra `npm run icerik:tam` (bkz. hafıza: OTA reçetesi).
set -u
cd "D:/GorselHafizaTeknikleriyleJSPS"

MESAJ="${1:?kullanim: bash scripts/ota-yayinla.sh \"yayin mesaji\"}"
SURUMLER="${SURUMLER:-1.0.44 1.0.43 1.0.42 1.0.41 1.0.40}"

export TMPDIR='D:\easbuild-tmp'
export TEMP='D:\easbuild-tmp'
export TMP='D:\easbuild-tmp'
export NODE_OPTIONS='--dns-result-order=ipv4first'   # IPv6 DNS tuzağı
export EAS_SKIP_AUTO_FINGERPRINT=1                   # parmak izi hesabı uzun sürüyor, gerekmiyor

for SURUM in $SURUMLER; do
  echo "=================== $SURUM ==================="
  python - "$SURUM" <<'PY'
import io, re, sys
s = io.open('app.json', encoding='utf-8').read()
s = re.sub(r'("version"\s*:\s*)"[^"]+"', r'\1"%s"' % sys.argv[1], s, count=1)
io.open('app.json', 'w', encoding='utf-8').write(s)
print('app.json version =', sys.argv[1])
PY
  BASARILI=0
  for DENEME in 1 2 3 4 5; do
    if npx eas update --channel production --message "$MESAJ" --non-interactive 2>&1 | tail -10; then
      BASARILI=1; break
    fi
    echo "  deneme $DENEME basarisiz, tekrar..."
    sleep 8
  done
  [ "$BASARILI" = "1" ] && echo "$SURUM YAYINLANDI" || echo "$SURUM BASARISIZ"
done

git checkout -- app.json
echo "app.json geri alindi:"; grep -m1 '"version"' app.json
