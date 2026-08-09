/**
 * ANLIK OTA DENETİMİ — yalnız başkanın cihazında (9 Ağu 2026 isteği):
 * "her seferinde kapatıp açmak zorunda kalıyorum; sürekli anlık denetleyen sistem olsun."
 *
 * Bayrak (`anlik-guncelleme`, ozellik_kisi) açık olan cihazda 30 saniyede bir ve
 * uygulama öne her gelişte OTA denetlenir; güncelleme varsa indirilir ve UYGULAMA
 * KENDİNİ YENİLER (reloadAsync) — kapat-aç gerekmez.
 *
 * HERKESTE KAPALI kalmasının sebebi: kullanıcı kart çalışırken/sınavdayken ekranın
 * kendiliğinden yenilenmesi kabul edilemez; ayrıca sürekli denetim sunucuyu yorar.
 * Normal kullanıcı için açılışta denetleyen varsayılan expo-updates davranışı yeter.
 *
 * ASLA hata fırlatmaz; geliştirme modunda (__DEV__) hiç çalışmaz (checkForUpdate
 * dev istemcide desteklenmez).
 */
import * as Updates from 'expo-updates';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { kisiselOzellikAcikMi } from '@/lib/ozellik';

const ARALIK_MS = 30_000;

async function denetleVeUygula(mesgulRef: { current: boolean }): Promise<void> {
  if (mesgulRef.current) return;
  mesgulRef.current = true;
  try {
    const sonuc = await Updates.checkForUpdateAsync();
    if (sonuc.isAvailable) {
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync(); // anında uygula — dönüşü olmayan çağrı
    }
  } catch {
    /* sessiz: ağ yok / dev istemci / sunucu hatası — bir sonraki turda yine denenir */
  } finally {
    mesgulRef.current = false;
  }
}

/** Kök _layout'ta bir kez bağlanır. Bayrak kapalıysa hiçbir şey yapmaz. */
export function useAnlikGuncelleme(): void {
  const mesgul = useRef(false);
  useEffect(() => {
    if (__DEV__) return;
    let zamanlayici: ReturnType<typeof setInterval> | null = null;
    let dinleyici: { remove: () => void } | null = null;
    let yasiyor = true;

    void kisiselOzellikAcikMi('anlik-guncelleme').then((acik) => {
      if (!acik || !yasiyor) return;
      void denetleVeUygula(mesgul);
      zamanlayici = setInterval(() => void denetleVeUygula(mesgul), ARALIK_MS);
      dinleyici = AppState.addEventListener('change', (d) => {
        if (d === 'active') void denetleVeUygula(mesgul);
      });
    });

    return () => {
      yasiyor = false;
      if (zamanlayici) clearInterval(zamanlayici);
      if (dinleyici) dinleyici.remove();
    };
  }, []);
}
