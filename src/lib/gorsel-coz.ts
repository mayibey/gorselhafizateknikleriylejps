/**
 * İndirilmiş ŞİFRELİ görseli çöz → data-URI (expo-image okuyabilsin). Bellek önbelleği (LRU):
 * çözülen kart tekrar açılınca anında gelir + komşu kartlar önden çözülüp (preload) gizlenir.
 * Düz dosya diske YAZILMAZ (data-URI bellekte) → at-rest düz sızıntı yok.
 */
import * as FileSystem from 'expo-file-system/legacy';
import { InteractionManager } from 'react-native';

import { icerikAnahtari } from './cihaz-anahtar';
import { yerelDosyaUri } from './indirme';
import { aesCoz, b64ToBytes, bytesToB64 } from './sifreleme';

const onbellek = new Map<string, string>(); // yol -> data-URI
// 80 çözülmüş kart bellekte tutulur (~37MB) → bir kanunu komple kapsar; tekrar girince yeniden
// çözmez (eskiden MAX=10'du, kanuna tekrar girince "görseller kayboldu" sanılıyordu).
const MAX = 80;

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

// --- Komşu ön-yükleme (preload) — JS thread'i BLOKE ETMEDEN ---
// aesCoz + base64 SENKRON çalışır (~0.5-1sn/görsel). Eskiden gorselOnCoz komşuları AYNI ANDA
// çözüyordu → kart değişince JS thread saniyelerce bloke → UI kilitleniyor (jest/ses/dokunma
// donuyor). Şimdi: (1) etkileşim bitince (runAfterInteractions → swipe/animasyon bitsin),
// (2) TEK TEK, aralarında makro-görev nefesi (setTimeout 0 → dokunmalar işlensin),
// (3) hızlı geçişte yalnız EN GÜNCEL komşular kuyrukta (eskiler çözülmez).
let onKuyruk: string[] = [];
let onCalisiyor = false;

function onSonraki() {
  if (onCalisiyor) return;
  let yol = onKuyruk.shift();
  while (yol && onbellek.has(yol)) yol = onKuyruk.shift(); // önbellektekileri atla
  if (!yol) return;
  onCalisiyor = true;
  void gorselCoz(yol)
    .catch(() => {})
    .finally(() => {
      onCalisiyor = false;
      if (onKuyruk.length) setTimeout(onSonraki, 0); // nefes ver → sonraki komşu
    });
}

/** Komşu kartları arkada önceden çöz (preload) — beklemeyi gizler; JS thread'i bloke ETMEZ. */
export function gorselOnCoz(yollar: (string | null | undefined)[]): void {
  const temiz = yollar.filter((y): y is string => !!y && !onbellek.has(y));
  if (temiz.length === 0) return;
  onKuyruk = temiz; // yalnız en güncel istek (hızlı geçişte eski komşuları çözme)
  void InteractionManager.runAfterInteractions(() => onSonraki());
}
