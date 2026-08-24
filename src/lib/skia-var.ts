/**
 * SKIA VAR MI? — bu bundle ESKİ bir binary'nin üstünde çalışıyor olabilir.
 *
 * NEDEN (24 Ağu 2026): iOS kullanıcılarının %94'ü hâlâ 1.0.43'te ve mağazadan
 * güncellemiyorlar. 1.0.43 build'inden bugüne uygulamaya eklenen telefon-tarafı
 * modül YALNIZCA üç tane: skia, expo-haptics, lottie. haptics zaten güvenli
 * (modül yoksa reddedilen söz döner, yakalanıyor), lottie hiç kullanılmıyor.
 * Geriye tek engel Skia kalıyor: `NativeSetup.js` modül BULUNAMAZSA doğrudan
 * `throw` ediyor → statik import yapan bundle eski binary'de HİÇ AÇILMAZ.
 *
 * Bu dosya import'u try/catch içine alır. Skia yoksa `skiaVar=false` olur ve
 * çağıran bileşen ışıma katmanını çizmez (keskin SVG/animasyon aynen durur).
 * Böylece aynı bundle hem 1.0.46 hem 1.0.43 binary'sinde çalışır.
 *
 * KURAL: Skia'yı BAŞKA hiçbir dosyada doğrudan import etme — hep buradan al.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
let modul: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  modul = require('@shopify/react-native-skia');
} catch {
  modul = null; // eski binary: native RNSkia yok
}

/** Skia bu cihazda kullanılabilir mi? (1.0.43 ve öncesi build'lerde false) */
export const skiaVar: boolean = modul != null && modul.Canvas != null;

/** Skia modülü (yoksa null). Kullanmadan önce `skiaVar` kontrol et. */
export const Skia2: any = modul;
