/**
 * Veri katmanı.
 * - Native (iOS/Android): expo-sqlite.
 * - Web: bellek-içi yedek (web'de ekstra wasm yapılandırması gerekmesin diye).
 * Her iki arka uç da aynı API'yi sunar; SRS kuralları srgüncelle ile tek yerden gelir.
 */

import { Platform } from 'react-native';

import { CREATE_SQL, type CardWithSrs } from '@/db/schema';
import { SEED_CARDS, SEED_LAWS } from '@/db/seed';
import { srsGuncelle, type SrsCevap } from '@/lib/srs';

interface Backend {
  init(): Promise<void>;
  getStudyCards(): Promise<CardWithSrs[]>;
  saveSrs(cardId: number, kutu: number, sonrakiTarih: string): Promise<void>;
}

/** Bellek-içi arka uç (web + yedek). */
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

/** expo-sqlite arka ucu (native). */
class SqliteBackend implements Backend {
  // expo-sqlite tipini gevşek tutuyoruz; sadece native'de yüklenir.
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

const backend: Backend = Platform.OS === 'web' ? new MemoryBackend() : new SqliteBackend();

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
): Promise<{ kutu: number; sonraki_tarih: string }> {
  await initDatabase();
  const next = srsGuncelle(mevcutKutu, cevap);
  await backend.saveSrs(cardId, next.kutu, next.sonraki_tarih);
  return next;
}
