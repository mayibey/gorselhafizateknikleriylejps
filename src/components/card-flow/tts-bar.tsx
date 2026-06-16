import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { KART_SES_METINLERI } from '../../assets/kart-ses-metinleri';
import { AppText } from '@/components/ui/app-text';
import { Palette, Radius, Spacing } from '@/constants/theme';

/**
 * Sesli anlatım — kartın ses metnini cihazın TTS'i (expo-speech) ile okur.
 * Kayıtlı ses DOSYASI YOK; metin `KART_SES_METINLERI[gorsel_yolu]`'dan gelir,
 * telefon Türkçe sesiyle okunur (çevrimdışı, ücretsiz). Metni olmayan kartta gizli.
 * Auto-play YOK. Kart değişince/ekran kapanınca okuma durur (key + cleanup).
 */
export function TtsBar({
  gorselYolu,
  onBitti,
}: {
  gorselYolu: string | null;
  /** Anlatım sonuna kadar okunup bitince çağrılır (kullanıcı durdurursa ÇAĞRILMAZ). */
  onBitti?: () => void;
}) {
  const metin = gorselYolu ? KART_SES_METINLERI[gorselYolu] : undefined;
  const [oynuyor, setOynuyor] = useState(false);

  useEffect(() => {
    return () => {
      void Speech.stop();
    };
  }, []);

  if (!metin) return null;

  function calistirDurdur() {
    if (oynuyor) {
      void Speech.stop();
      setOynuyor(false);
      return;
    }
    setOynuyor(true);
    Speech.speak(metin!, {
      language: 'tr-TR',
      rate: 1.0,
      onDone: () => {
        setOynuyor(false);
        onBitti?.();
      },
      onStopped: () => setOynuyor(false),
      onError: () => setOynuyor(false),
    });
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.bar, pressed && styles.pressed]}
      onPress={calistirDurdur}
      accessibilityRole="button"
      accessibilityLabel={oynuyor ? 'Sesli anlatımı durdur' : 'Sesli anlatımı dinle'}>
      <MaterialCommunityIcons
        name={oynuyor ? 'stop-circle' : 'volume-high'}
        size={22}
        color={Palette.beyaz}
      />
      <AppText variant="kucuk" color="beyaz" bold>
        {oynuyor ? 'Durdur' : 'Sesli Anlatım'}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    backgroundColor: Palette.lacivert,
    borderRadius: Radius.m,
    paddingVertical: Spacing.two,
    marginTop: Spacing.two,
  },
  pressed: {
    opacity: 0.85,
  },
});
