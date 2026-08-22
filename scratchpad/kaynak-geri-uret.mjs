/**
 * CANLI OYUN SAYFASINDAN KAYNAK DOSYAYI GERİ ÜRET.
 *
 * Üretici (scripts/oyun-merkezi-uret.mjs) kaynak → yayın dönüşümü yapıyor. Burada TERSİNİ
 * yapıyoruz: canlıda çalışan sayfadan üreticinin eklediklerini çıkarıp, sildiklerini geri
 * koyup KAYNAK adayı üretiyoruz. Doğrulama: aday kaynaktan üretici çalıştırılınca çıkan
 * dosya canlının BİREBİR AYNISI olmalı.
 */
import fs from 'node:fs';

const CANLI = 'scratchpad/canli-oyun.html';
const ADAY = 'scratchpad/kaynak-aday.html';
const URETICI = 'scripts/oyun-merkezi-uret.mjs';

let h = fs.readFileSync(CANLI, 'utf8').replace(/\r\n/g, '\n');
const basBoyut = h.length;

/** Zorunlu değişiklik: bulunamazsa DUR (sessiz kayma olmasın). */
function ters(ad, arayan, yeni) {
  const once = h;
  h = h.replace(arayan, yeni);
  if (h === once) {
    console.error(`HATA: "${ad}" tersine çevrilemedi.`);
    process.exit(1);
  }
  console.log(`  ✓ ${ad}`);
}

// Üreticinin KABUK_CSS bloğunu kaynağından birebir oku (elle kopyalama = tipografi riski).
const ur = fs.readFileSync(URETICI, 'utf8').replace(/\r\n/g, '\n');
const bas = ur.indexOf('const KABUK_CSS = `');
const son = ur.indexOf('`;\n{', bas);
if (bas < 0 || son < 0) { console.error('HATA: üreticide KABUK_CSS bulunamadı.'); process.exit(1); }
const KABUK_CSS = ur.slice(bas + 'const KABUK_CSS = `'.length, son);

console.log('tersine çevriliyor:');

// ---- 3. KAYIT KÖPRÜSÜ (çıkar) ----
const KOPRU_BAS = '<script>\n/* KÖPRÜ (üretici ekledi)';
const kb = h.indexOf(KOPRU_BAS);
if (kb < 0) { console.error('HATA: köprü bloğu yok.'); process.exit(1); }
const ke = h.indexOf('const HAVUZ=', kb);
if (ke < 0) { console.error('HATA: köprü sonu (const HAVUZ=) yok.'); process.exit(1); }
h = h.slice(0, kb) + '<script>\n' + h.slice(ke);
console.log('  ✓ kayıt köprüsü çıkarıldı');

// ---- 2d / 2c: yayın ayarları geri ----
ters('yardımla geçme', 'const TEST_GECIS=false;   /* üretici: yardım artık gerçekten yakıyor */', 'const TEST_GECIS=true;');
ters('ücretsiz sınırlar', 'const BEDAVA_BOLUM=2, BEDAVA_TUR=2;   /* başkan: ilk 2 bölüm açık · her oyunda günde 2 tur */', 'const BEDAVA_BOLUM=3, BEDAVA_TUR=3;');
ters('test modu', 'let TEST_MODU = false;   /* üretici: yayında test modu YOK */', "let TEST_MODU = (localStorage.getItem('mevzu_test_modu') ?? '1') === '1';");

// ---- 2b: nerede bildirimleri (çıkar) ----
ters('menüye dönüş bildirimi',
  "function menu(){\n  temaUygula('menu');\n  window.mevzuKopru&&window.mevzuKopru({tip:'nerede',ad:''});",
  "function menu(){\n  temaUygula('menu');");
ters('oyun açılış bildirimi',
  "function oyunAc(id){\n  window.mevzuKopru&&window.mevzuKopru({tip:'nerede',ad:id});\n  yeniTur();",
  'function oyunAc(id){\n  yeniTur();');

// ---- 2: Er Meydanı kutusu + tıklama (çıkar) ----
ters('kutu tıklaması',
  "[...document.querySelectorAll('.tile')].forEach(b=>b.onclick=()=>{\n    const o=OYUNLAR.find(x=>x.id===b.dataset.id);\n    if(o&&o.dis){ window.mevzuKopru&&window.mevzuKopru({tip:'ekran',ad:o.dis}); return; }\n    oyunAc(b.dataset.id);\n  });",
  "[...document.querySelectorAll('.tile')].forEach(b=>b.onclick=()=>oyunAc(b.dataset.id));");
