/** Veritabanı tipleri ve şema tanımı. */

export type Blok = 'müşterek' | 'branş';

export interface Law {
  id: number;
  blok: Blok;
  ad: string;
}

/** Kanun + içindeki kart sayısı (Mevzuat listesi için). */
export interface LawWithCount extends Law {
  kartSayisi: number;
}

/** JSPS branşı (Jandarma, MEBS, …). */
export interface Branch {
  id: number;
  slug: string;
  ad: string;
  sira: number;
}

/** Kanun ↔ branş çoğa-çok eşlemesi. müşterek kanunlar burada YER ALMAZ. */
export interface LawBranch {
  law_id: number;
  branch_id: number;
}

/**
 * Patika "bölümü" (Duolingo bloğu). Bir kanun → sıralı bölümler.
 * NOT: laws.blok (müşterek/branş) ile KARIŞTIRMA — bu ayrı kavram ("bolum").
 */
export interface Bolum {
  id: number;
  law_id: number;
  ad: string;
  sira: number;
}

/** Bölüm ↔ kart eşlemesi (bölüm içi sıra). */
export interface BolumKart {
  bolum_id: number;
  card_id: number;
  sira: number;
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

/**
 * Performans logu kaynağı:
 *  - 'calisma' → Karargah/kart akışı çalışması ('biliyorum'|'tekrar'|'zor')
 *  - 'quiz'    → Talim (kanun bazlı sınav) ('dogru'|'yanlis')
 *  - 'genel'   → Tatbikat (genel deneme) ('dogru'|'yanlis')
 * NOT: DB'de `kaynak` serbest TEXT sütunu (enum değil) → yeni değer şema göçü GEREKTİRMEZ.
 * Zayıf mevzi etiketi bu kaynağa bakar: talim = calisma|quiz, tatbikat = genel.
 */
export type PerformansKaynak = 'calisma' | 'quiz' | 'genel';

/**
 * Tek bir cevabın performans logu satırı (akıllı öğrenme — Katman 1).
 * sonuc kaynağa göre HAM tutulur: çalışma 'biliyorum'|'tekrar'|'zor', quiz/genel 'dogru'|'yanlis'.
 * SRS'ten AYRI katman; "geri besleme havuzu" Katman 2'de okuma filtresiyle türetilir.
 */
export interface PerformansSatir {
  card_id: number;
  kaynak: PerformansKaynak;
  sonuc: string;
  tarih: string;
}

/** Kart + ait olduğu kanun (SRS'siz ham birleşim — kuyruk girdisi). */
export interface CardWithLaw extends Card {
  blok: Blok;
  law_ad: string;
}

/** Kart + ait olduğu kanun + SRS durumu birleşik görünüm. */
export interface CardWithSrs extends CardWithLaw {
  kutu: number;
  sonraki_tarih: string;
}

/** Sicil defteri kaydı türü. */
export type SicilTip = 'odul' | 'ceza';
/** Ceza kademeleri (geri-bes devamsızlık merdiveni). */
export type CezaDerece = 'yazili_ikaz' | 'uyari' | 'kinama' | 'ayliktan_kesme';
/** Ödül kademeleri (başarı merdiveni). */
export type OdulDerece = 'takdir' | 'basari' | 'ustun_basari';
export type SicilDerece = CezaDerece | OdulDerece;

/** Sicil defteri kaydı (ödül veya ceza); temsili resmi yazı `metin`'de. */
export interface SicilKaydi {
  id: number;
  tip: SicilTip;
  derece: SicilDerece;
  baslik: string;
  metin: string;
  sebep: string;
  /** Tekilleştirme anahtarı (örn. 'takdir:1'); ceza kayıtlarında null. */
  anahtar: string | null;
  tarih: string;
}

/** Bir deneme sınavı (Tatbikat) sonucu — kalıcı skor geçmişi. */
export interface SinavSonuc {
  id: number;
  law_id: number;
  /** Kanunun kaçıncı testi (0 tabanlı). Testlere bölme öncesi kayıtlar 0. */
  test: number;
  dogru: number;
  toplam: number;
  /** YYYY-MM-DD. */
  tarih: string;
}

/** Geri besleme eğitim emri durumu (tek satır, id=1). */
export interface GeriBesDurum {
  acik: boolean;
  acilis: string | null;
  sonTarih: string | null;
  /** 0 = temiz sicil; 1..4 = en son verilen ceza kademesi. */
  kademe: number;
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

CREATE TABLE IF NOT EXISTS branches (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  ad TEXT NOT NULL,
  sira INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS law_branches (
  law_id INTEGER NOT NULL,
  branch_id INTEGER NOT NULL,
  PRIMARY KEY (law_id, branch_id)
);

CREATE TABLE IF NOT EXISTS study_days (
  gun TEXT PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS kart_performans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id INTEGER NOT NULL,
  kaynak TEXT NOT NULL,
  sonuc TEXT NOT NULL,
  tarih TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS bolumler (
  id INTEGER PRIMARY KEY,
  law_id INTEGER NOT NULL,
  ad TEXT NOT NULL,
  sira INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS bolum_kartlari (
  bolum_id INTEGER NOT NULL,
  card_id INTEGER NOT NULL,
  sira INTEGER NOT NULL,
  PRIMARY KEY (bolum_id, card_id)
);

CREATE TABLE IF NOT EXISTS sicil_kayitlari (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tip TEXT NOT NULL,
  derece TEXT NOT NULL,
  baslik TEXT NOT NULL,
  metin TEXT NOT NULL,
  sebep TEXT NOT NULL,
  anahtar TEXT,
  tarih TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS geri_bes_durum (
  id INTEGER PRIMARY KEY,
  acik INTEGER NOT NULL,
  acilis TEXT,
  son_tarih TEXT,
  kademe INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sinav_sonuclari (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  law_id INTEGER NOT NULL,
  test INTEGER NOT NULL DEFAULT 0,
  dogru INTEGER NOT NULL,
  toplam INTEGER NOT NULL,
  tarih TEXT NOT NULL
);
`;

/** Bu turun şema sürümü (PRAGMA user_version). Şema/referans veri değişince artırılır. */
export const SCHEMA_VERSION = 29;
