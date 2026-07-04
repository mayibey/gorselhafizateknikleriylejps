/**
 * Satın alma köprüsü — expo-iap satın alması ile Supabase doğrulama (dogrula-satinalma) arası.
 * Akış: paywall (useIAP) requestPurchase → purchase event → satinAlmaDogrula(token) → hak yazılır
 * → finishTransaction. Hak SUNUCUDA yazılır (istemci "premium" diyemez).
 */
import { ABONELIK_URUNLERI } from '@/constants/urunler';

import { supabase } from './supabase';

export type DogrulamaSonuc = { ok: boolean; premium?: boolean; bitis?: string | null };

/** Sunucunun net reddi (örn. "başka hesaba bağlı") — UI mesajı OLDUĞU GİBİ gösterebilsin. */
export class DogrulamaReddi extends Error {
  kod: string | null;
  constructor(mesaj: string, kod: string | null) {
    super(mesaj);
    this.name = 'DogrulamaReddi';
    this.kod = kod;
  }
}

/** Bir ürün abonelik mi (Play subscription) yoksa tek-seferlik mi? */
export function abonelikMi(urun: string): boolean {
  return ABONELIK_URUNLERI.includes(urun);
}

/**
 * Satın alma token'ını sunucuda doğrula → uyelik_haklari'na hak yazılır + log.
 * Başarılıysa true. (Sonra çağıran finishTransaction yapmalı + useUyelik.yenile().)
 * Sunucu {hata, kod} ile reddederse DogrulamaReddi fırlatır (mesaj kullanıcıya gösterilebilir).
 */
export async function satinAlmaDogrula(urun: string, token: string): Promise<DogrulamaSonuc> {
  if (!supabase) throw new Error('Sunucu bağlantısı yok.');
  if (!token) throw new Error('Satın alma belirteci alınamadı.');
  const tip = abonelikMi(urun) ? 'abonelik' : 'omurboyu';
  const { data, error } = await supabase.functions.invoke<DogrulamaSonuc>('dogrula-satinalma', {
    body: { token, urun, tip },
  });
  if (error) {
    // invoke hatasında sunucunun JSON gövdesi error.context (Response) içinde — net mesajı çıkar.
    const ctx = (error as { context?: { json?: () => Promise<unknown> } }).context;
    if (ctx?.json) {
      try {
        const govde = (await ctx.json()) as { hata?: string; kod?: string };
        if (govde?.hata) throw new DogrulamaReddi(govde.hata, govde.kod ?? null);
      } catch (e) {
        if (e instanceof DogrulamaReddi) throw e;
        // gövde JSON değilse genel hataya düş
      }
    }
    throw new Error(error.message ?? 'Doğrulama başarısız.');
  }
  return data ?? { ok: false };
}
