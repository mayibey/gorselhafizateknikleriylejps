/**
 * İndirilmiş ŞİFRELİ görseli çöz → data-URI (expo-image okuyabilsin). Bellek önbelleği (LRU):
 * çözülen kart tekrar açılınca anında gelir + komşu kartlar önden çözülüp (preload) gizlenir.
 * Düz dosya diske YAZILMAZ (data-URI bellekte) → at-rest düz sızıntı yok.
 */
import * as FileSystem from 'expo-file-system/legacy';

import { icerikAnahtari } from './cihaz-anahtar';
import { yerelDosyaUri } from './indirme';
import { aesCoz, b64ToBytes, bytesToB64 } from './sifreleme';

const onbellek = new Map<string, string>(); // yol -> data-URI
const MAX = 10; // ~10 kart × ~350KB = makul bellek

function mime(yol: string): string {
  if (yol.endsWith('.webp')) return 'image/webp';
  if (yol.endsWith('.png')) return 'image/png';
  return 'image/jpeg';
}

/** Önbellekte hazır mı (senkron). */
export function cozHazir(yol: string): string | undefined {
  return onbellek.get(yol);
}

/** Şifreli yerel görseli çöz → data-URI. Önbellekteyse anında döner. */
export async function gorselCoz(yol: string): Promise<string> {
  const hazir = onbellek.get(yol);
  if (hazir) {
    // LRU: en sona taşı
    onbellek.delete(yol);
    onbellek.set(yol, hazir);
    return hazir;
  }
  const key = await icerikAnahtari();
  const b64 = await FileSystem.readAsStringAsync(yerelDosyaUri(yol), {
    encoding: FileSystem.EncodingType.Base64,
  });
  const plain = aesCoz(b64ToBytes(b64), key);
  const dataUri = `data:${mime(yol)};base64,${bytesToB64(plain)}`;
  onbellek.set(yol, dataUri);
  if (onbellek.size > MAX) {
    const enEski = onbellek.keys().next().value;
    if (enEski) onbellek.delete(enEski);
  }
  return dataUri;
}

/** Komşu kartları arkada önceden çöz (preload) — beklemeyi gizler. Hataları yutar. */
export function gorselOnCoz(yollar: (string | null | undefined)[]): void {
  for (const yol of yollar) {
    if (yol && !onbellek.has(yol)) void gorselCoz(yol).catch(() => {});
  }
}
