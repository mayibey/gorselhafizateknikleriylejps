/**
 * Saf deneme sınavı (Tatbikat) mantığı — platform-bağımsız, DB/IO YOK.
 * Küratörlü SORULAR.json'lardan üretilen `KART_SORULARI` registry'sini (law_id → sorular)
 * okur; soru sırasını karıştırır ve puanlar. SRS'e DOKUNMAZ (sınav salt ölçümdür).
 *
 * NOT: Şık SIRASI karıştırılmaz — bazı açıklamalar "(C) şıkkı..." gibi harfe atıf yapar;
 * şıklar registry'de zaten "A) " önekinden ayıklanmış, doğru cevap index ile tutulur.
 */

import { type KartSoru } from '../assets/kart-sorulari';
import { type GenelDeneme } from '../assets/genel-denemeler';
import { KART_SORU_SAYILARI } from '../assets/kart-soru-sayilari';
import { birlesikUyeler } from '@/lib/birlesik';

export type { KartSoru } from '../assets/kart-sorulari';
export type { GenelDeneme, GenelSoru } from '../assets/genel-denemeler';

// PERF (denetim #5): soru bankası (KART_SORULARI ~5MB) + genel denemeler BOOT'ta YÜKLENMESİN.
// Metadata (sinavVarMi/sinavSoruSayisi/testSayisi) küçük KART_SORU_SAYILARI manifestinden gelir;
// yalnız soru DÖNDÜREN fonksiyonlar çağrılınca lazy require ile banka yüklenir (Metro senkron require).
let _bank: Record<number, KartSoru[]> | null = null;
function bank(): Record<number, KartSoru[]> {
  return (_bank ??= (
    require('../assets/kart-sorulari') as { KART_SORULARI: Record<number, KartSoru[]> }
  ).KART_SORULARI);
}
let _genelM: GenelDeneme[] | null = null;
let _genelB: GenelDeneme[] | null = null;
/** Genel deneme kaynağı (lazy; blok'a göre): müşterek (3) veya branş (5). */
function genelKaynak(blok?: 'brans'): GenelDeneme[] {
  if (blok === 'brans')
    return (_genelB ??= (
      require('../assets/genel-denemeler-brans') as { GENEL_DENEMELER_BRANS: GenelDeneme[] }
    ).GENEL_DENEMELER_BRANS);
  return (_genelM ??= (
    require('../assets/genel-denemeler') as { GENEL_DENEMELER: GenelDeneme[] }
  ).GENEL_DENEMELER);
}

/** Bir sınav cevabı: hangi soru, hangi şık seçildi. */
export type SinavCevap = { soruIndex: number; secilenIndex: number };

/** Bir kanunun deneme sınavı var mı (en az 1 soru)? (sayı manifestinden — banka yüklenmez.) */
export function sinavVarMi(lawId: number): boolean {
  return (KART_SORU_SAYILARI[lawId] ?? 0) > 0;
}

/** Bir kanunun deneme sınavı soru sayısı (yoksa 0). (sayı manifestinden — banka yüklenmez.) */
export function sinavSoruSayisi(lawId: number): number {
  return KART_SORU_SAYILARI[lawId] ?? 0;
}

