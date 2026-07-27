/**
 * Veri katmanı — WEB: bellek-içi (in-memory).
 * expo-sqlite'a HİÇBİR import yok (ne statik ne dinamik); böylece web bundle'ı
 * wa-sqlite.wasm / worker grafiğine hiç girmez.
 */

import {
  type Bolum,
  type Branch,
  type CardWithLaw,
  type CardWithSrs,
  type GeriBesDurum,
  type LawWithCount,
  type PerformansKaynak,
  type PerformansSatir,
  type SicilKaydi,
  type SinavSonuc,
} from '@/db/schema';
import {
  SEED_BOLUM_KARTLARI,
  SEED_BOLUMLER,
  SEED_BRANCHES,
  SEED_CARDS,
  SEED_LAW_BRANCHES,
  SEED_LAWS,
} from '@/db/seed';
import type { Backend, IlerlemeSnapshot, RecordReviewResult } from '@/db/types';
import { kanunKuyrugu } from '@/lib/kanun-kartlari';
import { zayifKartlar } from '@/lib/performans';
import { gunlukKuyruk, type QueueCard, type SrsDurum } from '@/lib/queue';
import { bugunISO, srsGuncelle, type SrsCevap } from '@/lib/srs';

/** Bellek-içi arka uç. */
class MemoryBackend implements Backend {
  // srs kaydı OLMAYAN kart = yeni kart. Başlangıçta boş (tohumlanmaz).
  private srs = new Map<number, SrsDurum>();
  // Çalışılan günler (streak). Bellek-içi → her yenilemede sıfırlanır (web kısıtı, native kalıcı).
  private studyDays = new Set<string>();
  // Performans logu (akıllı öğrenme). Bellek-içi → yenilemede sıfırlanır (native kalıcı).
  private performans: PerformansSatir[] = [];
  // Sicil (ödül/ceza) + geri-bes durumu. Bellek-içi → yenilemede sıfırlanır (native kalıcı).
  private sicil: SicilKaydi[] = [];
  private sicilSayac = 0;
  private geriBes: GeriBesDurum = { acik: false, acilis: null, sonTarih: null, kademe: 0 };
  // Deneme sınavı sonuçları. Bellek-içi → yenilemede sıfırlanır (native kalıcı).
  private sinavSonuclari: SinavSonuc[] = [];
  private sinavSayac = 0;

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

  async getAllCards(): Promise<CardWithLaw[]> {
    return this.cardsWithLaw();
  }

  async getCardCount(): Promise<number> {
    return SEED_CARDS.length;
  }

  // Etüt = SADECE TEKRAR (due). Yeni kart yok (Mevzuat→patikada öğrenilir) → yeniLimit=0.
  async getDailyQueue(): Promise<QueueCard[]> {
    return gunlukKuyruk(this.cardsWithLaw(), this.srs, bugunISO(), 0);
  }

  async getBranches(): Promise<Branch[]> {
    return [...SEED_BRANCHES].sort((a, b) => a.sira - b.sira);
  }

  async getLaws(bransSlug: string): Promise<LawWithCount[]> {
    // müşterek (herkese) + seçili branşın kanunları.
    const brans = SEED_BRANCHES.find((b) => b.slug === bransSlug);
    const bransLawIds = new Set(
      SEED_LAW_BRANCHES.filter((lb) => lb.branch_id === brans?.id).map((lb) => lb.law_id),
    );
    return SEED_LAWS.filter((law) => law.blok === 'müşterek' || bransLawIds.has(law.id)).map(
      (law) => ({
        ...law,
        kartSayisi: SEED_CARDS.filter((c) => c.law_id === law.id).length,
      }),
    );
  }

  async getCardsByLaw(lawId: number): Promise<QueueCard[]> {
    // Özet kartları kullanıcıdan GİZLİ (native SQL filtresiyle BİREBİR aynı): gorsel_yolu'nda
    // '_ozet_' geçenler elenir. '_ayirt_' kartları '_ozet_' içermez → ETKİLENMEZ.
    const cards = this.cardsWithLaw().filter(
      (c) => c.law_id === lawId && !c.gorsel_yolu?.includes('_ozet_'),
    );
    return kanunKuyrugu(cards, this.srs);
  }

