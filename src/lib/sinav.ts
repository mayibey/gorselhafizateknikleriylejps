/**
 * Saf deneme sınavı (Tatbikat) mantığı — platform-bağımsız, DB/IO YOK.
 * Küratörlü SORULAR.json'lardan üretilen `KART_SORULARI` registry'sini (law_id → sorular)
 * okur; soru sırasını karıştırır ve puanlar. SRS'e DOKUNMAZ (sınav salt ölçümdür).
 *
 * NOT: Şık SIRASI karıştırılmaz — bazı açıklamalar "(C) şıkkı..." gibi harfe atıf yapar;
 * şıklar registry'de zaten "A) " önekinden ayıklanmış, doğru cevap index ile tutulur.
 */

import { KART_SORULARI, type KartSoru } from '../assets/kart-sorulari';

export type { KartSoru } from '../assets/kart-sorulari';

/** Bir sınav cevabı: hangi soru, hangi şık seçildi. */
export type SinavCevap = { soruIndex: number; secilenIndex: number };

/** Bir kanunun deneme sınavı var mı (en az 1 soru)? */
export function sinavVarMi(lawId: number): boolean {
  return (KART_SORULARI[lawId]?.length ?? 0) > 0;
}

/** Bir kanunun deneme sınavı soru sayısı (yoksa 0). */
export function sinavSoruSayisi(lawId: number): number {
  return KART_SORULARI[lawId]?.length ?? 0;
}

/** Fisher-Yates karıştırma (enjekte RNG ile). Girdiyi mutasyona uğratmaz. */
function karistir<T>(dizi: readonly T[], rastgele: () => number): T[] {
  const a = [...dizi];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rastgele() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Bir kanunun sınav sorularını (soru sırası karıştırılmış) döndürür.
 * `rastgele` enjekte edilebilir → saf/test edilebilir (default Math.random).
 * Kanunun sorusu yoksa boş dizi.
 */
export function getSinavSorulari(lawId: number, rastgele: () => number = Math.random): KartSoru[] {
  const sorular = KART_SORULARI[lawId];
  if (!sorular || sorular.length === 0) return [];
  return karistir(sorular, rastgele);
}

/** Verilen cevapları puanlar (saf). */
export function puanlaSinav(
  cevaplar: SinavCevap[],
  sorular: KartSoru[],
): { dogru: number; toplam: number; yuzde: number } {
  const toplam = sorular.length;
  let dogru = 0;
  for (const c of cevaplar) {
    const soru = sorular[c.soruIndex];
    if (soru && c.secilenIndex === soru.dogru) dogru++;
  }
  const yuzde = toplam > 0 ? Math.round((dogru / toplam) * 100) : 0;
  return { dogru, toplam, yuzde };
}
