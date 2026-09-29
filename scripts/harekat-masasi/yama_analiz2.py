# Check-up analizi (başkan, 30 Eyl): Altın Özet düğmesi EN ÜSTTE; "Eksik maddeler" ve "Soru tipi" bölümleri açılır-kapanır;
# her eksik maddede "Karta git" (uygulamadaki konu kartı) + "Altın özete git" (özette o maddeye kaydır); madde adı tam yazılır;
# altta "Yanlış yaptığın sorular" olduğunu hissettiren zıplayan ipucu (kaydırınca kaybolur).
import os
KOK = os.path.dirname(os.path.abspath(__file__))
p = os.path.join(KOK, 'masa4.js'); s = open(p, encoding='utf-8').read()


def r(a, b):
    global s
    assert a in s, a[:80]
    s = s.replace(a, b, 1)


bas = s.index("  ${cu.n<k.q.length?`<button class=\"anaBtn2 ikincil\" id=\"kalan\"")
son = s.index("  if($('#kalan'))$('#kalan').onclick=()=>checkupBolum(id,true);")
yeni = r'''  <button class="anaBtn2" id="ozetAc">Altın Özeti aç ${IK.ok}<small>Eksik kaldığın maddelerin notları ve sınav tuzakları · kayıtlı</small></button>
  ${cu.n<k.q.length?`<button class="anaBtn2 ikincil" id="kalan">Kalan ${k.q.length-cu.n} soruyu çöz ${IK.ok}<small>sonuç bu check-up'la birleşir</small></button>`:''}
  <details class="acilir" open><summary><span class="hedefIk">${IK.hedef}</span>Eksik olduğun maddeler<span class="rozet">${eksik.length}</span><span class="acilirOk">${IK.sag}</span></summary>
  <section class="liste">${eksik.length?eksik.map(([m,o])=>`<div class="mdKart"><div class="mdUst"><span class="satirNo">m.${m}</span><span class="satirAd">${esc(maddeBaslik(k,m,sorular))}</span></div><div class="mdOlcu">${bar(o.d/o.n,oranRenk(o.d/o.n))}<span class="satirDeger">${o.d}/${o.n} doğru</span></div><div class="mdBtnler"><button class="mdBtn" data-kart="${m}">${IK.kitap}Karta git</button><button class="mdBtn dolu" data-ozet="${m}">${IK.belge}Altın özete git</button></div></div>`).join(''):'<p class="kucukNot">Eksik madde çıkmadı, hepsini doğru yaptın.</p>'}</section></details>
  <details class="acilir"><summary><span class="hedefIk">${IK.hedef}</span>Hangi soru tipinde hata yapıyorsun?<span class="rozet">${tipler.filter(t=>t.d<t.n).length}</span><span class="acilirOk">${IK.sag}</span></summary>
  <section class="liste">${tipler.map(t=>{const hata=1-t.oran;return `<div class="satir"><span class="satirAd">${esc(t.ad)}</span>${bar(hata,oranRenk(1-hata))}<span class="satirDeger">%${Math.round(hata*100)}</span><span class="satirKucuk">${t.n-t.d}/${t.n} yanlış</span></div>`}).join('')||'<p class="kucukNot">Tip ayrımı için yeterli soru yok.</p>'}</section></details>
  ${yanlislar.length?`<h3 class="bolumBaslik" id="yanlisBaslik"><span class="hedefIk">${IK.hedef}</span>Yanlış yaptığın sorular (${yanlislar.length})</h3><section class="liste yanlisKartlar">${yanlislar.map((q,i)=>`<details class="ySoru"><summary><span class="satirNo">${esc((q.y||'').match(/m\.[\d\/\-]+/)?.[0]||('Soru '+(i+1)))}</span><span class="satirOk">${IK.sag}</span><span class="ySoruK">${esc(q.k.slice(0,120))}${q.k.length>120?'…':''}</span></summary><div class="ySoruIc"><p style="white-space:pre-line">${esc(q.k)}</p>${K.cevap[kid(q.i)]!==undefined?`<p class="ySenin">Senin cevabın: ${HARF[K.cevap[kid(q.i)]]}) ${esc(q.s[K.cevap[kid(q.i)]])}</p>`:''}<p class="dg">Doğru: ${HARF[q.d]}) ${esc(q.s[q.d])}</p><p>${esc(q.a)}</p></div></details>`).join('')}</section>
  <button class="asagiIpucu" id="asagiIpucu">Yanlış yaptığın ${yanlislar.length} soru aşağıda <span class="asagiOk">${IK.sag}</span></button>`:''}
  <div class="altLinkler"><button id="yeniden">Bu kanunu yeniden check-up yap</button></div>`;
  document.querySelectorAll('[data-kart]').forEach(b=>b.onclick=()=>kartaGit(k.id,b.dataset.kart));
  document.querySelectorAll('[data-ozet]').forEach(b=>b.onclick=()=>ozet(id,()=>checkupAnaliz(id,geriHedef),'bu',b.dataset.ozet));
  const ip=$('#asagiIpucu');
  if(ip){ ip.onclick=()=>{$('#yanlisBaslik').scrollIntoView({behavior:'smooth',block:'start'});ip.classList.add('gizli');};
    const g=()=>{ if(window.scrollY>80){ip.classList.add('gizli');window.removeEventListener('scroll',g);} };
    window.addEventListener('scroll',g,{passive:true});
    if(document.documentElement.scrollHeight<=window.innerHeight+120)ip.classList.add('gizli'); }
'''
s = s[:bas] + yeni + s[son:]
# Karta git: uygulamaya mesaj (RN yoksa bilgi)
r("/* ---------- 6. ALTIN ÖZET ---------- */",
  """function kartaGit(kanunId,m){ if(window.ReactNativeWebView){window.ReactNativeWebView.postMessage(JSON.stringify({tip:'kart',kanun:kanunId,madde:String(m)}));} else toast('Konu kartı uygulamada açılır.'); }
/* ---------- 6. ALTIN ÖZET ---------- */""")
# özet: hedef maddeye kaydır
r("function ozet(id,geriHedef,sekme){\n  iz(()=>ozet(id,geriHedef,sekme));",
  "function ozet(id,geriHedef,sekme,hedefM){\n  iz(()=>ozet(id,geriHedef,sekme));")
