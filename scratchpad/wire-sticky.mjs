import fs from 'node:fs';
const P = 'scratchpad/canli-0836grid.html';
let t = fs.readFileSync(P, 'utf8').replace(/\r\n/g, '\n');
function D(ad, a, y) { const o = t; t = t.split(a).join(y); if (t === o) { console.error('HATA:' + ad); process.exit(1); } console.log('ok:' + ad); }

// 1) harita ust bilgiyi .haritaUst sarmalayicisina al (sticky icin)
D('sticky-ac', 'let h = `<div id="ilerlemeOzet">', 'let h = `<div class="haritaUst"><div id="ilerlemeOzet">');
D('sticky-kapa', '<div id="harita"><svg id="yolCizgi"></svg>', '</div><div id="harita"><svg id="yolCizgi"></svg>');

// 2) CSS: .haritaUst sticky (baskan-fixes bloguna ekle)
const css = '\n/* harita ust bilgi (BOLUM/YILDIZ/SURE + Siralama + aciklama) TEPEYE SABIT — mevcut bolume kayinca kaybolmasin */\n' +
  'html body[class] #tel #govde .haritaUst{position:sticky;top:0;z-index:6;margin:0 -16px 4px;padding:6px 16px 10px;' +
  'background:linear-gradient(180deg,rgba(6,22,36,.97),rgba(6,20,32,.93));border-bottom:1px solid rgba(126,205,218,.18);' +
  '-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}\n' +
  'html body[class] #tel .haritaUst .aciklamaS{margin:8px 0 0;font-size:13px}\n';
D('sticky-css', '<style id="baskan-fixes">', '<style id="baskan-fixes">' + css);

fs.writeFileSync(P, t);
console.log('yazildi');
