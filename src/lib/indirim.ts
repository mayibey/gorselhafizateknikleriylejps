/**
 * İNDİRİM KODU — YILLIK üyelikte gerçek %X indirim (bedava değil; kişi indirimli öder).
 * `indirim_kodu_kullan` RPC kodu doğrular ve kullanıcının GÜNCEL indirim hakkını (indirim_hak) yazar.
 * Paywall açılışta `indirimHakkiOku` ile bu hakkı okur; hak varsa YILLIK satın almada indirimli
 * teklif (offer_id) kullanılır. Gerçek indirim Play'deki teklifte; burada yalnız yetki + gösterim.
 */
import { supabase } from '@/lib/supabase';

/**
 * Kullanıcının GÜNCEL indirim durumu (sunucu hesaplar; ÜST ÜSTE BİNMEZ — tek, en yüksek):
 *  kaynak='kod' (SUEM2020OZEL30 → %30) > kaynak='ilk_giris' (hesap açılışından 24 saat → %20) > yok.
 *  yillik_offer  = YILLIK için Play abonelik teklifinin offerId'si.
 *  omurboyu_urun = ÖMÜR BOYU için indirimli Play ürününün SKU'su.
 *  bitis         = (yalnız ilk giriş) indirimin biteceği an (ISO).
 */
export type IndirimDurumu = {
  yuzde: number;
  kaynak: 'kod' | 'ilk_giris';
  yillik_offer: string;
  omurboyu_urun: string;
  bitis?: string;
};

const HATA_MESAJ: Record<string, string> = {
  oturum: 'Önce giriş yapmalısın.',
  bos: 'Lütfen bir kod gir.',
  gecersiz: 'Böyle bir kod yok. Kodu kontrol et.',
  pasif: 'Bu kod artık geçerli değil.',
  suresi_doldu: 'Bu kodun süresi dolmuş.',
  limit_doldu: 'Bu kodun kullanım hakkı dolmuş.',
};

export type IndirimSonuc = { ok: true; yuzde: number } | { ok: false; mesaj: string };

export async function indirimKoduKullan(kod: string): Promise<IndirimSonuc> {
  if (!supabase) return { ok: false, mesaj: 'Bağlantı yok. İnternetini kontrol et.' };
  try {
    const { data, error } = await supabase.rpc('indirim_kodu_kullan', { p_kod: kod });
    if (error) return { ok: false, mesaj: 'Kod uygulanamadı. Tekrar dene.' };
    const d = data as { ok?: boolean; hata?: string; yuzde?: number } | null;
    if (d?.ok) return { ok: true, yuzde: d.yuzde ?? 0 };
    return { ok: false, mesaj: HATA_MESAJ[d?.hata ?? ''] ?? 'Kod uygulanamadı.' };
  } catch {
    return { ok: false, mesaj: 'Bağlantı hatası. Tekrar dene.' };
  }
}

/** Kullanıcının güncel indirim durumu (yoksa null). Sunucu tek/en yüksek indirimi döner. */
export async function indirimDurumuOku(): Promise<IndirimDurumu | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.rpc('indirim_durumu');
    if (error || !data) return null;
    return data as IndirimDurumu;
  } catch {
    return null;
  }
}
