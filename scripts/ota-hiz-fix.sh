#!/usr/bin/env bash
# OTA: ses hızının kart değişince kaybolması hatası (kullanıcı bildirimi, 6 Ağu 2026).
# Canlıda 4 runtime var → her birine ayrı yayın şart (appVersion politikası).
# İçerik zaten strip'li olmalı (require sayısı 0) — değilse önce: npm run icerik:manifest
set -u
cd "D:/GorselHafizaTeknikleriyleJSPS"

export TMPDIR='D:\easbuild-tmp'
export TEMP='D:\easbuild-tmp'
export TMP='D:\easbuild-tmp'
export NODE_OPTIONS='--dns-result-order=ipv4first'   # IPv6 DNS tuzağı (bkz. hafıza)

MESAJ="Ses hizi kart degisince korunuyor (1.5x artik gercekten uygulaniyor)"

for SURUM in 1.0.43 1.0.42 1.0.41 1.0.40; do
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
    if npx eas update --channel production --message "$MESAJ" --non-interactive 2>&1 | tail -12; then
      BASARILI=1; break
    fi
    echo "  deneme $DENEME basarisiz, tekrar..."
    sleep 8
  done
  [ "$BASARILI" = "1" ] && echo "$SURUM YAYINLANDI" || echo "$SURUM BASARISIZ"
done

git checkout -- app.json
echo "app.json geri alindi:"; grep -m1 '"version"' app.json
