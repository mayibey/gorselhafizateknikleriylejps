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

// ⛔ SIZINTI SÜZGECİ (27 Ağu, başkan yakaladı): TCK kartının 1. panelinde "Ses olayları en
// fazla hangi cümlede?" çıktı — o bir TÜRKÇE sorusu. Kitapçıklardaki genel kültür bölümü ve
// hatta SINAV KURALLARI metni, zayıf benzerlikle kanunlara yapışmış (497 bilginin 30'u).
// Hukuki işaret taşımayan ve sınav yönergesi olan metinler artık görsele GİRMEZ.
const HUKUK = /(kanun|yönetmelik|madde|khk|kararname|ceza|hukuk|jandarma|kolluk|suç|görev|yetki|amir|hâkim|hakim|savcı|vali|kaymakam|disiplin|tutanak|arama|elkoyma|el koyma|gözaltı|trafik|silah|ruhsat|tebligat|kabahat|terör|kaçakçılık|çevre|orman|nüfus|kimlik|pasaport|memur|personel|sözleşme|izin|rütbe|teşkilat|komutan)/i;
const YONERGE = /(sınav salonu|cevap kâğıd|cevap kagid|soru kitapçığ|adaylar sınava|dışarı çıkarmanız|kurallara uyma|sınav esnasında|bulundurduğ)/i;
const temizMi = (b) => HUKUK.test(b.soru) && !YONERGE.test(b.soru) && b.soru.length > 40;
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
    .filter((b) => b.bicim !== 'OLUMSUZ' && temizMi(b))
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
`Sen bir HAFIZA TEKNİKLERİ uzmanısın. Türk Jandarma/Sahil Güvenlik sınavına (JSPS) çalışanlar için,
BİR KEZ BAKINCA BİR DAHA UNUTULMAYACAK tek bir görsel hafıza kartı çiz.

KANUN: ${k.kanun}

Aşağıdaki ${grup.length} bilgi, ${grup.length} ayrı dikey panelde soldan sağa yer alacak:

${bilgiMetni}

═══ EN ÖNEMLİ KURAL: SAYIYI YAZMA, SAYDIR ═══
Bir sayıyı hatırlatmanın yolu onu takvime yazmak DEĞİLDİR. Takvimde "2 YIL" yazması hiç kimseye
hiçbir şey hatırlatmaz. Sayı, sahnedeki NESNENİN KENDİSİNDEN sayılarak çıkmalı:
  • 5 yıl  → havada açılmış EL, beş parmak; beşi de belirgin
  • 3 gün  → üç kişi / üç mum / üç yıldız / üç kapı
  • 2 yıl  → İKİZLER, iki kanat, çift namlu
  • 15 gün → bir elin beş parmağı + üç kişi ... gibi sahnede SAYILABİLEN unsurlar
  • 20 yıl → yirmi parmaklık hapis penceresi, sayılabilir parmaklıklar
  • 48 saat → üstünde 48 yazan bir ARAÇ PLAKASI (nesneyle bütünleşmiş, ayrı tabela değil)
İzleyici sahneye bakınca sayıyı SAYARAK bulabilmeli.
BÜYÜK SAYILARDA GRUPLA: 15 → ÜÇ açık el (3×5 parmak), 20 → DÖRT açık el, 30 → altı el ya da
üç sıra on'luk düzen. Tek tek saymak zorunda kalınacak kalabalık YAPMA; grup net görünsün.

═══ TÜRKÇE KELİME OYUNU KULLAN (çok güçlü) ═══
Türkçede bir kelime iki anlama geliyorsa görselde İKİNCİ anlamı çiz — akılda böyle kalır:
  • "bir AY" → gökyüzünde tek bir AY (hilal). "üç ay" → üç hilal.
  • "VALİ" → elinde VALİZ taşıyan takım elbiseli adam
  • "MÜSADERE" → devasa bir SANDIK ağzı
  • "kısa süreli DURDURMA" → dev bir DUR levhası önünde çakılıp kalan personel
Böyle bir bağ kurabildiğin her bilgide MUTLAKA kullan.

═══ HER PANEL FARKLI MEKÂNDA GEÇSİN ═══
Beş panelin beşi de hapishane/adliye olmasın — bakan kişi panelleri birbirinden ayırt
edemezse hafıza çalışmaz. Her panele KENDİ mekânını ver (gökyüzü, çöl, deniz, dağ başı,
karakol avlusu, köy meydanı, otoyol, ofis…) ve zemin rengini değiştir.

═══ KESİNLİKLE YASAK ═══
✗ Takvim yaprağı üstünde yazan sayı
✗ Duvar saati, kum saati
✗ Sayının yazdığı düz tabela/levha/pano/kitapçık
✗ Elinde belge tutan adliye/hâkim/masa başı stok sahnesi
✗ Sadece "adam duruyor, yanında sayı yazıyor" düzeni
Bunlar hafıza kartı değil, etikettir. Kullanma.

═══ SAHNE KURALI ═══
Her panelde ABARTILI, İMKÂNSIZ, akılda kalıcı TEK bir olay olsun — ama olay bilgiyi TAŞISIN,
rastgele komiklik olmasın. Doğru mantık örnekleri:
  • "yalan söylemek" → burnu uzayıp duvarı delen kişi (Pinokyo)
  • "izinden geri çağırma" → tatildeki askeri kementle çeken dev bir el
  • "el koyma" → eşyayı yutan kocaman bir kilit ağzı
Kişi/makam kimse OYNAYAN O OLSUN: hâkim cübbeli, vali takım elbiseli, jandarma lacivert
üniformalı ve bereli, komutan apoletli — birbirine karışmasın, bakınca hangisi olduğu anlaşılsın.

═══ DÜZEN ═══
- Üstte koyu lacivert şerit, beyaz büyük başlık: "${k.kanun.toLocaleUpperCase('tr')}"
- Her panelin üstünde: renkli daire içinde numara + kısa soru (küçük punto) + cevabın kilit
  değeri BÜYÜK ve renkli.
- Her panelin altında beyaz kutuda tek cümle: "Sahnedeki X = bilgi Y" şeklinde çağrışımı açıkla.
- Canlı renkler, yüksek kontrast, karikatürize ama kaliteli dijital illüstrasyon; yatay format.
- Tüm yazılar TÜRKÇE ve hatasız; Türkçe karakterler (ç, ğ, ı, ö, ş, ü) doğru çıksın.
- Sayılar ve makam adları yukarıdaki bilgilerle BİREBİR aynı; kendinden bilgi ekleme.

Sadece görseli üret, açıklama yazma.`,

    });
  }
}

fs.writeFileSync('scripts/veri/hafiza-istemleri.json', JSON.stringify(istemler, null, 1), 'utf8');
const kanunSay = new Set(istemler.map((i) => i.kanun)).size;
console.log(`${istemler.length} görsel istemi · ${kanunSay} kanun`);
for (const i of istemler.slice(0, 8)) console.log('  ', i.ad, `(${i.bilgiSayisi} bilgi)`);
console.log('→ scripts/veri/hafiza-istemleri.json');
