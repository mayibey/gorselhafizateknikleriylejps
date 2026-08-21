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
import { ayarOku } from '@/lib/uzak-ayar';

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

/**
 * ÇİFT KADEMELİ YAYIN (21 Ağu 2026, başkan isteği): "önce bana ve Kemalettin'e anında
 * gelsin; biz 'yay' dedikten sonra herkese de anında yayılsın."
 *
 *  1. KADEME — DENEME (kişi bayrağı `anlik-guncelleme`, başkan + Kemalettin):
 *     30 sn'de bir + öne her gelişte denetler, güncelleme varsa ANINDA yeniler.
 *     Sert davranış bilinçli: değişikliği saniyeler içinde görmek için.
 *
 *  2. KADEME — HERKES (sunucu şalteri `uygulama_ayar.anlik_guncelleme_herkes` = '1'):
 *     BUILD GEREKMEZ, tek satır sunucu değişikliği ile açılır/kapanır.
 *     Davranış DAHA NAZİK: sürekli denetim YOK; yalnız uygulama arka plandan geri
 *     dönerken ve en az DINGIN_MS kadar kapalı kaldıysa yeniler. Böylece kimse
 *     kart dinlerken / sınav çözerken ekranı sıfırlanmaz — eskiden herkese
 *     açılamamasının tek sebebi buydu.
 *
 *  Kapatmak: şalteri '0' yap. Kişi bayrağı olanlar 1. kademede kalmaya devam eder.
 */
const DINGIN_MS = 60_000; // en az bu kadar arka planda kaldıysa "işin ortasında değil" say

export function useAnlikGuncelleme(): void {
  const mesgul = useRef(false);
  const arkaPlanAn = useRef<number | null>(null);
  useEffect(() => {
    if (__DEV__) return;
    let zamanlayici: ReturnType<typeof setInterval> | null = null;
    let dinleyici: { remove: () => void } | null = null;
    let yasiyor = true;

    void (async () => {
      const deneme = await kisiselOzellikAcikMi('anlik-guncelleme');
      const herkes = !deneme && (await ayarOku('anlik_guncelleme_herkes')) === '1';
      if (!yasiyor || (!deneme && !herkes)) return;

      if (deneme) {
        // 1. kademe — sert: hemen, sonra 30 sn'de bir, ayrıca öne gelişte.
        void denetleVeUygula(mesgul);
        zamanlayici = setInterval(() => void denetleVeUygula(mesgul), ARALIK_MS);
        dinleyici = AppState.addEventListener('change', (d) => {
          if (d === 'active') void denetleVeUygula(mesgul);
        });
        return;
      }

      // 2. kademe — nazik: yalnız yeterince uzun süre arka planda kaldıktan sonra.
      dinleyici = AppState.addEventListener('change', (d) => {
        if (d === 'background' || d === 'inactive') {
          if (arkaPlanAn.current === null) arkaPlanAn.current = Date.now();
          return;
        }
        if (d !== 'active') return;
        const gittiGeldi = arkaPlanAn.current;
        arkaPlanAn.current = null;
        if (gittiGeldi !== null && Date.now() - gittiGeldi >= DINGIN_MS) {
          void denetleVeUygula(mesgul);
        }
      });
    })();

    return () => {
      yasiyor = false;
      if (zamanlayici) clearInterval(zamanlayici);
      if (dinleyici) dinleyici.remove();
    };
  }, []);
}