/** Fisher-Yates karıştırma (enjekte RNG ile). Girdiyi mutasyona uğratmaz. */
function karistir<T>(dizi: readonly T[], rastgele: () => number): T[] {
  const a = [...dizi];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rastgele() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Bir kanunun sınav sorularını (soru sırası karıştırılmış) döndürür.
 * `rastgele` enjekte edilebilir → saf/test edilebilir (default Math.random).
 * Kanunun sorusu yoksa boş dizi.
 */
export function getSinavSorulari(lawId: number, rastgele: () => number = Math.random): KartSoru[] {
  const sorular = bank()[lawId];
  if (!sorular || sorular.length === 0) return [];
  return karistir(sorular, rastgele);
}

// --- GENEL DENEMELER (Tatbikat) — karma, çok-kanun; "Genel Deneme 1/2/3" ---

/** Kaç genel deneme var (Tatbikat listesi). blok='brans' → branş denemeleri. */
export function genelDenemeSayisi(blok?: 'brans'): number {
  return genelKaynak(blok).length;
}

/** Genel deneme meta bilgisi (no/başlık/soru sayısı). blok='brans' → branş denemeleri. */
export function genelDenemeler(blok?: 'brans'): { no: number; baslik: string; soruSayisi: number }[] {
  return genelKaynak(blok).map((d) => ({ no: d.no, baslik: d.baslik, soruSayisi: d.sorular.length }));
}

/** Bir genel denemenin sorularını (karışık) döndürür. GenelSoru KartSoru-uyumlu (+ kartId). */
export function getGenelDenemeSorulari(
  no: number,
  blok?: 'brans',
  rastgele: () => number = Math.random,
): KartSoru[] {
  const d = genelKaynak(blok).find((x) => x.no === no);
  if (!d || d.sorular.length === 0) return [];
  return karistir(d.sorular, rastgele);
}

/** Genel denemede kaç soru var (yoksa 0). blok='brans' → branş denemeleri. */
export function genelDenemeSoruSayisi(no: number, blok?: 'brans'): number {
  return genelKaynak(blok).find((x) => x.no === no)?.sorular.length ?? 0;
}

// --- Testlere bölme (uzun kanunlarda tek seferde 50 soru yorucu → ~20'şerlik Test 1/2/3…) ---

/** Bir testin hedef soru sayısı. */
export const TEST_BOYUT = 20;
// Son parça bundan azsa bir öncekine eklenir (tek/çok küçük soruluk test olmasın; 41 → 20+21).
const MIN_ARTIK = 8;

/**
 * Bir kanunun soru havuzunu STABİL dilimlere böler → [ [başlangıç, bitiş), … ] (registry sırası).
 * Dilim KÜMESİ sabittir (Test 2 hep aynı sorular) → puan/devam test bazında anlamlı.
 */
function testSinirlari(toplam: number): [number, number][] {
  if (toplam <= 0) return [];
  const out: [number, number][] = [];
  let i = 0;
  while (i < toplam) {
    let son = Math.min(i + TEST_BOYUT, toplam);
    if (toplam - son > 0 && toplam - son < MIN_ARTIK) son = toplam; // küçük artığı bu teste kat
    out.push([i, son]);
    i = son;
  }
  return out;
}

/** Bir kanunun test sayısı (0 = sınav yok). */
export function testSayisi(lawId: number): number {
  return testSinirlari(sinavSoruSayisi(lawId)).length;
}

/** Bir testin soru sayısı (geçersiz test index → 0). */
export function testSoruSayisi(lawId: number, testIndex: number): number {
  const s = testSinirlari(sinavSoruSayisi(lawId))[testIndex];
  return s ? s[1] - s[0] : 0;
}

/**
 * Bir testin (sabit dilim) sorularını döndürür — dilim İÇİNDE karıştırılmış. Küme sabit
 * (Test N hep aynı sorular), sıra her denemede değişir (devam için sıra ayrıca saklanır).
 */
export function getTestSorulari(
  lawId: number,
  testIndex: number,
  rastgele: () => number = Math.random,
): KartSoru[] {
  const sorular = bank()[lawId];
  if (!sorular || sorular.length === 0) return [];
  const s = testSinirlari(sorular.length)[testIndex];
  if (!s) return [];
  return karistir(sorular.slice(s[0], s[1]), rastgele);
}

/**
 * Bir soru kaynağından ("5237 m.1/1", "5237 m.21-22", "5237 m.247-250-252") madde
 * numaralarını çıkarır. Yalnız "m." sonrası madde no(lar)ı alınır; alt-fıkra (/2) ve
 * fıkra-aralığı (-3) yok sayılır; "-" ile ayrılan madde no'ları DISKRET listedir
 * (kaynak verisi "247-250-252" gibi maddeleri tek tek sayar). Birden çok "m." atfı
 * (örn. "m.21/2, m.36") da toplanır. Madde no yoksa (Ek/Geçici madde atfı) boş dizi.
 */
export function kaynakMaddeNolari(kaynak: string): number[] {
  const out = new Set<number>();
  const re = /m\.\s*(\d+(?:-\d+)*)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(kaynak)) !== null) {
    for (const parca of m[1].split('-')) {
      const n = parseInt(parca, 10);
      if (!Number.isNaN(n)) out.add(n);
    }
  }
  return [...out];
}

/** Zayıf havuz eşleştirmesi için karttan gereken minimum alanlar. */
export type EslesmeKart = { id: number; madde_no: string; gorsel_yolu: string | null };