  async getBolumler(lawId: number): Promise<Bolum[]> {
    return SEED_BOLUMLER.filter((b) => b.law_id === lawId).sort((a, b) => a.sira - b.sira);
  }

  async getCardsByBolum(bolumId: number): Promise<QueueCard[]> {
    const haritaWithLaw = new Map(this.cardsWithLaw().map((c) => [c.id, c]));
    return SEED_BOLUM_KARTLARI.filter((bk) => bk.bolum_id === bolumId)
      .sort((a, b) => a.sira - b.sira)
      .map((bk) => haritaWithLaw.get(bk.card_id))
      .filter((c): c is CardWithLaw => c !== undefined)
      .map((card) => {
        const s = this.srs.get(card.id);
        return s
          ? { ...card, kutu: s.kutu, sonraki_tarih: s.sonraki_tarih, yeni: false }
          : { ...card, kutu: 0, sonraki_tarih: '', yeni: true };
      });
  }

  async getBolumKartIds(): Promise<number[]> {
    return [...new Set(SEED_BOLUM_KARTLARI.map((bk) => bk.card_id))];
  }

  async getCardsByBolumChain(bolumId: number): Promise<QueueCard[]> {
    const bas = SEED_BOLUMLER.find((b) => b.id === bolumId);
    if (!bas) return [];
    const bolumlar = SEED_BOLUMLER.filter(
      (b) => b.law_id === bas.law_id && b.sira >= bas.sira,
    ).sort((a, b) => a.sira - b.sira);
    const harita = new Map(this.cardsWithLaw().map((c) => [c.id, c]));
    const out: QueueCard[] = [];
    for (const b of bolumlar) {
      const kartlar = SEED_BOLUM_KARTLARI.filter((bk) => bk.bolum_id === b.id).sort(
        (x, y) => x.sira - y.sira,
      );
      for (const bk of kartlar) {
        const card = harita.get(bk.card_id);
        if (!card) continue;
        const s = this.srs.get(card.id);
        out.push(
          s
            ? { ...card, kutu: s.kutu, sonraki_tarih: s.sonraki_tarih, yeni: false }
            : { ...card, kutu: 0, sonraki_tarih: '', yeni: true },
        );
      }
    }
    return out;
  }

  async saveSrs(cardId: number, kutu: number, sonrakiTarih: string): Promise<void> {
    // Map.set zaten upsert: yeni kartta oluşturur, varsa günceller.
    this.srs.set(cardId, { kutu, sonraki_tarih: sonrakiTarih });
  }

  async markStudyDay(gun: string): Promise<void> {
    // Set.add zaten gün-tekil.
    this.studyDays.add(gun);
  }

  async getStudyDays(): Promise<string[]> {
    return [...this.studyDays];
  }

  async kaydetPerformans(cardId: number, kaynak: PerformansKaynak, sonuc: string): Promise<void> {
    this.performans.push({ card_id: cardId, kaynak, sonuc, tarih: bugunISO() });
  }

  async getPerformans(): Promise<PerformansSatir[]> {
    return [...this.performans];
  }

  async getZayifKuyruk(): Promise<QueueCard[]> {
    const zayif = zayifKartlar(this.performans, this.cardsWithLaw());
    return zayif.map(({ card }) => {
      const s = this.srs.get(card.id);
      return s
        ? { ...card, kutu: s.kutu, sonraki_tarih: s.sonraki_tarih, yeni: false }
        : { ...card, kutu: 0, sonraki_tarih: '', yeni: true };
    });
  }

  async getSicilKayitlari(): Promise<SicilKaydi[]> {
    return [...this.sicil].reverse(); // en yeni önce (native ORDER BY id DESC ile parite)
  }

