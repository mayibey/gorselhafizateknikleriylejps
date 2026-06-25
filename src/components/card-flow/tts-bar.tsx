import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Rect } from 'react-native-svg';

import { KART_SES_METINLERI } from '../../assets/kart-ses-metinleri';
import { AppText } from '@/components/ui/app-text';
import { Palette, Spacing } from '@/constants/theme';

/**
 * Sesli anlatım — kartın ses metnini cihazın TTS'i (expo-speech) ile okur.
 * Kayıtlı ses DOSYASI YOK → metin `KART_SES_METINLERI[gorsel_yolu]`'dan gelir.
 *
 * expo-speech bir TTS MOTORU'dur (ses dosyası değil) → saniye bazında ileri/geri
 * sarma + GERÇEK süre + GERÇEK waveform YOK. Bunun yerine metin CÜMLELERE bölünür;
 * ◀ önceki / ▶ sonraki CÜMLE ile gezinme. Waveform DEKORATİF: dolu kısım cümle
 * ilerlemesini (kaçıncı cümle) gösterir — saniye/süre DEĞİL (dürüst gösterge).
 *
 * Auto-play YOK. Kart değişince component remount olur (akis'te key=card.id) → durur.
 */

/** Hız döngüsü (expo-speech rate parametresi → gerçek hızlanma). */
const HIZLAR = [1.0, 1.25, 1.5] as const;
/** Dekoratif waveform çubuk sayısı. */
const BAR_SAYISI = 40;
const DALGA_Y = 38;

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
  const [hizIdx, setHizIdx] = useState(0);
  const [W, setW] = useState(0); // waveform genişliği (onLayout)
  const aktifRef = useRef(0);
  const oynuyorRef = useRef(false);
  const hizRef = useRef<number>(HIZLAR[0]);
  // Her oynat/durdur "nesil"i artırır; eski okumanın onDone'u geç gelirse (seek/stop)
  // nesli tutmadığı için zincirlemez → çakışma olmaz.
  const nesilRef = useRef(0);

  // Sabit (dekoratif) genlik deseni — gerçek ses genliği DEĞİL.
  const amplitudler = useMemo(
    () =>
      Array.from(
        { length: BAR_SAYISI },
        (_, i) => 0.3 + 0.7 * Math.abs(Math.sin(i * 0.6) * Math.cos(i * 0.27)),
      ),
    [],
  );

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
      rate: hizRef.current, // canlı hız (sonraki cümle yeni hızla okunur)
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

  // Seek: her zaman yeni CÜMLEDEN sesli oynat (kaçırılan yeri duy).
  function sar(delta: number) {
    const yeni = Math.min(cumleler.length - 1, Math.max(0, aktifRef.current + delta));
    oynat(yeni);
  }

  function hizDegis() {
    const yeni = (hizIdx + 1) % HIZLAR.length;
    setHizIdx(yeni);
    hizRef.current = HIZLAR[yeni];
  }

  const olc = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && w !== W) setW(w);
  };

  const ilkCumle = aktif === 0;
  const sonCumle = aktif >= cumleler.length - 1;
  // Dolu oran = CÜMLE ilerlemesi (kaçıncı cümle) — saniye/süre DEĞİL.
  const oran = cumleler.length > 0 ? (aktif + 1) / cumleler.length : 0;
  const barW = W > 0 ? (W / BAR_SAYISI) * 0.55 : 0;

  return (
    <View style={styles.panel}>
      <View style={styles.ust}>
        <MaterialCommunityIcons name="volume-high" size={18} color={Palette.altinAcik2} />
        <AppText variant="kucuk" bold color="kartMetinAcik">
          Sesli Anlatım
        </AppText>
      </View>

      {/* DEKORATİF waveform (gerçek ses genliği değil; dolu = cümle ilerlemesi) */}
      <View style={styles.dalgaSar} onLayout={olc}>
        {W > 0 ? (
          <Svg width={W} height={DALGA_Y}>
            {amplitudler.map((a, i) => {
              const cx = (i + 0.5) * (W / BAR_SAYISI);
              const bh = a * DALGA_Y * 0.86;
              const dolu = (i + 0.5) / BAR_SAYISI <= oran;
              return (
                <Rect
                  key={i}
                  x={cx - barW / 2}
                  y={(DALGA_Y - bh) / 2}
                  width={barW}
                  height={bh}
                  rx={barW / 2}
                  fill={dolu ? Palette.altinAcik2 : Palette.kartMetinIkincil}
                  opacity={dolu ? 1 : 0.3}
                />
              );
            })}
            {/* Playhead: cümle oranına denk gelen ince altın çizgi + üstte nokta */}
            <Rect x={W * oran - 1} y={0} width={2} height={DALGA_Y} fill={Palette.altinAcik2} />
            <Circle cx={W * oran} cy={4} r={3.5} fill={Palette.altinAcik2} />
          </Svg>
        ) : null}
      </View>

      {/* Tek satır (kompakt): cümle sayacı (dürüst — süre/saat YOK) + legend */}
      <View style={styles.altSatir}>
        <AppText variant="etiket" bold color="kartMetinAcik">
          Cümle {aktif + 1} / {cumleler.length}
        </AppText>
        <View style={styles.legend}>
          <View style={[styles.lgNokta, { backgroundColor: Palette.altinAcik2 }]} />
          <AppText variant="etiket" color="kartMetinIkincil">
            Dinlenen
          </AppText>
          <View style={[styles.lgNokta, styles.lgNoktaGri]} />
          <AppText variant="etiket" color="kartMetinIkincil">
            Kalan
          </AppText>
        </View>
      </View>

      {/* Kontroller: ◀ önceki cümle · büyük dur/devam · ▶ sonraki cümle · hız */}
      <View style={styles.kontroller}>
        <Pressable
          onPress={() => sar(-1)}
          disabled={ilkCumle && !oynuyor}
          style={({ pressed }) => [styles.yan, pressed && styles.pressed, ilkCumle && !oynuyor && styles.pasif]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Önceki cümle">
          <MaterialCommunityIcons name="skip-previous" size={28} color={Palette.kartMetinAcik} />
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.oynat, pressed && styles.pressed]}
          onPress={calistirDurdur}
          accessibilityRole="button"
          accessibilityLabel={oynuyor ? 'Sesli anlatımı durdur' : 'Sesli anlatımı dinle'}>
          <MaterialCommunityIcons
            name={oynuyor ? 'pause' : 'play'}
            size={34}
            color={Palette.lacivert}
          />
        </Pressable>

        <Pressable
          onPress={() => sar(1)}
          disabled={sonCumle}
          style={({ pressed }) => [styles.yan, pressed && styles.pressed, sonCumle && styles.pasif]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Sonraki cümle">
          <MaterialCommunityIcons name="skip-next" size={28} color={Palette.kartMetinAcik} />
        </Pressable>

        <Pressable
          onPress={hizDegis}
          style={({ pressed }) => [styles.hizBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Okuma hızı">
          <AppText variant="kucuk" bold color="altinAcik2">
            {HIZLAR[hizIdx]}x
          </AppText>
          <AppText variant="etiket" color="kartMetinIkincil">
            HIZ
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: Palette.kartPanelKoyu,
    borderColor: Palette.kartKenarKoyu,
    borderWidth: 1,
    borderRadius: 20,
    padding: Spacing.two,
    gap: Spacing.one,
    marginTop: Spacing.two,
  },
  ust: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  dalgaSar: {
    width: '100%',
    height: DALGA_Y,
  },
  altSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  lgNokta: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 2,
  },
  lgNoktaGri: {
    backgroundColor: Palette.kartMetinIkincil,
    opacity: 0.4,
    marginLeft: Spacing.two,
  },
  kontroller: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  yan: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  oynat: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Palette.altin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hizBtn: {
    width: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pasif: {
    opacity: 0.3,
  },
  pressed: {
    opacity: 0.85,
  },
});
