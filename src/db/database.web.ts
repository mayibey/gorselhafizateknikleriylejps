/**
 * Veri katmanı — WEB: bellek-içi (in-memory).
 * expo-sqlite'a HİÇBİR import yok (ne statik ne dinamik); böylece web bundle'ı
 * wa-sqlite.wasm / worker grafiğine hiç girmez.
 */

import { type CardWithLaw, type CardWithSrs } from '@/db/schema';
import { SEED_CARDS, SEED_LAWS } from '@/db/seed';
import type { Backend, RecordReviewResult } from '@/db/types';
import { gunlukKuyruk, type QueueCard, type SrsDurum, YENI_LIMIT } from '@/lib/queue';
import { bugunISO, srsGuncelle, type SrsCevap } from '@/lib/srs';

/** Bellek-içi arka uç. */
class MemoryBackend implements Backend {
  // srs kaydı OLMAYAN kart = yeni kart. Başlangıçta boş (tohumlanmaz).
  private srs = new Map<number, SrsDurum>();

  async init(): Promise<void> {
    // srs tohumlanmaz: "srs kaydı yok = yeni kart".
  }

  /** SEED_CARDS'ı kanun bilgisiyle birleştirir (kuyruk girdisi). */
  private cardsWithLaw(): CardWithLaw[] {
    return SEED_CARDS.map((card) => {
      const law = SEED_LAWS.find((l) => l.id === card.law_id)!;
      return { ...card, blok: law.blok, law_ad: law.ad };
    });
  }

  async getStudyCards(): Promise<CardWithSrs[]> {
    return this.cardsWithLaw().map((card) => {
      const s = this.srs.get(card.id);
      return { ...card, kutu: s?.kutu ?? 0, sonraki_tarih: s?.sonraki_tarih ?? '' };
    });
  }

  async getDailyQueue(yeniLimit: number = YENI_LIMIT): Promise<QueueCard[]> {
    return gunlukKuyruk(this.cardsWithLaw(), this.srs, bugunISO(), yeniLimit);
  }

  async saveSrs(cardId: number, kutu: number, sonrakiTarih: string): Promise<void> {
    // Map.set zaten upsert: yeni kartta oluşturur, varsa günceller.
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

/** Tüm kartları SRS durumuyla döndürür (geriye dönük; akış artık getDailyQueue kullanır). */
export async function getStudyCards(): Promise<CardWithSrs[]> {
  await initDatabase();
  return backend.getStudyCards();
}

/** Bugünün çalışma kuyruğu: vakti gelmiş tekrarlar + en fazla yeniLimit yeni kart. */
export async function getDailyQueue(yeniLimit?: number): Promise<QueueCard[]> {
  await initDatabase();
  return backend.getDailyQueue(yeniLimit);
}

/** Bir kartın cevabını işler: Leitner kuralıyla SRS kaydını UPSERT eder ve yeni durumu döndürür. */
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