  async ekleSicilKaydi(k: Omit<SicilKaydi, 'id'>): Promise<void> {
    this.sicil.push({ ...k, id: ++this.sicilSayac });
  }

  async getGeriBesDurum(): Promise<GeriBesDurum> {
    return { ...this.geriBes };
  }

  async setGeriBesDurum(d: GeriBesDurum): Promise<void> {
    this.geriBes = { ...d };
  }

  async sicilSifirla(): Promise<void> {
    this.sicil = [];
    this.sicilSayac = 0;
    this.geriBes = { acik: false, acilis: null, sonTarih: null, kademe: 0 };
  }

  async ekleSinavSonucu(
    lawId: number,
    test: number,
    dogru: number,
    toplam: number,
    tarih: string,
  ): Promise<void> {
    this.sinavSonuclari.push({ id: ++this.sinavSayac, law_id: lawId, test, dogru, toplam, tarih });
  }

  async getSinavSonuclari(): Promise<SinavSonuc[]> {
    return [...this.sinavSonuclari]; // ekleme sırasıyla (native ORDER BY id ile parite)
  }

  async ilerlemeDisaAktar(): Promise<IlerlemeSnapshot> {
    const srs = [...this.srs.entries()].map(([card_id, d]) => ({
      card_id,
      kutu: d.kutu,
      sonraki_tarih: d.sonraki_tarih,
    }));
    return {
      surum: 1,
      srs,
      studyDays: [...this.studyDays],
      performans: [...this.performans],
      sicil: this.sicil.map(({ id, ...r }) => r),
      geriBes: { ...this.geriBes },
      sinavlar: this.sinavSonuclari.map(({ id, ...r }) => r),
    };
  }

  async ilerlemeIceAktar(snapshot: IlerlemeSnapshot, tamYukle: boolean): Promise<void> {
    // SRS — kutu ASLA geri gitmez: yalnız gelen kutu >= mevcut ise üzerine yaz.
    for (const s of snapshot.srs) {
      const mevcut = this.srs.get(s.card_id);
      if (!mevcut || s.kutu >= mevcut.kutu) {
        this.srs.set(s.card_id, { kutu: s.kutu, sonraki_tarih: s.sonraki_tarih });
      }
    }
    for (const g of snapshot.studyDays) this.studyDays.add(g);
    if (tamYukle) {
      for (const p of snapshot.performans) this.performans.push({ ...p });
      for (const k of snapshot.sicil) this.sicil.push({ ...k, id: ++this.sicilSayac });
      this.geriBes = { ...snapshot.geriBes };
      for (const s of snapshot.sinavlar) {
        // Eski snapshot'larda test alanı olmayabilir → 0'a düş.
        this.sinavSonuclari.push({ ...s, test: s.test ?? 0, id: ++this.sinavSayac });
      }
    }
  }

