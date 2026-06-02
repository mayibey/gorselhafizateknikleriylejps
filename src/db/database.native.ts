/**
 * Veri katmanı — NATIVE (iOS/Android): expo-sqlite.
 * expo-sqlite import'u SADECE bu dosyada bulunur; Metro web build'inde
 * `database.web.ts` seçildiği için bu dosya web grafiğine hiç girmez.
 */

import { CREATE_SQL, type CardWithSrs } from '@/db/schema';
import { SEED_CARDS, SEED_LAWS } from '@/db/seed';
import type { Backend, RecordReviewResult } from '@/db/types';
import { srsGuncelle, type SrsCevap } from '@/lib/srs';

/** expo-sqlite arka ucu. */
class SqliteBackend implements Backend {
  private db: Awaited<ReturnType<typeof import('expo-sqlite').openDatabaseAsync>> | null = null;

  async init(): Promise<void> {
    const SQLite = await import('expo-sqlite');
    this.db = await SQLite.openDatabaseAsync('jsps.db');
    await this.db.execAsync(CREATE_SQL);

    const row = await this.db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM cards');
    if ((row?.n ?? 0) > 0) return;

    const bugun = new Date().toISOString().slice(0, 10);
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
      await this.db.runAsync(
        'INSERT INTO srs (card_id, kutu, sonraki_tarih) VALUES (?, 1, ?)',
        card.id,
        bugun,
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

  async saveSrs(cardId: number, kutu: number, sonrakiTarih: string): Promise<void> {
    if (!this.db) throw new Error('DB hazır değil');
    await this.db.runAsync(
      'UPDATE srs SET kutu = ?, sonraki_tarih = ? WHERE card_id = ?',
      kutu,
      sonrakiTarih,
      cardId,
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
