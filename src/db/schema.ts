/** Veritabanı tipleri ve şema tanımı. */

export type Blok = 'müşterek' | 'branş';

export interface Law {
  id: number;
  blok: Blok;
  ad: string;
}

export interface Card {
  id: number;
  law_id: number;
  madde_no: string;
  baslik: string;
  anlatim_metni: string;
  gorsel_yolu: string | null;
  ses_yolu: string | null;
}

export interface Srs {
  card_id: number;
  kutu: number;
  sonraki_tarih: string;
}

/** Kart + ait olduğu kanun + SRS durumu birleşik görünüm. */
export interface CardWithSrs extends Card {
  blok: Blok;
  law_ad: string;
  kutu: number;
  sonraki_tarih: string;
}

export const CREATE_SQL = `
CREATE TABLE IF NOT EXISTS laws (
  id INTEGER PRIMARY KEY,
  blok TEXT NOT NULL,
  ad TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cards (
  id INTEGER PRIMARY KEY,
  law_id INTEGER NOT NULL,
  madde_no TEXT NOT NULL,
  baslik TEXT NOT NULL,
  anlatim_metni TEXT NOT NULL,
  gorsel_yolu TEXT,
  ses_yolu TEXT
);

CREATE TABLE IF NOT EXISTS srs (
  card_id INTEGER PRIMARY KEY,
  kutu INTEGER NOT NULL,
  sonraki_tarih TEXT NOT NULL
);
`;
