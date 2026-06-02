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

// --- Aşağısı Expo template bileşenlerinin (themed-text vb.) geriye dönük uyumu içindir. ---

export const Colors = {
  light: {
    text: '#000000',
    background: Palette.kremZemin,
    backgroundElement: Palette.kartKremi,
    backgroundSelected: Palette.kenarlik,
    textSecondary: Palette.solukMetin,
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: { sans: 'system-ui', serif: 'ui-serif', rounded: 'ui-rounded', mono: 'ui-monospace' },
  default: { sans: 'normal', serif: 'serif', rounded: 'normal', mono: 'monospace' },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

/** Tek font ailesi (yeni JSPS ekranları için). */
export const FontFamily = Platform.select({
  ios: 'system-ui',
  android: 'sans-serif',
  default: 'System',
});
