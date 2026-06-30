/**
 * Kart görseli kaynak çözümleyici — TEK nokta. ICERIK_TABANI doluysa görseli UZAKTAN
 * ({uri}) çeker (expo-image memory-disk cache'ler → ilk görüntülemeden sonra offline),
 * boşsa GÖMÜLÜ yerel require döner (varsayılan, mevcut davranış). Sunucuya taşıma fazında
 * sadece ICERIK_TABANI doldurulur + codegen GORSEL_MANIFEST_ONLY ile binary pakete girmez.
 */
import type { ImageRequireSource } from 'react-native';

import { KART_GORSEL_YOLLARI, KART_GORSELLERI } from '../assets/kart-gorselleri';
import { ICERIK_TABANI } from '@/constants/config';
import { kanunIndirilmisMi, yerelDosyaUri } from './indirme';

export type GorselKaynak = ImageRequireSource | { uri: string };

const klasorOf = (yol: string) => yol.slice(0, yol.indexOf('/'));

/**
 * Anahtar → expo-image kaynağı. Öncelik: (1) cihaza İNDİRİLMİŞ yerel dosya (anında+offline),
 * (2) ICERIK_TABANI doluysa uzak {uri} (stream+cache), (3) pakete GÖMÜLÜ require. Yoksa undefined.
 */
export function gorselKaynak(key?: string | null): GorselKaynak | undefined {
  if (!key) return undefined;
  const yol = KART_GORSEL_YOLLARI[key];
  if (yol) {
    if (kanunIndirilmisMi(klasorOf(yol))) return { uri: yerelDosyaUri(yol) };
    if (ICERIK_TABANI) return { uri: `${ICERIK_TABANI}/${yol}` };
  }
  return KART_GORSELLERI[key];
}

/** Bu anahtar için herhangi bir görsel kaynağı var mı? (indirilmiş / uzak / gömülü) */
export function gorselVarMi(key?: string | null): boolean {
  return gorselKaynak(key) !== undefined;
}
