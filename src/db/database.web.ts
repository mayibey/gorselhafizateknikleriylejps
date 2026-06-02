/**
 * Veri katmanı — WEB: bellek-içi (in-memory).
 * expo-sqlite'a HİÇBİR import yok (ne statik ne dinamik); böylece web bundle'ı
 * wa-sqlite.wasm / worker grafiğine hiç girmez.
 */

import { type CardWithSrs } from '@/db/schema';
import { SEED_CARDS, SEED_LAWS } from '@/db/seed';
import type { Backend, RecordReviewResult } from '@/db/types';
import { srsGuncelle, type SrsCevap } from '@/lib/srs';

/** Bellek-içi arka uç. */
class MemoryBackend implements Backend {
  private srs = new Map<number, { kutu: number; sonraki_tarih: string }>();

  async init(): Promise<void> {
    if (this.srs.size > 0) return;
    const bugun = new Date().toISOString().slice(0, 10);
    for (const card of SEED_CARDS) this.srs.set(card.id, { kutu: 1, sonraki_tarih: bugun });
  }

  async getStudyCards(): Promise<CardWithSrs[]> {
    return SEED_CARDS.map((card) => {
      const law = SEED_LAWS.find((l) => l.id === card.law_id)!;
      const s = this.srs.get(card.id)!;
      return { ...card, blok: law.blok, law_ad: law.ad, kutu: s.kutu, sonraki_tarih: s.sonraki_tarih };
    });
  }

  async saveSrs(cardId: number, kutu: number, sonrakiTarih: string): Promise<void> {
    this.srs.set(cardId, { kutu, sonraki_tarih: sonrakiTarih });
  }
}

const backend: Backend = new MemoryBackend();

let hazir: Promise<void> | null = null;

/** Veritabanını (idempotent) açar, şemayı kurar ve gerekiyorsa tohumlar. */
export function initDatabase(): Promise<void> {
  if (!hazir) hazir = backend.init();
  return hazir;
}

/** Çalışma akışı için tüm kartları SRS durumuyla birlikte döndürür. */
export async function getStudyCards(): Promise<CardWithSrs[]> {
  await initDatabase();
  return backend.getStudyCards();
}

/** Bir kartın cevabını işler: Leitner kuralıyla SRS kaydını günceller ve yeni durumu döndürür. */
export async function recordReview(
  cardId: number,
  mevcutKutu: number,
  cevap: SrsCevap,
): Promise<RecordReviewResult> {
  await initDatabase();
  const next = srsGuncelle(mevcutKutu, cevap);
  await backend.saveSrs(cardId, next.kutu, next.sonraki_tarih);
  return next;
}
