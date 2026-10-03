# 1. AŞAMA (başkan, 3 Eki): "her madde için özet blokları; kullanıcının yanlışlarına göre birleşsin; Altın Özet tüm kanun olarak kenarda".
# Altın Özet ekranı madde BLOKLARINA çevrilir. Blok = madde başlığı + (yanlış sayısı) + "Sınavda nasıl soruluyor" (kanun notundan o maddeyi
# anan satırlar) + nokta kartları (hüküm / sınavda böyle yazarlar / doğrusu, kaydedilebilir) + o maddenin sayı/makam satırları +
# "Karıştırılan maddeler" (yanlış şıkkın benzediği madde, tuzağın andığı madde, ortak noktalar).
# Sekmeler: Bana özel (yanlış yapılan maddeler, en çok yanlış önce) · Tüm kanun (bütün maddeler, kapalı bloklar) · Kaydettiklerim.
# Analiz ekranı: ana düğme "Bana özel konu özeti"; kutular: Yanlışlarım · Tüm kanun · Yeniden çöz.
import os
KOK = os.path.dirname(os.path.abspath(__file__))
p = os.path.join(KOK, 'masa4.js'); s = open(p, encoding='utf-8').read()


def r(a, b):
    global s
    assert s.count(a) == 1, (a[:80], s.count(a))
    s = s.replace(a, b)


