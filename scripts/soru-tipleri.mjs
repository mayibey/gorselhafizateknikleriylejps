/**
 * SORU TİPİ SINIFLAYICI — iki AYRI boyut. (26 Ağu 2026)
 *
 * Neden ayrı: "hangisi yanlıştır" bir SORU BİÇİMİDİR, "kaç gün" ise BİLGİ TÜRÜDÜR. İkisini tek
 * kategoriye koyarsan dağılım yanıltır ("olumsuz" her şeyi yutar, süre/makam görünmez olur).
 *   • bilgiTuru()  → NE bilinmeli: SÜRE · MAKAM/KİŞİ · CEZA/YAPTIRIM · SAYI/EŞİK · TANIM ·
 *                    GÖREV/YETKİ · KAPSAM/UNSUR
 *   • soruBicimi() → NASIL sorulmuş: OLUMSUZ · BOŞLUK · ÖNCÜLLÜ · DÜZ
 *
 * ⛔ TUZAK (ölçülerek bulundu): sınav sayıları çoğunlukla YAZIYLA yazılıyor —
 * "bir aydan - on yıldan", "üç ay". Rakam arayan süzgeç bu soruların tamamını kaçırır;
 * TCK'da "DİĞER"e düşen soruların çoğu böyleydi. Yazıyla sayılar da tanınır.
 */

export const SAYI_KELIME =
  '(?:bir|iki|üç|dört|beş|altı|yedi|sekiz|dokuz|on|onbir|oniki|onbeş|on\\s?beş|yirmi|otuz|kırk|elli|altmış|yetmiş|seksen|doksan|yüz|yüzelli|ikiyüz|beşyüz|bin)';
export const BIRIM = '(?:gün|ay|yıl|saat|hafta|iş\\s?günü)';

const SURE_DEGERI = new RegExp(`(?:\\d{1,4}|${SAYI_KELIME})\\s*${BIRIM}`, 'i');
const SURE_DEGERI_G = new RegExp(`(\\d{1,4}|${SAYI_KELIME})\\s*(${BIRIM})`, 'gi');

export const MAKAMLAR = [
  ['hâkim', /hâkim|hakim(?!lik)/i],
  ['sulh ceza hâkimi', /sulh ceza/i],
  ['mahkeme', /mahkeme/i],
  ['cumhuriyet savcısı', /savcı/i],
  ['vali', /vali\b|valili/i],
  ['kaymakam', /kaymakam/i],
  ['mülki amir', /mülk[iî]\s*amir/i],
  ['bakan/bakanlık', /bakan\b|bakanlığ|bakanlık/i],
  ['komutan', /komutan/i],
  ['disiplin amiri', /disiplin\s*amiri/i],
  ['disiplin kurulu', /disiplin\s*kurulu/i],
  ['yüksek disiplin kurulu', /yüksek\s*disiplin/i],
  ['emniyet', /emniyet/i],
  ['cumhurbaşkanı', /cumhurbaşkan/i],
  ['il idare kurulu', /il\s*idare\s*kurulu/i],
  ['belediye', /belediye/i],
  ['kurum amiri', /kurum\s*amiri/i],
  ['kolluk amiri', /kolluk\s*amiri/i],
  ['jandarma', /jandarma/i],
];

export const CEZALAR = [
  ['uyarma', /uyarma/i],
  ['kınama', /kınama/i],
  ['aylıktan kesme', /aylıktan\s*kesme/i],
  ['kısa süreli durdurma', /kısa\s*süreli\s*durdurma/i],
  ['uzun süreli durdurma', /uzun\s*süreli\s*durdurma/i],
  ['meslekten çıkarma', /meslekten\s*çıkarma/i],
  ['devlet memurluğundan çıkarma', /memurluğundan\s*çıkarma/i],
  ['hapis', /hapis/i],
  ['adli para cezası', /adl[iî]\s*para/i],
  ['idari para cezası', /idar[iî]\s*para/i],
];

export function eslesenler(metin, liste) {
  const out = [];
  for (const [ad, re] of liste) if (re.test(metin)) out.push(ad);
  return out;
}

