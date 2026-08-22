import fs from 'node:fs';
const P = 'scratchpad/canli-0836grid.html';
let t = fs.readFileSync(P, 'utf8').replace(/\r\n/g, '\n');
function D(ad, a, y) { const o = t; t = t.split(a).join(y); if (t === o) { console.error('HATA:' + ad); process.exit(1); } console.log('ok:' + ad); }

// dy: Yeniden butonundan once Sonucu Paylas (inline onclick, render aninda dD/dY baglanir)
const dyAnchor = '<button class="btn altin" id="a1" style="margin-top:8px">↻ Yeniden</button>';
const dyBtn = '<button class="btn hafif" style="margin-top:8px" onclick="sonucPaylas({id:\'dy\',ad:\'Doğru mu Yanlış mı\',buyuk:\'${dD} doğru\',alt:\'${dD} doğru · ${dY} yanlış (60 saniye)\',yildiz:null})">📤 Sonucu Paylaş</button>';
D('dy-paylas', dyAnchor, dyBtn + '\n    ' + dyAnchor);

// milyoner: bs divinden sonra Sonucu Paylas
const mAnchor = '<div class="bs">${kazandi?\'Binbaşı!\':\'Rütben: \'+(mi?RUTBE[mi-1]:\'—\')}</div>';
const mBtn = '<button class="btn hafif" style="margin-top:8px" onclick="sonucPaylas({id:\'milyoner\',ad:\'Rütbe Merdiveni\',buyuk:\'${kazandi?\'BİNBAŞI!\':(mi?RUTBE[mi-1]:\'ER\')}\',alt:\'${mi}/12 basamak çıktım\',yildiz:null})">📤 Sonucu Paylaş</button>';
D('milyoner-paylas', mAnchor, mAnchor + mBtn);

fs.writeFileSync(P, t);
console.log('yazildi');
