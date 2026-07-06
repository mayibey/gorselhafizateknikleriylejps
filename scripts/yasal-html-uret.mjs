// Hosted yasal sayfaları (docs/index.html = gizlilik, docs/sartlar.html = şartlar)
// TEK DOĞRU KAYNAKTAN üretir: src/constants/yasal-metin.ts. Böylece uygulama içi metinle
// birebir aynı kalır. Web sürümü platform-NÖTR (Google Play / App Store) yapılır.
// Çalıştır: node scripts/yasal-html-uret.mjs
import fs from 'fs';

const src = fs.readFileSync('src/constants/yasal-metin.ts', 'utf8');
const cikar = (ad) => {
  const bt = src.match(new RegExp('export const ' + ad + ' =\\s*`([\\s\\S]*?)`;'));
  if (bt) return bt[1];
  const tt = src.match(new RegExp('export const ' + ad + " =\\s*'([^']*)';"));
  if (tt) return tt[1];
  throw new Error(ad + ' bulunamadı');
};
const RESMI = cikar('RESMI_BAGLANTI_YOK');
let GIZ = cikar('GIZLILIK_METNI');
let SART = cikar('SARTLAR_METNI').replace('${RESMI_BAGLANTI_YOK}', RESMI);

// Web platform-nötr: mağaza adları iki platformu da kapsasın.
const notr = (s) =>
  s
    .split('Google Play').join('Google Play / App Store')
    .split("kart/banka bilgin Google'da işlenir").join("kart/banka bilgin ilgili mağazada (Google/Apple) işlenir");
GIZ = notr(GIZ);
SART = notr(SART);

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const linkle = (s) =>
  esc(s)
    .replace(/(https?:\/\/[^\s)]+)/g, '<a href="$1">$1</a>')
    .replace(/([\w.-]+@[\w.-]+\.\w+)/g, '<a href="mailto:$1">$1</a>');

// Düz metni HTML gövdeye çevir. Kaynak biçimi: ilk satır=başlık, "N) X"=h2, "• "=madde,
// GİRİNTİLİ satır=önceki madde/paragrafın DEVAMI (birleştir), girintisiz düz satır=paragraf.
function govde(metin) {
  const satirlar = metin.split('\n');
  satirlar.shift(); // başlık ayrı
  const out = [];
  let ul = [];
  let curBullet = null;
  let para = [];
  const flushBullet = () => { if (curBullet !== null) { ul.push(curBullet); curBullet = null; } };
  const flushUl = () => { flushBullet(); if (ul.length) { out.push('<ul>' + ul.map((x) => `<li>${linkle(x)}</li>`).join('') + '</ul>'); ul = []; } };
  const flushPara = () => { if (para.length) { out.push(`<p>${linkle(para.join(' '))}</p>`); para = []; } };
  for (const ham of satirlar) {
    const s = ham.trim();
    if (!s) { flushPara(); flushUl(); continue; }
    if (/^•\s/.test(s)) { flushPara(); flushBullet(); curBullet = s.replace(/^•\s/, ''); continue; }
    if (/^\d+\)\s/.test(s)) { flushPara(); flushUl(); out.push(`<h2>${linkle(s)}</h2>`); continue; }
    const girintili = /^\s/.test(ham);
    if (girintili) {
      if (curBullet !== null) curBullet += ' ' + s; // madde devamı
      else para.push(s);
    } else {
      flushBullet(); flushUl(); para.push(s); // girintisiz = paragraf satırı
    }
  }
  flushPara(); flushUl();
  return out.join('\n  ');
}

const baslikGiz = GIZ.split('\n')[0];
const baslikSart = SART.split('\n')[0];
const TARIH = '7 Temmuz 2026';

const sablon = (title, h1, bodyHtml, digerAd, digerUrl) => `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="index,follow" />
<title>${esc(title)}</title>
<style>
  :root { --lacivert:#0B1F3A; --krem:#F7F3EA; --metin:#1B2A4A; --soluk:#6E6047; --kenar:#E7DCC7; --altin:#C9A227; }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--krem); color:var(--metin);
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; line-height:1.6; }
  .wrap { max-width:760px; margin:0 auto; padding:28px 20px 64px; }
  header { border-bottom:2px solid var(--lacivert); padding-bottom:14px; margin-bottom:8px; }
  h1 { color:var(--lacivert); margin:0 0 4px; font-size:1.7rem; }
  h2 { color:var(--lacivert); font-size:1.12rem; margin:26px 0 6px; }
  .tarih { color:var(--soluk); font-size:.9rem; }
  ul { padding-left:20px; } li { margin:4px 0; }
  a { color:var(--altin); }
  nav { margin:22px 0 0; } nav a { display:inline-block; background:var(--lacivert); color:#fff; text-decoration:none;
    padding:8px 14px; border-radius:8px; font-size:.92rem; }
  footer { margin-top:40px; color:var(--soluk); font-size:.85rem; border-top:1px solid var(--kenar); padding-top:14px; }
  strong { color:var(--lacivert); }
</style>
</head>
<body>
<div class="wrap">
  <header>
    <h1>${esc(h1)}</h1>
    <div class="tarih">Son güncelleme: ${TARIH}</div>
  </header>
  ${bodyHtml}
  <nav><a href="${digerUrl}">${esc(digerAd)}</a></nav>
  <footer>© 2026 Mevzu · JSPS · <a href="mailto:iletisim@mevzujsps.com">iletisim@mevzujsps.com</a></footer>
</div>
</body>
</html>
`;

fs.writeFileSync('docs/index.html', sablon(baslikGiz, baslikGiz, govde(GIZ), 'Kullanım Şartları →', 'sartlar.html'));
fs.writeFileSync('docs/sartlar.html', sablon(baslikSart, baslikSart, govde(SART), 'Gizlilik Politikası →', 'index.html'));
console.log('docs/index.html + docs/sartlar.html uretildi (yasal-metin.ts kaynakli, platform-notr)');
