/**
 * İmzalı URL istemcisi — bir kanunun dosyaları için `imzali-url` Edge Function'ından kısa-ömürlü
 * indirme URL'leri alır (private bucket + auth'a bağlı). IMZALI_URL_AKTIF kapalıyken kullanılmaz.
 */
import { IMZALI_URL_AKTIF } from '@/constants/config';

import { supabase } from './supabase';

type ImzaliSatir = { path: string | null; signedUrl: string | null; error: string | null };

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
