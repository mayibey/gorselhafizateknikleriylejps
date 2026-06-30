/**
 * İmzalı URL istemcisi — bir kanunun dosyaları için `imzali-url` Edge Function'ından kısa-ömürlü
 * indirme URL'leri alır (private bucket + auth'a bağlı). IMZALI_URL_AKTIF kapalıyken kullanılmaz.
 */
import { IMZALI_URL_AKTIF, SUPABASE_ANON_KEY, SUPABASE_URL } from '@/constants/config';

import { supabase } from './supabase';

type ImzaliSatir = { path: string | null; signedUrl: string | null; error: string | null };

/**
 * Görsel filigran fonksiyonu (gorsel) tabanı + auth başlıkları. GÖRSEL indirme bunu kullanır →
 * sunucu e-postayı piksele basıp verir (cihaza filigranlı gelir). Aktif değilse/oturumsuz null.
 */
export async function gorselFiligran(): Promise<{ base: string; headers: Record<string, string> } | null> {
  if (!IMZALI_URL_AKTIF || !supabase) return null;
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return null;
  return {
    base: `${SUPABASE_URL}/functions/v1/gorsel`,
    headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY },
  };
}

/** Yol → imzalı URL haritası (tek çağrı, batch). Hata/kapalı ise boş Map. */
export async function imzaliUrller(yollar: string[]): Promise<Map<string, string>> {
  const harita = new Map<string, string>();
  if (!IMZALI_URL_AKTIF || !supabase || yollar.length === 0) return harita;

  const { data, error } = await supabase.functions.invoke<ImzaliSatir[]>('imzali-url', {
    body: { yollar },
  });
  if (error || !Array.isArray(data)) throw error ?? new Error('İmzalı URL alınamadı');

  for (const satir of data) {
    if (satir.path && satir.signedUrl) harita.set(satir.path, satir.signedUrl);
  }
  return harita;
}
