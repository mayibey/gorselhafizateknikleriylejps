/**
 * HAFIZA GÖRSELİ İSTEM ÜRETECİ — ChatGPT'ye verilecek görsel istemlerini hazırlar.
 * (27 Ağu 2026, başkan: "kanun kanun üret, Pinokyo burnu gibi ANLAMLI çağrışım olsun.")
 *
 * Kaynak: scripts/veri/kanun-bilgi-listesi.json — çıkmış sınavda sorulmuş, cevabı
 * doğrulanmış bilgiler. Uydurma bilgi görsele GİRMEZ.
 *
 * SEÇİM MANTIĞI: çağrışıma en uygun bilgiler önce — SÜRE, SAYI, MAKAM, CEZA (somut değer
 * taşıyanlar). "Kapsam/unsur" tipi liste bilgileri görselleştirmesi zor, sona bırakılır.
 * Bir kartta 4-5 bilgi (referans görseldeki gibi şeritli panel düzeni).
 *
 *   node scripts/hafiza-istem-uret.mjs   → scripts/veri/hafiza-istemleri.json
 */
import fs from 'node:fs';

const veri = JSON.parse(fs.readFileSync('scripts/veri/kanun-bilgi-listesi.json', 'utf8'));
const ONCELIK = { 'SÜRE': 0, 'SAYI/EŞİK': 1, 'MAKAM/KİŞİ': 2, 'CEZA/YAPTIRIM': 3, 'GÖREV/YETKİ': 4, 'TANIM': 5, 'KAPSAM/UNSUR': 6 };
const PANEL = 5;

const slug = (s) => s.toLocaleLowerCase('tr').replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g')
  .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c').replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '').slice(0, 46);

/** Bilgiyi tek satırlık "öğretilecek çekirdek"e indir. */
function cekirdek(b) {
  const soru = b.soru.replace(/\s+/g, ' ').replace(/^[\d.\s]*/, '').trim();
  const cevap = String(b.cevapMetni).replace(/\s+/g, ' ').trim();
  if (b.bicim === 'OLUMSUZ') {
    return { soru: soru.slice(0, 260), dogru: null, yanlis: cevap.slice(0, 200), olumsuz: true, tur: b.tur };
  }
  return { soru: soru.slice(0, 260), dogru: cevap.slice(0, 200), yanlis: null, olumsuz: false, tur: b.tur };
}

const istemler = [];
for (const k of veri.kanunlar) {
  if (k.cevapliSoru < 4) continue;
  // Olumsuz sorular görsele UYGUN DEĞİL: doğru cevap "yanlış olan ifade", çizince ters
  // ezber riski var. Yalnız düz bilgiler alınır.
  const uygun = k.bilgiler
    .filter((b) => b.bicim !== 'OLUMSUZ')
    .sort((a, b) => (ONCELIK[a.tur] ?? 9) - (ONCELIK[b.tur] ?? 9))
    .map(cekirdek);
  if (uygun.length < 3) continue;

  for (let i = 0; i < uygun.length; i += PANEL) {
    const grup = uygun.slice(i, i + PANEL);
    if (grup.length < 3) break;
    const no = Math.floor(i / PANEL) + 1;
    const bilgiMetni = grup.map((g, j) =>
      `${j + 1}) SORU: ${g.soru}\n   DOĞRU CEVAP: ${g.dogru}`).join('\n\n');

    istemler.push({
      ad: `${slug(k.kanun)}-${no}`,
      klasor: slug(k.kanun),
      kanun: k.kanun,
      bilgiSayisi: grup.length,
      istem:
`Türk Jandarma/Sahil Güvenlik sınavına (JSPS) hazırlananlar için TEK BİR GÖRSEL hafıza kartı çiz.

KANUN: ${k.kanun}

Aşağıda, gerçek sınavda çıkmış ${grup.length} bilgi var. Görselde bu ${grup.length} bilgi ${grup.length} ayrı DİKEY PANELDE, soldan sağa sıralı dursun.

${bilgiMetni}

GÖRSEL KURALLARI:
- Üstte koyu lacivert şerit içinde beyaz büyük başlık: "${k.kanun.toLocaleUpperCase('tr')}"
- Her panelin ÜSTÜNDE: renkli daire içinde panel numarası + o bilginin kısa sorusu (küçük punto) + ALTINDA cevabın kilit değeri ÇOK BÜYÜK ve RENKLİ yazıyla.
- Her panelde, o bilgiyi hatırlatan KARİKATÜR TARZI, abartılı ama ANLAMLI bir sahne olsun.
- Metafor kuralı: çağrışım bilgiyi TAŞIMALI, rastgele komiklik olmamalı. Örnek doğru mantık: "yalan söyleyen kişi" → burnu uzayan Pinokyo; "5 yıl" → havada açılmış 5 parmak; "48 saat" → üstünde 48 yazan araç. Sayı varsa sahnede o sayı GÖRÜNSÜN (parmak, takvim yaprağı, plaka, rozet).
- Makam/kişi bilgisi varsa o makamı ÜNİFORMASIYLA/simgesiyle ayırt et (jandarma bereli/lacivert üniformalı, hâkim cübbeli, vali takım elbiseli, komutan apoletli). Yanlış makamla karıştırılmasın diye her biri belirgin farklı görünsün.
- Her panelin ALTINDA beyaz kutu içinde tek cümlelik hatırlatma: sahnedeki unsur hangi bilgiyi temsil ediyor.
- Türkiye bağlamı: Türk jandarma üniforması (lacivert), Türk bayrağı, Türkçe metin.
- TÜM YAZILAR TÜRKÇE ve DOĞRU YAZILMIŞ olmalı; harf hatası olmasın. Türkçe karakterler (ç, ğ, ı, ö, ş, ü) doğru çıksın.
- Sayılar ve makam adları yukarıdaki bilgilerle BİREBİR aynı olsun; kendinden bilgi ekleme, değiştirme.
- Gerçekçi dijital illüstrasyon, canlı renkler, yüksek kontrast, okunaklı; yatay (geniş) format.

Sadece görseli üret, açıklama yazma.`,
    });
  }
}

fs.writeFileSync('scripts/veri/hafiza-istemleri.json', JSON.stringify(istemler, null, 1), 'utf8');
const kanunSay = new Set(istemler.map((i) => i.kanun)).size;
console.log(`${istemler.length} görsel istemi · ${kanunSay} kanun`);
for (const i of istemler.slice(0, 8)) console.log('  ', i.ad, `(${i.bilgiSayisi} bilgi)`);
console.log('→ scripts/veri/hafiza-istemleri.json');
