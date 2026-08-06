/**
 * OYUN MERKEZİ REGISTRY ÜRETİCİ — `npm run oyun:uret`
 *
 * Kaynak: assets/oyun/oyun-merkezi.html  (tarayıcıda tek başına çalışan oyun merkezi)
 * Çıktı : src/assets/oyun-merkezi-html.ts (WebView'e verilecek HTML dizesi)
 *
 * NEDEN ÜRETİCİ VAR: kaynak sayfa tarayıcı prototipi olarak yazıldı — telefon çerçevesi,
 * "prototip" açıklaması ve geliştirici notları içeriyor. Uygulamanın içinde bunların hiçbiri
 * olmamalı. Kaynağı ELLE budamak yerine burada buduyoruz ki oyun güncellendiğinde tek komutla
 * yeniden üretilsin (kart görselleri/sesleri registry'leri ile aynı mantık).
 *
 * ÜÇ MÜDAHALE:
 *  1. Kabuk temizliği — prototip açıklaması + geliştirici notları silinir, telefon maketi
 *     tam ekrana açılır.
 *  2. Er Meydanı — menünün EN BAŞINA bir kutu eklenir. Bu oyun WebView içinde DEĞİL, uygulamanın
 *     kendi ekranında çalışıyor; tıklanınca uygulamaya haber verilir.
 *  3. Kayıt köprüsü — oyun ilerlemesini localStorage'a yazıyor. Yazılan her şey uygulamaya
 *     iletilir, uygulama da sunucuya kaydeder. Oyunun kendi mantığına DOKUNULMAZ.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const kok = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const KAYNAK = path.join(kok, 'assets', 'oyun', 'oyun-merkezi.html');
const CIKTI = path.join(kok, 'src', 'assets', 'oyun-merkezi-html.ts');

// Satır sonları normalleştirilir: dosya Windows'ta CRLF olarak duruyor, aşağıdaki
// arama kalıpları ise LF yazılmış — normalleştirmezsek çok satırlı kalıplar tutmuyor.
let html = fs.readFileSync(KAYNAK, 'utf8').replace(/\r\n/g, '\n');
const basBoyut = html.length;

/** Kaynakta beklenen bir parçayı değiştirir; bulunamazsa üretimi DURDURUR.
 *  (Sessizce atlarsa uygulamaya prototip metinleri ya da köprüsüz oyun gider.) */
function degistir(ad, arayan, yeni) {
  const once = html;
  html = html.replace(arayan, yeni);
  if (html === once) {
    console.error(`HATA: "${ad}" uygulanamadı — kaynak sayfa değişmiş olabilir.`);
    process.exit(1);
  }
}

// ---- 1. KABUK: prototip açıklaması + geliştirici notları çıkar, maketi tam ekran yap ----
degistir('prototip açıklaması', /<div class="ust">[\s\S]*?<\/div>\s*/, '');
degistir('geliştirici notları', /<div class="notlar">[\s\S]*?<\/div>\s*/, '');
// ⚠️ EN SONDAKİ </style>'a eklenir. İlkine eklemek İŞE YARAMIYOR: sayfanın başında küçük bir
// sıfırlama bloğu var, oyunun asıl biçimleri ondan SONRA geliyor ve üsttekini eziyor. İlk
// denemede tam da bu oldu — telefon maketi iPhone'da olduğu gibi kaldı (başkan ekran
// görüntüsüyle gösterdi: içerik panel içinde, kenarlarda boşluk).
const KABUK_CSS = `
/* ---- UYGULAMA İÇİ (üretici ekledi) ----
   Kaynak sayfa tarayıcıda telefon maketi olarak duruyordu: ortalanmış, köşeleri yuvarlak,
   gölgeli, en/boy oranı sabit bir kutu. Gerçek telefonun içinde bunların hepsi fazlalık —
   maket ekranı tamamen kaplamalı, kenarda boşluk kalmamalı. */
/* Çift dokunmayla yakınlaştırmayı kapatır (viewport metası tek başına iOS'ta her sürümde
   yetmiyor); ayrıca yazı boyutunun kendiliğinden büyümesini engeller. */
html{touch-action:manipulation;-webkit-text-size-adjust:100%}
*{-webkit-tap-highlight-color:transparent}
html,body{height:100%;margin:0}
body{padding:0!important;gap:0!important;background:var(--kremZemin);display:block!important}
#tel{width:100%!important;max-width:none!important;height:100%!important;max-height:none!important;
  aspect-ratio:auto!important;border-radius:0!important;border:none!important;
  box-shadow:none!important;display:flex!important}
`;
{
  const son = html.lastIndexOf('</style>');
  if (son < 0) {
    console.error('HATA: "tam ekran biçimi" uygulanamadı — kaynakta </style> yok.');
    process.exit(1);
  }
  html = html.slice(0, son) + KABUK_CSS + html.slice(son);
}

