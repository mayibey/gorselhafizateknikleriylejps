/**
 * Madde etiketi birleştirici (SAF). Sorun: gerçek başlığı olmayan maddelerde seed
 * jenerik "Madde N" başlığı üretir; ekranlar "KVKK m.4 — Madde 4" gibi TEKRARLI
 * gösteriyordu. Kural: başlık jenerikse ("[Ek|Geçici] Madde N") ve N zaten madde
 * numarasında görünüyorsa başlığı GİZLE; gerçek başlıklar aynen kalır.
 */
import { trKucuk } from '@/lib/ara';

export function maddeEtiket(maddeNo: string, baslik: string | null | undefined): string {
  if (!baslik) return maddeNo;
  // NOT: trKucuk artık aksan KATLAR (ç→c, ğ→g, ı→i…) → "geçici"→"gecici", desen ona göre.
  const b = trKucuk(baslik.trim());
  const jenerik = b.match(/^(?:ek |gecici )?madde ([0-9]+[a-z]?)$/);
  if (jenerik) {
    const no = jenerik[1];
    const maddeNolar: string[] = trKucuk(maddeNo).match(/[0-9]+[a-z]?/g) ?? [];
    if (maddeNolar.includes(no)) return maddeNo; // numara zaten görünüyor → tekrar etme
  }
  return `${maddeNo} — ${baslik}`;
}
