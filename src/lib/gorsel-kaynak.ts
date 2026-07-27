/**
 * Kart görseli kaynak çözümleyici (ses-kaynak.ts ile simetrik). Öncelik:
 *  (1) İNDİRİLMİŞ (şifreli yerel) → `indirilmisGorsel` yolu döner; StudyCard onu ÇÖZ'er (data-URI).
 *  (2) ICERIK_TABANI doluysa → imzalı uzak {uri} (WEB + NATIVE; Storage'daki DÜZ webp doğrudan).
 *  (3) pakete GÖMÜLÜ require.
 */
import type { ImageRequireSource } from 'react-native';

import { KART_GORSEL_YOLLARI, KART_GORSELLERI } from '../assets/kart-gorselleri';
import { ICERIK_TABANI } from '@/constants/config';
import { imzaliAktif, imzaliUriSync } from './imzali-cache';
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
    // Private bucket → public URL 400 verir; imzalı URL (WEB + NATIVE, ses-kaynak ile simetrik).
    // İndirilmemiş/akış senaryosu: eskiden native'de webImzaliAktif() (web-only) yüzünden public
    // URL dönüp 400 alıyordu → görsel açılmıyordu. Storage'daki dosya DÜZ webp (AES şifreleme
    // yalnız indirme sırasında cihazda yapılır) → imzalı URL doğrudan {uri} ile gösterilir
    // (decrypt YOK). Hazır değilse undefined → imzalı gelince useImzaliTazele render'ı tazeler.
    if (imzaliAktif()) {
      const imzali = imzaliUriSync(yol);
      return imzali ? { uri: imzali } : undefined;
    }
    return { uri: `${ICERIK_TABANI}/${yol}` };
  }
  return KART_GORSELLERI[key];
}

/** Görselin imzalı URL'i henüz YOLDA mı? (WEB + NATIVE; StudyCard "hazırlanıyor" göstersin, placeholder değil) */
export function gorselBekliyorMu(key?: string | null): boolean {
  if (!key || !imzaliAktif()) return false;
  if (indirilmisGorsel(key)) return false; // yerelde şifreli var → imzalı URL beklenmez
  const yol = KART_GORSEL_YOLLARI[key];
  return !!yol && imzaliUriSync(yol) === null;
}

/** Bu kart için herhangi bir görsel var mı? (indirilmiş-şifreli / uzak / gömülü)
 *  İmzalı modda (web+native) URL'in henüz gelmemiş olması "yok" SAYILMAZ (manifest'te varsa var). */
export function gorselVarMi(key?: string | null): boolean {
  if (!key) return false;
  if (imzaliAktif() && KART_GORSEL_YOLLARI[key]) return true;
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
