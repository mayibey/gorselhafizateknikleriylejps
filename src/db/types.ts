/**
 * Veri katmanının platform-bağımsız ortak tipleri.
 * Buraya expo-sqlite gibi platforma özel HİÇBİR bağ girmez.
 */

import type { Bolum, Branch, CardWithLaw, CardWithSrs, LawWithCount, PerformansKaynak, PerformansSatir } from '@/db/schema';
import type { QueueCard } from '@/lib/queue';
import type { SrsCevap } from '@/lib/srs';

export type { Blok, Bolum, BolumKart, Branch, Card, CardWithLaw, CardWithSrs, Law, LawBranch, LawWithCount, PerformansKaynak, PerformansSatir, Srs } from '@/db/schema';
export type { QueueCard, SrsDurum } from '@/lib/queue';

/** Hem native (SQLite) hem web (bellek-içi) arka uçlarının uyduğu sözleşme. */
export interface Backend {
  init(): Promise<void>;
  getStudyCards(): Promise<CardWithSrs[]>;
  /** Tüm kartlar + kanun bilgisi (srs JOIN'siz; performans analizi için metadata). */
  getAllCards(): Promise<CardWithLaw[]>;
  getCardCount(): Promise<number>;
  getDailyQueue(yeniLimit?: number): Promise<QueueCard[]>;
  getBranches(): Promise<Branch[]>;
  getLaws(bransSlug: string): Promise<LawWithCount[]>;
  getCardsByLaw(lawId: number): Promise<QueueCard[]>;
  /** Bir kanunun patika bölümleri (sıralı). */
  getBolumler(lawId: number): Promise<Bolum[]>;
  /** Bir bölümün kartları (bölüm-içi sıraya göre). */
  getCardsByBolum(bolumId: number): Promise<QueueCard[]>;
  saveSrs(cardId: number, kutu: number, sonrakiTarih: string): Promise<void>;
  /** Verilen günü (YYYY-MM-DD) "çalışıldı" olarak işaretler (gün-tekil). */
  markStudyDay(gun: string): Promise<void>;
  /** Çalışılmış günleri (YYYY-MM-DD) ham liste olarak döndürür (streak hesabı stats.ts'te). */
  getStudyDays(): Promise<string[]>;
  /** Bir cevabı performans loguna ekler (akıllı öğrenme — Katman 1). SRS'ten ayrı. */
  kaydetPerformans(cardId: number, kaynak: PerformansKaynak, sonuc: string): Promise<void>;
  /** Ham performans loglarını (ekleme sırasıyla) döndürür; analiz Katman 2'de. */
  getPerformans(): Promise<PerformansSatir[]>;
}

/** Public API'nin (initDatabase/getStudyCards/recordReview) ortak tip imzaları. */
export type RecordReviewResult = { kutu: number; sonraki_tarih: string };
export type { SrsCevap };
