/**
 * Kart görseli kaynak çözümleyici. Öncelik:
 *  (1) İNDİRİLMİŞ (şifreli yerel) → `indirilmisGorsel` yolu döner; StudyCard onu ÇÖZ'er (data-URI).
 *  (2) ICERIK_TABANI doluysa → uzak {uri} (stream + expo-image cache).
 *  (3) pakete GÖMÜLÜ require.
 */
import type { ImageRequireSource } from 'react-native';

import { KART_GORSEL_YOLLARI, KART_GORSELLERI } from '../assets/kart-gorselleri';
import { ICERIK_TABANI } from '@/constants/config';
import { imzaliUriSync, webImzaliAktif } from './imzali-cache';
import { kanunIndirilmisMi } from './indirme';

export type GorselKaynak = ImageRequireSource | { uri: string };

const klasorOf = (yol: string) => yol.slice(0, yol.indexOf('/'));

/** İndirilmiş (şifreli) görselin içerik-göreli yolu (çözülecek), değilse null. */
export function indirilmisGorsel(key?: string | null): string | null {
  if (!key) return null;
  const yol = KART_GORSEL_YOLLARI[key];
  return yol && kanunIndirilmisMi(klasorOf(yol)) ? yol : null;
}

/** Kartın kanun klasörü (ör. "tck") — gorsel anahtarından. Erişim/kilit kontrolü için. */
export function kartKlasoru(key?: string | null): string | null {
  if (!key) return null;
  const yol = KART_GORSEL_YOLLARI[key];
  return yol ? klasorOf(yol) : null;
}

/** İNDİRİLMEMİŞ görsel için kaynak: uzak {uri} veya gömülü require. (İndirilmiş → çöz yolu.) */
export function gorselKaynak(key?: string | null): GorselKaynak | undefined {
  if (!key) return undefined;
  const yol = KART_GORSEL_YOLLARI[key];
  if (yol && ICERIK_TABANI) {
    // Web + private bucket: public URL 400 verir → kısa-ömürlü imzalı URL (hazır değilse
    // undefined; imzali-cache getirince dinleyiciler tetiklenir, render'da URL gelir).
    if (webImzaliAktif()) {
      const imzali = imzaliUriSync(yol);
      return imzali ? { uri: imzali } : undefined;
    }
    return { uri: `${ICERIK_TABANI}/${yol}` };
  }
  return KART_GORSELLERI[key];
}

/** Web'de görselin imzalı URL'i henüz YOLDA mı? (StudyCard "hazırlanıyor" göstersin, placeholder değil) */
export function gorselBekliyorMu(key?: string | null): boolean {
  if (!key || !webImzaliAktif()) return false;
  const yol = KART_GORSEL_YOLLARI[key];
  return !!yol && imzaliUriSync(yol) === null;
}

/** Bu kart için herhangi bir görsel var mı? (indirilmiş-şifreli / uzak / gömülü)
 *  Web imzalı modda URL'in henüz gelmemiş olması "yok" SAYILMAZ (manifest'te varsa var). */
export function gorselVarMi(key?: string | null): boolean {
  if (!key) return false;
  if (webImzaliAktif() && KART_GORSEL_YOLLARI[key]) return true;
  return !!indirilmisGorsel(key) || gorselKaynak(key) !== undefined;
}

/**
 * Zayıf havuzu ÇALIŞILABİLİR kartlara indirger: sunucu modunda (ICERIK_TABANI dolu) yalnız
 * İNDİRİLMİŞ kanun kartları kalır (indirilmemişler görsel/ses çekemeyip bozuk görünüyordu).
 * ICERIK_TABANI boşsa (gömülü/dev) dokunmaz. TEK KAYNAK → Karargah sayacı ile akış kuyruğu
 * AYNI sayıyı gösterir (63 vs 60 tutarsızlığı biter).
 */
export function calisilabilirZayif<T extends { gorsel_yolu: string | null }>(kartlar: T[]): T[] {
  if (!ICERIK_TABANI) return kartlar;
  return kartlar.filter((c) => indirilmisGorsel(c.gorsel_yolu) !== null);
}

/**
 * ZayifKart listesini ÇALIŞILABİLİR (indirilmiş görselli) mevzilere indirger — Evsaf listesi +
 * geri-besleme emri/ceza AYNI filtreyi kullansın diye (yukarıdaki `calisilabilirZayif` kart
 * kuyruğu içindir; bu `ZayifKart` meta'sını korur). Sunucu modunda indirilmemiş kanunların
 * zayıfları SAYILMAZ → Karargah/akış (0) ile Evsaf/emir (50+) tutarsızlığı kapanır, kullanıcı
 * çalışamadığı mevzi yüzünden sonsuz ceza almaz.
 */
export function calisilabilirZayifMevzi(zayiflar: import('./performans').ZayifKart[]) {
  if (!ICERIK_TABANI) return zayiflar;
  return zayiflar.filter((z) => indirilmisGorsel(z.card.gorsel_yolu) !== null);
}
