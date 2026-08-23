/**
 * SORU PROFİLİ — bir soruyu TEK etiketle değil, BEŞ BOYUTTA tarif eder.
 *
 * Başkan (23 Ağu 2026): "soru tiplerini tek boyutta düşünmeyelim, sadece 'değildir'i
 * soruyor gibi tek şarta bakmayalım, genel düşünelim."
 *
 * İlk sürümde tek bir `soruTipi` vardı ve öncelik sırasına göre ilk tutan etiket
 * kazanıyordu: "hangisi yanlıştır" diye biten bir CEZA sorusu yalnız 'olumsuz'
 * sayılıyor, ceza sorusu olduğu kayboluyordu. Beş boyut birbirinden bağımsız ölçülür:
 *
 *   yön   → olumlu | olumsuz          (doğruyu mu, yanlışı mı istiyor)
 *   biçim → duz | bosluk | onculu | vaka | alinti
 *   bilgi → makam | sure | ceza | kavram | kapsam | usul | genel  (NEYİ soruyor)
 *   şık   → kisa | orta | uzun | kombinasyon
 *   boy   → kisa | orta | uzun        (kökün uzunluğu)
 *
 * Ölçü, çıkmış sınav kitapçıklarından bu beş boyutta ayrı ayrı çıkarılır; deneme de
 * bu boyutlara ayrı ayrı oturtulur.
 */

const sonCumle = (k) => k.split(/(?<=\?)\s+/).slice(-2).join(' ').toLocaleLowerCase('tr');

/** Doğruyu mu yanlışı mı istiyor. */
export function yonBul(kok) {
  const son = sonCumle(kok);
  return /yanlıştır|yanliştir|değildir|olamaz|yer almaz|söylenemez|gerekmez|biri değil|dışındadır/.test(son)
    ? 'olumsuz'
    : 'olumlu';
}

/** Sorunun dış biçimi. */
export function bicimBul(kok, siklar) {
  const tam = kok.toLocaleLowerCase('tr');
  if (/boş bırakılan|boşluğa|……|\.\.\.\.|_{3,}|getirilmelidir|yazılmalıdır|gelmelidir/.test(tam)) return 'bosluk';
  if (/\bII\.\s/.test(kok) && /yukarıdakiler|hangileri|verilenler|numaralanmış/.test(tam)) return 'onculu';
  // Kombinasyon şıkları ("I ve III") öncüllü sorunun ikinci işareti.
  if (siklar.filter((s) => /^\s*(I{1,3}|IV|V)(\s*(,|ve)\s*(I{1,3}|IV|V))*\s*$/.test(String(s))).length >= 3) return 'onculu';
  // Vaka: tek harfli özne / parantezli kişi + geçmiş zamanlı anlatım.
  if (/\((?:[A-ZÇĞİÖŞÜ])\)|(^|\s)[A-ZÇĞİÖŞÜ],\s/.test(kok) && /(mış|miş|muş|müş|dı|di|du|dü)r?\.|eder\.|olur\./.test(kok)) return 'vaka';
  if (/["'“”].{40,}["'“”]/.test(kok)) return 'alinti';
  return 'duz';
}

/** NEYİ soruyor — cevabın türü. */
export function bilgiBul(kok) {
  const son = sonCumle(kok);
  const tam = kok.toLocaleLowerCase('tr');
  if (/ceza|cezalandırılır|disiplin cezası|yaptırım|hapis|adli para|idari para/.test(son)) return 'ceza';
  if (/kaç gün|kaç ay|kaç yıl|kaç saat|en az|en çok|süre|süresi|kaçtır|kaç kişi/.test(son)) return 'sure';
  if (/kim|hangi makam|merci|yetkili|tarafından|onayıyla|onayı ile|verilir|karar verir|izniyle/.test(son)) return 'makam';
  if (/tanımlamaktadır|ifade eder|hangi kavram|tanımı|denir|anlamına gelir/.test(son)) return 'kavram';
  if (/kapsam|istisna|sayılmaz|dâhil|dahil|hariç|uygulanmaz|şümul/.test(son)) return 'kapsam';
  if (/usul|işlem|başvuru|bildirim|tebligat|tutanak|prosedür|yapılır|düzenlenir/.test(son)) return 'usul';
  if (/ceza|disiplin/.test(tam) && /hangisi/.test(son)) return 'ceza';
  return 'genel';
}

/** Şıkların yapısı — zorluğu asıl belirleyen boyut. */
export function sikBul(siklar) {
  if (!siklar.length) return 'orta';
  const uz = siklar.map((s) => String(s).length);
  if (siklar.filter((s) => /^\s*(I{1,3}|IV|V)(\s*(,|ve)\s*(I{1,3}|IV|V))*\s*$/.test(String(s))).length >= 3) return 'kombinasyon';
  if (Math.max(...uz) >= 120) return 'uzun';
  if (Math.max(...uz) <= 30) return 'kisa';
  return 'orta';
}

/** Kökün uzunluğu. */
export function boyBul(kok) {
  const n = kok.length;
  return n < 150 ? 'kisa' : n <= 280 ? 'orta' : 'uzun';
}

/** Beş boyutlu profil. `q` bir soru nesnesi ya da düz kök metni olabilir. */
export function soruProfili(q) {
  const kok = String(typeof q === 'string' ? q : (q?.soru ?? ''));
  const siklar = Array.isArray(q?.siklar) ? q.siklar : [];
  return {
    yon: yonBul(kok),
    bicim: bicimBul(kok, siklar),
    bilgi: bilgiBul(kok),
    sik: sikBul(siklar),
    boy: boyBul(kok),
  };
}

/** Kota/eşleştirmede kullanılan bileşik anahtar: yön + ne sorduğu. */
export function profilAnahtari(p) {
  return `${p.yon}|${p.bilgi}`;
}

export const BOYUTLAR = ['yon', 'bicim', 'bilgi', 'sik', 'boy'];
