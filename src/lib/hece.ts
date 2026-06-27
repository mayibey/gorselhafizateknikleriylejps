/**
 * Türkçe heceleme — uzun kanun adları satıra sığmayınca TDK hece kuralına göre bölünsün.
 * Hecelerin arasına YUMUŞAK TİRE (U+00AD) konur: metin sığarsa görünmez, satır sonunda
 * kırılması gerekirse "-" ile o hecede bölünür (RN Text yumuşak tireyi onurlandırır).
 *
 * TDK kuralı (iki ünlü arası): n ünsüzden SONUNCUSU sonraki heceye, kalanlar önceki heceye.
 *  - 1 ünsüz: V-CV · 2 ünsüz: VC-CV · 3 ünsüz: VCC-CV.
 * Saf fonksiyon (UI'dan bağımsız).
 */

const SOFT = '­';
const UNLU = 'aeıioöuüâîûAEIİOÖUÜÂÎÛ';

function unluMu(ch: string): boolean {
  return UNLU.includes(ch);
}

/** Tek bir KELİMEYİ hecelere böler (yalnız harf dizisi beklenir). */
function heceBol(kelime: string): string[] {
  const harfler = [...kelime];
  const unluIdx: number[] = [];
  for (let i = 0; i < harfler.length; i++) if (unluMu(harfler[i])) unluIdx.push(i);
  if (unluIdx.length <= 1) return [kelime]; // 0/1 ünlü → tek hece

  // Her ardışık ünlü çifti arası → yeni hecenin BAŞLADIĞI indeks.
  const baslangic: number[] = [];
  for (let k = 0; k < unluIdx.length - 1; k++) {
    const a = unluIdx[k];
    const b = unluIdx[k + 1];
    const unsuz = b - a - 1; // aradaki ünsüz sayısı
    baslangic.push(unsuz === 0 ? b : b - 1); // 0 ünsüz: V|V · ≥1: son ünsüz sonraki heceye
  }

  const parcalar: string[] = [];
  let onceki = 0;
  for (const b of baslangic) {
    parcalar.push(harfler.slice(onceki, b).join(''));
    onceki = b;
  }
  parcalar.push(harfler.slice(onceki).join(''));
  return parcalar;
}

/**
 * Bir metindeki (kelime kelime) uzun kelimelere hece sınırlarında yumuşak tire ekler.
 * Boşluk/noktalama korunur; ≥2 ünlü içeren ve yeterince uzun kelimeler hecelenir.
 */
export function hecele(metin: string): string {
  // Kelimeleri (harf öbekleri) ayır; aradaki boşluk/noktalama olduğu gibi kalsın.
  return metin.replace(/[\p{L}]+/gu, (kelime) => {
    if (kelime.length < 6) return kelime; // kısa kelime kırılmaya zaten gerek duymaz
    const heceler = heceBol(kelime);
    return heceler.length > 1 ? heceler.join(SOFT) : kelime;
  });
}
