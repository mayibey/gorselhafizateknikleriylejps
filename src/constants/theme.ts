/**
 * JSPS sınav hazırlık uygulamasının tema sabitleri.
 * Tek font ailesi, büyük punto (yorgun gözle telefonda okunur).
 */

import '@/global.css';

import { Platform } from 'react-native';

/** Uygulama renk paleti. Kırmızı SADECE aksiyon/uyarı içindir. */
export const Palette = {
  lacivert: '#1F3864', // ana / krom
  kirmizi: '#C00000', // sadece aksiyon / uyarı
  kremZemin: '#F7F1E3', // sayfa zemini
  kartKremi: '#FBF6EA', // kart yüzeyi
  kenarlik: '#E3D8BE',
  solukMetin: '#8A7A52',
  altin: '#E6C24A',
  ten: '#E8C9A8',
  yesil: '#2E7D32',
  amber: '#B5791C',
  beyaz: '#FFFFFF',
} as const;

export type PaletteColor = keyof typeof Palette;

/** Büyük puntolu tipografi ölçeği. */
export const Type = {
  dev: 34,
  baslik: 26,
  altBaslik: 20,
  govde: 18,
  kucuk: 15,
  etiket: 13,
} as const;

export const Radius = {
  s: 8,
  m: 14,
  l: 20,
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

/** Forensic filigran: fotoğrafta görünür ama kartı okutur opaklık + çapraz açı. */
export const FiligranOpaklik = 0.15;
export const FiligranAci = '-30deg';
/** Kart Akışı'nın "telefon kolonu" genişlik tavanı (web'de ortalanır, dar ekranda devreye girmez). */
export const CardFlowMaxWidth = 460;

/** Tek font ailesi (yeni JSPS ekranları için). */
export const FontFamily = Platform.select({
  ios: 'system-ui',
  android: 'sans-serif',
  default: 'System',
});
