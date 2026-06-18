/**
 * Rütbeye göre müfredat kısıtı (resmî JSPS Ek-1 / "jsps konuları.pdf" rütbe sütunları).
 * SAF mantık. Varsayılan: bir kanun haritada YOKSA 4 rütbede de vardır (ortak).
 * Yalnız İSTİSNALAR tutulur — yani belirli rütbelerde OLMAYAN kanunlar.
 *
 * Şu an yalnız KULLANICI TARAFINDAN DOĞRULANAN müşterek istisna(lar) var. Diğer şüpheli
 * satırlar (Sözleşmeli S/A Yönetmeliği=16, E-imza, Türk Bayrağı) ve branş konularının
 * rütbe kısıtları teyit edildikçe eklenecek. Eksik veride GÜVENLİ yön = "göster"
 * (kimse zorunlu konuyu kaçırmaz; en fazla fazladan bir kanun görür).
 *
 * Anahtar = law_id (seed.ts SEED_LAWS). DB/migration GEREKMEZ (kod-içi, her açılış taze).
 */
import type { Rutbe } from '@/lib/rutbe-store';

const RUTBE_HARIC: Record<number, Rutbe[]> = {
  // 4678 Sözleşmeli Subay/Astsubay Kanunu → uzman jandarma ve uzman erbaşta YOK (kullanıcı teyidi).
  13: ['uzmj', 'uzmerb'],
};

/** Bu kanun verilen rütbenin müfredatında görünür mü? rütbe null → her şey görünür (güvenli). */
export function rutbeGorur(lawId: number, rutbe: Rutbe | null): boolean {
  if (!rutbe) return true;
  const haric = RUTBE_HARIC[lawId];
  return !haric || !haric.includes(rutbe);
}
