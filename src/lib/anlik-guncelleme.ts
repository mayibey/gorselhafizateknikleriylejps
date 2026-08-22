/**
 * ANLIK OTA DENETİMİ (9 Ağu 2026: "her seferinde kapatıp açmak zorunda kalıyorum").
 * Uygulama 30 sn'de bir + öne her gelişte OTA denetler; güncelleme varsa indirir ve
 * KENDİNİ YENİLER (reloadAsync) — kullanıcının kapat-aç yapması gerekmez.
 *
 * 21 Ağu 2026'dan beri ÇİFT KADEMELİ (aşağıya bak): önce yalnız başkan + Kemalettin,
 * sonra tek satır sunucu şalteriyle herkes. Herkes kipinde kullanıcı işin ortasındaysa
 * (sesli anlatım / sınav) yenileme BEKLETİLİR.
 *
 * ASLA hata fırlatmaz; geliştirme modunda (__DEV__) hiç çalışmaz (checkForUpdate
 * dev istemcide desteklenmez).
 */
import * as Updates from 'expo-updates';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { mesgulMu } from '@/lib/mesgul';
import { kisiselOzellikAcikMi } from '@/lib/ozellik';
import { ayarOku } from '@/lib/uzak-ayar';

const ARALIK_MS = 30_000;

/**
 * 🔴 22 Ağu 2026 — SİYAH EKRAN: başkan bildirime tıkladı, uygulama AÇILIRKEN güncellemeyi
 * bulup kendini yeniledi ve SİYAH EKRANDA KALDI. Sebep: `reloadAsync()` daha uygulama ilk
 * çizimini/açılış ekranını tamamlamadan çağrılırsa açılış yarıda kesiliyor.
 * ÇÖZÜM: açılıştan sonra ACILIS_BEKLE kadar hiç dokunma + yalnız uygulama ÖNDEYKEN yenile.
 */
const ACILIS_BEKLE_MS = 12_000;
const acilisAni = Date.now();
const acilisOturdu = () => Date.now() - acilisAni >= ACILIS_BEKLE_MS;

async function denetleVeUygula(mesgulRef: { current: boolean }): Promise<void> {
  if (mesgulRef.current) return;
  if (!acilisOturdu()) return; // açılış otursun; yoksa siyah ekran
  if (AppState.currentState !== 'active') return; // arka planda yenileme YOK
  mesgulRef.current = true;
  try {
    const sonuc = await Updates.checkForUpdateAsync();
    if (sonuc.isAvailable) {
      await Updates.fetchUpdateAsync();
      // İndirme sürerken kullanıcı işe başlamış ya da uygulama arkaya düşmüş olabilir.
      if (AppState.currentState !== 'active') return;
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
 *     Davranış: aynı sıklıkta bakar AMA kullanıcı İŞİN ORTASINDAYSA dokunmaz.
 *     Başkan (21 Ağu): "kart dinlerken yapmasın ama menüler arasında gezerken yenilesin."
 *     Meşgul sayılan işler `lib/mesgul.ts` kaydında: sesli anlatım çalıyor · sınav sürüyor.
 *     Menüde/listede gezerken anında yenilenir — eskiden herkese açılamamasının tek
 *     sebebi ekranın iş ortasında sıfırlanmasıydı, artık o durumda bekliyor.
 *
 *  Kapatmak: şalteri '0' yap. Kişi bayrağı olanlar 1. kademede kalmaya devam eder.
 */
export function useAnlikGuncelleme(): void {
  const mesgul = useRef(false);
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

      // 2. kademe — nazik: aynı sıklıkta bakar AMA kullanıcı işin ortasındaysa dokunmaz.
      // Başkan (21 Ağu): "kart dinlerken yapmasın ama menüler arasında gezerken yenilesin."
      // Meşgul sayılan işler: sesli anlatım çalıyor · sınav sürüyor (bkz. lib/mesgul.ts).
      const nazikDenetle = () => {
        if (mesgulMu()) return; // iş bitince bir sonraki turda yakalanır
        void denetleVeUygula(mesgul);
      };
      nazikDenetle();
      zamanlayici = setInterval(nazikDenetle, ARALIK_MS);
      dinleyici = AppState.addEventListener('change', (d) => {
        if (d === 'active') nazikDenetle();
      });
    })();

    return () => {
      yasiyor = false;
      if (zamanlayici) clearInterval(zamanlayici);
      if (dinleyici) dinleyici.remove();
    };
  }, []);
}
