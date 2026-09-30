# Röntgen sayfası tasarımı (başkan, 30 Eyl: GPT taslağı gibi olsun): ortalı başlık + süs, büyük kart (büyüteç halkası,
# HIZLI TARAMA, ~80 soru · ~24 dk, "röntgen sonunda görürsün" listesi), büyük altın düğme, "Son Röntgenlerin" satırları (Rapor hazır rozeti).
import os, re
KOK = os.path.dirname(os.path.abspath(__file__))
p = os.path.join(KOK, 'masa4.js'); s = open(p, encoding='utf-8').read()
bas = s.index('function rontgenSayfa(){')
son = s.index('\n}\n', bas) + 3
yeni = r'''function rontgenSayfa(){
  iz(rontgenSayfa);
  document.body.classList.remove('sinavda','giriste');window.scrollTo({top:0});
  const rSoru=rontgenToplam(), dk=Math.round(rSoru*0.3);
  const yarim=K.aktif&&K.aktif.meta&&K.aktif.meta.tur==='rontgen'?K.aktif:null;
  const g=(K.rontgenler||(K.rontgen?[K.rontgen]:[])).slice().reverse();
  const H=R=>hazirlik(new Set(R.ids));
  const yc=yarim?Object.keys(yarim.cevap||{}).length:0;
  $('#ekran').innerHTML=`<div class="rxUst"><button class="geriIk" id="geri">‹</button><h1 class="rxBaslik">Röntgen</h1><div class="rxSus"><i></i><span>✦</span><i></i></div></div>
  <section class="rxKart">
    <div class="rxIkon"><span>${IK.buyutec}</span></div>
    <div class="rxMetin"><span class="rxLbl">Hızlı tarama</span><div class="rxSayi">~<b>${rSoru}</b> soru · ~<b>${dk}</b> dk</div>
      <p>İlk 40 soru müşterek, son 40 soru branş mevzuatından gelir. Sorular sınav ağırlığına göre dağılır ve her röntgende değişir.</p></div>
    <div class="rxAyrac"></div>
    <span class="rxLbl rxTam">Röntgen sonunda görürsün:</span>
    <ul class="rxListe"><li>${IK.tik}<span>Kanun bazında ne kadar hazırsın</span></li><li>${IK.tik}<span>Hangi soru tiplerinde zorlanıyorsun</span></li><li>${IK.tik}<span>Önce hangi kanuna dönmen gerekiyor</span></li></ul>
  </section>
  ${yarim?`<button class="rxBtn" id="devamR">${IK.ok}<span>DEVAM ET</span><small>${yc}/${yarim.ids.length} cevaplandı · kaldığın yerden</small></button>`:''}
  <button class="rxBtn ${yarim?'ikincil':''}" id="cek">${IK.grafik}<span>${g.length||yarim?'YENİ RÖNTGEN ÇEK':'RÖNTGEN ÇEK'}</span>${IK.ok}</button>
  <p class="rxNot">Her seferinde farklı soru seti · yaklaşık ${dk} dakika${yarim?' · yeniden çekersen yarım kalan silinir':''}</p>
  <h3 class="rxBolum">${IK.grafik}<span>Son Röntgenlerin</span></h3>
  ${g.length?`<section class="rxSonuclar">${g.map((R,i)=>{const h=H(R);return `<button class="rxSatir ${i===0?'son':''}" data-i="${i}"><span class="rxSatirIk">${IK.grafik}</span><span class="rxSatirMetin"><b>${tarihYaz(R.tarih)}${i===0?' · son röntgen':''}${i===0?'<em class="rozetHazir">Rapor hazır</em>':''}</b><small><span><b>${R.d}</b>/${R.n} doğru</span><i></i>${h!=null?`<span>Hazırlık <b>${h}</b>/100</span>`:''}</small></span><span class="satirOk">${IK.sag}</span></button>`}).join('')}</section>`:`<p class="kucukNot" style="text-align:center">Henüz röntgen çekmedin. İlk röntgen yaklaşık ${dk} dakika sürer.</p>`}`;
  $('#geri').onclick=()=>{if(!window.merkezGeri())giris();};$('#cek').onclick=()=>{if(yarim){K.aktif=null;kaydet();}rontgenBaslat();};
  if($('#devamR'))$('#devamR').onclick=aktifDevam;
  document.querySelectorAll('.rxSatir').forEach(b=>b.onclick=()=>rontgenSonuc(g[+b.dataset.i],rontgenSayfa));
}
'''
s = s[:bas] + yeni + s[son:]
open(p, 'w', encoding='utf-8').write(s)

