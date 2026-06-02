/**
 * '@/db/database' için tip yüzeyi.
 * tsc, .web.ts / .native.ts platform uzantılarını çözmediği için import'un tip
 * tarafı bu bildirim dosyasından gelir. Metro ise runtime'da platforma göre
 * database.web.ts veya database.native.ts dosyasını seçer (bu .d.ts'i yok sayar).
 * İki implementasyon da bu imzaları birebir export eder.
 */

import type { Branch, CardWithSrs, LawWithCount } from '@/db/schema';
import type { RecordReviewResult, SrsCevap } from '@/db/types';
import type { QueueCard } from '@/lib/queue';

export function initDatabase(): Promise<void>;
export function getStudyCards(): Promise<CardWithSrs[]>;
export function getDailyQueue(yeniLimit?: number): Promise<QueueCard[]>;
export function getBranches(): Promise<Branch[]>;
export function getLaws(bransSlug: string): Promise<LawWithCount[]>;
export function getCardsByLaw(lawId: number): Promise<QueueCard[]>;
export function recordReview(
  cardId: number,
  mevcutKutu: number,
  cevap: SrsCevap,
): Promise<RecordReviewResult>;
