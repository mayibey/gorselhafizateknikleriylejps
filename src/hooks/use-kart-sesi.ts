/**
 * Tek kartın sesli anlatımını oynatma hook'u (expo-audio sarmalayıcı).
 * Ses native IO olduğu için saf lib değil; expo-audio'nun useAudioPlayer +
 * useAudioPlayerStatus'u üstüne sarmalar. Web'de de (HTML5 Audio) çalışır.
 *
 * OTOMATİK BAŞLAMA YOK: kart açılınca hiçbir şey çalmaz; yalnız calistirDurdur tetikler.
 * Kart değişince kaynak değişir → expo-audio önceki sesi bırakır (component key ile
 * remount edilirse tamamen sıfırlanır).
 */

import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useEffect } from 'react';

import { useImzaliTazele } from '@/hooks/use-imzali-tazele';
import { sesKaynak } from '@/lib/ses-kaynak';

export type KartSesi = {
  /** Bu kartın bir ses kaynağı var mı (registry'de kayıtlı mı). */
  varMi: boolean;
  oynuyor: boolean;
  yukleniyor: boolean;
  /** Çalıyorsa duraklat; değilse baştan oynat. Ses yoksa no-op. */
  calistirDurdur: () => void;
};

export function useKartSesi(sesYolu: string | null | undefined): KartSesi {
  useImzaliTazele(); // web imzalı modda mp3 URL'i gelince yeniden çiz (native no-op)
  const kaynak = sesKaynak(sesYolu);
  // Hook'lar koşulsuz çağrılır; kaynak null ise yüklü olmayan bir player döner.
  const player = useAudioPlayer(kaynak);
  const durum = useAudioPlayerStatus(player);

  const varMi = kaynak !== null;
  const oynuyor = varMi ? (durum?.playing ?? false) : false;
  const yukleniyor = varMi ? (durum?.isBuffering ?? false) : false;

  // Kart değişince / ekran kapanınca sesi durdur (web'de auto-release kesmiyordu).
  useEffect(() => () => {
    try {
      player.pause();
    } catch {}
  }, [player]);

  function calistirDurdur() {
    if (!varMi) return;
    if (oynuyor) {
      player.pause();
    } else {
      // Bittiyse baştan; ilk basışta da güvenli (0'dan başlat).
      player.seekTo(0);
      player.play();
    }
  }

  return { varMi, oynuyor, yukleniyor, calistirDurdur };
}