p = os.path.join(KOK, 'stil4.css'); s = open(p, encoding='utf-8').read()
s += """
/* ---- Röntgen sayfası (30 Eyl, GPT taslağı) ---- */
.rxUst{position:relative;text-align:center;padding:6px 0 14px}.rxUst .geriIk{position:absolute;left:0;top:2px}
.rxBaslik{font-family:var(--baslik);font-weight:700;font-size:clamp(34px,9.5vw,44px);color:#fff;margin:0;line-height:1.1;text-shadow:0 2px 12px rgba(0,20,30,.85)}
.rxSus{display:flex;align-items:center;justify-content:center;gap:8px;margin-top:6px;color:#F3C24A}.rxSus i{width:26px;height:1px;background:linear-gradient(90deg,transparent,#F3C24A)}.rxSus i+span+i{background:linear-gradient(90deg,#F3C24A,transparent)}.rxSus span{font-size:12px}
.rxKart{display:grid;grid-template-columns:auto minmax(0,1fr);gap:10px 16px;align-items:center;padding:18px 16px 16px;border-radius:20px;border:1.5px solid rgba(243,194,74,.6);background:linear-gradient(180deg,rgba(3,40,60,.82),rgba(2,28,44,.9));box-shadow:0 10px 30px rgba(0,0,0,.35)}
.rxIkon{width:92px;height:92px;border-radius:50%;border:1.5px solid rgba(243,194,74,.7);display:grid;place-items:center;position:relative;background:radial-gradient(circle,rgba(243,194,74,.14),rgba(3,40,60,0) 70%)}
.rxIkon::before{content:'';position:absolute;inset:-9px;border-radius:50%;border:1px solid rgba(243,194,74,.25)}
.rxIkon span{width:54px;height:54px;border-radius:50%;background:rgba(3,47,69,.9);display:grid;place-items:center;color:#F3C24A;box-shadow:0 0 22px rgba(243,194,74,.35)}.rxIkon svg{width:30px;height:30px}
.rxLbl{display:block;font-size:11px;letter-spacing:2.2px;text-transform:uppercase;color:#F3C24A;font-weight:700}
.rxSayi{font-family:var(--baslik);font-size:clamp(26px,7.6vw,34px);color:#fff;line-height:1.15;margin:4px 0 6px}.rxSayi b{color:#F8D57A;font-weight:700}
.rxMetin p{margin:0;font-size:14.5px;line-height:1.5;color:#E6EEF1}
.rxAyrac{grid-column:1/-1;height:1px;background:linear-gradient(90deg,transparent,rgba(243,194,74,.55),transparent);margin:4px 0 2px}
.rxTam{grid-column:1/-1}
.rxListe{grid-column:1/-1;list-style:none;margin:0;padding:0;display:grid;gap:9px}.rxListe li{display:flex;align-items:center;gap:12px;font-size:15px;color:#F2EEE4}
.rxListe svg{width:22px;height:22px;flex:none;color:#F3C24A;border:1.5px solid rgba(243,194,74,.7);border-radius:50%;padding:3px}
.rxBtn{width:100%;margin-top:16px;padding:16px 18px;border-radius:16px;background:linear-gradient(180deg,#F8D57A,#F3C24A);color:#1b1406;font-weight:900;font-size:19px;letter-spacing:1.2px;display:flex;align-items:center;justify-content:center;gap:12px;box-shadow:0 8px 24px rgba(243,194,74,.28);flex-wrap:wrap}
.rxBtn svg{width:24px;height:24px}.rxBtn svg:last-child{margin-left:auto}.rxBtn small{flex-basis:100%;text-align:center;font-weight:600;font-size:12.5px;letter-spacing:0;opacity:.85;margin-top:-4px}
.rxBtn.ikincil{background:rgba(243,194,74,.1);color:#F8D57A;border:1.5px solid rgba(243,194,74,.6);box-shadow:none;margin-top:10px}
.rxNot{text-align:center;color:#B9CDD3;font-size:13px;margin:10px 0 0;text-shadow:0 1px 6px rgba(0,15,25,.9)}
.rxBolum{display:flex;align-items:center;gap:10px;font-family:var(--baslik);font-size:24px;color:#fff;margin:24px 0 12px;text-shadow:0 1px 8px rgba(0,15,25,.9)}.rxBolum svg{width:24px;height:24px;color:#F3C24A}
.rxSonuclar{display:grid;gap:10px}
.rxSatir{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:14px;align-items:center;width:100%;text-align:left;padding:14px 14px;border-radius:16px;border:1px solid rgba(67,203,218,.3);background:rgba(3,40,60,.6)}
.rxSatir.son{border:1.5px solid rgba(243,194,74,.7);background:linear-gradient(180deg,rgba(243,194,74,.1),rgba(3,40,60,.7))}
.rxSatirIk{width:50px;height:50px;border-radius:12px;border:1px solid rgba(243,194,74,.5);display:grid;place-items:center;color:#F3C24A}.rxSatirIk svg{width:24px;height:24px}
.rxSatirMetin{min-width:0}.rxSatirMetin>b{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:17px;color:#fff;line-height:1.25}
.rxSatirMetin small{display:flex;align-items:center;gap:10px;margin-top:5px;font-size:14px;color:#C9D8DD}.rxSatirMetin small b{color:#F8D57A;font-size:17px}.rxSatirMetin small i{width:1px;height:16px;background:rgba(220,235,239,.35)}
.rozetHazir{font-style:normal;font-size:12px;font-weight:700;color:#8FE3B5;background:rgba(63,191,127,.14);border:1px solid rgba(63,191,127,.5);border-radius:999px;padding:3px 10px;display:inline-flex;align-items:center;gap:6px}.rozetHazir::before{content:'';width:7px;height:7px;border-radius:50%;background:#3FBF7F}
.rxSatir .satirOk{color:#DCEBEF}.rxSatir .satirOk svg{width:20px;height:20px}
@media (max-width:360px){.rxIkon{width:76px;height:76px}.rxSatirMetin>b{font-size:15.5px}}
"""
open(p, 'w', encoding='utf-8').write(s)
print('ok')
