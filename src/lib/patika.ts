/**
 * Saf patika ilerleme hesabı (Faz 1 — kilit YOK, hepsi açık).
 * Bir bölümün kartlarından (SRS kutu'su ile) çalışılmış oranı hesaplar.
 * DB/IO yok; kartlar enjekte edilir (stats.ts deseni). SRS'e yalnız OKUMA.
 */

/** kutu >= 1 = en az bir kez çalışılmış (yeni kart kutu 0). */
export function bolumIlerleme(bolumKartlar: { kutu: number }[]): {
  calisilan: number;
  toplam: number;
  oran: number;
} {
  const toplam = bolumKartlar.length;
  const calisilan = bolumKartlar.filter((c) => c.kutu >= 1).length;
  return { calisilan, toplam, oran: toplam > 0 ? calisilan / toplam : 0 };
}
