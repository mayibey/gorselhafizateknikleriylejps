import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { KART_SES_METINLERI } from '../../assets/kart-ses-metinleri';
import { AppText } from '@/components/ui/app-text';
import { Palette, Radius, Spacing } from '@/constants/theme';

/**
 * Sesli anlatım — kartın ses metnini cihazın TTS'i (expo-speech) ile okur.
 * Kayıtlı ses DOSYASI YOK → metin `KART_SES_METINLERI[gorsel_yolu]`'dan gelir.
 *
 * expo-speech bir TTS MOTORU'dur (ses dosyası değil) → saniye bazında ileri/geri
 * sarma YOK. Bunun yerine metin CÜMLELERE bölünür; ◀ önceki / ▶ sonraki cümle ile
 * kaçırılan yer tekrar dinlenebilir. Durdur→Oynat aynı cümleden devam eder.
 *
 * Auto-play YOK. Kart değişince component remount olur (akis'te key=card.id) → durur.
 */

/** Metni cümlelere böler; çok kısa parçaları (kısaltma vb.) öncekine ekler. */
function cumlelereBol(metin: string): string[] {
  const ham = metin.replace(/\s+/g, ' ').trim().match(/[^.!?]+[.!?]+|\S[^.!?]*$/g) ?? [metin];
  const out: string[] = [];
  for (const p of ham.map((s) => s.trim()).filter(Boolean)) {
    if (out.length > 0 && p.length < 15) out[out.length - 1] += ' ' + p;
    else out.push(p);
  }
  return out.length > 0 ? out : [metin];
}

export function TtsBar({
  gorselYolu,
  onBitti,
}: {
  gorselYolu: string | null;
  /** Son cümle de okunup anlatım bitince çağrılır (kullanıcı durdurursa ÇAĞRILMAZ). */
  onBitti?: () => void;
}) {
  const metin = gorselYolu ? KART_SES_METINLERI[gorselYolu] : undefined;
  const cumleler = useMemo(() => (metin ? cumlelereBol(metin) : []), [metin]);

  const [aktif, setAktif] = useState(0); // okunan cümle indeksi
  const [oynuyor, setOynuyor] = useState(false);
  const aktifRef = useRef(0);
  const oynuyorRef = useRef(false);
  // Her oynat/durdur "nesil"i artırır; eski okumanın onDone'u geç gelirse (seek/stop)
  // nesli tutmadığı için zincirlemez → çakışma olmaz.
  const nesilRef = useRef(0);

  // Unmount / kart değişimi → okumayı durdur.
  useEffect(() => {
    return () => {
      nesilRef.current += 1;
      oynuyorRef.current = false;
      void Speech.stop();
    };
  }, []);

  if (!metin) return null;

  // i. cümleyi oku; bitince (aynı nesilse ve durdurulmadıysa) sonrakine zincirle.
  function cumleOku(i: number, nesil: number) {
    aktifRef.current = i;
    setAktif(i);
    Speech.speak(cumleler[i], {
      language: 'tr-TR',
      rate: 1.0,
      onDone: () => {
        if (nesil !== nesilRef.current || !oynuyorRef.current) return;
        const sonraki = i + 1;
        if (sonraki < cumleler.length) {
          cumleOku(sonraki, nesil);
        } else {
          oynuyorRef.current = false;
          setOynuyor(false);
          onBitti?.();
        }
      },
      onStopped: () => {},
      onError: () => {
        if (nesil !== nesilRef.current) return;
        oynuyorRef.current = false;
        setOynuyor(false);
      },
    });
  }

  // Verilen cümleden oynatmaya başla (önce mevcut okumayı kes, nesli artır).
  function oynat(i: number) {
    nesilRef.current += 1;
    const nesil = nesilRef.current;
    void Speech.stop();
    oynuyorRef.current = true;
    setOynuyor(true);
    cumleOku(i, nesil);
  }

  function durdur() {
    nesilRef.current += 1; // mevcut zinciri geçersiz kıl
    oynuyorRef.current = false;
    setOynuyor(false);
    void Speech.stop();
  }

  function calistirDurdur() {
    if (oynuyor) durdur();
    else oynat(aktifRef.current); // durduğu cümleden devam
  }

  // Seek: her zaman yeni cümleden SESLİ oynat (kaçırılan yeri duy).
  function sar(delta: number) {
    const yeni = Math.min(cumleler.length - 1, Math.max(0, aktifRef.current + delta));
    oynat(yeni);
  }

  const ilkCumle = aktif === 0;
  const sonCumle = aktif >= cumleler.length - 1;

  return (
    <View style={styles.bar}>
      <Pressable
        onPress={() => sar(-1)}
        disabled={ilkCumle && !oynuyor}
        style={({ pressed }) => [styles.yan, pressed && styles.pressed, ilkCumle && !oynuyor && styles.pasif]}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Önceki cümle">
        <MaterialCommunityIcons name="skip-previous" size={24} color={Palette.beyaz} />
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.orta, pressed && styles.pressed]}
        onPress={calistirDurdur}
        accessibilityRole="button"
        accessibilityLabel={oynuyor ? 'Sesli anlatımı durdur' : 'Sesli anlatımı dinle'}>
        <MaterialCommunityIcons
          name={oynuyor ? 'pause-circle' : 'volume-high'}
          size={22}
          color={Palette.beyaz}
        />
        <AppText variant="kucuk" color="beyaz" bold>
          {oynuyor ? 'Durdur' : 'Sesli Anlatım'}
        </AppText>
        {cumleler.length > 1 ? (
          <AppText variant="etiket" color="kenarlik">
            {aktif + 1}/{cumleler.length}
          </AppText>
        ) : null}
      </Pressable>

      <Pressable
        onPress={() => sar(1)}
        disabled={sonCumle}
        style={({ pressed }) => [styles.yan, pressed && styles.pressed, sonCumle && styles.pasif]}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Sonraki cümle">
        <MaterialCommunityIcons name="skip-next" size={24} color={Palette.beyaz} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    backgroundColor: Palette.lacivert,
    borderRadius: Radius.m,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    marginTop: Spacing.two,
  },
  yan: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orta: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  pasif: {
    opacity: 0.3,
  },
  pressed: {
    opacity: 0.85,
  },
});
