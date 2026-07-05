/**
 * Geri sayım yardımcıları — bir bitiş anına (ISO) kalan süreyi gün/saat/dk/sn olarak verir.
 * `bitis` sunucudan ISO+Z gelir (bkz. indirim_durumu). Parse edilemez/bitmiş → null (sayaç gizlenir).
 */
export type KalanParca = { gun: number; sa: number; dk: number; sn: number };

/** Kalan süreyi parçalara ayırır. Bitmiş/negatif/parse edilemez → null. */
export function kalanParcala(bitisISO: string, simdi: number): KalanParca | null {
  const hedef = new Date(bitisISO).getTime();
  if (Number.isNaN(hedef)) return null;
  let k = Math.floor((hedef - simdi) / 1000);
  if (k <= 0) return null;
  const gun = Math.floor(k / 86400);
  k -= gun * 86400;
  const sa = Math.floor(k / 3600);
  k -= sa * 3600;
  const dk = Math.floor(k / 60);
  const sn = k - dk * 60;
  return { gun, sa, dk, sn };
}

/** "1 gün 13 sa 19 dk 20 sn" — baştaki sıfır birimler gizlenir; dk ve sn hep görünür. Bitmiş → null. */
export function kalanMetin(bitisISO: string, simdi: number): string | null {
  const p = kalanParcala(bitisISO, simdi);
  if (!p) return null;
  const parcalar: string[] = [];
  if (p.gun > 0) parcalar.push(`${p.gun} gün`);
  if (p.gun > 0 || p.sa > 0) parcalar.push(`${p.sa} sa`);
  parcalar.push(`${p.dk} dk`, `${p.sn} sn`);
  return parcalar.join(' ');
}