  async ilerlemeSifirla(): Promise<void> {
    // YALNIZ kullanıcı ilerlemesi — referans veri (laws/cards/branches) korunur (native parite).
    this.srs.clear();
    this.studyDays.clear();
    this.performans = [];
    this.sicil = [];
    this.sicilSayac = 0;
    this.geriBes = { acik: false, acilis: null, sonTarih: null, kademe: 0 };
    this.sinavSonuclari = [];
    this.sinavSayac = 0;
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

/** Tüm kartları kanun bilgisiyle döndürür (performans analizi için metadata). */
export async function getAllCards(): Promise<CardWithLaw[]> {
  await initDatabase();
  return backend.getAllCards();
}

/** Toplam kart sayısı (istatistik paydası). */
export async function getCardCount(): Promise<number> {
  await initDatabase();
  return backend.getCardCount();
}

/** Etüt kuyruğu: yalnız vakti gelmiş TEKRARLAR (due). Yeni kart yok (Mevzuat→patikada öğrenilir). */
export async function getDailyQueue(): Promise<QueueCard[]> {
  await initDatabase();
  return backend.getDailyQueue();
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

/** Bir kanunun patika bölümleri (sıralı; bölümü yoksa boş dizi). */
export async function getBolumler(lawId: number): Promise<Bolum[]> {
  await initDatabase();
  return backend.getBolumler(lawId);
}

/** Bir bölümün kartları, bölüm-içi sıraya göre (akış için). */
export async function getCardsByBolum(bolumId: number): Promise<QueueCard[]> {
  await initDatabase();
  return backend.getCardsByBolum(bolumId);
}

export async function getCardsByBolumChain(bolumId: number): Promise<QueueCard[]> {
  await initDatabase();
  return backend.getCardsByBolumChain(bolumId);
}

/** Patikada çalışılabilir (bölüme bağlı) TÜM kart id'leri — ilerleme paydası (genel-özet hariç). */
export async function getBolumKartIds(): Promise<number[]> {
  await initDatabase();
  return backend.getBolumKartIds();
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
  await backend.markStudyDay(bugunISO());
  // Akıllı öğrenme: çalışma cevabını performans loguna ekle (SRS'ten ayrı katman).
  await backend.kaydetPerformans(cardId, 'calisma', cevap);
  return next;
}

/** Çalışılmış günleri (YYYY-MM-DD) ham liste döndürür; streak lib/stats.ts'te hesaplanır. */
export async function getStudyDays(): Promise<string[]> {
  await initDatabase();
  return backend.getStudyDays();
}

/** Bir cevabı performans loguna ekler (akıllı öğrenme — Katman 1). */
export async function kaydetPerformans(
  cardId: number,
  kaynak: PerformansKaynak,
  sonuc: string,
): Promise<void> {
  await initDatabase();
  return backend.kaydetPerformans(cardId, kaynak, sonuc);
}

/** Ham performans loglarını (ekleme sırasıyla) döndürür; analiz Katman 2'de. */
export async function getPerformans(): Promise<PerformansSatir[]> {
  await initDatabase();
  return backend.getPerformans();
}

export async function getZayifKuyruk(): Promise<QueueCard[]> {
  await initDatabase();
  return backend.getZayifKuyruk();
}

export async function getSicilKayitlari(): Promise<SicilKaydi[]> {
  await initDatabase();
  return backend.getSicilKayitlari();
}

export async function ekleSicilKaydi(kayit: Omit<SicilKaydi, 'id'>): Promise<void> {
  await initDatabase();
  return backend.ekleSicilKaydi(kayit);
}

export async function getGeriBesDurum(): Promise<GeriBesDurum> {
  await initDatabase();
  return backend.getGeriBesDurum();
}

export async function setGeriBesDurum(durum: GeriBesDurum): Promise<void> {
  await initDatabase();
  return backend.setGeriBesDurum(durum);
}

export async function sicilSifirla(): Promise<void> {
  await initDatabase();
  return backend.sicilSifirla();
}

/** Bir deneme sınavı sonucunu kalıcı kaydeder (Tatbikat skor geçmişi). */
export async function ekleSinavSonucu(
  lawId: number,
  test: number,
  dogru: number,
  toplam: number,
  tarih: string,
): Promise<void> {
  await initDatabase();
  return backend.ekleSinavSonucu(lawId, test, dogru, toplam, tarih);
}

/** Tüm deneme sınavı sonuçlarını (eskiden yeniye) döndürür. */
export async function getSinavSonuclari(): Promise<SinavSonuc[]> {
  await initDatabase();
  return backend.getSinavSonuclari();
}

export async function ilerlemeDisaAktar(): Promise<IlerlemeSnapshot> {
  await initDatabase();
  return backend.ilerlemeDisaAktar();
}

export async function ilerlemeIceAktar(snapshot: IlerlemeSnapshot, tamYukle: boolean): Promise<void> {
  await initDatabase();
  return backend.ilerlemeIceAktar(snapshot, tamYukle);
}

/** TÜM kullanıcı ilerlemesini siler — YALNIZ hesap değişiminde (bkz. lib/senkron). */
export async function ilerlemeSifirla(): Promise<void> {
  await initDatabase();
  return backend.ilerlemeSifirla();
}
