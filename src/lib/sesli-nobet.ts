/**
 * Saf "Sesli Nöbet" kuyruk mantığı (platform-bağımsız, DB/IO YOK).
 * Sesli kart filtresi + sınır kontrollü index ilerletme. Oynatma (native IO)
 * use-sesli-nobet hook'unda; burası yalnız saf hesap (srs.ts/queue.ts deseni).
 */

import { sesVarMi } from './ses-kaynak';

/** ses_yolu için gereken alanları taşıyan minimal kart tipi (QueueCard bunu karşılar). */
type SesliKartGirdi = { ses_yolu: string | null };

/**
 * Yalnız çalınabilir kartları döndürür: ses_yolu DOLU ve registry'de kayıtlı.
 * Sessiz kartlar (ses_yolu null veya registry'de yok) elenir.
 */
export function sesliKartlar<T extends SesliKartGirdi>(kartlar: T[]): T[] {
  return kartlar.filter((k) => sesVarMi(k.ses_yolu));
}

/** Sonraki index; son karttaysa olduğu yerde kalır (son kartta DUR → "bitti"). */
export function sonrakiIndex(index: number, toplam: number): number {
  return index + 1 < toplam ? index + 1 : index;
}

/** Önceki index; ilk karttaysa olduğu yerde kalır. */
export function oncekiIndex(index: number): number {
  return index > 0 ? index - 1 : index;
}
