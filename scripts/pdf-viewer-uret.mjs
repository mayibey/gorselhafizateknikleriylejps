// PDF görüntüleyici HTML codegen: pdfjs (UMD) + worker + görüntüleyici/çizim uygulamasını
// TEK self-contained HTML'e gömer → src/assets/pdf-viewer.ts (WebView source={{html}}).
// Çalıştır: node scripts/pdf-viewer-uret.mjs   (pdfjs-dist@3.x kurulu olmalı)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const pdfLib = readFileSync('node_modules/pdfjs-dist/build/pdf.min.js', 'utf8');
const pdfWorker = readFileSync('node_modules/pdfjs-dist/build/pdf.worker.min.js', 'utf8');

// ── Görüntüleyici + çizim uygulaması (WebView içinde çalışır) ──
const APP = `
var pdfDoc=null, notlar={}, dosyaYolu='', arac='pan', renk='#e53935', kayitBekle={};
var pagesEl, araclar={};
// Araç başına AYARLANABİLİR boyut (kalem/silgi çizgi kalınlığı, fosfor kalınlığı, yazı font px).
var boyut={ kalem:3, fosfor:18, silgi:24, yazi:16 };
function rnPost(o){ if(window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(o)); }

// RN çağırır: PDF base64 + kayıtlı notlar (sayfa->öğe dizisi: stroke veya yazı) + dosya yolu.
window.baslat = function(b64, kayitli, yol){
  dosyaYolu = yol||''; notlar = kayitli||{};
  var bin = atob(b64), arr = new Uint8Array(bin.length);
  for (var i=0;i<bin.length;i++) arr[i]=bin.charCodeAt(i);
  pdfjsLib.getDocument({data:arr}).promise.then(function(doc){
    pdfDoc=doc; var p=Promise.resolve();
    for (var n=1;n<=doc.numPages;n++){ (function(k){ p=p.then(function(){return sayfaCiz(k);}); })(n); }
    p.then(function(){ rnPost({tip:'hazir', toplam:doc.numPages}); });
  }).catch(function(e){ rnPost({tip:'hata', mesaj:String(e)}); });
};

function sayfaCiz(n){
  return pdfDoc.getPage(n).then(function(page){
    var taban = page.getViewport({scale:1});
    var scale = (window.innerWidth-12)/taban.width;
    var vp = page.getViewport({scale: scale*2}); // 2x net render
    var wrap=document.createElement('div'); wrap.className='sayfa'; wrap.dataset.no=n;
    var c=document.createElement('canvas'); c.width=vp.width; c.height=vp.height; c.style.width='100%'; c.style.display='block';
    var oc=document.createElement('canvas'); oc.width=vp.width; oc.height=vp.height; oc.className='ov'; oc.style.width='100%';
    wrap.appendChild(c); wrap.appendChild(oc); pagesEl.appendChild(wrap);
    cizimKur(oc, n, wrap);
    if (notlar[n] && notlar[n].length){
      cizStroke(oc, notlar[n].filter(function(s){ return s.t!=='yazi'; }));      // çizgiler → canvas
      notlar[n].filter(function(s){ return s.t==='yazi'; }).forEach(function(s){ yaziDiv(wrap, n, s); }); // yazılar → div
    }
    return page.render({canvasContext:c.getContext('2d'), viewport:vp}).promise;
  });
}

// Overlay'e kayıtlı stroke'ları çiz. Kalınlık s.w'den (yoksa eski sabit değerler — geriye uyum).
function cizStroke(oc, liste){
  var ctx=oc.getContext('2d');
  liste.forEach(function(s){
    ctx.globalCompositeOperation = s.t==='silgi'?'destination-out':'source-over';
    ctx.globalAlpha = s.t==='fosfor'?0.35:1; ctx.strokeStyle=s.c||'#e53935';
    ctx.lineWidth = s.w || (s.t==='fosfor'?18:(s.t==='silgi'?24:3)); ctx.lineCap='round'; ctx.lineJoin='round';
    var p=s.p; if(!p||!p.length) return; ctx.beginPath(); ctx.moveTo(p[0][0]*oc.width, p[0][1]*oc.height);
    for (var i=1;i<p.length;i++) ctx.lineTo(p[i][0]*oc.width, p[i][1]*oc.height);
    ctx.stroke();
  });
  ctx.globalAlpha=1; ctx.globalCompositeOperation='source-over';
}

// Klavye yazı notu: sayfaya konumlanmış, düzenlenebilir div (kişiye özel + kalıcı).
function yaziDiv(wrap, n, s){
  var d=document.createElement('div'); d.className='yazi'; d.contentEditable='true';
  d.style.left=(s.x*100)+'%'; d.style.top=(s.y*100)+'%';
  d.style.color=s.c||'#173b6b'; d.style.fontSize=(s.s||16)+'px';
  d.textContent=s.metin||'';
  d.addEventListener('input', function(){ s.metin=d.textContent; kaydet(n); });
  d.addEventListener('blur', function(){
    s.metin=d.textContent;
    if(!(s.metin||'').trim()){ var i=notlar[n].indexOf(s); if(i>=0) notlar[n].splice(i,1); d.remove(); }
    kaydet(n);
  });
  // Dokununca yazıya odaklan (altındaki sayfaya/çizime gitmesin).
  d.addEventListener('touchstart', function(ev){ ev.stopPropagation(); });
  d.addEventListener('mousedown', function(ev){ ev.stopPropagation(); });
  wrap.appendChild(d); return d;
}
function yeniYazi(wrap, n, x, y){
  var s={ t:'yazi', c:renk, s:boyut.yazi||16, x:x, y:y, metin:'' };
  notlar[n].push(s); var d=yaziDiv(wrap, n, s);
  setTimeout(function(){ d.focus(); }, 0);
}

// Bir sayfada çizim (parmakla) / yazı ekleme + kaydetme.
function cizimKur(oc, n, wrap){
  var ctx=oc.getContext('2d'), ciziyor=false, nokta=[];
  if(!notlar[n]) notlar[n]=[];
  function xy(e){ var r=oc.getBoundingClientRect(); var t=e.touches?e.touches[0]:e;
    return [(t.clientX-r.left)/r.width, (t.clientY-r.top)/r.height]; }
  function bas(e){
    if(arac==='pan') return;
    if(arac==='yazi'){ var pt=xy(e); yeniYazi(wrap, n, pt[0], pt[1]); return; } // boş yere dokun → yeni yazı
    e.preventDefault(); ciziyor=true; nokta=[xy(e)];
  }
  function hareket(e){ if(!ciziyor) return; e.preventDefault(); nokta.push(xy(e));
    ctx.globalCompositeOperation=arac==='silgi'?'destination-out':'source-over';
    ctx.globalAlpha=arac==='fosfor'?0.35:1; ctx.strokeStyle=renk;
    ctx.lineWidth=boyut[arac]||3; ctx.lineCap='round'; ctx.lineJoin='round';
    var a=nokta[nokta.length-2], b=nokta[nokta.length-1]; ctx.beginPath();
    ctx.moveTo(a[0]*oc.width,a[1]*oc.height); ctx.lineTo(b[0]*oc.width,b[1]*oc.height); ctx.stroke();
    ctx.globalAlpha=1; }
  function birak(){ if(!ciziyor) return; ciziyor=false; if(nokta.length>1){ notlar[n].push({t:arac,c:renk,w:boyut[arac],p:nokta}); kaydet(n); } }
  oc.addEventListener('touchstart',bas,{passive:false}); oc.addEventListener('touchmove',hareket,{passive:false}); oc.addEventListener('touchend',birak);
  oc.addEventListener('mousedown',bas); oc.addEventListener('mousemove',hareket); oc.addEventListener('mouseup',birak);
}

// Sayfa notunu RN'e gönder (debounce → sunucuya yazılır).
function kaydet(n){ clearTimeout(kayitBekle[n]); kayitBekle[n]=setTimeout(function(){
  rnPost({tip:'kaydet', sayfa:n, veri:notlar[n]}); },600); }

// Araç çubuğu. Seçili araca göre boyut kaydırıcısı + renkleri göster/gizle.
function aracSec(a){ arac=a; document.body.dataset.arac=a;
  Object.keys(araclar).forEach(function(k){ araclar[k].className='arac'+(k===a?' aktif':''); });
  var bx=document.getElementById('boyut');
  if(a==='pan'){ bx.style.display='none'; } else { bx.style.display=''; bx.value=boyut[a]||3; }
  document.getElementById('renkler').style.display=(a==='silgi'||a==='pan')?'none':''; // silgi/gez'de renk gereksiz
}
window.addEventListener('DOMContentLoaded', function(){
  pagesEl=document.getElementById('pages');
  [['pan','↕','Gez'],['kalem','✏️','Kalem'],['fosfor','🖍️','Fosfor'],['silgi','🧽','Silgi'],['yazi','⌨️','Yazı']].forEach(function(a){
    var b=document.createElement('button'); b.textContent=a[1]; b.title=a[2]; b.className='arac';
    b.onclick=function(){ aracSec(a[0]); }; araclar[a[0]]=b; document.getElementById('arac').appendChild(b);
  });
  var bx=document.getElementById('boyut');
  bx.addEventListener('input', function(){ if(arac!=='pan') boyut[arac]=+bx.value; });
  ['#e53935','#1e88e5','#43a047','#fdd835','#000000','#173b6b'].forEach(function(c){
    var b=document.createElement('button'); b.className='renk'; b.style.background=c;
    b.onclick=function(){ renk=c; }; document.getElementById('renkler').appendChild(b);
  });
  aracSec('pan');
});
`;

