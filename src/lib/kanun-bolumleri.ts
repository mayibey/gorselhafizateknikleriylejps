/**
 * KANUN BÖLÜMLERİ — madde numarası → konu bloğu.
 *
 * Uygulamadaki kart içeriği kanunun TAMAMI değil, sınavda çıkan bloklardır: TCK'da
 * 45'ten 247'ye atlanır. Kullanıcı bunu "sayılar rastgele" diye okuyordu (başkan, 13 Ağu).
 * Patika bu tabloyu kullanarak blok değişiminde yola BÖLÜM KAPISI koyar.
 *
 * `ornekler` ŞART: yalnız resmî başlık ("Kamu İdaresine Karşı Suçlar") kimseye bir şey
 * anlatmıyor — kapıda içindeki konular da yazar (Zimmet · Rüşvet…), başkan bunu istedi.
 * Yeni kanun eklerken buraya satır eklemek yeterli; tablo yoksa patika "YENİ BÖLÜM" der.
 */
export type BolumAraligi = { bas: number; son: number; ad: string; ornekler: string };

const BOLUMLER: Record<string, BolumAraligi[]> = {
  tck: [
    {
      bas: 1,
      son: 45,
      ad: 'GENEL HÜKÜMLER',
      ornekler: 'Kast · Taksir · İçtima · Ceza türleri',
    },
    {
      bas: 247,
      son: 266,
      ad: 'KAMU İDARESİNE KARŞI SUÇLAR',
      ornekler: 'Zimmet · İrtikâp · Rüşvet · Görevi kötüye kullanma',
    },
    {
      bas: 317,
      son: 325,
      ad: 'MİLLÎ SAVUNMAYA KARŞI SUÇLAR',
      ornekler: 'Askerlikten soğutma · İtaatsizliğe teşvik · Sefer emrine uymama',
    },
  ],
};

/** Madde numarasının bulunduğu blok; tanımsızsa null. */
export function bolumBilgi(klasor: string | null | undefined, maddeNo: number): BolumAraligi | null {
  if (!klasor) return null;
  const liste = BOLUMLER[klasor];
  if (!liste) return null;
  return liste.find((b) => maddeNo >= b.bas && maddeNo <= b.son) ?? null;
}

/** Yalnız ad (geriye uyum). */
export function bolumAdi(klasor: string | null | undefined, maddeNo: number): string | null {
  return bolumBilgi(klasor, maddeNo)?.ad ?? null;
}
