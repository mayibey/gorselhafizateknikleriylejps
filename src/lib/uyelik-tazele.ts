/**
 * ABONELİK TAZELEME — yenilenen aboneliğin bitiş tarihini uzatır.
 *
 * NEDEN (26 Ağu 2026, başkan sordu): `uyelik_haklari.bitis` YALNIZ satın alma anında ve
 * kullanıcı paywall'da "geri yükle"ye basınca yazılıyordu. Aylık abone parayı ödemeye
 * devam etse bile bizde bitiş tarihi uzamıyor → dönem dolunca premium DÜŞÜYORDU.
 * (İlk aylık aboneler 24 Eylül'de bu duvara çarpacaktı.)
 *
 * NE YAPAR: mağazadaki (Play/StoreKit) AKTİF satın almaları alır, her birini sunucuda
 * yeniden doğrulatır → `bitis` yenilenmiş döneme göre güncellenir. Kullanıcı hiçbir şey görmez.
 *
 * ⚠️ SINIRLARI — bilerek dar tutuldu ("başka yer bozmayalım"):
 *  1. Yalnız NATIVE'de çalışır (web'de expo-iap yok).
 *  2. Yalnız kullanıcının ABONELİĞİ varsa ve bitişine 3 günden az kaldıysa/geçtiyse çalışır.
 *     Ömür boyu alanlarda ve aboneliği olmayanlarda HİÇ çalışmaz → açılışa yük bindirmez.
 *  3. 6 saatte bir'den sık denemez (AsyncStorage damgası).
 *  4. HİÇBİR hak SİLMEZ, yalnız tazeler. Doğrulama başarısız olursa mevcut hak aynen kalır
 *     (ağ hatası yüzünden ödeme yapmış kullanıcının erişimi KAPANMAZ).
 *  5. Her hata yutulur.
 *
 * NOT: İADE (refund) edilen ömür boyu satın alma bu yolla DÜŞMEZ — mağaza iade edilen
 * işlemi cihaza artık bildirmez. Onun doğru çözümü sunucu bildirimidir
 * (App Store Server Notifications / Google RTDN) — ayrı iş, `scripts/uyelik-denetle.mjs`
 * ile şimdilik elle denetleniyor.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { satinAlmaDogrula } from '@/lib/satinalma';
import { supabase } from '@/lib/supabase';

const DAMGA = 'jsps.abonelik.tazeleme';
const ARALIK_MS = 6 * 60 * 60 * 1000; // 6 saat
const ESIK_MS = 3 * 24 * 60 * 60 * 1000; // bitişine 3 günden az kaldıysa

/**
 * Gerekiyorsa aboneliği mağazadan tazeler.
 * @returns true → en az bir satın alma yeniden doğrulandı (çağıran hakları TEKRAR okumalı).
 */
export async function abonelikTazele(): Promise<boolean> {
  if (Platform.OS === 'web' || !supabase) return false;
  try {
    const oturum = (await supabase.auth.getSession()).data.session;
    if (!oturum) return false;

    // 1) Tazelenecek abonelik var mı? (ömür boyu kullanıcıda hiç çalışmaz)
    const { data, error } = await supabase
      .from('uyelik_haklari')
      .select('tip, bitis')
      .eq('tip', 'abonelik');
    if (error || !data || data.length === 0) return false;
    const simdi = Date.now();
    const gerekli = (data as { bitis: string | null }[]).some(
      (h) => h.bitis != null && new Date(h.bitis).getTime() - simdi < ESIK_MS,
    );
    if (!gerekli) return false;

    // 2) Sık denemeyi engelle
    const son = await AsyncStorage.getItem(DAMGA);
    if (son && simdi - Number(son) < ARALIK_MS) return false;
    await AsyncStorage.setItem(DAMGA, String(simdi));

    // 3) Mağazadaki aktif satın almaları sunucuda yeniden doğrulat
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let iap: any;
    try {
      iap = await import('expo-iap');
    } catch {
      return false; // native modül yok (Expo Go / eski derleme)
    }
    if (!iap?.initConnection || !iap?.getAvailablePurchases) return false;

    let tazelendi = false;
    try {
      await iap.initConnection();
      const alinmis = await iap.getAvailablePurchases();
      for (const p of alinmis ?? []) {
        const token = p?.purchaseToken ?? '';
        if (!token || !p?.productId) continue;
        try {
          const sonuc = await satinAlmaDogrula(p.productId, token);
          if (sonuc?.ok) tazelendi = true;
        } catch {
          /* tek ürün doğrulanamadı → diğerlerine devam, HAK SİLİNMEZ */
        }
      }
    } finally {
      await iap.endConnection?.().catch?.(() => {});
    }
    return tazelendi;
  } catch {
    return false; // tazeleme asla kullanıcı akışını bozmaz
  }
}
