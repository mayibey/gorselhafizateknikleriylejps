/**
 * AÇIKLAMA VURGUSU (başkan, 24 Eyl 2026: "açıklamalardaki önemli yerler de farklı renkte olsun,
 * daha dikkat çekici olur, akılda kalır").
 *
 * Cevaptan sonra görünen açıklama metnini parçalara ayırır:
 *  - kunye   : baştaki "m.17/2-c:" / "Madde 5:" / "Geçici Madde 2:" / "… Kanunu, m.9:" künyesi
 *  - sayi    : süre, oran, yaş, para, kat ("15 gün", "yüzde yüzyirmi", "%7", "binde biri", "üçte ikisi")
 *  - makam   : yetkili makam ("vali", "Cumhurbaşkanı", "sulh ceza hâkimi", "İçişleri Bakanlığı" …)
 *  - olumsuz : istisna/yasak ("yapılamaz", "verilemez", "hariç", "aşamaz" …) — tuzakların saklandığı yer
 * VERİYE DOKUNULMAZ — yalnız gösterim.
 */
export type AciklamaTur = 'kunye' | 'sayi' | 'makam' | 'olumsuz';
export type AciklamaParca = { metin: string; tur?: AciklamaTur };

const KUNYE = /^\s*((?:[^:'"“]{0,120}?,\s*)?(?:(?:Geçici|Ek)\s+)?(?:Madde|m\.)\s*[\w./()-]*(?:\s*vd\.)?\s*:)/i;

const SAYI_KELIME =
  '(?:bir|iki|üç|dört|beş|altı|yedi|sekiz|dokuz|on|yirmi|otuz|kırk|elli|altmış|yetmiş|seksen|doksan|yüz|bin)';
const BIRIM =
  '(?:iş\\s*günü|gün|hafta|ay|yıl|sene|saat|dakika|yaş|kat|misli|puan|kişi|metre|kilometre|km|TL|lira|adet|defa|kez)[a-zçğıöşü]*';
const SAYI = new RegExp(
  [
    '%\\s?\\d+(?:[.,]\\d+)?',
    '(?:yüzde|binde|onda|yüzde)\\s+' + SAYI_KELIME + '+[a-zçğıöşü]*',
    '(?:yarı(?:sı|sına)?|(?:üçte|dörtte|beşte|altıda|onda)\\s+' + SAYI_KELIME + '[a-zçğıöşü]*)',
    '\\d+(?:[.,]\\d+)?\\s*(?:-\\s*\\d+\\s*)?' + BIRIM,
    SAYI_KELIME + '(?:\\s?' + SAYI_KELIME + ')*\\s+' + BIRIM,
  ].join('|'),
  'g',
);

const MAKAM = new RegExp(
  [
    'Cumhurbaşkan[a-zçğıöşü]*',
    '[A-ZÇĞİÖŞÜ][a-zçğıöşü]+\\s+Bakan(?:lığ|l[ıi]ğ)?[a-zçğıöşü]*',
    'Bakan(?:lık|lığ)?[a-zçğıöşü]*',
    'val[iı](?:lik|liğ|ler)?[a-zçğıöşü]*',
    'Val[iı](?:lik|liğ|ler)?[a-zçğıöşü]*',
    'kaymakam[a-zçğıöşü]*',
    'Kaymakam[a-zçğıöşü]*',
    '(?:mahall(?:in|î|i)\\s+)?(?:en büyük\\s+)?mülk[iî]\\s+(?:idare\\s+)?amir[a-zçğıöşü]*',
    '(?:sulh ceza|sulh hukuk|aile|idare|asliye ceza|ağır ceza|çocuk)\\s+(?:hâkim|hakim|mahkeme)[a-zçğıöşü]*',
    '[Hh][âa]kim(?:lik|liğ)?[a-zçğıöşü]*',
    'Cumhuriyet\\s+(?:baş)?savcı[a-zçğıöşü]*',
    'Genelkurmay(?:\\s+Başkan[a-zçğıöşü]*)?',
    'Jandarma Genel Komutan[a-zçğıöşü]*',
    'Sayıştay[a-zçğıöşü]*',
    'TBMM[a-zçğıöşü\']*',
  ].join('|'),
  'g',
);

const OLUMSUZ = new RegExp(
  [
    '[a-zçğıöşü]+(?:a|e)maz(?:lar)?',
    '[a-zçğıöşü]+(?:ı|i|u|ü)lamaz',
    '[a-zçğıöşü]+(?:e|a)mez(?:ler)?',
    'hariç(?:tir)?',
    'yasak(?:tır)?',
    'değildir',
    'yoktur',
    'aranmaz',
    'alınmaz',
    'uygulanmaz',
    'verilmez',
    'edilmez',
    'yapılmaz',
    'sayılmaz',
  ].join('|'),
  'g',
);

type Bulgu = { i: number; son: number; tur: AciklamaTur };

export function aciklamaAyir(metin: string): AciklamaParca[] {
  const s = String(metin ?? '');
  const bulgular: Bulgu[] = [];
  const k = s.match(KUNYE);
  if (k && k[1].length <= 140) bulgular.push({ i: s.indexOf(k[1]), son: s.indexOf(k[1]) + k[1].length, tur: 'kunye' });
  const ekle = (rx: RegExp, tur: AciklamaTur) => {
    // Kelime sınırı: eşleşme harfe bitişik başlamamalı (Türkçe harfler \b ile yakalanmaz). Kelime
    // içinden başlayan eşleşme ("Son on yıl" → "on on yıl") atlanır, arama bir karakter ileriden sürer.
    rx.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = rx.exec(s)) !== null) {
      const i = m.index;
      if (i > 0 && /[A-Za-zÇĞİÖŞÜçğıöşüâîû0-9]/.test(s[i - 1])) {
        rx.lastIndex = i + 1;
        continue;
      }
      bulgular.push({ i, son: i + m[0].length, tur });
      if (m[0].length === 0) rx.lastIndex++;
    }
  };
  ekle(SAYI, 'sayi');
  ekle(MAKAM, 'makam');
  ekle(OLUMSUZ, 'olumsuz');
  // Çakışmaları ele: önce başlayan, eşitse uzun olan kazanır.
  bulgular.sort((a, b) => a.i - b.i || b.son - a.son);
  const out: AciklamaParca[] = [];
  let son = 0;
  for (const b of bulgular) {
    if (b.i < son) continue;
    if (b.i > son) out.push({ metin: s.slice(son, b.i) });
    out.push({ metin: s.slice(b.i, b.son), tur: b.tur });
    son = b.son;
  }
  if (son < s.length) out.push({ metin: s.slice(son) });
  return out;
}
