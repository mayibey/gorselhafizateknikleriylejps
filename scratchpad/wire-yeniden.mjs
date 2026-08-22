import fs from 'node:fs';
const P = 'scratchpad/canli-0836grid.html';
let t = fs.readFileSync(P, 'utf8');
function D(ad, a, y) { const o = t; t = t.split(a).join(y); if (t === o) { console.error('HATA bulunamadi:' + ad); process.exit(1); } console.log('ok:' + ad + ' (' + (t.split(y).length - 1) + ' yer)'); }

// 1) yenidenGate — turlu oyunun "Yeniden" butonu da hak kapisindan gecsin (bypass kapatildi).
const fn = "function yenidenGate(id,fn){try{"
  + "if(BOLUMSUZ[id] && !premiumMu() && turHakki(id)<=0){"
  + "return kilitPerdesi((OYUNLAR.find(function(o){return o.id===id})||{ad:'Oyun'}).ad,"
  + "'Bu oyunda ücretsiz hesaplar günde '+BEDAVA_TUR+' tur oynayabiliyor; bugünkü hakkın doldu. Hakkın gece yarısı yenilenir. Premium\\u2019da sınır yok.');}"
  + "if(BOLUMSUZ[id] && !premiumMu()){turArtir(id);turBildir(turHakki(id));}"
  + "}catch(e){} fn();}\n";
D('fn', 'function turBildir(kalan){', fn + 'function turBildir(kalan){');

// 2) 4 turlu oyunun Yeniden butonunu gate'e bagla
D('dy', "a1').onclick=acDY", "a1').onclick=function(){yenidenGate('dy',acDY)}");
D('milyoner', "a1').onclick=acMilyoner", "a1').onclick=function(){yenidenGate('milyoner',acMilyoner)}");
D('kusatma', "a1').onclick=acKusatma", "a1').onclick=function(){yenidenGate('kusatma',acKusatma)}");
D('bayrak', "a1').onclick=acBayrak", "a1').onclick=function(){yenidenGate('bayrak',acBayrak)}");

fs.writeFileSync(P, t);
console.log('yazildi');
