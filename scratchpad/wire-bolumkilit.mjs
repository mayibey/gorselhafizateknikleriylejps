import fs from 'node:fs';
const P = 'scratchpad/canli-0836grid.html';
let t = fs.readFileSync(P, 'utf8');
function D(ad, a, y) { const o = t; t = t.split(a).join(y); if (t === o) { console.error('HATA:' + ad); process.exit(1); } console.log('ok:' + ad + ' (' + (t.split(y).length - 1) + ')'); }

// MERKEZI BOLUM KILIDI: bolumBasla her bolum baslatmanin tek noktasi. Kilidi buraya koyunca
// harita tiklamasi + "Sonraki bolum" butonu + her yol kapanir (ilk BEDAVA_BOLUM bolum bedava).
const eski = 'function bolumBasla(no){\n  haritada=false;';
const yeni = "function bolumBasla(no){\n"
  + "  if(!premiumMu() && no>=BEDAVA_BOLUM){ return kilitPerdesi((HRT&&HRT.ad)||'Oyun',"
  + "'İlk '+BEDAVA_BOLUM+' bölüm herkese açık; gerisi Tam Erişim ile açılır.'); }\n"
  + "  haritada=false;";
D('bolumBasla-kilit', eski, yeni);

fs.writeFileSync(P, t);
console.log('yazildi');