/** Metindeki tüm süre değerleri ("15 gün", "on yıl") — normalize edilmiş. */
export function sureDegerleri(metin) {
  const c = new Set();
  for (const m of String(metin).matchAll(SURE_DEGERI_G)) {
    c.add(`${m[1].toLocaleLowerCase('tr').replace(/\s+/g, '')} ${m[2].toLocaleLowerCase('tr')}`);
  }
  return [...c];
}

/** Şıkların çoğunluğu sayısal/süre değeri mi? (asıl kanıt köke değil şıklara bakmaktır) */
function sayisalSiklar(siklar) {
  const sik = (siklar || []).map(String);
  if (sik.length < 3) return false;
  const n = sik.filter((x) => SURE_DEGERI.test(x) || /^\s*[«"']?\s*\d/.test(x) || /\b\d{1,4}\s*(kişi|adet|katı|TL|lira|metre|yaş)\b/i.test(x)).length;
  return n >= Math.ceil(sik.length * 0.6);
}

/** NE bilinmeli? */
export function bilgiTuru(kok, siklar) {
  const k = String(kok || '');
  const sikMetni = (siklar || []).join(' | ');
  const sureVar = SURE_DEGERI.test(sikMetni);

  // 1) SÜRE — şıklarda süre değeri yarışıyor (kök "kaç gün" demese de boşluk sorusu olabilir)
  if (sureVar && (sayisalSiklar(siklar) || /kaç\s*(gün|ay|yıl|saat|hafta)|\bsüre|içinde|en geç|en fazla|en az|zamanaşımı|müddet/i.test(k))) return 'SÜRE';
  // 2) MAKAM/KİŞİ — şıklarda birden çok makam yarışıyor ya da kök makam soruyor
  if (eslesenler(sikMetni, MAKAMLAR).length >= 2
    || /kim tarafından|kim(ler)? ?(verir|yapar|karar)|hangi makam|hangi merci|yetkili (makam|merci|amir|kurul|birim)|kimin (onayı|kararı|emri|izni)/i.test(k)) return 'MAKAM/KİŞİ';
  // 3) CEZA/YAPTIRIM
  if (eslesenler(sikMetni, CEZALAR).length >= 2 || /hangi ceza|ceza(sı)? nedir|cezalandırılır|yaptırım|disiplin cezası/i.test(k)) return 'CEZA/YAPTIRIM';
  // 4) SAYI/EŞİK (süre dışı sayı)
  if (sayisalSiklar(siklar)) return 'SAYI/EŞİK';
  // 5) TANIM
  if (/ne(yi)? ifade eder|tanım|hangi kavram|\bdenir\b|olarak adlandırılır|kime .{0,15}denir/i.test(k)) return 'TANIM';
  // 6) GÖREV/YETKİ
  if (/görev|yetki|sorumlu|ödev|hizmet/i.test(k)) return 'GÖREV/YETKİ';
  // 7) KAPSAM/UNSUR — "hangisi ...dan biridir/değildir", sayma/liste bilgisi
  return 'KAPSAM/UNSUR';
}

/** NASIL sorulmuş? */
export function soruBicimi(kok, siklar) {
  const k = String(kok || '');
  // ⛔ SIRA TUZAĞI: boşluk sorusunun GÖVDESİNDE de olumsuz kelime geçebiliyor
  // ("…fazla olamaz." cümlesindeki boşluk). Önce boşluk biçimine bak.
  if (/…|\.{3,}|_{2,}|boş bırakılan|noktalı yerlere|getirilmelidir/i.test(k)) return 'BOŞLUK';
  // Olumsuzluk SORU cümlesinde olmalı (gövdedeki "olamaz" değil): "hangisi … yanlıştır?"
  if (/hangisi[^?]{0,60}(yanlış|değildir|yer almaz|sayılmaz|olamaz|girmez|söylenemez|gerekmez|yoktur|biri değil)/i.test(k)
    || /(yanlıştır|değildir|yer almaz|sayılmaz|söylenemez|gerekmez)\s*[?.]?\s*$/i.test(k.trim())) return 'OLUMSUZ';
  if (/\bI\.\s|\bII\.\s|öncül|yukarıdakilerden hangisi/i.test(k) || (siklar || []).some((x) => /^\s*(I{1,3}|IV|V)\b/.test(String(x)))) return 'ÖNCÜLLÜ';
  return 'DÜZ';
}
