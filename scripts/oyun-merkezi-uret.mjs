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
/* touch-action KALITSAL DEĞİL: yalnız html'e vermek yetmiyordu, ızgara/klavye gibi
   çocuklarda çift dokunma yine yakınlaştırıyordu (başkan Günün Maddesi'nde gördü).
   Bu yüzden her ögeye veriliyor. */
html{-webkit-text-size-adjust:100%}
*{touch-action:manipulation;-webkit-tap-highlight-color:transparent}
html,body{height:100%;margin:0}
body{padding:0!important;gap:0!important;background:var(--kremZemin);display:block!important}
#tel{width:100%!important;max-width:none!important;height:100%!important;max-height:none!important;
  aspect-ratio:auto!important;border-radius:0!important;border:none!important;
  box-shadow:none!important;display:flex!important}

/* ---- BOŞ ALAN (başkan ekran görüntüsüyle gösterdi, 6 Ağu) ----
   Maket sabit yükseklikteydi, gerçek telefon çok daha uzun. Kısa içerikli oyunlarda
   (Ceza Terazisi gibi) her şey tepeye sıkışıp ekranın yarısı bomboş kalıyordu.
   "safe center": içerik sığıyorsa dikeyde ORTALANIR, taşıyorsa yukarıdan başlar ve
   normal kayar — düz "center" taşan içeriğin tepesini kırpardı.
   ⚠️ HERKESE UYGULANMAZ: Çengel/Asmaca gibi oyunlarda gövde tam yükseklikte bir sütun
   ve ızgara "flex:1" ile kalan alanı kaplıyor; ortalayınca o çocuk uzayamıyor →
   ızgara kırpıldı, klavye ortada kaldı (başkan gösterdi). Yalnız kısa ekranlarda. */
#govde:has(.terazi),#govde:has(.dyKart),#govde:has(.ymKart),
#govde:has(.sonuc),#govde:has(.kilitKart){justify-content:safe center}

/* Yapışkan alt şerit kabın 16px DIŞINA taşıyordu → son sıra kırpılıyordu (Günün
   Maddesi'nde klavyenin alt sırası). Kaba oturtuldu + cihazın alt güvenli alanı.
   96px'lik alt boşluk KALDIRILDI: klavyeyi yukarı itip harflerin üstüne bindiriyordu. */
#altSabit{bottom:0;padding-bottom:calc(8px + env(safe-area-inset-bottom))}
#govde{padding-bottom:env(safe-area-inset-bottom)}

/* KLAVYELER GERÇEK DİBE. Ölçtüm: Asmaca'da 196px, Çengel'de 176px ölü alan kalıyordu,
   üstelik çengelde şerit ızgaraya 56px biniyordu. "margin-top:auto" artan boşluğu
   şeridin ÜSTÜNE alır → klavye dibe oturur, ızgaraya yer açılır. */
#asKlavye,#altSabit{margin-top:auto}

/* Grup başlıkları (ARKADAŞ LİGİ · BUGÜN) harf üstlerinden kırpılıyordu: harf aralığı
   büyük, satır yüksekliği yoktu. */
.grupBas,.bolgeBas{line-height:1.5;padding:2px 0}

/* İKİ KELİMELİK CEVAPTAKİ AYIRICI BLOK — yazılamayan hücre. Düz koyu kare oyuncuya
   "burada harf var" gibi görünebiliyordu (başkan: "onu da harf sanabilirler").
   Artık çapraz taramalı, kenarlıksız, kare köşeli bir DUVAR: bakınca yazılamayacağı
   ve cevabın iki kelime olduğu anlaşılıyor. */
#cengel td.blok,.hc.blok{
  background-color:var(--lacivert)!important;opacity:1!important;border-radius:2px!important;
  background-image:repeating-linear-gradient(45deg,
    rgba(255,255,255,.16) 0 3px, transparent 3px 7px)!important;
  box-shadow:inset 0 0 0 2px rgba(255,255,255,.14)!important}

/* HATA BİLDİR — yalnız bayrak simgesiyken kimse ne olduğunu anlamıyordu (başkan
   söyledi). Yazılı, kırmızı çerçeveli bir rozet: üst şeritte "?" işaretinin yanında
   duruyor, her oyunda ve her soruda görünüyor. Kırmızı, uygulamanın kimliğinde
   "aksiyon/uyarı" rengi — tam da bu düğmenin işi. */
#bildir{flex:none;display:flex;align-items:center;gap:5px;height:30px;padding:0 11px;
  margin-left:8px;border-radius:20px;cursor:pointer;white-space:nowrap;
  border:1.5px solid #E88A8A;background:transparent;color:#FFD9D9;
  font-family:inherit;font-size:12.5px;font-weight:800;letter-spacing:.02em;transition:.15s}
