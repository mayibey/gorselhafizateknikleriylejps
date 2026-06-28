/**
 * Saf performans analizi (akıllı öğrenme — Katman 2). DB/IO YOK; performans+cards enjekte.
 * "Geri besleme havuzu" (zayıf kartlar) = bir kart kötü yapılınca girer, ÇIKIŞ için
 * SON İKİ deneme de iyi olmalı (tek doğru yetmez → "2 doğru" kuralı, daha güvenli).
 *  - Hiç kötü yapılmamış kart → havuzda değil.
 *  - Kötü yapılmış kart → son 2 deneme ardışık iyi olana kadar havuzda kalır.
 * Kötü = çalışmada 'zor' VEYA quiz'de 'yanlis'. 'tekrar' zayıf SAYILMAZ.
 * stats.ts/sinav.ts deseni: saf, test edilebilir.
 */

import type { CardWithLaw, PerformansSatir } from '@/db/schema';

export function kotuMu(satir: PerformansSatir): boolean {
  return (
    (satir.kaynak === 'calisma' && satir.sonuc === 'zor') ||
    (satir.kaynak === 'quiz' && satir.sonuc === 'yanlis')
  );
}

export type ZayifKart = {
  card: CardWithLaw;
  /** Toplam kötü (zor/yanlış) sayısı — şiddet/sıralama için. */
  yanlisSayisi: number;
  /** En güncel deneme tarihi (YYYY-MM-DD). */
  sonTarih: string;
};

export type KanunPerf = {
  law_ad: string;
  deneme: number;
  kotu: number;
  /** Kötü oranı 0..1. */
  oran: number;
};

/** card_id → kart metadata haritası. */
function kartHarita(cards: CardWithLaw[]): Map<number, CardWithLaw> {
  return new Map(cards.map((c) => [c.id, c]));
}

/**
 * Zayıf kartlar: bir kez kötü yapılmış VE son 2 denemesi ardışık iyi OLMAYAN kartlar.
 * getPerformans() ekleme sırasıyla (kronolojik) döndüğü için sondakiler = en güncel.
 */
export function zayifKartlar(performans: PerformansSatir[], cards: CardWithLaw[]): ZayifKart[] {
  const harita = kartHarita(cards);
  // card_id → { satirlar (kronolojik) }
  const grup = new Map<number, PerformansSatir[]>();
  for (const s of performans) {
    const liste = grup.get(s.card_id);
    if (liste) liste.push(s);
    else grup.set(s.card_id, [s]);
  }

  const sonuc: ZayifKart[] = [];
  for (const [cardId, satirlar] of grup) {
    if (!satirlar.some(kotuMu)) continue; // hiç kötü yapılmamış → havuzda değil
    // Sondan başlayarak ardışık "iyi" deneme sayısı; 2'ye ulaştıysa toparlanmış (çıkar).
    let ardisikIyi = 0;
    for (let i = satirlar.length - 1; i >= 0 && !kotuMu(satirlar[i]); i--) ardisikIyi++;
    if (ardisikIyi >= 2) continue; // 2 ardışık doğru → havuzdan çıktı
    const card = harita.get(cardId);
    if (!card) continue; // metadata yoksa atla
    sonuc.push({
      card,
      yanlisSayisi: satirlar.filter(kotuMu).length,
      sonTarih: satirlar[satirlar.length - 1].tarih,
    });
  }

  return sonuc.sort((a, b) => b.yanlisSayisi - a.yanlisSayisi);
}

/** Kanun bazında deneme/kötü/oran (şimdilik "en zayıf kanun" için; çubuk yok). */
export function kanunPerformans(
  performans: PerformansSatir[],
  cards: CardWithLaw[],
): KanunPerf[] {
  const harita = kartHarita(cards);
  const grup = new Map<string, { deneme: number; kotu: number }>();
  for (const s of performans) {
    const card = harita.get(s.card_id);
    if (!card) continue;
    const g = grup.get(card.law_ad) ?? { deneme: 0, kotu: 0 };
    g.deneme += 1;
    if (kotuMu(s)) g.kotu += 1;
    grup.set(card.law_ad, g);
  }
  return [...grup.entries()]
    .map(([law_ad, g]) => ({ law_ad, deneme: g.deneme, kotu: g.kotu, oran: g.deneme > 0 ? g.kotu / g.deneme : 0 }))
    .sort((a, b) => b.oran - a.oran);
}

export type EksikOzet = {
  zayifSayisi: number;
  toplamDeneme: number;
  /** En kötü oranlı kanun adı (deneme varsa), yoksa null. */
  enZayifKanun: string | null;
};

export function eksikOzet(performans: PerformansSatir[], cards: CardWithLaw[]): EksikOzet {
  const zayif = zayifKartlar(performans, cards);
  const kanunlar = kanunPerformans(performans, cards).filter((k) => k.kotu > 0);
  return {
    zayifSayisi: zayif.length,
    toplamDeneme: performans.length,
    enZayifKanun: kanunlar.length > 0 ? kanunlar[0].law_ad : null,
  };
}
