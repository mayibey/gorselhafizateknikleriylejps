/**
 * "Sesli Nöbet" kuyruk oynatma hook'u (foreground v1).
 * Tek expo-audio player; aktif kartın sesi çalar, bitince (didJustFinish) otomatik
 * sıradaki karta geçer. Saf kuyruk mantığı lib/sesli-nobet.ts'te.
 *
 * AUTO-START YOK: mount'ta çalmaz; kullanıcı oynatDurdur ile başlatır. Oturum aktifken
 * (devam ref'i true) kart değişince yeni kart kaldığı yerden çalmaya devam eder.
 * Arka plan / kilit ekranı KAPSAM DIŞI (v2, dev build).
 */

import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useEffect, useRef, useState } from 'react';

import { useImzaliTazele } from '@/hooks/use-imzali-tazele';
import type { QueueCard } from '@/lib/queue';
import { sesKaynak } from '@/lib/ses-kaynak';
import { oncekiIndex, sonrakiIndex } from '@/lib/sesli-nobet';

export type SesliNobet = {
  aktifKart: QueueCard | undefined;
  index: number;
  toplam: number;
  oynuyor: boolean;
  yukleniyor: boolean;
  /** Çalıyorsa duraklat; değilse aktif kartı oynat (oturumu aktifleştirir). */
  oynatDurdur: () => void;
  sonraki: () => void;
  onceki: () => void;
};

/** kartlar: zaten sesliKartlar() ile filtrelenmiş (her birinin ses_yolu registry'de var). */
export function useSesliNobet(kartlar: QueueCard[]): SesliNobet {
  useImzaliTazele(); // web imzalı modda mp3 URL'i gelince yeniden çiz (native no-op)
  const [index, setIndex] = useState(0);
  const aktifKart = kartlar[index];
  const kaynak = sesKaynak(aktifKart?.ses_yolu);

  const player = useAudioPlayer(kaynak);
  const durum = useAudioPlayerStatus(player);

  const oynuyor = durum?.playing ?? false;
  const yukleniyor = durum?.isBuffering ?? false;

  // Oturum aktif mi (kullanıcı başlattı → kart değişince devam etsin).
  const devamRef = useRef(false);

  // Ses bitince otomatik sıradaki karta geç (son kartta yerinde kalır → durur).
  useEffect(() => {
    if (durum?.didJustFinish) {
      setIndex((i) => sonrakiIndex(i, kartlar.length));
    }
  }, [durum?.didJustFinish, kartlar.length]);

  // Kart (kaynak) değişince, oturum aktifse yeni kartı baştan çal.
  useEffect(() => {
    if (devamRef.current && kaynak !== null) {
      player.seekTo(0);
      player.play();
    }
    // player kaynak değişince yeniden oluşur; index'e bağlı tetikleniyoruz.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  // Ekran kapanınca (unmount) sesi durdur. Web'de (HTML5 Audio) auto-release sesi
  // kesmiyordu → açık pause. Native'de zaten duruyor; bu ekstra garanti.
  useEffect(() => {
    return () => {
      try {
        player.pause();
      } catch {}
    };
  }, [player]);

  function oynatDurdur() {
    if (kaynak === null) return;
    if (oynuyor) {
      devamRef.current = false;
      player.pause();
    } else {
      devamRef.current = true;
      player.seekTo(0);
      player.play();
    }
  }

  function sonraki() {
    setIndex((i) => sonrakiIndex(i, kartlar.length));
  }

  function onceki() {
    setIndex((i) => oncekiIndex(i));
  }

  return {
    aktifKart,
    index,
    toplam: kartlar.length,
    oynuyor,
    yukleniyor,
    oynatDurdur,
    sonraki,
    onceki,
  };
}