#bildir:hover,#bildir:active{background:var(--kirmizi);border-color:var(--kirmizi);color:#fff}
/* Dar telefonda başlık uzunsa yazı gizlenir, bayrak kalır — taşmasın. */
@media (max-width:380px){#bildir{padding:0 9px;font-size:0;gap:0}
  #bildir::first-letter{font-size:14px}}

/* Uzun ekranda yazılar da büyür: aynı alanda "minnacık soru" kalmasın. */
@media (min-height:700px){
  .sucAd{font-size:clamp(21px,6vw,26px)}
  /* Suçun tanımı EKRANDAKI ASIL SORU — 16px'te "minnacık" duruyordu (başkan iki kez
     söyledi). Kartın öbür yazılarıyla aynı ağırlığa çekildi.
     AYRICA: puntoyu büyütüp rengi koyulaştırınca üstteki madde başlığıyla BİRBİRİNE
     GİRDİ (başkan ekran görüntüsünde daire içine aldı). Artık ikisi ayrı: başlığın
     altında ince ayırıcı, soru kendi altın şeritli kutusunda duruyor. */
  .sucAd{margin-bottom:0;padding-bottom:13px;border-bottom:1px solid var(--ayirici)}
  .sucMt{font-size:17.5px;line-height:1.65;color:var(--metin);
    margin-top:15px;padding:13px 15px;background:var(--altinYuzey);
    border-left:3px solid var(--altin);border-radius:0 11px 11px 0}
  .tBar .etik{font-size:13px}
  .slotSat label b{font-size:22px}
  .slotSat label{font-size:12.5px}
  .cumle{font-size:clamp(17px,5vw,20px);line-height:1.7}
  .sik{font-size:clamp(16px,4.6vw,18.5px)}
  .ymKart{font-size:clamp(16px,4.6vw,18.5px)}
  .dyKart{font-size:19.5px;min-height:200px}
  .hk,.hs{font-size:clamp(15.5px,4.4vw,17.5px)}
  .aciklamaS{font-size:17px;line-height:1.65}

  /* ORTALAMAK YETMEDİ: kart küçük kalınca boşluk sadece alta ve üste bölünüyordu
     (başkan ikinci kez söyledi). Uzun ekranda kartın kendisi büyüyor — iç boşluk,
     kaydırıcı yüksekliği ve düğme daha ferah. Yan fayda: kaydırıcıya parmakla
     tutunmak kolaylaşıyor. */
  .terazi{padding:22px 20px}
  .slotSat{margin-top:22px}
  input[type=range]{height:40px}
  .tBar{height:46px;margin-top:20px}
  .btn{padding:20px 15px;font-size:17.5px}
  .cumle{padding:20px}
  .ek{min-height:74px;padding:15px}
  .hk,.hs{padding:15px 16px}
  .sik{padding:16px}
  .cip{min-height:54px;padding:14px 20px;font-size:16.5px}
}
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

// ---- 2c. TEST MODU KAPALI + PREMIUM KAPISI AÇIK (6 Ağu gece, başkan kararı) ----
// Menüdeki "TEST MODU AÇIK / AÇ-KAPAT" satırı kullanıcının görmesi gereken bir şey değil.
// KİLİT: bölümlü oyunlarda İLK 2 BÖLÜM herkese açık, gerisi premium. Bölümsüz oyunlarda
// (Doğru-Yanlış · Rütbe Merdiveni · Kuşatma · Bayrak) her oyun için GÜNDE 2 TUR ücretsiz —
// sayaç oyun başına ayrı, yani Rütbe Merdiveni'ni 2 kez oynayınca yalnız o biter.
// KİLİT DIŞI: Günün Maddesi (haritası ve tur sayacı yok → zaten herkese açık) ve
// Er Meydanı (uygulamanın kendi ekranı, WebView kilidine hiç uğramıyor).
degistir(
  'test modu kapalı',
  "let TEST_MODU = (localStorage.getItem('mevzu_test_modu') ?? '1') === '1';",
  'let TEST_MODU = false;   /* üretici: yayında test modu YOK */',
);
degistir(
  'ücretsiz sınırlar şimdilik sınırsız',
  'const BEDAVA_BOLUM=3, BEDAVA_TUR=3;',
  'const BEDAVA_BOLUM=2, BEDAVA_TUR=2;   /* başkan: ilk 2 bölüm açık · her oyunda günde 2 tur */',
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
// Kilit perdesindeki ikinci geliştirici anahtarı: "premium aç/kapat". Menüdeki satırı
// kaldırmak yetmiyordu — kilit perdesi açıldığında bu düğme çıkıyor ve kullanıcı
// kendini premium yapabiliyordu. Düğme de bağlayıcısı da çıkarılıyor.
degistir(
  'kilit perdesindeki premium anahtarı (düğme)',
  `<button class="btn altin" id="kAl">PREMIUM'A GEÇ</button>`,
  '',
);
degistir(
  'kilit perdesindeki prototip notu',
  /<div class="aciklamaS" style="text-align:center">Prototipte satın alma yok[\s\S]*?<\/div>/,
  '',
);
degistir(
  'kilit perdesindeki premium anahtarı (bağlayıcı)',
  /\s*\$\('#kAl'\)\.onclick=\(\)=>\{[^\n]*\n/,
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
