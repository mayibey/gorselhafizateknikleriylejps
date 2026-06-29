/**
 * Veri katmanının platform-bağımsız ortak tipleri.
 * Buraya expo-sqlite gibi platforma özel HİÇBİR bağ girmez.
 */

import type { Bolum, Branch, CardWithLaw, CardWithSrs, GeriBesDurum, LawWithCount, PerformansKaynak, PerformansSatir, SicilKaydi, SinavSonuc } from '@/db/schema';
import type { QueueCard } from '@/lib/queue';
import type { SrsCevap } from '@/lib/srs';

export type { Blok, Bolum, BolumKart, Branch, Card, CardWithLaw, CardWithSrs, CezaDerece, GeriBesDurum, Law, LawBranch, LawWithCount, OdulDerece, PerformansKaynak, PerformansSatir, SicilDerece, SicilKaydi, SicilTip, SinavSonuc, Srs } from '@/db/schema';
export type { QueueCard, SrsDurum } from '@/lib/queue';

/** Bulut senkron için kullanıcı ilerleme anlık görüntüsü (JSON). Referans veri (laws/cards) DAHİL DEĞİL. */
export type IlerlemeSnapshot = {
  surum: 1;
  srs: { card_id: number; kutu: number; sonraki_tarih: string }[];
  studyDays: string[];
  performans: PerformansSatir[];
  sicil: Omit<SicilKaydi, 'id'>[];
  geriBes: GeriBesDurum;
  sinavlar: Omit<SinavSonuc, 'id'>[];
};

/** Hem native (SQLite) hem web (bellek-içi) arka uçlarının uyduğu sözleşme. */
export interface Backend {
  init(): Promise<void>;
  getStudyCards(): Promise<CardWithSrs[]>;
  /** Tüm kartlar + kanun bilgisi (srs JOIN'siz; performans analizi için metadata). */
  getAllCards(): Promise<CardWithLaw[]>;
  getCardCount(): Promise<number>;
  getDailyQueue(): Promise<QueueCard[]>;
  getBranches(): Promise<Branch[]>;
  getLaws(bransSlug: string): Promise<LawWithCount[]>;
  getCardsByLaw(lawId: number): Promise<QueueCard[]>;
  /** Zayıf mevzi kuyruğu (geri-bes oturumu): son denemede zor/yanlış kartlar + SRS. */
  getZayifKuyruk(): Promise<QueueCard[]>;
  /** Bir kanunun patika bölümleri (sıralı). */
  getBolumler(lawId: number): Promise<Bolum[]>;
  /** Bir bölümün kartları (bölüm-içi sıraya göre). */
  getCardsByBolum(bolumId: number): Promise<QueueCard[]>;
  /** Bu bölümden başlayıp kanunun KALAN bölümlerini de sırayla (sürekli patika akışı). */
  getCardsByBolumChain(bolumId: number): Promise<QueueCard[]>;
  /** Bir bölüme bağlı (patikada çalışılabilir) TÜM kart id'leri — ilerleme paydası. */
  getBolumKartIds(): Promise<number[]>;
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
  /** Bir deneme sınavı sonucunu kalıcı kaydeder (id otomatik). */
  ekleSinavSonucu(lawId: number, dogru: number, toplam: number, tarih: string): Promise<void>;
  /** Tüm deneme sınavı sonuçlarını ekleme sırasıyla (eskiden yeniye) döndürür. */
  getSinavSonuclari(): Promise<SinavSonuc[]>;
  /** Kullanıcı ilerlemesini JSON snapshot olarak dışa aktarır (bulut senkron). */
  ilerlemeDisaAktar(): Promise<IlerlemeSnapshot>;
  /** Snapshot'ı yerele birleştirir: SRS max(kutu) (asla geri gitmez); tamYukle=true → log/sicil/sınav da. */
  ilerlemeIceAktar(snapshot: IlerlemeSnapshot, tamYukle: boolean): Promise<void>;
}

/** Public API'nin (initDatabase/getStudyCards/recordReview) ortak tip imzaları. */
export type RecordReviewResult = { kutu: number; sonraki_tarih: string };
export type { SrsCevap };
