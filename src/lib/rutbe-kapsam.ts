/**
 * Rütbeye göre müfredat kısıtı (resmî JSPS Ek-1 / "jsps konuları.pdf" rütbe sütunları).
 * SAF mantık. Varsayılan: bir kanun haritada YOKSA 4 rütbede de vardır (ortak).
 * Yalnız İSTİSNALAR tutulur — yani belirli rütbelerde OLMAYAN kanunlar.
 *
 * MÜŞTEREK matris KİLİTLİ (kullanıcı teyidi): yalnız subay/astsubay kariyer mevzuatı
 * uzmanlarda yok; E-imza, Türk Bayrağı dahil gerisi 4 rütbede ortak. BRANŞ konularının
 * rütbe kısıtları ayrı tur (branş içeriği henüz yok). Eksik veride GÜVENLİ yön = "göster".
 *
 * Anahtar = law_id (seed.ts SEED_LAWS). DB/migration GEREKMEZ (kod-içi, her açılış taze).
 */
import type { Rutbe } from '@/lib/rutbe-store';

const RUTBE_HARIC: Record<number, Rutbe[]> = {
  // Subay/astsubay kariyer mevzuatı → uzman jandarma ve uzman erbaşta YOK (kullanıcı teyidi):
  13: ['uzmj', 'uzmerb'], // 4678 Sözleşmeli Subay/Astsubay Kanunu
  16: ['uzmj', 'uzmerb'], // Sözleşmeli Subay ve Astsubay Yönetmeliği
};

/** Bu kanun verilen rütbenin müfredatında görünür mü? rütbe null → her şey görünür (güvenli). */
export function rutbeGorur(lawId: number, rutbe: Rutbe | null): boolean {
  if (!rutbe) return true;
  const haric = RUTBE_HARIC[lawId];
  return !haric || !haric.includes(rutbe);
}
