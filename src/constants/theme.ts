/**
 * JSPS sınav hazırlık uygulamasının tema sabitleri.
 * Tek font ailesi, büyük punto (yorgun gözle telefonda okunur).
 */

import '@/global.css';

import { Platform } from 'react-native';

/** Krem premium marka paleti. Kırmızı SADECE aksiyon/uyarı içindir. */
export const Palette = {
  // Lacivert / krom ekseni
  lacivert: '#0B1F3A', // ana / krom
  lacivert2: '#173B6B', // krom üst tonu / aksan
  anaMetin: '#1B2A4A', // krem üstünde ana metin
  kirmizi: '#C00000', // sadece aksiyon / uyarı

  // Krem yüzeyler
  kremZemin: '#F7F3EA', // sayfa zemini
  kartKremi: '#FFFCF5', // kart yüzeyi
  kenarlik: '#E7DCC7', // kart kenarlığı
  ayirici: '#EFE6D6', // ince ayraç
  solukMetin: '#6E6047', // ikincil metin (koyulaştırıldı: krem üstünde WCAG AA ≈4.6:1; eski #8A7D62 = 3.67:1 okunmuyordu)

  // Altın (şampanya)
  altin: '#C9A227', // ana altın accent
  altinKoyu: '#B88917', // koyu altın (ikon/svg + KOYU ekranda yazı)
  altinMetin: '#8A6510', // krem üstünde altın YAZI (WCAG AA ≈4.5:1; altinKoyu metin olarak soluktu)
  altinSolukYuzey: '#F3E7C1', // altın soluk yüzey (rozet/pill arka)

  // İlerleme
  ilerlemeDolu: '#C9A227',
  ilerlemeTrack: '#EDE3CF',

  kartGolge: 'rgba(11,31,58,0.08)', // kart gölgesi (shadowColor değil; rgba)

  // Kart çalışma ekranı (KOYU mod — app krem ama çalışma modu koyu premium).
  kartZeminKoyu: '#061A33', // çalışma ekranı zemini
  kartYuzeyKoyu: '#0B1F3A', // header / yüzey
  kartPanelKoyu: '#0D2747', // ses paneli vb.
  kartMetinAcik: '#FFFFFF', // koyu üstünde ana metin
  kartMetinIkincil: '#D8CFBD', // koyu üstünde ikincil metin
  kartKenarKoyu: 'rgba(255,255,255,0.14)', // koyu üstünde ince kenar
  altinAcik2: '#E7BC56', // koyu üstünde altın accent (waveform/playhead)
  altinParlak: '#F3C24A', // GECE ekranında TAM PARLAK sıcak altın (handoff v2 COLOR_SPEC "bright") — kanonik altin'a dokunma, bu EK
  kirmiziParlak: '#F04438', // GECE ekranında uyarı kırmızısı (koyu zeminde #C00000 okunmuyordu; handoff #F04438) — EK

  // Korunan yardımcı tonlar (mevcut ekranlar kullanıyor)
  ten: '#E8C9A8',
  yesil: '#2E7D32',
  amber: '#8A5A12', // uyarı (koyulaştırıldı: soluk altın zemin üstünde okunabilir; eski #B5791C düşük kontrasttı)
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
export const FiligranOpaklik = 0.22;
export const FiligranAci = '-30deg';
/** Kart Akışı'nın "telefon kolonu" genişlik tavanı (web'de ortalanır, dar ekranda devreye girmez). */
export const CardFlowMaxWidth = 460;

/** Tek font ailesi (yeni JSPS ekranları için). */
export const FontFamily = Platform.select({
  ios: 'system-ui',
  android: 'sans-serif',
  default: 'System',
});
