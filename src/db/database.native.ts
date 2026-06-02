/**
 * Veri katmanı — NATIVE (iOS/Android): expo-sqlite.
 * expo-sqlite import'u SADECE bu dosyada bulunur; Metro web build'inde
 * `database.web.ts` seçildiği için bu dosya web grafiğine hiç girmez.
 */

import {
  CREATE_SQL,
  type Branch,
  type CardWithLaw,
  type CardWithSrs,
  type LawWithCount,
  type Srs,
} from '@/db/schema';
import { SEED_BRANCHES, SEED_CARDS, SEED_LAW_BRANCHES, SEED_LAWS } from '@/db/seed';
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
    await this.migrate();
  }

  /**
   * PRAGMA user_version tabanlı migration runner.
   * Eksik sürümleri sırayla uygular; her sürüm idempotenttir (yeniden çalışsa
   * da güvenli). Kullanıcı verisi (srs) hiçbir adımda silinmez.
   */
  private async migrate(): Promise<void> {
    const db = this.db!;
    const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    let version = row?.user_version ?? 0;

    if (version < 1) {
      // Tüm tablolar (IF NOT EXISTS) — eski kurulumlarda branches/law_branches da oluşur.
      await db.execAsync(CREATE_SQL);
      await this.seedReference();
      version = 1;
    }
    // Gelecekte: if (version < 2) { ...; version = 2; }

    if (version !== (row?.user_version ?? 0)) {
      await db.execAsync(`PRAGMA user_version = ${version}`);
    }
  }

  /**
   * Referans veriyi (laws, cards, branches, law_branches) IDEMPOTENT yükler
   * (INSERT OR IGNORE). srs'e DOKUNULMAZ → mevcut ilerleme korunur.
   * Eski kurulumlarda kartlar zaten dolu olsa da branş tabloları buradan dolar.
   */
  private async seedReference(): Promise<void> {
    const db = this.db!;
    for (const law of SEED_LAWS) {
      await db.runAsync(
        'INSERT OR IGNORE INTO laws (id, blok, ad) VALUES (?, ?, ?)',
        law.id,
        law.blok,
        law.ad,
      );
    }
    for (const card of SEED_CARDS) {
      await db.runAsync(
        'INSERT OR IGNORE INTO cards (id, law_id, madde_no, baslik, anlatim_metni, gorsel_yolu, ses_yolu) VALUES (?, ?, ?, ?, ?, ?, ?)',
        card.id,
        card.law_id,
        card.madde_no,
        card.baslik,
        card.anlatim_metni,
        card.gorsel_yolu,
        card.ses_yolu,
      );
    }
    for (const b of SEED_BRANCHES) {
      await db.runAsync(
        'INSERT OR IGNORE INTO branches (id, slug, ad, sira) VALUES (?, ?, ?, ?)',
        b.id,
        b.slug,
        b.ad,
        b.sira,
      );
    }
    for (const lb of SEED_LAW_BRANCHES) {
      await db.runAsync(
        'INSERT OR IGNORE INTO law_branches (law_id, branch_id) VALUES (?, ?)',
        lb.law_id,
        lb.branch_id,
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

  async getBranches(): Promise<Branch[]> {
    if (!this.db) throw new Error('DB hazır değil');
    return this.db.getAllAsync<Branch>('SELECT id, slug, ad, sira FROM branches ORDER BY sira');
  }

  async getLaws(bransSlug: string): Promise<LawWithCount[]> {
    if (!this.db) throw new Error('DB hazır değil');
    // müşterek (herkese) + seçili branşın kanunları.
    return this.db.getAllAsync<LawWithCount>(
      `SELECT l.id, l.blok, l.ad, COUNT(c.id) AS kartSayisi
       FROM laws l
       LEFT JOIN cards c ON c.law_id = l.id
       WHERE l.blok = 'müşterek'
          OR l.id IN (
            SELECT lb.law_id FROM law_branches lb
            JOIN branches b ON b.id = lb.branch_id
            WHERE b.slug = ?
          )
       GROUP BY l.id, l.blok, l.ad
       ORDER BY l.id`,
      bransSlug,
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

/** Tüm branşları (sıralı) döndürür (onboarding / branş değiştirme). */
export async function getBranches(): Promise<Branch[]> {
  await initDatabase();
  return backend.getBranches();
}

/** Müşterek + seçili branşın kanunlarını kart sayısıyla döndürür (Mevzuat listesi). */
export async function getLaws(bransSlug: string): Promise<LawWithCount[]> {
  await initDatabase();
  return backend.getLaws(bransSlug);
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
