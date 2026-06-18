/**
 * Kanun metinlerinde tam-metin arama — SAF mantık (web/native ortak; lib/queue.ts deseni).
 * Veri: getAllCards() (CardWithLaw) + maddeMetni() resmî metin çözücü. DB/şema/migration YOK.
 *
 * İki aşama:
 *  1) araIndeksHazirla(cards, metinAl) → law_id+madde_no bazında TEKİL, küçük-harf önişlemli
 *     kayıt listesi (kartlar yüklenince BİR kez; pahalı kısım burada).
 *  2) araKanunlar(indeks, sorgu) → her tuşta hızlı filtre (sadece indexOf).
 */
import type { Blok, CardWithLaw } from '@/db/schema';

/** Aranabilir tek madde kaydı (aynı maddenin çok kartı → tek kayıt, ilk kart temsilci). */
export interface AraKayit {
  cardId: number; // o maddenin temsili kartı → akış navigasyon hedefi
  lawId: number;
  kanun: string; // law_ad
  blok: Blok;
  maddeNo: string;
  baslik: string;
  metin: string; // resmî tam metin ('' olabilir — metinsiz madde)
  metinK: string; // tr-küçük harf (arama için önceden hesaplı)
  baslikK: string;
  maddeK: string;
}

export interface AramaSonuc {
  cardId: number;
  lawId: number;
  kanun: string;
  blok: Blok;
  maddeNo: string;
  baslik: string;
  snippet: string; // eşleşme civarı bağlam (metin yoksa başlık)
  eslesme: number; // gösterim: toplam geçiş sayısı (metin + başlık)
  skor: number; // sıralama: başlık eşleşmesi ağırlıklı
}

/** Türkçe-duyarlı küçük harf (İ→i, I→ı). Aksi halde arama Türkçe'de yanlış eşleşir. */
export function trKucuk(s: string): string {
  return s.toLocaleLowerCase('tr-TR');
}

/**
 * Kart listesinden aranabilir indeks üretir. metinAl = maddeMetni (resmî metin çözücü).
 * SAF: aynı girdi → aynı çıktı (getAllCards web/native paritesi indekse taşınır).
 */
export function araIndeksHazirla(
  cards: CardWithLaw[],
  metinAl: (maddeNo: string) => string | null,
): AraKayit[] {
  const gorulen = new Set<string>();
  const kayitlar: AraKayit[] = [];
  for (const c of cards) {
    const anahtar = `${c.law_id}|${c.madde_no}`;
    if (gorulen.has(anahtar)) continue;
    gorulen.add(anahtar);
    const metin = metinAl(c.madde_no) ?? '';
    kayitlar.push({
      cardId: c.id,
      lawId: c.law_id,
      kanun: c.law_ad,
      blok: c.blok,
      maddeNo: c.madde_no,
      baslik: c.baslik,
      metin,
      metinK: trKucuk(metin),
      baslikK: trKucuk(c.baslik),
      maddeK: trKucuk(c.madde_no),
    });
  }
  return kayitlar;
}

const MIN_UZUNLUK = 2;

/** İndekste sorguyu arar; eşleşen maddeleri alaka sırasıyla (başlık ağırlıklı) döner. */
export function araKanunlar(indeks: AraKayit[], sorgu: string): AramaSonuc[] {
  const q = trKucuk(sorgu.trim());
  if (q.length < MIN_UZUNLUK) return [];

  const sonuclar: AramaSonuc[] = [];
  for (const k of indeks) {
    const metinAdet = sayGec(k.metinK, q);
    const baslikAdet = sayGec(k.baslikK, q);
    const maddeAdet = k.maddeK.includes(q) ? 1 : 0;
    if (metinAdet + baslikAdet + maddeAdet === 0) continue;
    sonuclar.push({
      cardId: k.cardId,
      lawId: k.lawId,
      kanun: k.kanun,
      blok: k.blok,
      maddeNo: k.maddeNo,
      baslik: k.baslik,
      snippet: snippetUret(k.metin || k.baslik, k.metin ? k.metinK : k.baslikK, q),
      eslesme: metinAdet + baslikAdet,
      // Başlıkta geçiş en güçlü alaka (madde adı), sonra madde no, sonra gövde.
      skor: baslikAdet * 5 + maddeAdet * 3 + metinAdet,
    });
  }
  sonuclar.sort((a, b) => b.skor - a.skor);
  return sonuclar;
}

/** Bir metinde alt-dizginin kaç kez (örtüşmesiz) geçtiğini sayar. */
function sayGec(metin: string, q: string): number {
  let i = 0;
  let n = 0;
  for (;;) {
    const idx = metin.indexOf(q, i);
    if (idx === -1) break;
    n++;
    i = idx + q.length;
  }
  return n;
}

/** İlk eşleşme civarından kısa bağlam çıkarır (… ile kırpılı). */
function snippetUret(metin: string, metinK: string, q: string): string {
  const idx = metinK.indexOf(q);
  if (idx === -1) {
    return metin.length > 120 ? metin.slice(0, 120).trimEnd() + '…' : metin;
  }
  const bas = Math.max(0, idx - 45);
  const son = Math.min(metin.length, idx + q.length + 75);
  let s = metin.slice(bas, son).trim();
  if (bas > 0) s = '…' + s;
  if (son < metin.length) s = s + '…';
  return s;
}
