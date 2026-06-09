/**
 * Veri katmanının platform-bağımsız ortak tipleri.
 * Buraya expo-sqlite gibi platforma özel HİÇBİR bağ girmez.
 */

import type { Bolum, Branch, CardWithLaw, CardWithSrs, GeriBesDurum, LawWithCount, PerformansKaynak, PerformansSatir, SicilKaydi } from '@/db/schema';
import type { QueueCard } from '@/lib/queue';
import type { SrsCevap } from '@/lib/srs';

export type { Blok, Bolum, BolumKart, Branch, Card, CardWithLaw, CardWithSrs, CezaDerece, GeriBesDurum, Law, LawBranch, LawWithCount, OdulDerece, PerformansKaynak, PerformansSatir, SicilDerece, SicilKaydi, SicilTip, Srs } from '@/db/schema';
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
  /** Zayıf mevzi kuyruğu (geri-bes oturumu): son denemede zor/yanlış kartlar + SRS. */
  getZayifKuyruk(): Promise<QueueCard[]>;
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
  /** Sicil defteri kayıtları (ödül+ceza), en yeni önce. */
  getSicilKayitlari(): Promise<SicilKaydi[]>;
  /** Yeni bir sicil kaydı ekler (id otomatik). */
  ekleSicilKaydi(kayit: Omit<SicilKaydi, 'id'>): Promise<void>;
  /** Geri besleme emri durumu (tek satır; yoksa varsayılan temiz durum). */
  getGeriBesDurum(): Promise<GeriBesDurum>;
  /** Geri besleme emri durumunu yazar (id=1 upsert). */
  setGeriBesDurum(durum: GeriBesDurum): Promise<void>;
  /** Sicil defterini ve geri-bes durumunu sıfırlar (demo/önizleme temizliği). */
  sicilSifirla(): Promise<void>;
}

/** Public API'nin (initDatabase/getStudyCards/recordReview) ortak tip imzaları. */
export type RecordReviewResult = { kutu: number; sonraki_tarih: string };
export type { SrsCevap };
