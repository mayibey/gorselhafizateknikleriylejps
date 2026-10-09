/**
 * AD SOYAD DENETİMİ (9 Eki 2026, başkan: "ad soyad güncelleme ekranı çıkaralım, uyduruk isim olursa
 * kabul etmeyelim"). Ad soyad başarı belgesine yazılır, ödül-ceza sisteminde ve kişiye özel içerik
 * filigranında kullanılır. 9 Eki ölçümü: 2.477 aktif profilin %15'i boş, ~%3'ü uydurma/tek harf/rakamlı
 * ("Aa Aa", "Tolga S", "Komutan123 20").
 *
 * Saf fonksiyonlar — UI/DB yok.
 */

// Türkçe + Latin + Kiril harfler, boşluk, kesme işareti, tire. Rakam/emoji/süslü (Unicode matematik) harf YOK.
const HARF = /^[A-Za-zÇĞİÖŞÜçğıöşüÂâÎîÛûÊêЀ-ӿ' -]+$/;
const SESLI = /[aeıioöuüâîûêAEIİOÖUÜÂÎÛÊаеёиоуыэюя]/i;
const KIRIL = /[Ѐ-ӿ]/;
const ANLAMSIZ = new Set([
  'test', 'deneme', 'asd', 'asdf', 'qwe', 'qwerty', 'abc', 'xxx', 'yok', 'ad', 'soyad', 'isim', 'adim', 'adım',
  'kullanici', 'kullanıcı', 'user', 'admin', 'komutan', 'jandarma', 'mevzu', 'null', 'none', 'bilinmiyor', 'anonim',
]);

/** Fazla boşlukları siler, baş/son boşluğu kırpar. */
export function isimTemizle(s: string | null | undefined): string {
  return (s ?? '').replace(/\s+/g, ' ').trim();
}

/** Her kelimenin ilk harfi büyük, gerisi küçük (Türkçe kurallarıyla: i→İ, I→ı). */
export function isimBicimle(s: string): string {
  return isimTemizle(s)
    .split(' ')
    .map((k) =>
      k
        .split('-')
        .map((p) => (p ? p.charAt(0).toLocaleUpperCase('tr-TR') + p.slice(1).toLocaleLowerCase('tr-TR') : p))
        .join('-'),
    )
    .join(' ');
}

function kelimeler(s: string): string[] {
  return s.split(/[ -]+/).map((k) => k.replace(/'/g, '')).filter(Boolean);
}

/** Uydurma/eksik isimse kullanıcıya gösterilecek sebep, geçerliyse null. */
export function isimSorunu(adHam: string | null | undefined, soyadHam: string | null | undefined): string | null {
  const ad = isimTemizle(adHam);
  const soyad = isimTemizle(soyadHam);
  if (!ad || !soyad) return 'Adınızı ve soyadınızı yazın.';
  if (ad.length > 40 || soyad.length > 40) return 'Ad ve soyad en fazla 40 karakter olabilir.';
  if (!HARF.test(ad) || !HARF.test(soyad)) {
    return 'Ad ve soyadda yalnızca harf kullanın (rakam, emoji ya da süslü yazı olmaz).';
  }
  const tumu = [...kelimeler(ad), ...kelimeler(soyad)];
  if (tumu.some((k) => k.length < 2)) return 'Kısaltma ya da tek harf yerine adınızı ve soyadınızı tam yazın.';
  if (ad.toLocaleLowerCase('tr-TR') === soyad.toLocaleLowerCase('tr-TR')) return 'Ad ve soyad aynı olamaz.';
  for (const k of tumu) {
    const kucuk = k.toLocaleLowerCase('tr-TR');
    if (ANLAMSIZ.has(kucuk)) return 'Lütfen gerçek adınızı ve soyadınızı yazın.';
    if (/^(.)\1+$/.test(kucuk)) return 'Lütfen gerçek adınızı ve soyadınızı yazın.'; // "aa", "ddd"
    if (!KIRIL.test(k) && !SESLI.test(k)) return 'Lütfen gerçek adınızı ve soyadınızı yazın.'; // "Tk", "Dd"
  }
  return null;
}

/** Filigranda gösterilecek kısa ad: "Ahmet C." (geçersiz isimde null → yalnız kod gösterilir). */
export function filigranAdi(ad: string | null | undefined, soyad: string | null | undefined): string | null {
  if (isimSorunu(ad, soyad)) return null;
  const a = isimBicimle(ad as string);
  const s = isimBicimle(soyad as string);
  return `${a} ${s.charAt(0)}.`;
}
