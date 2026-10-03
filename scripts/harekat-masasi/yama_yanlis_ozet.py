# "Yanlışlarımın özeti" (başkan, 3 Eki): check-up bitince yanlış yapılan sorulardan madde madde özet:
# her madde: kural (Altın Özet hükmü) + her yanlış soru için soru, senin cevabın, doğrusu, neden. Altta "Yanlışları tekrar çöz".
import os
KOK = os.path.dirname(os.path.abspath(__file__))
p = os.path.join(KOK, 'masa4.js'); s = open(p, encoding='utf-8').read()


def r(a, b):
    global s
    assert s.count(a) == 1, (a[:70], s.count(a))
    s = s.replace(a, b)


r("""  <button class="anaBtn2" id="ozetAc">Altın Özeti aç ${IK.ok}<small>Eksik kaldığın maddelerin notları ve sınav tuzakları · kayıtlı</small></button>""",
  """  ${yanlislar.length?`<button class="anaBtn2" id="yOzetAc">Yanlışlarımın özeti · ${yanlislar.length} soru ${IK.ok}<small>Her yanlışın doğrusu ve nedeni, madde madde</small></button>`:''}
  <button class="anaBtn2 ${yanlislar.length?'ikincil':''}" id="ozetAc">Altın Özeti aç ${IK.ok}<small>Eksik kaldığın maddelerin notları ve sınav tuzakları · kayıtlı</small></button>""")
r("$('#ozetAc').onclick=()=>ozet(id,()=>checkupAnaliz(id,geriHedef));",
  "$('#ozetAc').onclick=()=>ozet(id,()=>checkupAnaliz(id,geriHedef));if($('#yOzetAc'))$('#yOzetAc').onclick=()=>yanlisOzet(id);")
r("/* ---------- 6. ALTIN ÖZET ---------- */",
  r"""/* ---------- YANLIŞLARIMIN ÖZETİ ---------- */
function yanlisOzet(id){ if(kilit('ozet'))return;
  iz(()=>yanlisOzet(id));
  document.body.classList.remove('sinavda','giriste');window.scrollTo({top:0});
  const k=BYID[id],cu=K.checkup[id];if(!cu){checkupListe();return;}
  const ys=cu.ids.map(i=>TUM[i]).filter(q=>q&&K.tani[kid(q.i)]===0);
  const grup={};ys.forEach(q=>{const m=maddeNo(q)||'?';(grup[m]=grup[m]||[]).push(q);});
  const sira=Object.keys(grup).sort((a,b)=>(parseInt(a)||9999)-(parseInt(b)||9999));
  const kural=m=>{const n=k.n.find(n=>n.m.includes(m));return n?n.h:'';};
  const soruKart=q=>{const c=K.cevap[kid(q.i)];return `<article class="yoKart">
    <p class="yoSoru">${esc(q.k)}</p>
    ${c!==undefined?`<div class="tzYanlis"><span class="tzIk">✕</span><div><small>Senin cevabın</small><p>${HARF[c]}) ${esc(q.s[c])}</p></div></div>`:''}
    <div class="tuzakKutu iyi"><span class="tuzakIk">${IK.tik}</span><div><b>Doğrusu</b><p>${HARF[q.d]}) ${esc(q.s[q.d])}</p></div></div>
    ${q.a?`<div class="yoNeden"><b>Neden?</b> ${esc(q.a)}</div>`:''}</article>`;};
  $('#ekran').innerHTML=`<div class="ustBar"><button class="geriIk" id="geri">‹</button><h2>Yanlışlarımın özeti</h2><span></span></div>
  <p class="ozOzet">${esc(kisa(k))} · ${ys.length} yanlış · ${sira.length} madde</p>
  ${ys.length?sira.map(m=>`<section class="yoMadde"><h3 class="yoBaslik"><span class="ozNo">${m==='?'?'':'m.'+m}</span>${esc(m==='?'?'Diğer':maddeBaslik(k,m))}<span class="rozet">${grup[m].length}</span></h3>
    ${kural(m)?`<div class="yoKural"><small>Kural</small><p>${esc(kural(m))}</p></div>`:''}
    ${grup[m].map(soruKart).join('')}</section>`).join(''):'<p class="kucukNot">Bu check-up\'ta yanlışın yok.</p>'}
  ${ys.length?`<button class="anaBtn2" id="tekrarCoz">Yanlışları tekrar çöz · ${ys.length} soru ${IK.ok}<small>doğru yaptıkların özetten düşer</small></button>`:''}
  <button class="anaBtn2 ikincil" id="ozetGit">Altın Özeti aç ${IK.ok}</button>`;
  $('#geri').onclick=()=>{if(!window.merkezGeri())checkupAnaliz(id);};
  $('#ozetGit').onclick=()=>ozet(id,()=>yanlisOzet(id));
  if($('#tekrarCoz'))$('#tekrarCoz').onclick=()=>basla(karistir(ys),`${kisa(k)} · yanlışlar`,{tani:true,tur:'tekrar',kanun:id});
}
/* ---------- 6. ALTIN ÖZET ---------- */""")
open(p, 'w', encoding='utf-8').write(s)
p = os.path.join(KOK, 'stil4.css'); s = open(p, encoding='utf-8').read()
s += """
/* Yanlışlarımın özeti (3 Eki) */
.yoMadde{margin-top:18px}
.yoBaslik{display:flex;align-items:center;gap:8px;font-size:16.5px;color:#fff;margin:0 0 8px;text-shadow:0 1px 6px rgba(0,15,25,.9)}.yoBaslik .rozet{margin-left:auto;font-family:var(--mono);font-size:12px;color:#F8D57A;border:1px solid rgba(243,194,74,.5);border-radius:999px;padding:2px 9px}
.yoKural{padding:10px 12px;border-radius:12px;background:rgba(243,194,74,.1);border:1px solid rgba(243,194,74,.45);margin-bottom:8px}.yoKural small{display:block;font-size:10.5px;letter-spacing:1.2px;text-transform:uppercase;color:#F8D57A;font-weight:800}.yoKural p{margin:3px 0 0;font-size:14.5px;line-height:1.5;color:#F2EEE4}
.yoKart{padding:12px;border-radius:14px;border:1px solid rgba(67,203,218,.3);background:rgba(3,40,60,.6);margin-bottom:10px;display:grid;gap:8px}
.yoSoru{margin:0;font-size:15px;line-height:1.5;color:#fff;white-space:pre-line}
.yoKart .tzYanlis p{font-style:normal}
.yoNeden{font-size:14px;line-height:1.55;color:#DCEBEF;padding:8px 10px;border-left:3px solid rgba(67,203,218,.6);background:rgba(67,203,218,.06);border-radius:0 8px 8px 0}.yoNeden b{color:#9FDCE6}
"""
open(p, 'w', encoding='utf-8').write(s)
print('ok')
