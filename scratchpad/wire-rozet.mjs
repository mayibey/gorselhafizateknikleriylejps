import fs from 'node:fs';
const P = 'scratchpad/canli-0836grid.html';
let t = fs.readFileSync(P, 'utf8').replace(/\r\n/g, '\n');
function D(ad, a, y) { const o = t; t = t.split(a).join(y); if (t === o) { console.error('HATA:' + ad); process.exit(1); } console.log('ok:' + ad); }

// uretilmistir -> turetilmistir + "Gercek JSPS sorulariyla calis" alt satirini kaldir
const eski = "+'<span><b>Çıkmış sınav sorularından üretilmiştir</b><br>'\n    +'Gerçek JSPS sorularıyla çalış.</span></div>'";
const yeni = "+'<span><b>Çıkmış sınav sorularından türetilmiştir</b></span></div>'";
D('rozet', eski, yeni);

fs.writeFileSync(P, t);
console.log('yazildi');
