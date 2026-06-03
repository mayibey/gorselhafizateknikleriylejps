import { StyleSheet, Text, View } from 'react-native';

import { FiligranAci, FiligranOpaklik, FontFamily, Palette } from '@/constants/theme';

/** Bir satırdaki tekrar sayısı ve toplam satır (kartı + köşeleri kaplayacak yoğunluk). */
const SATIR_SAYISI = 14;
const SATIR_ICI_TEKRAR = 8;

/**
 * Forensic filigran: çapraz, yarı saydam, tekrarlayan metin overlay.
 * Saf UI — DB/IO yok, sadece `metin` prop'u. pointerEvents="none" → dokunmayı bloklamaz.
 * StudyCard'ın overflow:'hidden' kökü içinde olduğundan kart sınırında kırpılır (taşma yok).
 */
export function Watermark({ metin }: { metin: string }) {
  const satir = Array(SATIR_ICI_TEKRAR).fill(metin).join('     ');

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={styles.overlay}>
        <View style={styles.katman}>
          {Array.from({ length: SATIR_SAYISI }).map((_, i) => (
            <Text key={i} style={styles.metin} numberOfLines={1}>
              {satir}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Karttan büyük + çapraz: overlay'in flex merkezlemesiyle kartın MERKEZİNE oturur,
  // taşan kısımlar kök overflow:'hidden' ile kırpılır (köşeler çapraz tile ile kaplanır).
  // position:'absolute' YOK — absolute olsaydı parent'ın center align'ı uygulanmaz, sol-üste çakılırdı.
  katman: {
    width: 900,
    height: 900,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 26,
    opacity: FiligranOpaklik,
    transform: [{ rotate: FiligranAci }],
  },
  metin: {
    color: Palette.lacivert,
    fontFamily: FontFamily,
    fontSize: 13,
    fontWeight: '700',
    // İnce açık kontur: koyu/renkli görsel alanlarında da okunsun (krem kartta zaten lacivert okunur).
    textShadowColor: 'rgba(247, 241, 227, 0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