// ---- 1b. YAKINLAŞTIRMA KAPALI ----
// Tarayıcıda çift dokunma sayfayı yakınlaştırıyordu; uygulamanın içinde bu bir kusur —
// oyun kutularına art arda basınca ekran zıplıyor (başkan bildirdi, 6 Ağu). Sayfa zaten
// telefon ölçüsüne göre yazılmış, yakınlaştırmaya ihtiyacı yok.
degistir(
  'yakınlaştırma kapatma',
  '<meta name=viewport content="width=device-width,initial-scale=1">',
  '<meta name=viewport content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">',
);

// ---- 2. ER MEYDANI: menünün en başındaki kutu ----
// Uygulamanın kendi ekranında çalışan tek oyun. `dis` işareti taşıyanlar WebView içinde
// açılmaz; tıklanınca uygulamaya haber gider, o da ilgili ekrana götürür.
degistir(
  'Er Meydanı kutusu',
  'const OYUNLAR=[',
  `const OYUNLAR=[
 /* EN BAŞTA: Er Meydanı. Uygulamanın kendi ekranında çalışır (canlı rakip, oda, lig),
    bu yüzden \`dis\` işaretli — tıklanınca WebView değil uygulama devralır. */
 {g:'Gerçek Rakip',id:'ermeydani',dis:'ermeydani',ad:'Er Meydanı',ik:'⚔️',
  ac:'Canlı rakiple 10 soruluk düello. Oda kur, arkadaşını çağır, ligde yüksel.'},`,
);
degistir(
  'kutu tıklaması',
  "[...document.querySelectorAll('.tile')].forEach(b=>b.onclick=()=>oyunAc(b.dataset.id));",
  `[...document.querySelectorAll('.tile')].forEach(b=>b.onclick=()=>{
    const o=OYUNLAR.find(x=>x.id===b.dataset.id);
    if(o&&o.dis){ window.mevzuKopru&&window.mevzuKopru({tip:'ekran',ad:o.dis}); return; }
    oyunAc(b.dataset.id);
  });`,
);

// ---- 2b. NEREDEYİZ: menüde mi, oyun içinde mi ----
// Android'in geri tuşu için şart: oyun içindeyken geri MENÜYE dönmeli, menüdeyken sekmeden
// çıkmalı. Sayfa durumunu kendisi bildirmezse uygulama bunu bilemez (durum sayfanın kendi
// değişkeninde, dışarıdan okunamıyor).
degistir(
  'menüye dönüş bildirimi',
  'function menu(){\n  temaUygula(\'menu\');',
  `function menu(){
  temaUygula('menu');
  window.mevzuKopru&&window.mevzuKopru({tip:'nerede',ad:''});`,
);
degistir(
  'oyun açılış bildirimi',
  'function oyunAc(id){\n  yeniTur();',
  `function oyunAc(id){
  window.mevzuKopru&&window.mevzuKopru({tip:'nerede',ad:id});
  yeniTur();`,
);

