/**
 * PROMOSYON KODU kullanımı. Sunucudaki `promo_kullan` RPC'sini çağırır (atomik + güvenli);
 * başarılıysa uyelik_haklari'na promo hakkı yazılır → çağıran taraf üyeliği yeniler → premium açılır.
 * Kod doğrulama/mükerrer kullanım/limit hepsi SUNUCUDA; burada yalnız çağrı + Türkçe mesaj eşleme.
 */
import { supabase } from '@/lib/supabase';

export type PromoSonuc = { ok: true } | { ok: false; mesaj: string };

const HATA_MESAJ: Record<string, string> = {
  oturum: 'Önce giriş yapmalısın.',
  bos: 'Lütfen bir kod gir.',
  gecersiz: 'Böyle bir kod yok. Kodu kontrol et.',
  pasif: 'Bu kod artık geçerli değil.',
  suresi_doldu: 'Bu kodun süresi dolmuş.',
  limit_doldu: 'Bu kodun kullanım hakkı dolmuş.',
  zaten_kullandin: 'Bu kodu zaten kullanmışsın.',
};

export async function promoKodKullan(kod: string): Promise<PromoSonuc> {
  if (!supabase) return { ok: false, mesaj: 'Bağlantı yok. İnternetini kontrol et.' };
  try {
    const { data, error } = await supabase.rpc('promo_kullan', { p_kod: kod });
    if (error) return { ok: false, mesaj: 'Kod kullanılamadı. Tekrar dene.' };
    const d = data as { ok?: boolean; hata?: string } | null;
    if (d?.ok) return { ok: true };
    return { ok: false, mesaj: HATA_MESAJ[d?.hata ?? ''] ?? 'Kod kullanılamadı.' };
  } catch {
    return { ok: false, mesaj: 'Bağlantı hatası. Tekrar dene.' };
  }
}