/**
 * Verilen soru kaynağıyla eşleşen kart id'lerini bulur (saf).
 * Bir kart eşleşir = kaynaktaki madde no'larından en az biri kartın maddesidir.
 * Kart maddeleri: madde_no'daki "m.<no>" + (birleşik/ayırt-özet kartlarda) gorsel
 * anahtarından TÜM üye madde no'ları → ör. m.21-22 ayırt kartı, "m.22" sorusuyla da eşleşir.
 * Eşleşme yoksa boş dizi (çağıran sessiz geçer).
 */
export function eslesenKartIdleri(kaynak: string, kartlar: readonly EslesmeKart[]): number[] {
  const hedef = new Set(kaynakMaddeNolari(kaynak));
  if (hedef.size === 0) return [];
  const ids: number[] = [];
  for (const k of kartlar) {
    const kartNolari = new Set<number>();
    const mm = k.madde_no.match(/m\.\s*(\d+)/i);
    if (mm) kartNolari.add(parseInt(mm[1], 10));
    const uyeler = birlesikUyeler(k.gorsel_yolu);
    if (uyeler) for (const u of uyeler) kartNolari.add(u);
    for (const n of kartNolari) {
      if (hedef.has(n)) {
        ids.push(k.id);
        break;
      }
    }
  }
  return ids;
}

/** Bir kartın kapsadığı madde no'ları (kendi madde_no + birleşik/ayırt-özet üyeleri). */
function kartMaddeNolari(k: { madde_no: string; gorsel_yolu: string | null }): Set<number> {
  const s = new Set<number>();
  const mm = k.madde_no.match(/m\.\s*(\d+)/i);
  if (mm) s.add(parseInt(mm[1], 10));
  const uyeler = birlesikUyeler(k.gorsel_yolu);
  if (uyeler) for (const u of uyeler) s.add(u);
  return s;
}

/** Teyit-quiz için karttan gereken alanlar (law_id soru registry'sini seçer). */
export type TeyitKart = { id: number; law_id: number; madde_no: string; gorsel_yolu: string | null };

/**
 * ZAYIF HAVUZ TEYİDİ (saf): verilen (çalışılmış zayıf) kartların HER BİRİ için, o kartın
 * maddesine ait BİR soru döndürür → { soru, cardId }. Öz-rapor ("biliyorum") yerine OBJEKTİF
 * teyit: Etüt sonunda kullanıcı bu soruları çözer; doğru → kart havuzdan çıkışa sayılır.
 * Kartın maddesine soru yoksa kart atlanır (yalnız çalışma değeri sayılır — mevcut davranış).
 * Aynı soru iki karta düşmez. `rastgele` enjekte edilebilir (test + çeşitlilik).
 */
export function teyitSorulari(
  kartlar: readonly TeyitKart[],
  rastgele: () => number = Math.random,
): { soru: KartSoru; cardId: number }[] {
  const out: { soru: KartSoru; cardId: number }[] = [];
  const kullanilmis = new Set<string>();
  for (const k of kartlar) {
    const sorular = bank()[k.law_id];
    if (!sorular || sorular.length === 0) continue;
    const kartNo = kartMaddeNolari(k);
    if (kartNo.size === 0) continue;
    const adaylar = sorular.filter(
      (s) => !kullanilmis.has(s.id) && kaynakMaddeNolari(s.kaynak).some((n) => kartNo.has(n)),
    );
    if (adaylar.length === 0) continue;
    const secili = adaylar[Math.floor(rastgele() * adaylar.length)];
    kullanilmis.add(secili.id);
    out.push({ soru: secili, cardId: k.id });
  }
  return out;
}

/** Verilen cevapları puanlar (saf). */
/** Her doğru cevabın puanı (deneme puanı — 50 soruluk genel deneme = 100 puan). */
export const PUAN_KATSAYI = 2;

export function puanlaSinav(
  cevaplar: SinavCevap[],
  sorular: KartSoru[],
): { dogru: number; toplam: number; yuzde: number; puan: number; toplamPuan: number } {
  const toplam = sorular.length;
  let dogru = 0;
  for (const c of cevaplar) {
    const soru = sorular[c.soruIndex];
    if (soru && c.secilenIndex === soru.dogru) dogru++;
  }
  const yuzde = toplam > 0 ? Math.round((dogru / toplam) * 100) : 0;
  return { dogru, toplam, yuzde, puan: dogru * PUAN_KATSAYI, toplamPuan: toplam * PUAN_KATSAYI };
}
