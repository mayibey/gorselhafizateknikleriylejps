/**
 * Uzaktan ayar/bayrak — Supabase `uygulama_ayar` tablosu (docs/v2/10). BUILD ALMADAN sunucudan
 * açılıp kapanabilen özellikler için (ilk kullanım: telefon ile giriş). Herkes okur, kimse yazamaz
 * (yalnız service_role). Okunamazsa (offline/hata) null → çağıran güvenli varsayılana düşer.
 */
import { supabase, supabaseHazir } from '@/lib/supabase';

const onbellek = new Map<string, { deger: string; zaman: number }>();
const ONBELLEK_MS = 5 * 60 * 1000; // 5 dk — her ekran açılışında sorgu atma

/** Tek bir ayarı okur (5 dk önbellekli). Yoksa/hata → null. */
export async function ayarOku(anahtar: string): Promise<string | null> {
  if (!supabaseHazir || !supabase) return null;
  const c = onbellek.get(anahtar);
  if (c && Date.now() - c.zaman < ONBELLEK_MS) return c.deger;
  try {
    const { data, error } = await supabase
      .from('uygulama_ayar')
      .select('deger')
      .eq('anahtar', anahtar)
      .maybeSingle();
    if (error || !data) return null;
    onbellek.set(anahtar, { deger: data.deger as string, zaman: Date.now() });
    return data.deger as string;
  } catch {
    return null;
  }
}

/** Telefon ile giriş/doğrulama açık mı? (MasGSM hazır olunca sunucudan '1' yapılır.) */
export async function telefonGirisAcikMi(): Promise<boolean> {
  return (await ayarOku('telefon_giris')) === '1';
}

/** Premium içerik çevrimdışı en fazla kaç gün kullanılabilir (heartbeat penceresi). Varsayılan 5. */
export async function premiumOfflineGun(): Promise<number> {
  const s = await ayarOku('premium_offline_gun');
  const n = s ? parseInt(s, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : 5;
}