# --- ozet(): 'bu' içeriği madde blokları + 'tum' sekmesi ---
bas = s.index("  const bu=`<p class=\"ozOzet\">")
son = s.index("  const kayitKartlar=[];")
yeni = r'''  // ---- MADDE BLOKLARI ----
  const mOf=n=>n.m[0]||'';
  const maddeNolari=[...new Set(k.n.map(mOf).filter(Boolean))].sort((a,b)=>(parseInt(a)||9999)-(parseInt(b)||9999)||String(a).localeCompare(String(b)));
  // kanun notundaki "nasıl soruluyor" satırları → madde
  const ipucuSatirlari=(()=>{const md=String(k.md||'');const mm=md.match(/###[^\n]*nasıl soruluyor[^\n]*\n([\s\S]*?)(?=\n###|$)/i);if(!mm)return [];
    return mm[1].split('\n').map(x=>x.trim()).filter(x=>/^(\d+\.|-|•)/.test(x)).map(x=>x.replace(/^(\d+\.|-|•)\s*/,'').replace(/\*\*(.+?)\*\*/g,'$1').replace(/\*(.+?)\*/g,'$1'));})();
  const ipucu=m=>ipucuSatirlari.filter(x=>new RegExp('m\\.\\s*'+m+'(?![\\d])').test(x));
  const tabloSatir=m=>[...(k.sayi||[]),...(k.makam||[])].filter(r=>String((String(r[2]||'').match(/\d+/)||[''])[0])===String(m));
  // check-up'taki yanlışlar (madde → sorular)
  const qMadde={};cu.ids.map(i=>TUM[i]).filter(Boolean).forEach(q=>{const m=maddeNo(q);if(!m)return;const o=qMadde[m]=qMadde[m]||{n:0,y:[]};o.n++;if(K.tani[kid(q.i)]===0)o.y.push(q);});
  // karıştırılan maddeler
  const kelS=t=>new Set(String(t||'').toLocaleLowerCase('tr').replace(/[^a-zçğıöşü0-9 ]/g,' ').split(/\s+/).filter(w=>w.length>=5||/\d/.test(w)));
  const nKel=k.n.map(n=>({m:mOf(n),s:kelS(n.b+' '+n.h)}));
  const karis=m=>{const sk={};const ekle=(x,p)=>{if(x&&x!==m&&maddeNolari.includes(x))sk[x]=(sk[x]||0)+p;};
    ((qMadde[m]||{}).y||[]).forEach(q=>{const c=K.cevap[kid(q.i)];if(c===undefined)return;const ck=kelS(q.s[c]);let en=null,ep=0;nKel.forEach(o=>{if(o.m===m)return;let p=0;ck.forEach(w=>{if(o.s.has(w))p++;});if(p>ep){ep=p;en=o.m;}});if(ep>=2)ekle(en,2);});
    k.tz.forEach(z=>{if(tzMadde(z)!==m)return;(String(z.d+' '+z.y).match(/m\.\s*(\d+)/g)||[]).forEach(t=>ekle(t.replace(/\D/g,''),1));});
    k.n.forEach(n=>{if(n.m.includes(m)&&n.m.length>1)n.m.forEach(x=>ekle(x,1));});
    return Object.entries(sk).sort((a,b)=>b[1]-a[1]).slice(0,4).map(x=>x[0]);};
  const blok=(m,acik,bana)=>{const ns=k.n.filter(n=>mOf(n)===m);const qm=qMadde[m];const ip=ipucu(m);const ts=tabloSatir(m);const kr=karis(m);
    const eslesen=new Set(Object.values(tzEsle(k)).flat());const artikTz=k.tz.filter((z,i)=>tzMadde(z)===m&&!eslesen.has(i));
    return `<details class="mBlok ${qm&&qm.y.length?'hatali':''}" data-m="${m}" ${acik?'open':''}><summary class="mBas"><span class="ozNo">m.${esc(m)}</span><b>${esc(maddeBaslik(k,m))}</b>${qm&&qm.y.length?`<span class="mYanlis">${qm.y.length}/${qm.n} yanlış</span>`:''}<span class="acilirOk">${IK.sag}</span></summary>
      ${ip.length?`<div class="mIpucu"><small>${IK.hedef} Sınavda nasıl soruluyor</small>${ip.map(x=>`<p>${vurgula(x)}</p>`).join('')}</div>`:''}
      ${ns.map(n=>kart(n)).join('')}
      ${bana?artikTz.filter(z=>!kullanilanTz.has(k.id+'-tz'+k.tz.indexOf(z))).map(tuzakKart).join(''):''}
      ${ts.length?`<div class="ezber mEzber"><small>Ezberle</small>${ts.map(r=>`<div class="ezSatir"><span class="ezKonu">${esc(r[0])}</span><b class="ezDeger">${esc(r[1])}</b></div>`).join('')}</div>`:''}
      ${kr.length?`<div class="mKaris"><small>Karıştırılan maddeler</small><div>${kr.map(x=>`<button class="mGit" data-git="${esc(x)}">m.${esc(x)} · ${esc(maddeBaslik(k,x))}</button>`).join('')}</div></div>`:''}
    </details>`;};
  const banaM=Object.keys(qMadde).filter(m=>qMadde[m].y.length&&maddeNolari.includes(m)).sort((a,b)=>qMadde[b].y.length-qMadde[a].y.length);
  const yanlisToplam=Object.values(qMadde).reduce((a,o)=>a+o.y.length,0);
  const bu=`<p class="ozOzet">${esc(kisa(k))} · check-up ${tarihYaz(cu.tarih)} · ${ozC.d}/${ozC.n} doğru · ${yanlisToplam} yanlış, ${banaM.length} madde</p>
    ${tipler.length?`<div class="tuzakKutu bilgi"><span class="tuzakIk">${IK.unlem}</span><div><b>Hata yaptığın soru tipi: ${tipler.map(t=>esc((TIPLER.find(x=>x[0]===t)||[])[1]||t)).join(', ')}</b><p>${tipler.map(t=>esc(TIP_TAVSIYE[t]||'')).join(' ')}</p></div></div>`:''}
    ${banaM.length?banaM.map((m,i)=>blok(m,i<3,true)).join(''):'<p class="kucukNot">Bu check-up\'ta yanlışın yok. Kanunun tamamına "Tüm kanun" sekmesinden bakabilirsin.</p>'}
    <button class="anaBtn2 ikincil" id="tumGec">Kanunun tüm Altın Özeti ${IK.ok}<small>bütün maddeler, sırayla</small></button>`;
  const tum=`<p class="ozOzet">${esc(kisa(k))} · ${maddeNolari.length} madde · ${k.n.length} nokta</p>
    ${maddeNolari.map(m=>blok(m,false,false)).join('')}
    ${tablo('Sayılar ve süreler',k.sayi||[],'Sınavda en çok oynanan rakamlar.')}${tablo('Yetkili makamlar',k.makam||[],'Hangi işi kim yapar?')}`;
'''
s = s[:bas] + yeni + s[son:]

