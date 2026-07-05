/**
 * DUYURULAR — geliştirici (başkan) tarafından sunucudan yönetilen, uygulama içi mesajlar.
 * - Yalnız OKUMA: istemci `duyurular` tablosundan aktif satırları çeker (RLS: aktif=true).
 * - HEDEF filtresi: 'herkes' herkese; 'premium' yalnız premium kullanıcıya gösterilir.
 * - OKUNMAMIŞ takibi: son görülme zamanı AsyncStorage'ta tutulur; en yeni duyuru bundan
 *   sonraysa çan yerindeki ikonda kırmızı nokta çıkar. Ekran açılınca "görüldü" işaretlenir.
 * - Çevrimdışı/sunucu yoksa boş liste döner (çökme yok).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from '@/lib/supabase';

export type Duyuru = {
  id: string;
  baslik: string;
  metin: string;
  hedef: 'herkes' | 'premium';
  created_at: string;
};

const SON_GORULME_KEY = 'jsps.duyuru.songoruldu';

/** Aktif duyuruları (yeni→eski) getirir; premium-hedefli olanlar yalnız premium kullanıcıya. */
export async function duyurulariGetir(premium: boolean): Promise<Duyuru[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('duyurular')
      .select('id, baslik, metin, hedef, created_at')
      .eq('aktif', true)
      .order('created_at', { ascending: false });
    if (error || !data) return [];
    return (data as Duyuru[]).filter((d) => d.hedef === 'herkes' || premium);
  } catch {
    return [];
  }
}

/** Verilen listede son görülmeden sonra eklenmiş (okunmamış) duyuru var mı? */
export async function okunmamisVarMi(duyurular: Duyuru[]): Promise<boolean> {
  if (duyurular.length === 0) return false;
  try {
    const son = await AsyncStorage.getItem(SON_GORULME_KEY);
    const sonMs = son ? new Date(son).getTime() : 0;
    return duyurular.some((d) => new Date(d.created_at).getTime() > sonMs);
  } catch {
    return false;
  }
}

/** Duyurular ekranı açıldığında çağrılır — "şimdi hepsi görüldü" olarak işaretler. */
export async function duyurulariGoruldu(): Promise<void> {
  try {
    await AsyncStorage.setItem(SON_GORULME_KEY, new Date().toISOString());
  } catch {
    // yut — okunmamış rozeti bir sonraki açılışta düzelir
  }
}
