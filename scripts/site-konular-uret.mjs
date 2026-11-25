// mevzujsps.com için "JSPS konuları" sayfalarını + sitemap.xml'i uygulamanın kendi kanun listesinden üretir.
// Kaynak: src/db/seed.ts + src/db/seed-brans-diger.ts (resmî JSPS Ek-1 mevzuat listesiyle eşlenmiş).
// Kullanım (uygulama klasöründen): node scripts/site-konular-uret.mjs
// Çıktı: docs/jsps-konulari/index.html, docs/jsps-konulari/<branş>/index.html, docs/sitemap.xml
import fs from 'node:fs';
import path from 'node:path';

const SITE = 'https://mevzujsps.com';
const IOS = 'https://apps.apple.com/tr/app/id6787908212';
const AND = 'https://play.google.com/store/apps/details?id=app.mevzujsps.android';
const oku = (p) => fs.readFileSync(p, 'utf8');
const yaz = (p, t) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, t); };
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// --- veri ---
const LAWS = new Map();
for (const f of ['src/db/seed.ts', 'src/db/seed-brans-diger.ts'])
  for (const m of oku(f).matchAll(/\{ id: (\d+), blok: '([^']+)', ad: (["'])(.*?)\3 \}/g))
    LAWS.set(+m[1], { id: +m[1], blok: m[2], ad: m[4].replace(/\\'/g, "'") });
const LB = {};
for (let i = 26; i <= 67; i++) (LB[1] ??= []).push(i);
for (const m of oku('src/db/seed-brans-diger.ts').matchAll(/law_id: (\d+), branch_id: (\d+)/g)) (LB[+m[2]] ??= []).push(+m[1]);
const BRANSLAR = [...oku('src/db/seed.ts').matchAll(/\{ id: (\d+), slug: '([^']+)', ad: '([^']+)'/g)]
  .map((m) => ({ id: +m[1], slug: m[2].replace(/_/g, '-'), ad: m[3] }));
const RUTBE_HARIC_UZMAN = new Set([13, 16]); // src/lib/rutbe-kapsam.ts ile aynı

// TAMAMI BÜYÜK HARF yazılmış resmî adları okunur başlık biçimine çevir.
const KUCUK = new Set(['ve', 'ile', 'veya', 'ya', 'da', 'de', 'için', 'sayılı', 'hakkında', 'dair']);
const trK = (s) => s.toLocaleLowerCase('tr-TR');
const trB = (s) => s.charAt(0).toLocaleUpperCase('tr-TR') + s.slice(1);
function duzAd(ad) {
  const harf = ad.replace(/[^A-Za-zÇĞİÖŞÜçğıöşüÂÎÛâîû]/g, '');
  const buyuk = harf.replace(/[^A-ZÇĞİÖŞÜÂÎÛ]/g, '').length;
  let s = ad;
  if (harf.length && buyuk / harf.length > 0.6) {
    s = ad.split(/(\s+|\/|\()/).map((w, i) => {
      if (!/[A-Za-zÇĞİÖŞÜçğıöşü]/.test(w)) return w;
      const k = trK(w);
      return i > 0 && KUCUK.has(k) ? k : trB(k);
    }).join('');
  }
  return s.replace(/ Sayılı /g, ' sayılı ');
}
const kanunNo = (ad) => (ad.match(/^(\d{3,5})\s/) || [])[1];

const musterek = [...LAWS.values()].filter((l) => l.blok === 'müşterek');
const brans = BRANSLAR.map((b) => ({ ...b, kanunlar: [...new Set(LB[b.id] || [])].map((i) => LAWS.get(i)).filter(Boolean) }));

// --- şablon (ana sayfanın krem/lacivert teması) ---
const CSS = `:root{--lacivert:#0B1F3A;--metin:#1B2A4A;--krem:#F7F3EA;--kart:#FFFCF5;--kenar:#E7DCC7;--ayirici:#EFE6D6;--soluk:#6E6047;--altin:#C9A227;--altin-koyu:#B88917;--altin-yuzey:#F3E7C1;--kirmizi:#C00000;--baslik:"Playfair Display",Georgia,"Times New Roman",serif;--govde:"Inter",-apple-system,"Segoe UI",Roboto,Arial,sans-serif;color-scheme:light}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}
body{background:var(--krem);color:var(--metin);font-family:var(--govde);font-weight:500;line-height:1.6;margin:0}
a{color:inherit}.ic{max-width:880px;margin:0 auto;padding-inline:16px}
h1,h2,h3{font-family:var(--baslik);text-wrap:balance;margin:0;line-height:1.2}
.bant{background:var(--lacivert);color:var(--krem);position:relative}
.bant::after{content:"";position:absolute;inset:auto 0 0 0;height:4px;background:linear-gradient(90deg,var(--altin-koyu),var(--altin),var(--altin-koyu))}
.ust{display:flex;align-items:center;justify-content:space-between;gap:12px;padding-block:16px}
.marka{display:flex;align-items:center;gap:10px;text-decoration:none;font-weight:800}
.marka img{width:36px;height:36px;border-radius:9px}.marka span{font-family:var(--baslik);font-size:1.25rem}.marka b{color:var(--altin)}
.ust nav{display:flex;gap:18px;font-size:.9rem;font-weight:600}.ust nav a{text-decoration:none;color:#D9E0EA}.ust nav a:hover{color:var(--altin)}
.kahraman{padding-block:18px 36px}.kahraman h1{font-size:clamp(1.7rem,4.5vw,2.5rem)}
.kahraman p{color:#C9D3E0;max-width:640px;margin:12px 0 0}
.iz{font-size:.82rem;color:#C9D3E0;margin-bottom:10px}.iz a{color:#C9D3E0}
main{padding-block:28px}
.kutu{background:var(--kart);border:1px solid var(--kenar);border-radius:14px;padding:20px 22px;margin-bottom:20px;box-shadow:0 2px 10px rgba(11,31,58,.08)}
.kutu h2{font-size:1.35rem;margin-bottom:6px}.alt{color:var(--soluk);font-size:.92rem;margin:0 0 12px}
ol.liste{margin:0;padding-left:1.4em}ol.liste li{padding:7px 0;border-bottom:1px solid var(--ayirici)}ol.liste li:last-child{border-bottom:0}
.no{font-weight:700;color:var(--altin-koyu);margin-right:.3em}
.not{font-size:.8rem;color:var(--soluk);font-weight:600}
.izgara{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px;margin:0;padding:0;list-style:none}
.izgara a{display:block;text-decoration:none;background:var(--kart);border:1px solid var(--kenar);border-radius:12px;padding:12px 14px;font-weight:700}
.izgara a:hover{border-color:var(--altin)}.izgara small{display:block;color:var(--soluk);font-weight:500}
.cagri{background:var(--lacivert);color:var(--krem);border-radius:14px;padding:22px;margin:28px 0}
.cagri h2{font-size:1.3rem}.cagri p{color:#C9D3E0;margin:8px 0 0}
.magaza{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px}
.mbtn{display:inline-block;background:var(--altin);color:var(--lacivert);text-decoration:none;font-weight:800;border-radius:10px;padding:11px 18px}
.mbtn:hover{background:var(--altin-yuzey)}
.sss h3{font-size:1.05rem;margin-top:14px}.sss p{margin:4px 0 0}
footer{margin-top:40px;border-top:1px solid var(--kenar);padding-block:24px 40px;color:var(--soluk);font-size:.88rem}
footer .ic{display:flex;flex-wrap:wrap;gap:10px 24px;justify-content:space-between}footer nav{display:flex;flex-wrap:wrap;gap:8px 18px}
footer a{text-decoration:none;color:var(--metin);font-weight:600}`;

function sayfa({ yol, baslik, aciklama, h1, giris, iz, govde, jsonld }) {
  const url = SITE + yol;
  return `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(baslik)}</title>
<meta name="description" content="${esc(aciklama)}">
<meta name="robots" content="index,follow">
<link rel="canonical" href="${url}">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(baslik)}">
<meta property="og:description" content="${esc(aciklama)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/assets/kast.jpg">
<meta property="og:locale" content="tr_TR">
<link rel="icon" href="/assets/ikon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@500;600;700;800&display=swap">
<style>${CSS}</style>
${jsonld.map((j) => `<script type="application/ld+json">${JSON.stringify(j)}</script>`).join('\n')}
</head>
<body>
<header class="bant">
  <div class="ic ust">
    <a class="marka" href="/"><img src="/assets/ikon.png" alt=""><span>Mevzu <b>JSPS</b></span></a>
    <nav aria-label="Menü"><a href="/jsps-konulari/">JSPS konuları</a><a href="/">Uygulama</a></nav>
  </div>
  <div class="ic kahraman">
    <div class="iz">${iz}</div>
    <h1>${h1}</h1>
    <p>${giris}</p>
  </div>
</header>
<main class="ic">
${govde}
<section class="cagri">
  <h2>Bu kanunları görsel hafıza kartlarıyla çalış</h2>
  <p>Mevzu JSPS'te listedeki her madde tek bir görsel kartta: resmî metin, sesli anlatım, branşına ve rütbene göre denemeler.</p>
  <div class="magaza"><a class="mbtn" href="${IOS}">App Store'dan indir</a><a class="mbtn" href="${AND}">Google Play'den indir</a></div>
</section>
</main>
<footer>
  <div class="ic">
    <span>Mevzu JSPS · Jandarma ve Sahil Güvenlik personeli için sınav hazırlık uygulaması</span>
    <nav aria-label="Yasal ve destek"><a href="/iletisim.html">Destek ve iletişim</a><a href="/gizlilik/">Gizlilik politikası</a><a href="/sartlar.html">Kullanım şartları</a></nav>
  </div>
</footer>
</body>
</html>
`;
}

const satir = (l, ek = '') => {
  const ad = duzAd(l.ad); const n = kanunNo(ad);
  return `<li>${n ? `<span class="no">${n}</span>` : ''}${esc(n ? ad.replace(/^\d{3,5}\s+/, '') : ad)}${ek}</li>`;
};
const musterekListe = (uzmanNotu) => `<ol class="liste">\n${musterek.map((l) => satir(l, uzmanNotu && RUTBE_HARIC_UZMAN.has(l.id) ? ' <span class="not">(uzman jandarma ve uzman erbaşta yok)</span>' : '')).join('\n')}\n</ol>`;
const kaynakNotu = `<p class="alt">Liste, 2026 JSPS duyurusunun Ek-1 mevzuat listesine göre hazırlanmıştır. Bazı mevzuatta yalnız belirli maddeler sınav kapsamındadır; madde ayrıntısı ve olası güncellemeler için resmî duyuruyu esas alın: <a href="https://jandarma.ataaof.edu.tr/">jandarma.ataaof.edu.tr</a>.</p>`;
const org = { '@type': 'Organization', name: 'Mevzu JSPS', url: SITE + '/', logo: SITE + '/assets/ikon.png' };
const iz = (b) => `<a href="/">Mevzu JSPS</a> › <a href="/jsps-konulari/">JSPS konuları</a>${b ? ' › ' + esc(b) : ''}`;
const breadcrumb = (b) => ({
  '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Mevzu JSPS', item: SITE + '/' },
    { '@type': 'ListItem', position: 2, name: 'JSPS konuları', item: SITE + '/jsps-konulari/' },
    ...(b ? [{ '@type': 'ListItem', position: 3, name: b.ad + ' branşı konuları', item: `${SITE}/jsps-konulari/${b.slug}/` }] : []),
  ] });

// --- ana konu sayfası ---
const toplamBrans = new Set(brans.flatMap((b) => b.kanunlar.map((l) => l.id))).size;
const sss = [
  ['JSPS müşterek konuları nelerdir?', `Bütün branşlar için ortak olan müşterek konular ${musterek.length} mevzuattan oluşur: Türk Ceza Kanunu, 2803 sayılı Jandarma Teşkilat, Görev ve Yetkileri Kanunu, Kabahatler Kanunu, İl İdaresi Kanunu, Terörle Mücadele Kanunu, Kişisel Verilerin Korunması Kanunu ve diğerleri. Tam liste bu sayfadadır.`],
  ['Branş konuları herkes için aynı mı?', `Hayır. JSPS'te ${brans.length} branş vardır ve her branşın meslek bilgisi konuları farklıdır. Kendi branşınızın listesini aşağıdaki branş sayfalarından görebilirsiniz.`],
  ['Uzman jandarma ve uzman erbaş için müşterek konular farklı mı?', '4678 sayılı Sözleşmeli Subay ve Astsubaylar Hakkında Kanun ile Sözleşmeli Subay ve Astsubay Yönetmeliği uzman jandarma ve uzman erbaş adaylarının listesinde yer almaz. Diğer müşterek konular dört rütbede ortaktır.'],
];
const anaGovde = `<section class="kutu" id="musterek">
  <h2>Müşterek konular (bütün branşlar)</h2>
  ${kaynakNotu}
  ${musterekListe(true)}
</section>
<section class="kutu" id="branslar">
  <h2>Branş konuları</h2>
  <p class="alt">Branşını seç, o branşın meslek bilgisi mevzuat listesini gör.</p>
  <ul class="izgara">
${brans.map((b) => `    <li><a href="/jsps-konulari/${b.slug}/">${esc(b.ad)}<small>${b.kanunlar.length} mevzuat</small></a></li>`).join('\n')}
  </ul>
</section>
<section class="kutu sss">
  <h2>Sık sorulan sorular</h2>
${sss.map(([s, c]) => `  <h3>${esc(s)}</h3>\n  <p>${esc(c)}</p>`).join('\n')}
</section>`;
yaz('docs/jsps-konulari/index.html', sayfa({
  yol: '/jsps-konulari/',
  baslik: 'JSPS Konuları — Müşterek ve Branş Mevzuat Listesi | Mevzu JSPS',
  aciklama: `JSPS müşterek konuları (${musterek.length} mevzuat) ve ${brans.length} branşın meslek bilgisi konuları tek sayfada. Ek-1 mevzuat listesine göre güncel JSPS konu listesi.`,
  h1: 'JSPS konuları: müşterek ve branş mevzuat listesi',
  giris: `Jandarma ve Sahil Güvenlik Personeli Sınavı'nda (JSPS) sorumlu olduğun kanun ve yönetmelikler. Müşterek ${musterek.length} mevzuat bütün adaylar için ortak; branş konuları ${brans.length} branşa göre değişir.`,
  iz: iz(null), govde: anaGovde,
  jsonld: [breadcrumb(null), { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: sss.map(([s, c]) => ({ '@type': 'Question', name: s, acceptedAnswer: { '@type': 'Answer', text: c } })) },
    { '@context': 'https://schema.org', '@type': 'WebPage', name: 'JSPS konuları', inLanguage: 'tr', publisher: org }],
}));

// --- branş sayfaları ---
for (const b of brans) {
  const uzmanNot = b.slug === 'jandarma' ? ' Uzman jandarma ve uzman erbaş adayları yalnız Jandarma branşından sınava girer.' : '';
  const govde = `<section class="kutu" id="brans">
  <h2>${esc(b.ad)} branşı meslek bilgisi konuları</h2>
  ${kaynakNotu}
  <ol class="liste">
${b.kanunlar.map((l) => satir(l)).join('\n')}
  </ol>
</section>
<section class="kutu" id="musterek">
  <h2>Müşterek konular (${musterek.length} mevzuat)</h2>
  <p class="alt">${esc(b.ad)} adayları branş konularına ek olarak bütün branşlarda ortak olan bu mevzuattan da sorumludur.${uzmanNot}</p>
  ${musterekListe(b.slug === 'jandarma')}
</section>
<section class="kutu">
  <h2>Diğer branşlar</h2>
  <ul class="izgara">
${brans.filter((x) => x.slug !== b.slug).map((x) => `    <li><a href="/jsps-konulari/${x.slug}/">${esc(x.ad)}<small>${x.kanunlar.length} mevzuat</small></a></li>`).join('\n')}
  </ul>
</section>`;
  yaz(`docs/jsps-konulari/${b.slug}/index.html`, sayfa({
    yol: `/jsps-konulari/${b.slug}/`,
    baslik: `JSPS ${b.ad} Branşı Konuları — Mevzuat Listesi | Mevzu JSPS`,
    aciklama: `JSPS ${b.ad} branşı konuları: ${b.kanunlar.length} meslek bilgisi mevzuatı ve ${musterek.length} müşterek mevzuat. Ek-1 listesine göre ${b.ad} branşı JSPS konu listesi.`,
    h1: `JSPS ${esc(b.ad)} branşı konuları`,
    giris: `${esc(b.ad)} branşından JSPS'ye girecek adayların sorumlu olduğu ${b.kanunlar.length} meslek bilgisi mevzuatı ve ${musterek.length} müşterek mevzuat.`,
    iz: iz(b.ad + ' branşı'), govde,
    jsonld: [breadcrumb(b), { '@context': 'https://schema.org', '@type': 'WebPage', name: `JSPS ${b.ad} branşı konuları`, inLanguage: 'tr', publisher: org }],
  }));
}

// --- sitemap ---
const bugun = new Date().toISOString().slice(0, 10);
const adresler = ['/', '/jsps-konulari/', ...brans.map((b) => `/jsps-konulari/${b.slug}/`),
  '/jsps2026ekimanaliz/', '/jsps2026iptalanaliz/', '/uygulama.html', '/iletisim.html', '/gizlilik/', '/sartlar.html'];
yaz('docs/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${adresler.map((u) => `  <url><loc>${SITE}${u}</loc><lastmod>${bugun}</lastmod></url>`).join('\n')}
</urlset>
`);
console.log('müşterek', musterek.length, '| branş', brans.length, '| branş mevzuatı (tekil)', toplamBrans, '| sitemap', adresler.length, 'adres');
