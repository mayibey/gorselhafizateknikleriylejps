/**
 * Veri katmanının platform-bağımsız ortak tipleri.
 * Buraya expo-sqlite gibi platforma özel HİÇBİR bağ girmez.
 */

import type { Branch, CardWithSrs, LawWithCount } from '@/db/schema';
import type { QueueCard } from '@/lib/queue';
import type { SrsCevap } from '@/lib/srs';

export type { Blok, Branch, Card, CardWithLaw, CardWithSrs, Law, LawBranch, LawWithCount, Srs } from '@/db/schema';
export type { QueueCard, SrsDurum } from '@/lib/queue';

/** Hem native (SQLite) hem web (bellek-içi) arka uçlarının uyduğu sözleşme. */
export interface Backend {
  init(): Promise<void>;
  getStudyCards(): Promise<CardWithSrs[]>;
  getDailyQueue(yeniLimit?: number): Promise<QueueCard[]>;
  getBranches(): Promise<Branch[]>;
  getLaws(bransSlug: string): Promise<LawWithCount[]>;
  getCardsByLaw(lawId: number): Promise<QueueCard[]>;
  saveSrs(cardId: number, kutu: number, sonrakiTarih: string): Promise<void>;
}

/** Public API'nin (initDatabase/getStudyCards/recordReview) ortak tip imzaları. */
export type RecordReviewResult = { kutu: number; sonraki_tarih: string };
export type { SrsCevap };
