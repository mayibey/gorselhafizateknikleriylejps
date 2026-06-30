/**
 * Kart görseli kaynak çözümleyici. Öncelik:
 *  (1) İNDİRİLMİŞ (şifreli yerel) → `indirilmisGorsel` yolu döner; StudyCard onu ÇÖZ'er (data-URI).
 *  (2) ICERIK_TABANI doluysa → uzak {uri} (stream + expo-image cache).
 *  (3) pakete GÖMÜLÜ require.
 */
import type { ImageRequireSource } from 'react-native';

import { KART_GORSEL_YOLLARI, KART_GORSELLERI } from '../assets/kart-gorselleri';
import { ICERIK_TABANI } from '@/constants/config';
import { kanunIndirilmisMi } from './indirme';

export type GorselKaynak = ImageRequireSource | { uri: string };

const klasorOf = (yol: string) => yol.slice(0, yol.indexOf('/'));

/** İndirilmiş (şifreli) görselin içerik-göreli yolu (çözülecek), değilse null. */
export function indirilmisGorsel(key?: string | null): string | null {
  if (!key) return null;
  const yol = KART_GORSEL_YOLLARI[key];
  return yol && kanunIndirilmisMi(klasorOf(yol)) ? yol : null;
}

/** İNDİRİLMEMİŞ görsel için kaynak: uzak {uri} veya gömülü require. (İndirilmiş → çöz yolu.) */
export function gorselKaynak(key?: string | null): GorselKaynak | undefined {
  if (!key) return undefined;
  const yol = KART_GORSEL_YOLLARI[key];
  if (yol && ICERIK_TABANI) return { uri: `${ICERIK_TABANI}/${yol}` };
  return KART_GORSELLERI[key];
}

/** Bu kart için herhangi bir görsel var mı? (indirilmiş-şifreli / uzak / gömülü) */
export function gorselVarMi(key?: string | null): boolean {
  return !!indirilmisGorsel(key) || gorselKaynak(key) !== undefined;
}