r("""  $('#ekran').innerHTML=`<div class="ustBar"><button class="geriIk" id="geri">‹</button><h2>Altın Özet</h2><span></span></div>
  <div class="segment" id="ozSekme"><button data-s="bu" aria-pressed="${sekme==='bu'}">Eksik maddelerim</button><button data-s="kayit" aria-pressed="${sekme==='kayit'}">Kaydettiklerim</button></div>
  ${sekme==='bu'?bu:kayitliHtml+(kayitKartlar.length?eskiKayitliHtml:'')}`;""",
  """  $('#ekran').innerHTML=`<div class="ustBar"><button class="geriIk" id="geri">‹</button><h2>${sekme==='tum'?'Altın Özet':sekme==='kayit'?'Kaydettiklerim':'Bana özel konu özeti'}</h2><span></span></div>
  <div class="segment uclu" id="ozSekme"><button data-s="bu" aria-pressed="${sekme==='bu'}">Bana özel</button><button data-s="tum" aria-pressed="${sekme==='tum'}">Tüm kanun</button><button data-s="kayit" aria-pressed="${sekme==='kayit'}">Kaydettiklerim</button></div>
  ${sekme==='bu'?bu:sekme==='tum'?tum:kayitliHtml+(kayitKartlar.length?eskiKayitliHtml:'')}`;
  if($('#tumGec'))$('#tumGec').onclick=()=>{YIGIN.pop();POP=true;ozet(id,geriHedef,'tum');};
  // karıştırılan madde: bu sayfada bloğu varsa aç ve kaydır; yoksa Tüm kanun sekmesinde aç
  const blokAc=m=>{const b=document.querySelector(`.mBlok[data-m="${m}"]`);if(!b)return false;b.open=true;setTimeout(()=>{b.scrollIntoView({behavior:'smooth',block:'start'});b.classList.add('vurgu');setTimeout(()=>b.classList.remove('vurgu'),1800);},60);return true;};
  document.querySelectorAll('[data-git]').forEach(x=>x.onclick=()=>{if(!blokAc(x.dataset.git)){YIGIN.pop();POP=true;ozet(id,geriHedef,'tum',x.dataset.git);}});""")
r("""  if(hedefM){const h=document.querySelector(`.ozKart[data-m="${hedefM}"]`);if(h){setTimeout(()=>{h.scrollIntoView({behavior:'smooth',block:'start'});h.classList.add('vurgu');},60);}}""",
  """  if(hedefM&&!blokAc(hedefM)&&sekme==='bu'){YIGIN.pop();POP=true;ozet(id,geriHedef,'tum',hedefM);return;}""")
r("document.querySelectorAll('#ozSekme button').forEach(b=>b.onclick=()=>{YIGIN.pop();POP=true;ozet(id,geriHedef,b.dataset.s);});",
  "document.querySelectorAll('#ozSekme button').forEach(b=>b.onclick=()=>{YIGIN.pop();POP=true;ozet(id,geriHedef,b.dataset.s);});")
# noktalar/takviye artık kullanılmıyor ama zararsız; kart() içindeki kullanilanTz gerekli.

# --- analiz ekranı: ana düğme Bana özel konu özeti; kutular Yanlışlarım · Tüm kanun · Yeniden çöz ---
r("""    ${yanlislar.length?`<button class="anAna" id="yOzetAc"><span class="anIk">${IK.belge}</span><span class="anMetin"><b>Yanlışlarımın özeti</b><small>${yanlislar.length} yanlışın doğrusu ve nedeni</small></span><span class="anOk">${IK.sag}</span></button>`:''}
    <div class="anIzgara">
      <button class="anKutu ${yanlislar.length?'':'dolu'}" id="ozetAc">${IK.kitap}<b>Altın Özet</b></button>
      ${yanlislar.length?`<button class="anKutu" id="asagiLink">${IK.hedef}<b>${yanlislar.length} yanlış soru</b></button>`:''}
      <button class="anKutu" id="yenidenUst">${IK.grafik}<b>Yeniden çöz</b></button>
    </div>""",
  """    ${yanlislar.length?`<button class="anAna" id="ozetAc"><span class="anIk">${IK.kitap}</span><span class="anMetin"><b>Bana özel konu özeti</b><small>${eksik.length} eksik maddenin anlatımı, ipuçları ve tuzakları</small></span><span class="anOk">${IK.sag}</span></button>`:''}
    <div class="anIzgara">
      ${yanlislar.length?`<button class="anKutu" id="yOzetAc">${IK.hedef}<b>Yanlışlarım (${yanlislar.length})</b></button>`:''}
      <button class="anKutu ${yanlislar.length?'':'dolu'}" id="tumOzet">${IK.belge}<b>Tüm kanun özeti</b></button>
      <button class="anKutu" id="yenidenUst">${IK.grafik}<b>Yeniden çöz</b></button>
    </div>""")