ters('Er Meydanı kutusu',
  "const OYUNLAR=[\n /* EN BAŞTA: Er Meydanı. Uygulamanın kendi ekranında çalışır (canlı rakip, oda, lig),\n    bu yüzden `dis` işaretli — tıklanınca WebView değil uygulama devralır. */\n {g:'Gerçek Rakip',id:'ermeydani',dis:'ermeydani',ad:'Er Meydanı',ik:'⚔️',\n  ac:'Canlı rakiple 10 soruluk düello. Oda kur, arkadaşını çağır, ligde yüksel.'},",
  'const OYUNLAR=[');

// ---- 1b: yakınlaştırma metası geri ----
ters('yakınlaştırma metası',
  '<meta name=viewport content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">',
  '<meta name=viewport content="width=device-width,initial-scale=1">');

// ---- 1: kabuk CSS (çıkar) ----
if (!h.includes(KABUK_CSS)) { console.error('HATA: KABUK_CSS canlıda bulunamadı.'); process.exit(1); }
h = h.replace(KABUK_CSS, '');
console.log('  ✓ tam ekran kabuk CSS çıkarıldı');

// ---- 2c: test modu satırı + düğme bağlayıcısı (geri koy) ----
// Üretici bunları siliyor; kaynakta DURMALI ki üretici yine silebilsin.
const PREMSAT = 'h+=`<div class="premSat">\n      <span style="font-size:20px">${TEST_MODU?\'🔓\':\'🔒\'}</span>\n      <span class="pz">${TEST_MODU\n        ? \'<b>TEST MODU AÇIK</b> — bütün oyunlar ve bütün bölümler kilitsiz, tur sınırı yok.\'\n        : `<b>Yayın modu</b> — ücretsizde ilk ${BEDAVA_BOLUM} bölüm ve günde ${BEDAVA_TUR} tur açık.`}</span>\n      <button id="premAnahtar" class="${TEST_MODU?\'acik\':\'\'}">${TEST_MODU?\'KAPAT\':\'AÇ\'}</button>\n    </div>`;\n';
const GRID_KAPAT = "  h+='</div>';\n    // meydan okuma";
if (!h.includes(GRID_KAPAT)) { console.error('HATA: premSat için çıpa (ızgara kapanışı) yok.'); process.exit(1); }
h = h.replace(GRID_KAPAT, "  h+='</div>';\n  " + PREMSAT + '  // meydan okuma');
console.log('  ✓ test modu satırı geri kondu');

const TIKLAMA_SONU = "[...document.querySelectorAll('.tile')].forEach(b=>b.onclick=()=>oyunAc(b.dataset.id));\n";
if (!h.includes(TIKLAMA_SONU)) { console.error('HATA: premAnahtar için çıpa yok.'); process.exit(1); }
h = h.replace(TIKLAMA_SONU, TIKLAMA_SONU + "  $('#premAnahtar').onclick=()=>{ testModuAyarla(!TEST_MODU); menu(); };\n");
console.log('  ✓ test modu düğmesinin bağlayıcısı geri kondu');

// ---- 1: prototip açıklaması + geliştirici notları (geri koy) ----
const UST = '<div class="ust"><b>Oyun Merkezi.</b> Menüden seç, oyna. Bütün madde metinleri resmî mevzuattan birebir alındı, cezalar TCK\'dan tek tek doğrulandı.</div>\n\n';
const NOTLAR = '<div class="notlar">\n  <b>Neye bakmalısın:</b> Hiçbiri görsel istemiyor — hepsi 7571 madde metninden besleniyor.\n  Boşluk, eşleştirme, sıralama, doğru-yanlış ve süre şeridi <b>otomatik üretilebilir</b>; havuzu yüzlerce soruya\n  çıkarmak yeni içerik yazmak değil, mevcut tabloyu çevirmek demek. Çengel ve Milyoner elle tanım/soru istiyor.\n  Kuşatma ve Bayrak Yarışı burada tek kişilik simülasyon — gerçekte Er Meydanı\'nın oda ve tohum altyapısına oturur.\n</div>\n\n';
if (!h.includes('<div id="tel">')) { console.error('HATA: #tel yok.'); process.exit(1); }
h = h.replace('<div id="tel">', UST + '<div id="tel">');
const TEL_KAPAT = '  <div id="govde"></div>\n</div>\n\n';
if (!h.includes(TEL_KAPAT)) { console.error('HATA: #tel kapanışı yok.'); process.exit(1); }
h = h.replace(TEL_KAPAT, TEL_KAPAT + NOTLAR);
console.log('  ✓ prototip açıklaması + geliştirici notları geri kondu');

fs.writeFileSync(ADAY, h, 'utf8');
console.log(`\naday kaynak: ${(basBoyut / 1024).toFixed(0)} KB (canlı) → ${(h.length / 1024).toFixed(0)} KB (kaynak) · ${ADAY}`);
