/**
 * '@/db/database' için tip yüzeyi.
 * tsc, .web.ts / .native.ts platform uzantılarını çözmediği için import'un tip
 * tarafı bu bildirim dosyasından gelir. Metro ise runtime'da platforma göre
 * database.web.ts veya database.native.ts dosyasını seçer (bu .d.ts'i yok sayar).
 * İki implementasyon da bu imzaları birebir export eder.
 */

import type { Bolum, Branch, CardWithLaw, CardWithSrs, GeriBesDurum, LawWithCount, PerformansKaynak, PerformansSatir, SicilKaydi, SinavSonuc } from '@/db/schema';
import type { IlerlemeSnapshot, RecordReviewResult, SrsCevap } from '@/db/types';
import type { QueueCard } from '@/lib/queue';

export function initDatabase(): Promise<void>;
export function getStudyCards(): Promise<CardWithSrs[]>;
export function getAllCards(): Promise<CardWithLaw[]>;
export function getCardCount(): Promise<number>;
export function getDailyQueue(): Promise<QueueCard[]>;
export function getBranches(): Promise<Branch[]>;
export function getLaws(bransSlug: string): Promise<LawWithCount[]>;
export function getCardsByLaw(lawId: number): Promise<QueueCard[]>;
export function getZayifKuyruk(): Promise<QueueCard[]>;
export function getBolumler(lawId: number): Promise<Bolum[]>;
export function getCardsByBolum(bolumId: number): Promise<QueueCard[]>;
export function getCardsByBolumChain(bolumId: number): Promise<QueueCard[]>;
export function getBolumKartIds(): Promise<number[]>;
export function getStudyDays(): Promise<string[]>;
export function recordReview(
  cardId: number,
  mevcutKutu: number,
  cevap: SrsCevap,
): Promise<RecordReviewResult>;
export function kaydetPerformans(
  cardId: number,
  kaynak: PerformansKaynak,
  sonuc: string,
): Promise<void>;
export function getPerformans(): Promise<PerformansSatir[]>;
export function getSicilKayitlari(): Promise<SicilKaydi[]>;
export function ekleSicilKaydi(kayit: Omit<SicilKaydi, 'id'>): Promise<void>;
export function getGeriBesDurum(): Promise<GeriBesDurum>;
export function setGeriBesDurum(durum: GeriBesDurum): Promise<void>;
export function sicilSifirla(): Promise<void>;
export function ekleSinavSonucu(
  lawId: number,
  test: number,
  dogru: number,
  toplam: number,
  tarih: string,
): Promise<void>;
export function getSinavSonuclari(): Promise<SinavSonuc[]>;
export function ilerlemeDisaAktar(): Promise<IlerlemeSnapshot>;
export function ilerlemeIceAktar(snapshot: IlerlemeSnapshot, tamYukle: boolean): Promise<void>;
export function ilerlemeSifirla(): Promise<void>;
