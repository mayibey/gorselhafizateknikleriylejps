/**
 * Veri katmanının platform-bağımsız ortak tipleri.
 * Buraya expo-sqlite gibi platforma özel HİÇBİR bağ girmez.
 */

import type { SrsCevap } from '@/lib/srs';

export type { Blok, Card, CardWithSrs, Law, Srs } from '@/db/schema';

/** Hem native (SQLite) hem web (bellek-içi) arka uçlarının uyduğu sözleşme. */
export interface Backend {
  init(): Promise<void>;
  getStudyCards(): Promise<import('@/db/schema').CardWithSrs[]>;
  saveSrs(cardId: number, kutu: number, sonrakiTarih: string): Promise<void>;
}

/** Public API'nin (initDatabase/getStudyCards/recordReview) ortak tip imzaları. */
export type RecordReviewResult = { kutu: number; sonraki_tarih: string };
export type { SrsCevap };
