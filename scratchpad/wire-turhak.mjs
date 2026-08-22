import fs from 'node:fs';
const P = 'scratchpad/canli-0836grid.html';
let t = fs.readFileSync(P, 'utf8');
function D(ad, a, y) { const o = t; t = t.split(a).join(y); if (t === o) { console.error('HATA bulunamadi:' + ad); process.exit(1); } if (t.split(y).length - 1 < 1) { console.error('yaz basarisiz:' + ad); process.exit(1); } console.log('ok:' + ad); }

// 1) CSS — baskan-fixes bloguna ekle
const css = '\n/* Turlu oyunlarda ucretsiz hak bildirimi (baskan 19 Agu: 2 hakki net goster) */\n' +
  '.turBildir{position:absolute;left:12px;right:12px;top:52px;z-index:30;background:linear-gradient(180deg,rgba(9,32,47,.97),rgba(6,24,38,.97));border:1px solid rgba(243,194,74,.55);color:#F7FAFC;font-size:13px;font-weight:600;text-align:center;padding:9px 12px;border-radius:12px;box-shadow:0 6px 20px rgba(0,0,0,.35);animation:turIn .25s ease-out}\n' +
  '.turBildir b{color:#F3C24A}\n' +
  '.turBildir.git{opacity:0;transform:translateY(-6px);transition:.4s}\n' +
  '@keyframes turIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}\n';
D('css', '<style id="baskan-fixes">', '<style id="baskan-fixes">' + css);

// 2) turBildir fonksiyonu — oyunAc'tan hemen once ekle
const fn = "function turBildir(kalan){try{var v=document.getElementById('turBildir');if(v)v.remove();"
  + "var b=document.createElement('div');b.id='turBildir';b.className='turBildir';"
  + "b.innerHTML=kalan>0?('\\uD83C\\uDF9F\\uFE0F Ücretsiz oyun — bugün <b>'+kalan+'</b> tur hakkın kaldı'):"
  + "'\\uD83C\\uDF9F\\uFE0F Son ücretsiz turun — yarın 2 tur daha bedava';"
  + "(document.getElementById('tel')||document.body).appendChild(b);"
  + "setTimeout(function(){try{b.classList.add('git')}catch(e){}},2800);"
  + "setTimeout(function(){try{b.remove()}catch(e){}},3300);}catch(e){}}\n";
D('fn', 'function oyunAc(id){', fn + 'function oyunAc(id){');

// 3) gate: turArtir sonrasi ucretsiz kullaniciya bildir
D('gate', 'if(BOLUMSUZ[id]) turArtir(id);', 'if(BOLUMSUZ[id]){ turArtir(id); if(!premiumMu()) turBildir(turHakki(id)); }');

fs.writeFileSync(P, t);
console.log('yazildi');
