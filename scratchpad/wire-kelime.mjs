import fs from 'node:fs';
const P = 'scratchpad/canli-0836grid.html';
let t = fs.readFileSync(P, 'utf8').replace(/\r\n/g, '\n');
function D(ad, a, y) { const o = t; t = t.split(a).join(y); if (t === o) { console.error('HATA:' + ad); process.exit(1); } console.log('ok:' + ad); }

// Kelime (wordle) sonucuna Sonucu Paylas ekle (inline onclick, render aninda deger baglanir)
const anchor = '<div class="c">${KELIME.civile}</div></div>';
const yeni = anchor +
  '<button class="btn hafif" style="margin-top:10px" onclick="sonucPaylas({id:\'kelime\',ad:\'Günün Maddesi\',buyuk:\'' +
  '${ok?wS+\'/6\':\'—\'}' +
  '\',alt:\'' +
  '${ok?\'Günün maddesini bildim!\':\'Bugün bulamadım, yarın yeni kelime\'}' +
  '\',yildiz:null})">📤 Sonucu Paylaş</button>';
D('kelime-paylas', anchor, yeni);

fs.writeFileSync(P, t);
console.log('yazildi');
