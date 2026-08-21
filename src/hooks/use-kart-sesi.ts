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
import { useEffect, useState } from 'react';

import { useEkranAcikTut } from '@/hooks/use-ekran-acik-tut';
import { useMesgul } from '@/lib/mesgul';
import { useImzaliTazele } from '@/hooks/use-imzali-tazele';
import { sesKaynak } from '@/lib/ses-kaynak';
import { onbellekUri, sesiOnbellekle } from '@/lib/ses-onbellek';

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

  // SES ÖNBELLEĞİ (17 Ağu): kaynak UZAK URL ise (kanun indirilmemiş) canlı akıtmak
  // uzun mp3'lerde kesiliyordu. Çalınmadan diske indirip yerel dosyadan çalıyoruz.
  // Kaynak gömülü (number) veya zaten yerel (file://) ise dokunma. Başarısızsa
  // orijinal uzak kaynağa düşer → en kötü ihtimalde bugünkü stream davranışı.
  const uzakMi =
    !!sesYolu && typeof kaynak === 'object' && !!kaynak && !kaynak.uri.startsWith('file:');
  const [yerelIndi, setYerelIndi] = useState<string | null>(() =>
    sesYolu ? onbellekUri(sesYolu) : null,
  );
  const [iniyor, setIniyor] = useState(false);
  useEffect(() => {
    setYerelIndi(sesYolu ? onbellekUri(sesYolu) : null);
    if (!uzakMi || !sesYolu || typeof kaynak !== 'object' || !kaynak) return;
    if (onbellekUri(sesYolu)) return;
    let iptal = false;
    setIniyor(true);
    void sesiOnbellekle(sesYolu, kaynak.uri).then((yerel) => {
      if (iptal) return;
      if (yerel) setYerelIndi(yerel);
      setIniyor(false);
    });
    return () => {
      iptal = true;
    };
    // kaynak.uri imzalı URL'de değişebilir; onu izliyoruz.
  }, [sesYolu, uzakMi, typeof kaynak === 'object' && kaynak ? kaynak.uri : null]);

  // Player'a önce indirilmiş yerel dosyayı ver; yoksa orijinal kaynak (gömülü/yerel/uzak).
  const oynatilacak = yerelIndi ? { uri: yerelIndi } : kaynak;
  // Hook'lar koşulsuz çağrılır; kaynak null ise yüklü olmayan bir player döner.
  const player = useAudioPlayer(oynatilacak);
  const durum = useAudioPlayerStatus(player);

  const varMi = kaynak !== null;
  const oynuyor = varMi ? (durum?.playing ?? false) : false;
  const yukleniyor = varMi ? ((durum?.isBuffering ?? false) || iniyor) : false;

  // Sesli anlatım çalarken ekran kapanmasın (kullanıcı önerisi).
  useEkranAcikTut(oynuyor, 'mevzu-kart-ses');
  // Sesli anlatım çalarken uygulama kendini YENİLEMESİN (anlık güncelleme bunu sorar).
  useMesgul(oynuyor, 'kart-sesi');

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
