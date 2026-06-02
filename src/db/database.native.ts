/**
 * Veri katmanı — NATIVE (iOS/Android): expo-sqlite.
 * expo-sqlite import'u SADECE bu dosyada bulunur; Metro web build'inde
 * `database.web.ts` seçildiği için bu dosya web grafiğine hiç girmez.
 */

import {
  CREATE_SQL,
  type CardWithLaw,
  type CardWithSrs,
  type LawWithCount,
  type Srs,
} from '@/db/schema';
import { SEED_CARDS, SEED_LAWS } from '@/db/seed';
import type { Backend, RecordReviewResult } from '@/db/types';
import { kanunKuyrugu } from '@/lib/kanun-kartlari';
import { gunlukKuyruk, type QueueCard, type SrsDurum, YENI_LIMIT } from '@/lib/queue';
import { bugunISO, srsGuncelle, type SrsCevap } from '@/lib/srs';

/** expo-sqlite arka ucu. */
class SqliteBackend implements Backend {
  private db: Awaited<ReturnType<typeof import('expo-sqlite').openDatabaseAsync>> | null = null;

  async init(): Promise<void> {
    const SQLite = await import('expo-sqlite');
    this.db = await SQLite.openDatabaseAsync('jsps.db');
    await this.db.execAsync(CREATE_SQL);

    const row = await this.db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM cards');
    if ((row?.n ?? 0) > 0) return;

    // Sadece laws + cards tohumlanır. srs tohumlanmaz: "srs kaydı yok = yeni kart".
    for (const law of SEED_LAWS) {
      await this.db.runAsync('INSERT INTO laws (id, blok, ad) VALUES (?, ?, ?)', law.id, law.blok, law.ad);
    }
    for (const card of SEED_CARDS) {
      await this.db.runAsync(
        'INSERT INTO cards (id, law_id, madde_no, baslik, anlatim_metni, gorsel_yolu, ses_yolu) VALUES (?, ?, ?, ?, ?, ?, ?)',
        card.id,
        card.law_id,
        card.madde_no,
        card.baslik,
        card.anlatim_metni,
        card.gorsel_yolu,
        card.ses_yolu,
      );
    }
  }

  async getStudyCards(): Promise<CardWithSrs[]> {
    if (!this.db) throw new Error('DB hazır değil');
    return this.db.getAllAsync<CardWithSrs>(
      `SELECT c.*, l.blok AS blok, l.ad AS law_ad, s.kutu AS kutu, s.sonraki_tarih AS sonraki_tarih
       FROM cards c
       JOIN laws l ON l.id = c.law_id
       JOIN srs s ON s.card_id = c.id
       ORDER BY c.id`,
    );
  }

  async getDailyQueue(yeniLimit: number = YENI_LIMIT): Promise<QueueCard[]> {
    if (!this.db) throw new Error('DB hazır değil');
    const cards = await this.db.getAllAsync<CardWithLaw>(
      `SELECT c.*, l.blok AS blok, l.ad AS law_ad
       FROM cards c
       JOIN laws l ON l.id = c.law_id
       ORDER BY c.id`,
    );
    const srsRows = await this.db.getAllAsync<Srs>('SELECT card_id, kutu, sonraki_tarih FROM srs');
    const srsMap = new Map<number, SrsDurum>(
      srsRows.map((r) => [r.card_id, { kutu: r.kutu, sonraki_tarih: r.sonraki_tarih }]),
    );
    return gunlukKuyruk(cards, srsMap, bugunISO(), yeniLimit);
  }

  async getLaws(): Promise<LawWithCount[]> {
    if (!this.db) throw new Error('DB hazır değil');
    return this.db.getAllAsync<LawWithCount>(
      `SELECT l.id, l.blok, l.ad, COUNT(c.id) AS kartSayisi
       FROM laws l
       LEFT JOIN cards c ON c.law_id = l.id
       GROUP BY l.id, l.blok, l.ad
       ORDER BY l.id`,
    );
  }

  async getCardsByLaw(lawId: number): Promise<QueueCard[]> {
    if (!this.db) throw new Error('DB hazır değil');
    const cards = await this.db.getAllAsync<CardWithLaw>(
      `SELECT c.*, l.blok AS blok, l.ad AS law_ad
       FROM cards c
       JOIN laws l ON l.id = c.law_id
       WHERE c.law_id = ?`,
      lawId,
    );
    const srsRows = await this.db.getAllAsync<Srs>('SELECT card_id, kutu, sonraki_tarih FROM srs');
    const srsMap = new Map<number, SrsDurum>(
      srsRows.map((r) => [r.card_id, { kutu: r.kutu, sonraki_tarih: r.sonraki_tarih }]),
    );
    return kanunKuyrugu(cards, srsMap);
  }

  async saveSrs(cardId: number, kutu: number, sonrakiTarih: string): Promise<void> {
    if (!this.db) throw new Error('DB hazır değil');
    // UPSERT: yeni kartta (srs satırı yoksa) oluştur, varsa güncelle.
    await this.db.runAsync(
      `INSERT INTO srs (card_id, kutu, sonraki_tarih) VALUES (?, ?, ?)
       ON CONFLICT(card_id) DO UPDATE SET kutu = excluded.kutu, sonraki_tarih = excluded.sonraki_tarih`,
      cardId,
      kutu,
      sonrakiTarih,
    );
  }
}

const backend: Backend = new SqliteBackend();

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

/** Tüm kanunları kart sayısıyla döndürür (Mevzuat listesi). */
export async function getLaws(): Promise<LawWithCount[]> {
  await initDatabase();
  return backend.getLaws();
}

/** Bir kanunun TÜM kartlarını (due filtresiz) SRS durumuyla döndürür (kanun çalışma modu). */
export async function getCardsByLaw(lawId: number): Promise<QueueCard[]> {
  await initDatabase();
  return backend.getCardsByLaw(lawId);
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
