/**
 * Kart sesi kaynak çözümleyici (görsel resolver'ın sesli analoğu). Öncelik:
 *  (1) İNDİRİLMİŞ yerel mp3 (file://) — anında + offline.
 *  (2) ICERIK_TABANI doluysa uzak {uri} (expo-audio stream eder; offline için indir gerekir).
 *  (3) pakete GÖMÜLÜ require (number).
 * NOT: ses ŞİFRELENMEZ (anlatım içeriği; asıl IP görsel kartlar). Ses koruması serving fazında
 * imzalı-URL + Play Integrity ile (erişim katmanı). At-rest AES-ses = decrypt-to-temp, marjinal.
 */
import { KART_SES_YOLLARI, KART_SESLERI } from '../assets/kart-sesleri';
import { ICERIK_TABANI } from '@/constants/config';
import { kanunIndirilmisMi, yerelDosyaUri } from './indirme';

export type SesKaynak = number | { uri: string };

const klasorOf = (yol: string) => yol.slice(0, yol.indexOf('/'));

/** Anahtar → expo-audio kaynağı (yerel file:// / uzak {uri} / gömülü require). Yoksa null. */
export function sesKaynak(key?: string | null): SesKaynak | null {
  if (!key) return null;
  const yol = KART_SES_YOLLARI[key];
  if (yol) {
    if (kanunIndirilmisMi(klasorOf(yol))) return { uri: yerelDosyaUri(yol) };
    if (ICERIK_TABANI) return { uri: `${ICERIK_TABANI}/${yol}` };
  }
  return KART_SESLERI[key] ?? null;
}

/** Bu kart için ses var mı? (indirilmiş / uzak manifest / gömülü) */
export function sesVarMi(key?: string | null): boolean {
  if (!key) return false;
  if (key in KART_SESLERI) return true;
  return ICERIK_TABANI ? key in KART_SES_YOLLARI : false;
}
