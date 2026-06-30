/**
 * Kart görseli kaynak çözümleyici — TEK nokta. ICERIK_TABANI doluysa görseli UZAKTAN
 * ({uri}) çeker (expo-image memory-disk cache'ler → ilk görüntülemeden sonra offline),
 * boşsa GÖMÜLÜ yerel require döner (varsayılan, mevcut davranış). Sunucuya taşıma fazında
 * sadece ICERIK_TABANI doldurulur + codegen GORSEL_MANIFEST_ONLY ile binary pakete girmez.
 */
import type { ImageRequireSource } from 'react-native';

import { KART_GORSEL_YOLLARI, KART_GORSELLERI } from '../assets/kart-gorselleri';
import { ICERIK_TABANI } from '@/constants/config';

export type GorselKaynak = ImageRequireSource | { uri: string };

/** Anahtar → expo-image kaynağı (uzak {uri} veya yerel require). Yoksa undefined. */
export function gorselKaynak(key?: string | null): GorselKaynak | undefined {
  if (!key) return undefined;
  if (ICERIK_TABANI) {
    const yol = KART_GORSEL_YOLLARI[key];
    return yol ? { uri: `${ICERIK_TABANI}/${yol}` } : undefined;
  }
  return KART_GORSELLERI[key];
}

/** Bu anahtar için görsel var mı? (uzak modda manifest, yerel modda require map.) */
export function gorselVarMi(key?: string | null): boolean {
  if (!key) return false;
  return ICERIK_TABANI ? key in KART_GORSEL_YOLLARI : key in KART_GORSELLERI;
}
