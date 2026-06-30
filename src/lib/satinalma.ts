/**
 * Satın alma köprüsü — expo-iap satın alması ile Supabase doğrulama (dogrula-satinalma) arası.
 * Akış: paywall (useIAP) requestPurchase → purchase event → satinAlmaDogrula(token) → hak yazılır
 * → finishTransaction. Hak SUNUCUDA yazılır (istemci "premium" diyemez).
 */
import { ABONELIK_URUNLERI } from '@/constants/urunler';

import { supabase } from './supabase';

export type DogrulamaSonuc = { ok: boolean; premium?: boolean; bitis?: string | null };

/** Bir ürün abonelik mi (Play subscription) yoksa tek-seferlik mi? */
export function abonelikMi(urun: string): boolean {
  return ABONELIK_URUNLERI.includes(urun);
}

/**
 * Satın alma token'ını sunucuda doğrula → uyelik_haklari'na hak yazılır + log.
 * Başarılıysa true. (Sonra çağıran finishTransaction yapmalı + useUyelik.yenile().)
 */
export async function satinAlmaDogrula(urun: string, token: string): Promise<DogrulamaSonuc> {
  if (!supabase) throw new Error('Sunucu bağlantısı yok.');
  if (!token) throw new Error('Satın alma belirteci alınamadı.');
  const tip = abonelikMi(urun) ? 'abonelik' : 'omurboyu';
  const { data, error } = await supabase.functions.invoke<DogrulamaSonuc>('dogrula-satinalma', {
    body: { token, urun, tip },
  });
  if (error) throw new Error(error.message ?? 'Doğrulama başarısız.');
  return data ?? { ok: false };
}
