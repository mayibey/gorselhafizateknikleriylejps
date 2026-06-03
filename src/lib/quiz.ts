/**
 * Saf quiz (tatbikat) mantığı — platform-bağımsız, DB/IO YOK.
 * Kartların madde_no + baslik alanlarından çoktan seçmeli soru üretir.
 * Rastgelelik enjekte edilir (test edilebilir/deterministik) — srs.ts deseni.
 * SRS'e DOKUNMAZ: quiz salt ölçümdür.
 */

import type { Card } from '@/db/schema';

/** Quiz havuzu için gereken minimum kart sayısı. */
export const MIN_HAVUZ = 4;
/** Soru başına şık sayısı (havuz küçükse min(4, havuz)). */
export const SECENEK_SAYISI = 4;

/** Quiz girdisi: karttan yalnız bu alanlar gerekir (QueueCard/CardWithSrs bunu karşılar). */
export type QuizKart = Pick<Card, 'id' | 'madde_no' | 'baslik'>;

export type QuizSoru = {
  soruMetni: string;
  secenekler: string[];
  dogruIndex: number;
  kaynakCardId: number;
};

export type QuizUretOpts = {
  /** Üretilecek soru sayısı (default: tüm kartlar). */
  soruSayisi?: number;
  /** Soru başına şık (default 4; her zaman min(secenekSayisi, havuz) ile sınırlanır). */
  secenekSayisi?: number;
  /** Enjekte edilebilir RNG (default Math.random) → saf/test edilebilir. */
  rastgele?: () => number;
};

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
 * Kart havuzundan çoktan seçmeli sorular üretir.
 * Her soru rastgele tip A ("'{madde_no}' hangi konuyu düzenler?" → baslik) veya
 * tip B ("'{baslik}' hangi maddede düzenlenir?" → madde_no).
 * Çeldiriciler havuzdaki başka kartların ilgili alanından (birbirinden ve doğrudan farklı).
 */
export function quizUret(cards: QuizKart[], opts: QuizUretOpts = {}): QuizSoru[] {
  const rastgele = opts.rastgele ?? Math.random;
  if (cards.length < 2) return [];

  const secenekSayisi = Math.min(opts.secenekSayisi ?? SECENEK_SAYISI, cards.length);
  const soruSayisi = Math.min(opts.soruSayisi ?? cards.length, cards.length);
  const soruKartlari = karistir(cards, rastgele).slice(0, soruSayisi);

  return soruKartlari.map((card) => {
    const tipA = rastgele() < 0.5;
    const alan = (k: QuizKart) => (tipA ? k.baslik : k.madde_no);
    const dogru = alan(card);
    const soruMetni = tipA
      ? `"${card.madde_no}" hangi konuyu düzenler?`
      : `"${card.baslik}" hangi maddede düzenlenir?`;

    // Çeldiriciler: diğer kartların ilgili alanı, doğru ve birbirinden farklı.
    const digerler = karistir(
      cards.filter((k) => k.id !== card.id),
      rastgele,
    );
    const secili = new Set<string>([dogru]);
    const celdiriciler: string[] = [];
    for (const k of digerler) {
      if (celdiriciler.length >= secenekSayisi - 1) break;
      const deger = alan(k);
      if (!secili.has(deger)) {
        secili.add(deger);
        celdiriciler.push(deger);
      }
    }

    const secenekler = karistir([dogru, ...celdiriciler], rastgele);
    return {
      soruMetni,
      secenekler,
      dogruIndex: secenekler.indexOf(dogru),
      kaynakCardId: card.id,
    };
  });
}

/** Cevapları puanlar (saf). */
export function puanla(
  cevaplar: { soruIndex: number; secilenIndex: number }[],
  sorular: QuizSoru[],
): { dogru: number; toplam: number; yuzde: number } {
  const toplam = sorular.length;
  let dogru = 0;
  for (const c of cevaplar) {
    const soru = sorular[c.soruIndex];
    if (soru && c.secilenIndex === soru.dogruIndex) dogru++;
  }
  const yuzde = toplam > 0 ? Math.round((dogru / toplam) * 100) : 0;
  return { dogru, toplam, yuzde };
}
