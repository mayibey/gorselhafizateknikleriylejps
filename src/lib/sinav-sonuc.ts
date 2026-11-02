/**
 * SINAV SONUCU SORUSU (2 Kas 2026, başkan): 10 Ekim 2026 JSPS sonuçları açıklandı; üyelerin kaç
 * aldığını topluyoruz. Kayıt `sinav_sonuc` tablosunda (kişi başı tek satır, yeniden gönderirse
 * güncellenir — RPC `sinav_sonuc_kaydet`). Web formu (docs/sonuc) aynı tabloya `kaynak='web'` yazar.
 */
import { supabase, supabaseHazir } from '@/lib/supabase';
import type { Rutbe } from '@/lib/rutbe-store';

/** Rütbeye göre girilebilecek branşlar (resmî Ek-1; docs/sinavgorus ile aynı). */
export const RUTBE_BRANSLARI: Record<Rutbe, string[]> = {
  sb: ['jandarma', 'mebs', 'havacilik', 'personel', 'maliye', 'istihkam', 'ikmal', 'bakim', 'bando', 'tabip', 'dis_tabibi', 'eczaci', 'kimyager', 'veteriner', 'muhendis'],
  asb: ['jandarma', 'mebs', 'havacilik', 'personel', 'maliye', 'istihkam', 'ikmal', 'bakim', 'bando', 'saglik'],
  uzmj: ['jandarma'],
  uzmerb: ['jandarma'],
};

/** "59,59" / "59.59" / "72" → sayı. 0-100 arası, en fazla 2 ondalık; değilse null. */
export function puanCoz(metin: string): number | null {
  const t = metin.trim().replace(',', '.');
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(t)) return null;
  const n = Number(t);
  return n >= 0 && n <= 100 ? n : null;
}

/** Bu hesap sonucunu girdi mi? true/false; okunamazsa (çevrimdışı) null → soru açılmaz. */
export async function sinavSonucuVarMi(): Promise<boolean | null> {
  if (!supabaseHazir || !supabase) return null;
  try {
    const { data, error } = await supabase.from('sinav_sonuc').select('id').limit(1);
    if (error) return null;
    return (data ?? []).length > 0;
  } catch {
    return null;
  }
}

export async function sinavSonucuKaydet(p: {
  rutbe: Rutbe;
  brans: string;
  girmedi: boolean;
  puan: number | null;
}): Promise<void> {
  if (!supabaseHazir || !supabase) throw new Error('bağlantı yok');
  const { error } = await supabase.rpc('sinav_sonuc_kaydet', {
    p_rutbe: p.rutbe,
    p_brans: p.brans,
    p_girmedi: p.girmedi,
    p_puan: p.girmedi ? null : p.puan,
  });
  if (error) throw error;
}
