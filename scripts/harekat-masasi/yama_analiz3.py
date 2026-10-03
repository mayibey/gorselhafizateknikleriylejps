# Check-up analizi (başkan, 3 Eki gece):
# 1) Skor, kanunun GÜNCEL soru setinden hesaplanır (soru çıkarılırsa skordan düşer; eklenirse "kalan" olur) — cuOzet().
# 2) "Hangi soru tipinde hata yapıyorsun?" yalnız yanlışı olan tipleri gösterir; hiç yanlış yoksa bölüm hiç çıkmaz.
# 3) Sabit (fixed) "Yanlış yaptığın N soru aşağıda" balonu düğmelerin üstüne biniyordu → kaldırıldı; yerine skor kartının altında satır içi bağlantı.
# 4) Check-up listesindeki yüzde ve rozet de cuOzet() ile.
import os
KOK = os.path.dirname(os.path.abspath(__file__))
p = os.path.join(KOK, 'masa4.js'); s = open(p, encoding='utf-8').read()


def r(a, b):
    global s
    assert s.count(a) == 1, (a[:70], s.count(a))
    s = s.replace(a, b)


r("const kalanSorular=(k,cu)=>{",
  """// Check-up özeti GÜNCEL soru setine göre: kayıttaki kimliklerden kanunda hâlâ duranlar sayılır (soru çıkarılır/eklenir, kapsam değişir).
const cuOzet=(k,cu)=>{const var_=new Set(k.q.map(q=>kid(q.i)));const ids=(cu.ids||[]).filter(i=>var_.has(kid(i)));
  const d=ids.filter(i=>K.tani[kid(i)]===1).length;const n=ids.length;return {d,n,oran:n?d/n:0,kalan:k.q.length-n};};
const kalanSorular=(k,cu)=>{""")
# analiz skoru
r("  const oran=cu.d/cu.n;\n  // madde bazlı",
  "  const oz=cuOzet(k,cu);const oran=oz.oran;\n  // madde bazlı")
r("""<b class="hzSayi kucukSayi">${cu.d}<small> / ${cu.n} doğru</small></b><div class="tipAltSatir">${bar(oran,oranRenk(oran))}<span class="tipYuzde">%${Math.round(oran*100)}</span></div>${cu.n<k.q.length?`<p>Bu kanunun ${k.q.length} sorusundan ${cu.n}'i çözüldü.</p>`:''}</div></section>""",
  """<b class="hzSayi kucukSayi">${oz.d}<small> / ${oz.n} doğru</small></b><div class="tipAltSatir">${bar(oran,oranRenk(oran))}<span class="tipYuzde">%${Math.round(oran*100)}</span></div>${oz.kalan>0?`<p>Bu kanunun ${k.q.length} sorusundan ${oz.n} tanesini çözdün; ${oz.kalan} soru yeni ya da çözülmedi.</p>`:''}</div></section>
  ${yanlislar.length?`<button class="asagiLink" id="asagiLink">Yanlış yaptığın ${yanlislar.length} soru aşağıda <span class="asagiOk">${IK.sag}</span></button>`:''}""")
# tip bölümü
r("  const tipler=tipIst(sorular).filter(t=>t.n>=1).sort((a,b)=>(a.oran??1)-(b.oran??1));",
  "  const tipler=tipIst(sorular).filter(t=>t.n>=1&&t.d<t.n).sort((a,b)=>(a.oran??1)-(b.oran??1));")
r("""  <details class="acilir"><summary><span class="hedefIk">${IK.hedef}</span>Hangi soru tipinde hata yapıyorsun?<span class="rozet">${tipler.filter(t=>t.d<t.n).length}</span><span class="acilirOk">${IK.sag}</span></summary>
  <section class="liste">${tipler.map(t=>{const hata=1-t.oran;return `<div class="satir"><span class="satirAd">${esc(t.ad)}</span>${bar(hata,oranRenk(1-hata))}<span class="satirDeger">%${Math.round(hata*100)}</span><span class="satirKucuk">${t.n-t.d}/${t.n} yanlış</span></div>`}).join('')||'<p class="kucukNot">Tip ayrımı için yeterli soru yok.</p>'}</section></details>""",
  """  ${tipler.length?`<details class="acilir"><summary><span class="hedefIk">${IK.hedef}</span>Hangi soru tipinde hata yapıyorsun?<span class="rozet">${tipler.length}</span><span class="acilirOk">${IK.sag}</span></summary>
  <section class="liste">${tipler.map(t=>{const hata=1-t.oran;return `<div class="satir"><span class="satirAd">${esc(t.ad)}</span>${bar(hata,'#E85A4F')}<span class="satirDeger">%${Math.round(hata*100)}</span><span class="satirKucuk">${t.n-t.d}/${t.n} yanlış</span></div>`}).join('')}</section></details>`:''}""")
# sabit balonu kaldır
r("""  <button class="asagiIpucu" id="asagiIpucu">Yanlış yaptığın ${yanlislar.length} soru aşağıda <span class="asagiOk">${IK.sag}</span></button>`:''}""",
  """`:''}""")
r("""  const ip=$('#asagiIpucu');
  if(ip){ ip.onclick=()=>{$('#yanlisBaslik').scrollIntoView({behavior:'smooth',block:'start'});ip.classList.add('gizli');};
    const g=()=>{ if(window.scrollY>80){ip.classList.add('gizli');window.removeEventListener('scroll',g);} };
    window.addEventListener('scroll',g,{passive:true});
    if(document.documentElement.scrollHeight<=window.innerHeight+120)ip.classList.add('gizli'); }""",
  """  if($('#asagiLink'))$('#asagiLink').onclick=()=>$('#yanlisBaslik').scrollIntoView({behavior:'smooth',block:'start'});""")
# liste: yüzde ve rozet
r("""    const kalanN=cu?kalanSorular(x.k,cu).length:0;const kismi=kalanN>0;""",
  """    const oz=cu?cuOzet(x.k,cu):null;const kalanN=cu?kalanSorular(x.k,cu).length:0;const kismi=kalanN>0;""")
r("""    const oran=cu?cu.d/cu.n:durum==='devam'?cevaplanan/bolumBoyu(x.k):0;""",
  """    const oran=cu?oz.oran:durum==='devam'?cevaplanan/bolumBoyu(x.k):0;""")
open(p, 'w', encoding='utf-8').write(s)
p = os.path.join(KOK, 'stil4.css'); s = open(p, encoding='utf-8').read()
s += "\n.asagiLink{display:flex;align-items:center;justify-content:center;gap:6px;width:100%;margin:10px 0 0;padding:9px 12px;border-radius:12px;border:1px dashed rgba(232,90,79,.6);background:rgba(232,90,79,.08);color:#FF8F86;font-weight:800;font-size:13.5px}.asagiLink .asagiOk{display:inline-flex;transform:rotate(90deg)}.asagiLink .asagiOk svg{width:15px;height:15px}\n"
open(p, 'w', encoding='utf-8').write(s)
print('ok')