// ---- 2c. TEST MODU KAPALI, İÇERİK YİNE DE AÇIK (6 Ağu, başkan talimatı) ----
// Menüdeki "TEST MODU AÇIK / AÇ-KAPAT" satırı kullanıcının görmesi gereken bir şey değil.
// Ama içerik HENÜZ kilitlenmeyecek: test modu kapanınca ücretsiz sınırlar (3 bölüm / günde
// 3 tur) devreye girerdi. Sınırlar şimdilik pratikte sınırsıza çekiliyor — kilit kararı
// verildiğinde tek satır: 999 → 3. (Ödeme kapısı [[odeme-modeli-ve-gating]] ile birlikte.)
degistir(
  'test modu kapalı',
  "let TEST_MODU = (localStorage.getItem('mevzu_test_modu') ?? '1') === '1';",
  'let TEST_MODU = false;   /* üretici: yayında test modu YOK */',
);
degistir(
  'ücretsiz sınırlar şimdilik sınırsız',
  'const BEDAVA_BOLUM=3, BEDAVA_TUR=3;',
  'const BEDAVA_BOLUM=999, BEDAVA_TUR=999;   /* üretici: içerik henüz kilitlenmiyor */',
);
degistir(
  'test modu satırı menüden kaldırıldı',
  /h\+=`<div class="premSat">[\s\S]*?<\/div>`;\n/,
  '',
);
// Satırın tıklama bağlayıcısı da gitmeli: öge kalkınca `$('#premAnahtar')` null döner ve
// atama TypeError atar → menu() orada patlar, ALTINDAKİ bağlamalar (meydan okuma kutusu)
// hiç kurulmaz. Kutuyu silip bunu unutmak, menüyü sessizce yarım bırakırdı.
degistir(
  'test modu düğmesinin bağlayıcısı',
  /\s*\$\('#premAnahtar'\)\.onclick=\(\)=>\{[^\n]*\n/,
  '\n',
);

// ---- 2d. YARDIMLA BÖLÜM GEÇME KALKTI (6 Ağu, başkan talimatı) ----
// Çengelde "bitiren geçer" kuralı test için açılmıştı: bütün harfleri yardımla açan da
// bölümü geçiyordu. Artık puan gerçekten yanıyor (6 - hata - yardım) ve geçmek için
// eşiğin üstünde kalmak şart — yardım alabilirsin ama bedeli var.
degistir(
  'yardımla geçme kaldırıldı',
  'const TEST_GECIS=true;',
  'const TEST_GECIS=false;   /* üretici: yardım artık gerçekten yakıyor */',
);

// ---- 3. KAYIT KÖPRÜSÜ ----
// Oyun ilerlemesini localStorage'a yazıyor (bölüm, yıldız, rekor, günlük tur…). Cihazda kalırsa
// telefon değişince gider. Bu yüzden: açılışta uygulamadan gelen kayıt localStorage'a DOLDURULUR,
// sonra her yazma uygulamaya iletilir. Oyunun kendi kodu değişmez — sadece setItem sarmalanır.
degistir(
  'kayıt köprüsü',
  '<script>\nconst HAVUZ=',
  `<script>
/* KÖPRÜ (üretici ekledi) — oyunun kendi mantığına dokunmaz, yalnız kaydı dışarı taşır. */
(function(){
  function gonder(m){
    try{ window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(m)); }catch(e){}
  }
  window.mevzuKopru = gonder;
  // Uygulama sayfa yüklenmeden ÖNCE window.__MEVZU_KAYIT yazar (sunucudan gelen ilerleme).
  try{
    var s = window.__MEVZU_KAYIT;
    if (s && typeof s === 'object') {
      for (var k in s) { try{ localStorage.setItem(k, s[k]); }catch(e){} }
    }
  }catch(e){}
  var asil = localStorage.setItem.bind(localStorage);
  localStorage.setItem = function(k, v){
    asil(k, v);
    gonder({tip:'kayit', anahtar:String(k), deger:String(v)});
  };
  gonder({tip:'hazir'});
})();
const HAVUZ=`,
);

const ts = `// OTOMATİK ÜRETİLDİ — ELLE DÜZENLEME. \`npm run oyun:uret\` ile yenile.
// Kaynak: assets/oyun/oyun-merkezi.html · Üretici: scripts/oyun-merkezi-uret.mjs
/* eslint-disable */

export const OYUN_MERKEZI_HTML = ${JSON.stringify(html)};
`;

fs.mkdirSync(path.dirname(CIKTI), { recursive: true });
fs.writeFileSync(CIKTI, ts, 'utf8');
console.log(
  `oyun merkezi: ${(basBoyut / 1024).toFixed(0)} KB → ${(html.length / 1024).toFixed(0)} KB · ${path.relative(kok, CIKTI)}`,
);
