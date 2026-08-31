/**
 * WEB imzalı içerik önbelleği. Bucket PRIVATE olduğu için web'de (indirme motoru yok)
 * görsel/ses public URL'den ÇEKİLEMEZ (400 → kart bomboş kalıyordu). Bu modül istenen
 * yolları kısa bir debounce ile TOPLAyıp `imzali-url` Edge Function'ından kısa-ömürlü
 * imzalı URL alır ve senkron sorguya (resolver'lara) sunar.
 *
 * - Yalnız WEB + IMZALI_URL_AKTIF iken devreye girer (native'de indirme+şifreli yerel yol var).
 * - URL hazır olunca dinleyiciler tetiklenir → ekranlar `useImzaliTazele` ile yeniden çizer.
 * - İmzalı URL ~15 dk yaşar; süresi dolan görüntülenmişse expo-image cache'inde zaten vardır,
 *   dev-web senaryosu için yeterli (web yayınlanan platform değil, test aracı).
 */
import { Platform } from 'react-native';

import { ICERIK_TABANI, IMZALI_URL_AKTIF } from '@/constants/config';

import { imzaliUrller } from './imzali-url';

const cache = new Map<string, string>();
const kuyruk = new Set<string>();
const istendi = new Set<string>();
const dinleyiciler = new Set<() => void>();
let zamanlayici: ReturnType<typeof setTimeout> | null = null;

/**
 * İmzalı-içerik modu aktif mi? PLATFORMDAN BAĞIMSIZ (web + native). Private bucket'ta public
 * URL 400 verdiği için ses resolver'ı native'de de bunu kullanır (indirilmemiş/akış senaryosu):
 * indirme motoru devreye girmeden imzalı URL ile çalabilmek için. (imzaliUrller/imzaliDinle
 * zaten platformdan bağımsız çalışır; tek web-kısıtı buradaki eski gate'ti.)
 */
export function imzaliAktif(): boolean {
  return IMZALI_URL_AKTIF && ICERIK_TABANI !== '';
}

/** Web'de imzalı-içerik modu aktif mi? (görsel resolver'ı dallanma için kullanır — davranış AYNI) */
export function webImzaliAktif(): boolean {
  return Platform.OS === 'web' && imzaliAktif();
}

function yay(): void {
  for (const d of dinleyiciler) d();
}

async function bosalt(): Promise<void> {
  zamanlayici = null;
  const yollar = [...kuyruk];
  kuyruk.clear();
  if (yollar.length === 0) return;
  try {
    const harita = await imzaliUrller(yollar);
    for (const [yol, url] of harita) cache.set(yol, url);
  } catch {
    // Alınamadı → tekrar istenebilsin (oturum henüz kurulmamış olabilir).
    for (const y of yollar) istendi.delete(y);
  }
  yay();
}

/**
 * Senkron sorgu: imzalı URL hazırsa döner; değilse arka planda getirtir ve null döner
 * (hazır olunca dinleyiciler tetiklenir → yeniden render'da URL gelir).
 */
export function imzaliUriSync(yol: string): string | null {
  const hazir = cache.get(yol);
  if (hazir) return hazir;
  if (!istendi.has(yol)) {
    istendi.add(yol);
    kuyruk.add(yol);
    if (!zamanlayici) zamanlayici = setTimeout(bosalt, 50);
  }
  return null;
}

/**
 * Bir yolun imzalı URL'ini UNUT → sonraki sorguda YENİSİ istenir.
 *
 * 31 Ağu 2026 (Ömer Faruk bildirdi: "Görsel görünmüyor"): indirmeden çalışan kullanıcıda
 * görsel bir kez yüklenemeyince kart SONSUZA KADAR boş kalıyordu — elde geçerli görünen bir
 * URL vardı, yeniden denenmiyordu. Adam boş karta bakıp 10 dakika bekledi. Yükleme hatasında
 * bu çağrılır, taze URL alınır ve görsel bir kez daha denenir.
 */
export function imzaliUnut(yol: string): void {
  cache.delete(yol);
  istendi.delete(yol);
}

/** Önbelleğe yeni URL düştüğünde haber al (aboneliği geri verilen fonksiyonla kes). */
export function imzaliDinle(cb: () => void): () => void {
  dinleyiciler.add(cb);
  return () => {
    dinleyiciler.delete(cb);
  };
}
