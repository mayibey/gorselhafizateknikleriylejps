import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { useImzaliTazele } from '@/hooks/use-imzali-tazele';
import { sesKaynak } from '@/lib/ses-kaynak';
import { Palette, Spacing } from '@/constants/theme';
import { SES_HIZLARI, sesHizDurum } from '@/lib/ses-hiz';

/**
 * GERÇEK ses (mp3) oynatıcı — kartın insan-seslendirme dosyasını çalar (expo-audio).
 * TtsBar'ın (robotik TTS) muadili: ses DOSYASI olan kartlarda (KART_SESLERI'de kayıtlı)
 * TtsBar yerine bu kullanılır. GERÇEK ilerleme/seek (currentTime/duration), play/pause,
 * ±10sn. Otomatik başlar (kart açılınca; TtsBar paritesi — akis key=card.id ile remount).
 * Bitince onBitti (akis'te "geçelim mi?" modalını tetikler).
 */

function bicimSure(s: number): string {
  const v = Number.isFinite(s) && s > 0 ? s : 0;
  const dk = Math.floor(v / 60);
  const sn = Math.floor(v % 60);
  return `${dk}:${sn.toString().padStart(2, '0')}`;
}

export function SesOynatici({
  sesYolu,
  onBitti,
}: {
  /** Ses anahtarı = kartın gorsel_yolu (KART_SESLERI ile aynı namespace). */
  sesYolu: string | null;
  /** Ses sonuna kadar çalınıp bitince çağrılır (kullanıcı durdurursa ÇAĞRILMAZ). */
  onBitti?: () => void;
}) {
  useImzaliTazele(); // web imzalı modda mp3 URL'i gelince yeniden çiz (native no-op)
  const kaynak = sesKaynak(sesYolu);
  const player = useAudioPlayer(kaynak);
  const durum = useAudioPlayerStatus(player);
  const [W, setW] = useState(0);
  const [hizIdx, setHizIdx] = useState(sesHizDurum.idx); // okuma hızı (paylaşılan, korunur)

  const oynuyor = durum?.playing ?? false;
  const yukleniyor = durum?.isBuffering ?? false;
  const sure = durum?.duration ?? 0;
  const an = durum?.currentTime ?? 0;
  const oran = sure > 0 ? Math.min(1, Math.max(0, an / sure)) : 0;

  // Mount'ta OTOMATİK başla (kart açılınca; akis key=card.id → her kartta yeniden mount).
  const basladiRef = useRef(false);
  useEffect(() => {
    if (basladiRef.current || kaynak === null) return;
    basladiRef.current = true;
    try {
      player.shouldCorrectPitch = true; // hızlanınca ses tizleşmesin (konuşma doğal kalsın)
      player.play();
    } catch (e) {
      // Sessizce yutma → teşhis (native private-bucket / imzalı-URL sorunları görünür olsun).
      console.warn('[ses] otomatik başlatma hatası', sesYolu, e);
    }
  }, [player, kaynak, sesYolu]);

  // Hızı player'a uygula (yeni kart/oynatıcı VE hız değişiminde) → seçilen hız korunur.
  useEffect(() => {
    try {
      player.shouldCorrectPitch = true;
      player.setPlaybackRate(SES_HIZLARI[hizIdx], 'high');
    } catch {}
  }, [player, hizIdx]);

  // Ses YÜKLENEMEZ/ÇALINAMAZSA sessizce yutma → teşhis için logla. expo-audio hata durumunu
  // playbackState='error' (ve/veya status.error) ile bildirir. Private bucket'ta imzalı URL
  // gelmezse / 400 alınırsa burada görünür (eskiden hata tamamen sessizdi, "ses yok" sanılıyordu).
  const hataLoglandiRef = useRef(false);
  useEffect(() => {
    if (!durum) return;
    const statusHata = (durum as { error?: unknown }).error;
    const hataliDurum = durum.playbackState === 'error' || !!statusHata;
    if (hataliDurum && !hataLoglandiRef.current) {
      hataLoglandiRef.current = true;
      console.warn('[ses] oynatma/yükleme hatası', {
        yol: sesYolu,
        playbackState: durum.playbackState,
        reason: durum.reasonForWaitingToPlay,
        error: statusHata,
      });
    }
  }, [durum?.playbackState, durum, sesYolu]);

  // Bitince onBitti (bir kez). Kart değişince component remount → ref sıfırlanır.
  const bittiRef = useRef(false);
  useEffect(() => {
    if (durum?.didJustFinish && !bittiRef.current) {
      bittiRef.current = true;
      onBitti?.();
    }
  }, [durum?.didJustFinish, onBitti]);

  // Unmount / kart değişince sesi durdur (web'de auto-release kesmiyordu).
  useEffect(
    () => () => {
      try {
        player.pause();
      } catch {}
    },
    [player],
  );

  // Ses ÇALARKEN ekran kapanmasın (müşteri Zülküf önerisi) — durunca/çıkınca serbest bırak.
  useEffect(() => {
    if (oynuyor) void activateKeepAwakeAsync('sesli-kart');
    else deactivateKeepAwake('sesli-kart').catch(() => {});
    return () => {
      deactivateKeepAwake('sesli-kart').catch(() => {});
    };
  }, [oynuyor]);

  if (kaynak === null) return null;

  function calistirDurdur() {
    if (oynuyor) {
      player.pause();
    } else {
      if (sure > 0 && an >= sure - 0.25) {
        bittiRef.current = false;
        player.seekTo(0);
      }
      player.play();
    }
  }

  function sar(delta: number) {
    let hedef = an + delta;
    if (hedef < 0) hedef = 0;
    if (sure > 0 && hedef > sure) hedef = sure;
    bittiRef.current = false;
    try {
      player.seekTo(hedef);
    } catch {}
  }

  function barDokun(e: GestureResponderEvent) {
    if (W <= 0 || sure <= 0) return;
    const lx = e.nativeEvent.locationX;
    if (!Number.isFinite(lx)) return;
    const o = Math.min(1, Math.max(0, lx / W));
    bittiRef.current = false;
    try {
      player.seekTo(o * sure);
    } catch {}
  }

  const olc = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && w !== W) setW(w);
  };

  function hizDegis() {
    const yeni = (hizIdx + 1) % SES_HIZLARI.length;
    setHizIdx(yeni);
    sesHizDurum.idx = yeni; // seçimi paylaş (TTS + sonraki kartlar aynı hız)
    // Uygulama [player, hizIdx] effect'inde (pitch düzeltmeli) yapılır.
  }

  return (
    <View style={styles.sar}>
      {/* GERÇEK ilerleme barı (dekoratif değil) — dokun → o ana atla. */}
      <Pressable style={styles.bar} onLayout={olc} onPress={barDokun} accessibilityLabel="Sese atla">
        <View style={styles.barTaban} />
        <View style={[styles.barDolu, { width: `${oran * 100}%` }]} />
      </Pressable>

      <View style={styles.satir}>
        <AppText variant="etiket" bold color="kartMetinAcik">
          {bicimSure(an)}
        </AppText>
        <AppText variant="etiket" color="kartMetinIkincil">
          {bicimSure(sure)}
        </AppText>
      </View>

      <View style={styles.kontroller}>
        <Pressable onPress={() => sar(-10)} style={styles.yan} hitSlop={8} accessibilityLabel="10 saniye geri">
          <MaterialCommunityIcons name="rewind-10" size={26} color={Palette.kartMetinAcik} />
        </Pressable>
        <Pressable
          onPress={calistirDurdur}
          style={styles.oynat}
          accessibilityRole="button"
          accessibilityLabel={oynuyor ? 'Duraklat' : 'Dinle'}>
          <MaterialCommunityIcons
            name={yukleniyor ? 'loading' : oynuyor ? 'pause' : 'play'}
            size={28}
            color={Palette.lacivert}
          />
        </Pressable>
        <Pressable onPress={() => sar(10)} style={styles.yan} hitSlop={8} accessibilityLabel="10 saniye ileri">
          <MaterialCommunityIcons name="fast-forward-10" size={26} color={Palette.kartMetinAcik} />
        </Pressable>
        <Pressable
          onPress={hizDegis}
          style={styles.hizBtn}
          accessibilityRole="button"
          accessibilityLabel="Okuma hızı">
          <AppText variant="kucuk" bold color="altinAcik2">
            {SES_HIZLARI[hizIdx]}x
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
  sar: {
    backgroundColor: Palette.kartPanelKoyu,
    borderColor: Palette.kartKenarKoyu,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  bar: {
    height: 24,
    justifyContent: 'center',
  },
  barTaban: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 6,
    borderRadius: 3,
    backgroundColor: Palette.kartKenarKoyu,
  },
  barDolu: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Palette.altinAcik2,
  },
  satir: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kontroller: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  yan: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hizBtn: {
    minWidth: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  oynat: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Palette.altin,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