const HTML = `<!doctype html><html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=6, user-scalable=yes">
<style>
  html,body{margin:0;padding:0;background:#e9e4d8;font-family:-apple-system,system-ui,sans-serif;}
  #pages{padding:6px 6px 80px;}
  .sayfa{position:relative;margin:0 auto 10px;max-width:900px;box-shadow:0 1px 6px rgba(0,0,0,.15);background:#fff;}
  .sayfa canvas{border-radius:2px;}
  .sayfa .ov{position:absolute;left:0;top:0;touch-action:auto;}
  body[data-arac="kalem"] .ov,body[data-arac="fosfor"] .ov,body[data-arac="silgi"] .ov{touch-action:none;}
  /* Klavye yazı notu: sayfaya yapışık, düzenlenebilir kutu (sarı post-it görünümü). */
  .yazi{position:absolute;transform:translate(-1px,-1px);min-width:14px;min-height:1em;max-width:62%;
    background:rgba(255,249,196,.9);border:1px dashed #c9a227;border-radius:5px;padding:2px 5px;
    font-family:inherit;line-height:1.3;white-space:pre-wrap;word-break:break-word;outline:none;cursor:text;
    box-shadow:0 1px 3px rgba(0,0,0,.12);}
  /* Çizim araçları etkinken yazılar tıklamayı yutmasın (çizim altından geçsin). */
  body[data-arac="kalem"] .yazi,body[data-arac="fosfor"] .yazi,body[data-arac="silgi"] .yazi{pointer-events:none;}
  #cubuk{position:fixed;left:0;right:0;bottom:0;display:flex;gap:8px;align-items:center;justify-content:center;
    padding:8px;background:rgba(255,252,245,.97);border-top:1px solid #e7dcc7;flex-wrap:wrap;}
  .arac{font-size:20px;width:44px;height:40px;border:1px solid #e7dcc7;background:#fff;border-radius:8px;}
  .arac.aktif{background:#173b6b;border-color:#173b6b;}
  #boyut{width:120px;accent-color:#173b6b;}
  #renkler{display:flex;gap:6px;} .renk{width:26px;height:26px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 1px #ccc;}
</style></head><body>
<div id="pages"></div>
<div id="cubuk"><div id="arac" style="display:flex;gap:8px"></div><input id="boyut" type="range" min="1" max="48" value="3" style="display:none"><div id="renkler"></div></div>
<script id="wsrc" type="text/plain">${pdfWorker}</script>
<script>${pdfLib}</script>
<script>
  try{ var w=document.getElementById('wsrc').textContent;
    var b=new Blob([w],{type:'application/javascript'});
    pdfjsLib.GlobalWorkerOptions.workerSrc=URL.createObjectURL(b);
  }catch(e){}
</script>
<script>${APP}</script>
</body></html>`;

const tsEsc = HTML.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
mkdirSync('src/assets', { recursive: true });
writeFileSync(
  'src/assets/pdf-viewer.ts',
  `/* CODEGEN — scripts/pdf-viewer-uret.mjs ile üretildi (pdfjs ${JSON.parse(readFileSync('node_modules/pdfjs-dist/package.json','utf8')).version}). ELLE DÜZENLEME. */\n/* eslint-disable */\nexport const PDF_VIEWER_HTML = \`${tsEsc}\`;\n`,
);
console.log('src/assets/pdf-viewer.ts yazıldı ·', (HTML.length / 1024 / 1024).toFixed(2), 'MB HTML');
