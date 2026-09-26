/**
 * EKRAN ÖLÇEĞİ (başkan, 27 Eyl 2026: "her şeyi sığdıracak şekilde yap; konu sadece iPad değil,
 * Android'de de böyle olmalı").
 *
 * Uygulama ~393×852 (iPhone 15) ekrana göre çizildi. Bu katsayı bütün ölçüleri ekrana oranlar:
 *  - Tablet (kısa kenar ≥ 600): büyür, en çok 1.6× → iPad/Android tablette içerik ekranı doldurur.
 *  - Küçük telefon: hafif küçülür, en az 0.82× → iPhone SE / kısa Android'de taşma azalır.
 *  - Normal telefon: 1 → hiçbir şey değişmez.
 * Uygulama açılışında BİR KEZ hesaplanır (yön dikey kilitli, pencere boyu değişmez).
 */
import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');
const kisa = Math.min(width, height);
const uzun = Math.max(width, height);
const ham = Math.min(kisa / 393, uzun / 852);
const sinirla = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

export const EKRAN_OLCEK = !kisa || !uzun ? 1 : kisa >= 600 ? sinirla(ham, 1, 1.6) : sinirla(ham, 0.82, 1);

/** Bir ölçüyü ekran katsayısıyla çarpar (tam sayıya yuvarlar; 0 ve çok küçük değerler korunur). */
export function o(n: number): number {
  if (EKRAN_OLCEK === 1 || !n || Math.abs(n) < 2) return n;
  return Math.round(n * EKRAN_OLCEK * 2) / 2;
}
