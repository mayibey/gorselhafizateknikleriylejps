/**
 * İçerik şifreleme anahtarı — AES-256, cihazda bir kez üretilir, expo-secure-store'da
 * (Android Keystore / iOS Keychain → modern cihazlarda DONANIM destekli) saklanır.
 * NOT (yayın): üyelik gelince anahtar SUNUCUDAN kullanıcıya özel gelecek (giriş + ödeme ile);
 * şimdi cihaz-yerel anahtar — pipeline + perf için yeterli.
 */
import * as SecureStore from 'expo-secure-store';

import { b64ToBytes, bytesToB64, rastgeleAnahtar } from './sifreleme';

const ANAHTAR_AD = 'jsps_icerik_anahtar_v1';
let bellek: Uint8Array | null = null;

/** İçerik AES anahtarını getir (yoksa üret + keystore'a yaz). */
export async function icerikAnahtari(): Promise<Uint8Array> {
  if (bellek) return bellek;
  try {
    const mevcut = await SecureStore.getItemAsync(ANAHTAR_AD);
    if (mevcut) {
      bellek = b64ToBytes(mevcut);
      return bellek;
    }
  } catch {
    // SecureStore yok/erişilemez (ör. web) → geçici bellek anahtarı (aşağıda)
  }
  const yeni = rastgeleAnahtar();
  try {
    await SecureStore.setItemAsync(ANAHTAR_AD, bytesToB64(yeni));
  } catch {
    // yazılamadı → en azından oturum boyu bellek anahtarı
  }
  bellek = yeni;
  return yeni;
}
