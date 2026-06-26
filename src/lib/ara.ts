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
  anlatim: string; // GERÇEK seslendirme metni ("Kartlar" kapsamı) — '' olabilir
  civile: string; // seslendirmenin "Aklınıza çivileyin: …" kısmı ("Aklına Çivile" kapsamı)
  metinK: string; // tr-küçük harf (arama için önceden hesaplı)
  baslikK: string;
  maddeK: string;
  anlatimK: string;
  civileK: string;
}

/** Arama kapsamı (filtre çipleri): hepsi · kanun metni · madde no · kart içeriği · aklına çivile. */
export type AraKapsam = 'hepsi' | 'metin' | 'madde' | 'kart' | 'civile';

/** Seslendirme metninden "Aklınıza çivileyin: …" cümlesini (sona kadar) ayıklar; yoksa ''. */
const CIVILE_ANAHTAR = 'aklınıza çivileyin';
export function civileAyikla(ses: string): string {
  const i = trKucuk(ses).indexOf(CIVILE_ANAHTAR);
  return i === -1 ? '' : ses.slice(i).trim();
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
  sesAl: (gorselYolu: string | null) => string | null,
): AraKayit[] {
  const gorulen = new Set<string>();
  const kayitlar: AraKayit[] = [];
  for (const c of cards) {
    const anahtar = `${c.law_id}|${c.madde_no}`;
    if (gorulen.has(anahtar)) continue;
    gorulen.add(anahtar);
    const metin = metinAl(c.madde_no) ?? '';
    // "Kartlar" kapsamı = GERÇEK seslendirme metni (temsilci kartın gorsel_yolu'ndan).
    // Eski c.anlatim_metni placeholder'dı → artık ses metni kullanılır.
    const anlatim = sesAl(c.gorsel_yolu) ?? '';
    const civile = civileAyikla(anlatim);
    kayitlar.push({
      cardId: c.id,
      lawId: c.law_id,
      kanun: c.law_ad,
      blok: c.blok,
      maddeNo: c.madde_no,
      baslik: c.baslik,
      metin,
      anlatim,
      civile,
      metinK: trKucuk(metin),
      baslikK: trKucuk(c.baslik),
      maddeK: trKucuk(c.madde_no),
      anlatimK: trKucuk(anlatim),
      civileK: trKucuk(civile),
    });
  }
  return kayitlar;
}

const MIN_UZUNLUK = 2;

/**
 * İndekste sorguyu arar; eşleşen maddeleri alaka sırasıyla (başlık ağırlıklı) döner.
 * PHRASE eşleştirme (q AYNEN, substring) DEĞİŞMEDİ; `kapsam` yalnız NEREDE arandığını
 * daraltır: hepsi (metin+başlık+madde+anlatım+çivile) · metin · madde · kart (başlık+
 * anlatım=gerçek ses) · civile ("Aklınıza çivileyin" kısmı).
 */
export function araKanunlar(
  indeks: AraKayit[],
  sorgu: string,
  kapsam: AraKapsam = 'hepsi',
): AramaSonuc[] {
  const q = trKucuk(sorgu.trim());
  if (q.length < MIN_UZUNLUK) return [];
  const hepsi = kapsam === 'hepsi';

  const sonuclar: AramaSonuc[] = [];
  for (const k of indeks) {
    const metinAdet = hepsi || kapsam === 'metin' ? sayGec(k.metinK, q) : 0;
    const maddeAdet = (hepsi || kapsam === 'madde') && k.maddeK.includes(q) ? 1 : 0;
    // "Kartlar" kapsamı = kart içeriği: başlık + GERÇEK seslendirme metni (anlatim).
    const baslikAdet = hepsi || kapsam === 'kart' ? sayGec(k.baslikK, q) : 0;
    const anlatimAdet = hepsi || kapsam === 'kart' ? sayGec(k.anlatimK, q) : 0;
    // "Aklına Çivile" kapsamı = seslendirmenin "Aklınıza çivileyin: …" kısmı.
    const civileAdet = hepsi || kapsam === 'civile' ? sayGec(k.civileK, q) : 0;
    // 'hepsi'de anlatim çiviileyi ZATEN kapsar (civile ⊂ anlatim) → çift saymamak için
    // civile yalnız 'civile' kapsamında toplama/skora girer; 'hepsi'de sadece snippet
    // tercihi için hesaplanır.
    const civileToplam = kapsam === 'civile' ? civileAdet : 0;
    if (metinAdet + baslikAdet + maddeAdet + anlatimAdet + civileToplam === 0) continue;
    // Snippet: eşleşen alandan bağlam (metin > çivile > anlatım > başlık).
    let kaynak = k.baslik;
    let kaynakK = k.baslikK;
    if (metinAdet > 0) {
      kaynak = k.metin;
      kaynakK = k.metinK;
    } else if (civileAdet > 0) {
      kaynak = k.civile;
      kaynakK = k.civileK;
    } else if (anlatimAdet > 0) {
      kaynak = k.anlatim;
      kaynakK = k.anlatimK;
    }
    sonuclar.push({
      cardId: k.cardId,
      lawId: k.lawId,
      kanun: k.kanun,
      blok: k.blok,
      maddeNo: k.maddeNo,
      baslik: k.baslik,
      snippet: snippetUret(kaynak || k.baslik, kaynakK || k.baslikK, q),
      eslesme: metinAdet + baslikAdet + anlatimAdet + civileToplam,
      // Başlık en güçlü alaka, sonra madde no, sonra çivile/anlatım, sonra gövde.
      skor: baslikAdet * 5 + maddeAdet * 3 + civileToplam * 2 + anlatimAdet * 2 + metinAdet,
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
