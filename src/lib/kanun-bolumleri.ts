/**
 * KANUN BÖLÜMLERİ — madde numarası → konu bloğu adı.
 *
 * Uygulamadaki kart içeriği kanunun TAMAMI değil, sınavda çıkan bloklardır: TCK'da
 * 45'ten 247'ye atlanır. Kullanıcı bunu "sayılar rastgele" diye okuyordu (başkan, 13 Ağu).
 * Patika bu tabloyu kullanarak blok değişiminde yola BÖLÜM KAPISI koyar.
 *
 * Yeni kanun eklerken buraya satır eklemek yeterli; tablo yoksa patika "YENİ BÖLÜM" der.
 */
export type BolumAraligi = { bas: number; son: number; ad: string };

const BOLUMLER: Record<string, BolumAraligi[]> = {
  tck: [
    { bas: 1, son: 45, ad: 'GENEL HÜKÜMLER' },
    { bas: 247, son: 266, ad: 'KAMU İDARESİNE KARŞI SUÇLAR' },
    { bas: 317, son: 325, ad: 'MİLLÎ SAVUNMAYA KARŞI SUÇLAR' },
  ],
};

/** Madde numarasının bulunduğu bloğun adı; tanımsızsa null. */
export function bolumAdi(klasor: string | null | undefined, maddeNo: number): string | null {
  if (!klasor) return null;
  const liste = BOLUMLER[klasor];
  if (!liste) return null;
  const bulunan = liste.find((b) => maddeNo >= b.bas && maddeNo <= b.son);
  return bulunan?.ad ?? null;
}

/** Bu kanunun blok tablosu var mı? (yoksa patika genel "YENİ BÖLÜM" yazısını kullanır) */
export function bolumTablosuVar(klasor: string | null | undefined): boolean {
  return !!klasor && !!BOLUMLER[klasor];
}