r("$('#ozetAc').onclick=()=>ozet(id,()=>checkupAnaliz(id,geriHedef));",
  "if($('#ozetAc'))$('#ozetAc').onclick=()=>ozet(id,()=>checkupAnaliz(id,geriHedef),'bu');$('#tumOzet').onclick=()=>ozet(id,()=>checkupAnaliz(id,geriHedef),'tum');")
# Yanlışlarım ekranı sonu → Bana özel konu özeti
r("""  <button class="anaBtn2 ikincil" id="ozetGit">Altın Özeti aç ${IK.ok}</button>`;""",
  """  <button class="anaBtn2 ikincil" id="ozetGit">Bana özel konu özeti ${IK.ok}<small>yanlış yaptığın maddelerin anlatımı, ipuçları ve tuzakları</small></button>`;""")
r("$('#ozetGit').onclick=()=>ozet(id,()=>yanlisOzet(id));", "$('#ozetGit').onclick=()=>ozet(id,()=>yanlisOzet(id),'bu');")
r("<h2>Yanlışlarımın özeti</h2>", "<h2>Yanlışlarım</h2>")
r("""<button class="anaBtn2" id="yOzetAc2">Yanlışlarımın özeti ${IK.ok}<small>Her yanlışın doğrusu ve nedeni, madde madde</small></button>""",
  """<button class="anaBtn2" id="yOzetAc2">Bana özel konu özeti ${IK.ok}<small>yanlış yaptığın maddelerin anlatımı, ipuçları ve tuzakları</small></button>""")
r("if($('#yOzetAc2'))$('#yOzetAc2').onclick=()=>yanlisOzet(id);", "if($('#yOzetAc2'))$('#yOzetAc2').onclick=()=>ozet(id,()=>checkupAnaliz(id,geriHedef),'bu');")
open(p, 'w', encoding='utf-8').write(s)

c = os.path.join(KOK, 'stil4.css'); t = open(c, encoding='utf-8').read()
t += """
/* Madde blokları (3 Eki, 1. aşama) */
.segment.uclu button{font-size:13.5px;padding-left:4px;padding-right:4px}
.mBlok{margin-top:10px;border-radius:16px;border:1px solid rgba(67,203,218,.28);background:rgba(3,30,46,.55);padding:0 10px}
.mBlok.hatali{border-color:rgba(232,90,79,.55)}
.mBlok[open]{padding-bottom:10px}
.mBlok>summary{list-style:none;display:grid;grid-template-columns:auto minmax(0,1fr) auto 18px;gap:8px;align-items:center;padding:12px 4px;cursor:pointer;-webkit-tap-highlight-color:transparent}
.mBlok>summary::-webkit-details-marker{display:none}.mBlok>summary::marker{content:''}
.mBas b{font-size:15.5px;color:#fff;line-height:1.3}
.mYanlis{font-size:11.5px;font-weight:800;color:#FF8F86;background:rgba(232,90,79,.14);border:1px solid rgba(232,90,79,.5);border-radius:999px;padding:2px 8px;white-space:nowrap}
.mBlok .acilirOk{color:#F8D57A;transform:rotate(90deg);transition:transform .2s}.mBlok .acilirOk svg{width:16px;height:16px}.mBlok[open] .acilirOk{transform:rotate(-90deg)}
.mIpucu{padding:10px 12px;border-radius:12px;background:rgba(67,203,218,.08);border:1px solid rgba(67,203,218,.4);margin-bottom:8px}
.mIpucu small{display:flex;align-items:center;gap:6px;font-size:10.5px;letter-spacing:1.2px;text-transform:uppercase;color:#9FDCE6;font-weight:800}.mIpucu small svg{width:13px;height:13px}
.mIpucu p{margin:5px 0 0;font-size:14px;line-height:1.5;color:#E6EEF1}
.mEzber{margin-top:8px}.mEzber>small,.mKaris>small{display:block;font-size:10.5px;letter-spacing:1.2px;text-transform:uppercase;color:#F8D57A;font-weight:800;margin-bottom:4px}
.mKaris{margin-top:10px}.mKaris>div{display:flex;flex-wrap:wrap;gap:6px}
.mGit{padding:6px 10px;border-radius:999px;border:1px solid rgba(243,194,74,.55);background:rgba(243,194,74,.08);color:#F8D57A;font-size:12.5px;font-weight:700;text-align:left}
.mBlok.vurgu{box-shadow:0 0 0 2px rgba(243,194,74,.9),0 0 22px rgba(243,194,74,.4)}
.mBlok .ozKart{margin-top:8px}
"""
open(c, 'w', encoding='utf-8').write(t)
print('ok')
