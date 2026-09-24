/**
 * SORU BİÇİMLENDİRME — öncüllü ("I. … II. … III. …") soruları okunur hâle getirir.
 *
 * Başkan (23 Ağu 2026): "bu tarz maddeli sorularda maddeleri paragraf içinde
 * kaybolacak şekilde değil de alt alta yazsan olmaz mı?"
 *
 * Gerçek sınav kitapçığında öncüller ayrı satırda basılır; bizde tek paragraf hâlinde
 * akıyor ve göz hangi öncülün nerede bittiğini seçemiyordu.
 *
 * VERİYE DOKUNULMAZ — yalnız ekranda gösterilirken satır sonu eklenir. Böylece hem
 * eski hem yeni sorular düzelir, üreteçleri yeniden çalıştırmak gerekmez.
 */

// Roma rakamı öncül başlangıcı: bir boşluktan sonra "I." / "II." / "IV." / "V." …
// (Cümle içindeki "V" harfi ya da "IV. Murat" gibi kullanımlar değil: rakamdan sonra
// NOKTA ve ardından BOŞLUK + büyük harf aranır.)
const ONCUL = /\s+((?:I{1,3}|IV|VI{0,3}|IX|XI{0,2}|V|X)\.)\s+(?=[A-ZÇĞİÖŞÜ0-9(])/g;

/** Şık metinlerindeki "I ve III" gibi kısa atıflar bölünmesin diye asgari uzunluk. */
const ASGARI_UZUNLUK = 120;

/**
 * Öncülleri alt alta getirir. En az iki öncül yoksa metne dokunmaz
 * (tek "V." rastlantısı yüzünden normal cümle bölünmesin).
 */
export function soruBicimle(metin: string): string {
  const s = String(metin ?? '');
  if (s.length < ASGARI_UZUNLUK) return s;
  const sayi = (s.match(ONCUL) ?? []).length;
  if (sayi < 2) return s;
  return s.replace(ONCUL, '\n$1 ').replace(/\n{2,}/g, '\n');
}

/**
 * SORU CÜMLESİNİ AYIR — "asıl sorulan" kısmı paragraftan ayırır (Ünal önerisi, 24 Eyl 2026:
 * "soruyu 3 kez okuyorum anlamak için; sorulan kısım farklı renkte olsa").
 *
 * Son "?" işaretiyle biten cümle soru cümlesidir; ondan önceki kısım gövdedir (olay, bilgi,
 * öncüller). Gövde yoksa (tek cümlelik soru) ayırma yapılmaz, yalnız olumsuz vurgu uygulanır.
 * VERİYE DOKUNULMAZ — yalnız gösterim.
 */
export type SoruParca = { metin: string; olumsuz?: boolean };
export type SoruBolum = { govde: string; soru: SoruParca[] };

// Sınavın "ters" sorduğunu gösteren kelimeler — gerçek kitapçıklarda altı çizili basılır.
const OLUMSUZ =
  /(yanlıştır|yanlış olan|yanlış verilmiştir|değildir|değil midir|yer almaz|yer almamaktadır|sayılmaz|bulunmaz|gerekmez|uygulanmaz|söylenemez|ulaşılamaz)/gi;

function olumsuzBol(s: string): SoruParca[] {
  const out: SoruParca[] = [];
  let son = 0;
  for (const m of s.matchAll(OLUMSUZ)) {
    const i = m.index ?? 0;
    if (i > son) out.push({ metin: s.slice(son, i) });
    out.push({ metin: m[0], olumsuz: true });
    son = i + m[0].length;
  }
  if (son < s.length) out.push({ metin: s.slice(son) });
  return out;
}

export function soruAyir(metin: string): SoruBolum {
  const s = soruBicimle(metin).trim();
  const soruSonu = s.lastIndexOf('?');
  if (soruSonu < 0) return { govde: s, soru: [] };
  // Soru cümlesinin başı: soru işaretinden önceki son cümle sonu (". " / satır sonu / ":" ).
  const once = s.slice(0, soruSonu);
  const sinir = Math.max(once.lastIndexOf('. '), once.lastIndexOf('\n'), once.lastIndexOf(': '));
  const bas = sinir >= 0 ? sinir + (s[sinir] === '\n' ? 1 : 2) : 0;
  const govde = s.slice(0, bas).trim();
  const soru = s.slice(bas).trim();
  if (!govde) return { govde: '', soru: olumsuzBol(soru) };
  return { govde, soru: olumsuzBol(soru) };
}
