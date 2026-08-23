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