r('return `<article class="ozKart"><div class="ozUst">', 'return `<article class="ozKart" data-m="${mm}"><div class="ozUst">')
r("  document.querySelectorAll('#ozSekme button').forEach(b=>b.onclick=()=>{YIGIN.pop();POP=true;ozet(id,geriHedef,b.dataset.s);});",
  "  document.querySelectorAll('#ozSekme button').forEach(b=>b.onclick=()=>{YIGIN.pop();POP=true;ozet(id,geriHedef,b.dataset.s);});\n  if(hedefM){const h=document.querySelector(`.ozKart[data-m=\"${hedefM}\"]`);if(h){setTimeout(()=>{h.scrollIntoView({behavior:'smooth',block:'start'});h.classList.add('vurgu');},60);}}")
open(p, 'w', encoding='utf-8').write(s)

p = os.path.join(KOK, 'stil4.css'); s = open(p, encoding='utf-8').read()
s += """
/* Check-up analizi: açılır bölümler, madde kartları, aşağı ipucu (30 Eyl) */
.acilir{margin-top:14px}.acilir>summary{list-style:none;display:flex;align-items:center;gap:8px;cursor:pointer;font-family:var(--baslik);font-size:18px;color:#F8D57A;padding:6px 0;text-shadow:0 1px 6px rgba(0,15,25,.95),0 0 14px rgba(0,15,25,.8);-webkit-tap-highlight-color:transparent}
.acilir>summary::-webkit-details-marker{display:none}.acilir>summary::marker{content:''}
.acilir .rozet{font-family:var(--mono);font-size:12px;color:#F8D57A;background:rgba(243,194,74,.16);border:1px solid rgba(243,194,74,.5);border-radius:999px;padding:2px 9px;text-shadow:none}
.acilir .acilirOk{margin-left:auto;color:#F8D57A;transform:rotate(90deg);transition:transform .2s}.acilir .acilirOk svg{width:18px;height:18px}.acilir[open] .acilirOk{transform:rotate(-90deg)}
.acilir>.liste{margin-top:6px}
.mdKart{padding:12px;border-radius:12px;border:1px solid rgba(67,203,218,.3);background:rgba(3,40,60,.55)}
.mdUst{display:grid;grid-template-columns:auto minmax(0,1fr);gap:10px;align-items:baseline}
.mdUst .satirAd{font-size:14.5px;line-height:1.3;display:block;-webkit-line-clamp:unset;overflow:visible;color:#fff}
.mdOlcu{display:flex;align-items:center;gap:10px;margin-top:9px}.mdOlcu .bar{flex:1;min-width:0}.mdOlcu .satirDeger{min-width:0}
.mdBtnler{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:11px}
.mdBtn{display:flex;align-items:center;justify-content:center;gap:6px;padding:10px 8px;border-radius:10px;font-weight:800;font-size:13.5px;border:1.5px solid rgba(243,194,74,.6);background:rgba(243,194,74,.12);color:#F8D57A}
.mdBtn.dolu{background:linear-gradient(180deg,#F8D57A,#F3C24A);color:#1b1406;border-color:transparent}.mdBtn svg{width:16px;height:16px;flex:none}
.anaBtn2+.anaBtn2.ikincil{margin-top:10px}
.asagiIpucu{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);background:rgba(3,30,45,.94);border:1px solid rgba(243,194,74,.65);color:#F8D57A;font-weight:800;font-size:13px;padding:10px 16px;border-radius:999px;display:flex;gap:6px;align-items:center;box-shadow:0 6px 18px rgba(0,0,0,.45);animation:zipla 1.4s ease-in-out infinite;z-index:5;transition:opacity .25s;white-space:nowrap}
.asagiIpucu .asagiOk{display:inline-flex;transform:rotate(90deg)}.asagiIpucu .asagiOk svg{width:15px;height:15px}
.asagiIpucu.gizli{opacity:0;pointer-events:none;animation:none}
@keyframes zipla{0%,100%{transform:translate(-50%,0)}50%{transform:translate(-50%,-6px)}}
.ozKart.vurgu{box-shadow:0 0 0 2px rgba(243,194,74,.9),0 0 22px rgba(243,194,74,.45)}
"""
open(p, 'w', encoding='utf-8').write(s)
print('ok')
