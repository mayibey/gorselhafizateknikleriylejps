#!/usr/bin/env bash
# Yerel release AAB build (Play'e yüklenecek). Tek komut: bash scripts/build-aab.sh
#
# vCode 6 deneyiminden öğrenilenler bu script'te sabit:
#  - İçerik STRIP (icerik:manifest) → app ~47MB (yoksa 755MB, Play'e sığmaz). Bitince GERİ YÜKLENİR.
#  - NODE_OPTIONS heap ↑ → Metro/node JS-bundle çökmesin (büyük app, 766 modül).
#  - JAVA_HOME (Android Studio JBR) + ANDROID_HOME otomatik.
#  - gradle OOM ayarları (paralel kapalı, Kotlin in-process) zaten withYerelBuild'de.
set -e
cd "$(dirname "$0")/.."

export JAVA_HOME="${JAVA_HOME:-/c/Program Files/Android/Android Studio/jbr}"
export ANDROID_HOME="${ANDROID_HOME:-$LOCALAPPDATA/Android/Sdk}"
export NODE_OPTIONS="--max-old-space-size=8192"

[ -f "$JAVA_HOME/bin/java.exe" ] || { echo "HATA: JAVA_HOME bulunamadı: $JAVA_HOME"; exit 1; }

# Build ne olursa olsun (hata/başarı) içeriği dev için geri yükle.
geri_yukle() { echo "↩ içerik geri yükleniyor (dev modu)…"; npm run icerik:tam >/dev/null 2>&1 || true; }
trap geri_yukle EXIT

echo "==> 1/3 içerik strip (app küçülsün)"
npm run icerik:manifest

echo "==> 2/3 prebuild --clean (native android/ + expo-iap + imza)"
npx expo prebuild --clean --platform android

echo "==> 3/3 gradle bundleRelease (AAB)"
./android/gradlew -p android bundleRelease

AAB="android/app/build/outputs/bundle/release/app-release.aab"
echo ""
[ -f "$AAB" ] && echo "✅ HAZIR: $AAB ($(du -m "$AAB" | cut -f1) MB)" || { echo "❌ AAB oluşmadı"; exit 1; }
