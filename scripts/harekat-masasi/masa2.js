(()=>{
/* ================= HAREKÂT MERKEZİ v2 — Teşhis → Eksikler → Nokta Atışı ================= */
const V=JSON.parse(document.getElementById('veri').textContent);
const KANUN=V.kanun, BYID={}; KANUN.forEach(k=>{BYID[k.id]=k; k.q.forEach(q=>q.l=k.id);});
const TUM={}; KANUN.forEach(k=>k.q.forEach(q=>TUM[q.i]=q));
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const HARF='ABCDE';
const kisaAd=k=>k.ad.replace(' (müşterek kapsam)','');
const SINAV_AN=new Date('2026-10-10T10:00:00+03:00');
const kalanGun=()=>Math.max(0,Math.floor((SINAV_AN-new Date())/86400000));
const bugun=()=>new Date().toISOString().slice(0,10);
const gunEkle=(iso,n)=>{const d=new Date(iso+'T12:00:00');d.setDate(d.getDate()+n);return d.toISOString().slice(0,10);};
// Sınav ağırlığı (kanun başına beklenen soru payı; karma denemelerin MEBS dağılımı + 2024 MEBS kitapçığı)
const AGIRLIK={1:7,2:3,3:2,4:1,5:3,6:3,7:3,8:1,9:1,10:1,11:1,12:3,13:1,14:1,15:4,16:1,17:4,18:1,19:1,20:1,21:1,22:3,23:1,24:1,25:1,68:4,97:4,98:3,99:3,100:3,101:3,102:4,142:3,103:3};
const w=id=>AGIRLIK[id]||1;
const maddeNo=q=>{const m=(q.y||'').match(/m\.\s*(\d+)/i);return m?m[1]:null;};
// Soru tipleri (çıkmış sınavdaki payı: olumsuz 34.5 · makam 21.1 · boşluk 5.1 · öncüllü 4.8 · tanım 1.8)
const TIPLER=[
 ['olumsuz','Olumsuz kök ("değildir / yanlıştır")',34.5,q=>/(değildir|yanlıştır|yoktur|söylenemez|olamaz|aykırıdır|bulunmaz|sayılmaz|yer almaz|gerekmez|dışındadır)\s*\??\s*$/i.test(q.k.trim())||/hangisi(si)?\s+(yanlış|değil)/i.test(q.k)],
 ['makam','Yetkili makam / kim yapar',21.1,q=>/(\bkim\b|hangi (makam|merci|kurum|birim|kurul|komutan)|yetkili|tarafından|onaylanır|karar ver)/i.test(q.k)],
 ['sayi','Sayı, süre ve oranlar',null,q=>q.s.filter(x=>/\d|\bbir\b|\biki\b|\büç\b|dört|\bbeş\b|altı|yedi|sekiz|dokuz|\bon\b|yarı|gün|\bay\b|yıl|saat/i.test(x)).length>=4],
 ['onculu','Öncüllü sorular (I, II, III…)',4.8,q=>/(^|\n|\s)(I|II|III|IV)[\.\)\-]\s/.test(q.k)],
 ['bosluk','Boşluk doldurma',5.1,q=>/(boş bırakılan|boşluğa|\.{4,}|_{3,})/i.test(q.k)],
];
const TIP_KURAL={
 olumsuz:['Olumsuz kökte önce "değil / yanlış" kelimesinin altını çiz.','Dört şık madde metninden birebir alınır, biri tek kelime bozulur. Her şıkkı "maddede böyle mi?" diye tek tek ele; eminsen o şıkkı at. Kalan tek şık cevaptır.'],
 makam:['Makam sorularında "kim" değil "hangi seviye" diye düşün.','Şıklarda hep komşu makamlar yer değiştirir: vali↔kaymakam, Bakanlık↔Kurum, Cumhurbaşkanı↔Bakan. Hükmü hatırlamıyorsan yetkinin büyüklüğüne bak: ülke çapı → Cumhurbaşkanı/Bakanlık, il → vali, ilçe → kaymakam.'],
 sayi:['Sayı sorularında şıkların yarısı "bir kademe kaydırılmış" değerdir.','1 ay ↔ 3 ay, 15 gün ↔ 30 gün, yarı ↔ üçte bir. Emin olmadığında en uç iki şıkkı at; gerçek değer çoğu zaman ortadaki üçlüdedir. Aşağıdaki kartlar zayıf olduğun kanunların süre tablolarından.'],
 onculu:['Öncüllüde bütün öncülleri değil, emin olduğun BİR öncülü kullan.','Emin olduğun öncül doğruysa onu içermeyen şıkları at; yanlışsa onu içeren şıkları at. Genelde tek şık kalır. Kalan iki şık arasında kararsızsan, "hepsi" şıkkı yalnız gerçekten hepsinden eminsen seçilir.'],
 bosluk:['Boşluk doldurmada boşluğun ÖNCESİNİ değil SONRASINI oku.','Cümlenin devamı çoğu zaman şıkkı ele verir (ek uyumu, çoğul-tekil, "içinde / itibaren"). Şıkkı boşluğa koyup cümleyi baştan sona sesli oku; kulağa takılan yanlıştır.'],
};

/* ---------- kayıt ---------- */
const ANAHTAR='harekat-masasi-v2';
let K={tani:{},cevap:{},kn:{},kp:'mus',aktif:null,rontgen:null,checkup:{},son:null};
try{const s=JSON.parse(localStorage.getItem(ANAHTAR)||'null');if(s&&s.tani)K=Object.assign(K,s);}catch(e){}
let bulutRef=null,bulutZ=null;
function kaydet(){try{localStorage.setItem(ANAHTAR,JSON.stringify(K))}catch(e){} if(bulutRef){clearTimeout(bulutZ);bulutZ=setTimeout(bulutaYaz,1500);}}
function bulutaYaz(){if(!bulutRef)return;clearTimeout(bulutZ);bulutRef.set(JSON.parse(JSON.stringify(K))).catch(()=>{});}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&bulutZ)bulutaYaz();});
(async()=>{try{
  if(!window.claude||!claude.use)return;
  const [db,user]=await Promise.all([claude.use('db'),claude.use('user')]); if(!db||!user)return;
  const uid=await user.id(); if(!uid)return;
  const ref=db.doc('data/users/'+uid+'/masa2'); const sn=await ref.get();
  if(sn.exists){const b=sn.data(); const yerelBos=!Object.keys(K.tani).length&&!Object.keys(K.kn).length;
    if(yerelBos){K=Object.assign(K,b);} else { // birleştir: her iki tarafın kayıtlarını al
      for(const a of ['tani','cevap','kn','checkup']) K[a]=Object.assign({},b[a]||{},K[a]||{});
      K.rontgen=K.rontgen||b.rontgen||null; K.aktif=K.aktif||b.aktif||null; }
    try{localStorage.setItem(ANAHTAR,JSON.stringify(K))}catch(e){}}
  bulutRef=ref; bulutaYaz(); if(!S&&!document.body.classList.contains('sinavda')) ana();
}catch(e){}})();

/* ---------- ölçüm ---------- */
if(K.kp!=='mus'&&K.kp!=='mebs')K.kp='mus';
const kapsamKanun=()=>KANUN.filter(k=>k.g===K.kp);
const KP_AD={mus:'Müşterek',mebs:'Branş (MEBS)'};
const kpSecici=()=>`<div class="ara kpSec" id="kpSec"><button class="anahtar" data-kp="mus" aria-pressed="${K.kp==='mus'}">Müşterek</button><button class="anahtar" data-kp="mebs" aria-pressed="${K.kp==='mebs'}">Branş (MEBS)</button></div>`;
function kpBagla(yenile){document.querySelectorAll('#kpSec button').forEach(b=>b.onclick=()=>{K.kp=b.dataset.kp;kaydet();yenile();});}
function kanunDurum(k){
  let d=0,n=0;const kacan=new Set();
  for(const q of k.q){const v=K.tani[q.i];if(v===undefined)continue;n++;if(v===1)d++;else{const m=maddeNo(q);if(m)kacan.add(m);}}
  let durum='yok';
  if(n){const y=n-d;if(K.checkup[k.id]||n>=6){const o=d/n;durum=o>=.75?'iyi':o>=.5?'dikkat':'kritik';}else{durum=y===0?'iyi':y===1?'dikkat':'kritik';}}
  return {k,d,n,kacan:[...kacan],durum,oncelik:n?w(k.id)*(1-d/n):0};
}
function tipZaaf(){
  const out=[];const cevaplar=Object.entries(K.tani).map(([qi,v])=>({q:TUM[qi],v})).filter(x=>x.q);
  const genel=cevaplar.length?cevaplar.filter(x=>x.v===1).length/cevaplar.length:0;
  for(const [id,ad,pay,f] of TIPLER){const c=cevaplar.filter(x=>f(x.q));if(c.length<4)continue;const o=c.filter(x=>x.v===1).length/c.length;
    if(o<Math.min(.6,genel-.08)) out.push({id,ad,pay,n:c.length,oran:o});}
  return out.sort((a,b)=>a.oran-b.oran);
}
function endeks(){
  const ks=kapsamKanun().map(kanunDurum).filter(x=>x.n);
  const n=Object.keys(K.tani).length;
  if(!ks.length)return {deger:null,kanit:'yok',n,olcum:0};
  let wt=0,ws=0;ks.forEach(x=>{wt+=w(x.k.id);ws+=w(x.k.id)*x.d/x.n;});
  // sağlamlaşan noktalar küçük bonus (en fazla +8): öğrenme de sayılsın ama skoru şişirmesin
  const saglam=Object.values(K.kn).filter(x=>x.durum==='saglam').length;
  return {deger:Math.min(100,Math.round(ws/wt*100+Math.min(8,saglam*0.5))),kanit:n<25?'az':n<70?'orta':'yüksek',n,olcum:ks.length};
}

/* ---------- kritik noktalar (kanun → kartlar) ---------- */
function kanunKartlari(kd){
  const k=kd.k, out=[];
  const kacan=new Set(kd.kacan);
  // 1) kaçırılan maddelerin noktaları
  k.n.forEach(n=>{if(n.m.some(m=>kacan.has(m)))out.push({t:'n',id:n.i,k:k.id,n,oncelik:3});});
  // 2) kanun zayıfsa: ★ çıkmış noktalar (madde bazlı olanlardan sonra)
  if(kd.durum!=='iyi') k.n.forEach(n=>{if(n.s&&!out.some(x=>x.id===n.i))out.push({t:'n',id:n.i,k:k.id,n,oncelik:2});});
  // 3) kritikse: kaçırılan maddelerin tuzakları ve tabloları
  if(kd.durum==='kritik'){k.tz.forEach((z,i)=>{if(z.m.some(m=>kacan.has(m)))out.push({t:'tz',id:`${k.id}-tz${i}`,k:k.id,z,oncelik:3});});}
  return out;
}
function tipKartlari(z){
  const ks=kapsamKanun().map(kanunDurum).filter(x=>x.n&&x.durum!=='iyi');
  const hedef=ks.length?ks:kapsamKanun().map(kanunDurum).sort((a,b)=>w(b.k.id)-w(a.k.id)).slice(0,6);
  const out=[];
  for(const kd of hedef){const k=kd.k;
    if(z.id==='sayi')k.sayi.slice(0,6).forEach((r,i)=>out.push({t:'sayi',id:`${k.id}-s${i}`,k:k.id,r,oncelik:1}));
    if(z.id==='makam')k.makam.slice(0,6).forEach((r,i)=>out.push({t:'makam',id:`${k.id}-m${i}`,k:k.id,r,oncelik:1}));
    if(z.id==='olumsuz')k.tz.slice(0,5).forEach((zz,i)=>out.push({t:'tz',id:`${k.id}-tz${i}`,k:k.id,z:zz,oncelik:1}));
  }
  return out;
}
function tumKartlar(){
  const ks=kapsamKanun().map(kanunDurum).filter(x=>x.n&&x.durum!=='iyi').sort((a,b)=>b.oncelik-a.oncelik);
  let out=[];ks.forEach(kd=>out.push(...kanunKartlari(kd).map(c=>({...c,oncelik:c.oncelik*10+w(kd.k.id)*(1-kd.d/kd.n)}))));
  tipZaaf().forEach(z=>out.push(...tipKartlari(z)));
  const g={};for(const c of out){if(!g[c.id]||g[c.id].oncelik<c.oncelik)g[c.id]=c;}
  return Object.values(g).sort((a,b)=>b.oncelik-a.oncelik);
}
const kartDurum=id=>K.kn[id]||null;
const kapali=id=>{const d=kartDurum(id);return d&&(d.durum==='saglam'||d.durum==='bildi');};
function tekrarlar(){const t=bugun();return tumKartlar().filter(c=>{const d=kartDurum(c.id);return d&&!kapali(c.id)&&d.sonraki&&d.sonraki<=t;});}
function yeniKartlar(){return tumKartlar().filter(c=>!kartDurum(c.id));}

/* ---------- ANA EKRAN ---------- */
function ana(){
  document.body.classList.remove('sinavda');window.scrollTo({top:0});S=null;
  const g=kalanGun(), E=endeks();
  if(!E.deger){giris();return;}
  const ks=kapsamKanun().map(kanunDurum), eksik=ks.filter(x=>x.n&&x.durum!=='iyi').sort((a,b)=>b.oncelik-a.oncelik);
  const iyi=ks.filter(x=>x.n&&x.durum==='iyi'), yok=ks.filter(x=>!x.n);
  const tk=tekrarlar(), yeni=yeniKartlar(), zaaf=tipZaaf();
  const doz=Math.min(g<=2?20:15,tk.length+yeni.length);
  let ana1;
  if(g<=2) ana1={id:'sonkontrol',m:`Son kontrol · 30 soru · ~20 dk`,alt:'Sınava '+(g<=0?'saatler':g+' gün')+' kaldı: en çok çıkan kanunlardan 30 soru, sonra karıştırdıkların.'};
  else if(tk.length) ana1={id:'nokta',m:`Tekrar · ${Math.min(doz,tk.length+yeni.length)} nokta · ~${Math.ceil(doz*0.75)} dk`,alt:`${tk.length} nokta bugün tekrar edilecek${yeni.length?', sonra yeni noktalar':''}.`};
  else if(yeni.length) ana1={id:'nokta',m:`Nokta Atışı · ${doz} nokta · ~${Math.ceil(doz*0.75)} dk`,alt:yeni.length>40?'En çok puan götüren eksiklerden başlıyoruz; bitince sıradaki dilim gelir.':`${yeni.length} kritik nokta sırada. En çok puan götürenden başlıyoruz.`};
  else if(yok.length) ana1={id:'rontgen',m:`Röntgeni tamamla · ${yok.length} kanun`,alt:'Henüz ölçmediğimiz kanunlar var.'};
  else ana1={id:'checkup',m:'Check-up · bölüm bölüm derinleş',alt:'Açık eksik kalmadı. Madde düzeyine inmek için bir kanun seç.'};
  const durumAd={kritik:'Kritik',dikkat:'Dikkat',iyi:'Sorun görünmedi',yok:'Ölçülmedi'};
  const durumRenk={kritik:'#FF8F86',dikkat:'var(--altin2)',iyi:'var(--dogru)',yok:'var(--soluk2)'};
  const satir=x=>{const kart=kanunKartlari(x), acik=kart.filter(c=>!kapali(c.id)).length, cu=K.checkup[x.k.id];
    return `<div class="ek" style="--r:${durumRenk[x.durum]}"><div class="ekUst"><span class="hd">${durumAd[x.durum]}</span><b>${esc(kisaAd(x.k))}</b>
      <small>${x.d}/${x.n} doğru${x.kacan.length?` · yanlış: ${x.kacan.slice(0,6).map(m=>'m.'+m).join(', ')}`:''}${cu?' · check-up yapıldı':' · röntgen'}</small></div>
      <div class="ekAlt">${acik?`<button class="btn kucuk ana" data-na="${x.k.id}">Nokta Atışı · ${acik}</button>`:'<span class="cip">noktalar kapandı</span>'}
      ${cu?`<button class="btn kucuk" data-not="${x.k.id}">Özet</button>`:`<button class="btn kucuk" data-kapat="${x.k.id}">Kanunu kapat · ~8 dk</button>`}</div></div>`;};
  const zsatir=z=>{const kart=tipKartlari(z), acik=kart.filter(c=>!kapali(c.id)).length;
    return `<div class="ek" style="--r:#FF8F86"><div class="ekUst"><span class="hd">Soru tipi</span><b>${esc(z.ad)}</b><small>%${Math.round(z.oran*100)} doğru (${z.n} soru)${z.pay?` · sınavdaki payı ≈%${z.pay}`:''}</small></div>
      <div class="ekAlt">${acik?`<button class="btn kucuk ana" data-tip="${z.id}">Nokta Atışı · ${acik}</button>`:'<span class="cip">kartlar kapandı</span>'}</div></div>`;};
  $('#ekran').innerHTML=`
  ${kpSecici()}
  <section class="ozet">
    <div class="oz1"><span class="lbl">Hazırlık</span><b class="buyuk">${E.deger??'—'}<small>/100</small></b><span class="kanit">Kanıt: ${E.kanit}${E.n?` · ${E.n} cevap · ${E.olcum}/${kapsamKanun().length} kanun ölçüldü`:''}</span></div>
    <div class="oz2"><span class="lbl">Sınava</span><b class="buyuk">${g}<small> gün</small></b><span class="kanit">10 Ekim 2026 · 10.00</span></div>
  </section>
  <button class="anaBtn" id="anaBtn"><b>${esc(ana1.m)}</b><small>${esc(ana1.alt)}</small></button>
  <div class="bolumBas"><h2>Eksiklerin</h2><p>${eksik.length?'sınavda en çok puan götürenden aşağıya':'ölçülen kanunlarda açık eksik yok'}</p></div>
  <div class="ekler">${eksik.slice(0,8).map(satir).join('')}${zaaf.map(zsatir).join('')}</div>
  ${eksik.length>8?`<details class="iyiler"><summary>Diğer eksikler (${eksik.length-8}) — önce yukarıdakiler</summary><div class="ekler">${eksik.slice(8).map(satir).join('')}</div></details>`:''}
  ${iyi.length?`<details class="iyiler"><summary>Sorun görünmeyenler (${iyi.length})</summary><div class="ekler">${iyi.map(satir).join('')}</div></details>`:''}
  ${yok.length?`<details class="iyiler"><summary>Henüz ölçülmeyenler (${yok.length})</summary><p class="kucukNot">Röntgen bunları da ölçer; ya da Check-up'tan tek tek seç.</p></details>`:''}
  <div class="altLinkler">
    <button id="lRontgen">Yeniden röntgen</button><span>·</span>
    <button id="lCheckup">Check-up · ${kapsamKanun().filter(k=>K.checkup[k.id]).length}/${kapsamKanun().length} bölüm</button><span>·</span>
    <button id="lDaha">Daha fazla</button>
  </div>`;
  $('#anaBtn').onclick=()=>({sonkontrol:sonKontrol,nokta:()=>noktaAtisi(),rontgen:()=>rontgenBaslat(true),checkup:checkupListe})[ana1.id]();
  document.querySelectorAll('[data-na]').forEach(b=>b.onclick=()=>noktaAtisi(+b.dataset.na));
  document.querySelectorAll('[data-kapat]').forEach(b=>b.onclick=()=>kanunKapat(+b.dataset.kapat));
  document.querySelectorAll('[data-not]').forEach(b=>b.onclick=()=>ozet(+b.dataset.not,true));
  document.querySelectorAll('[data-tip]').forEach(b=>b.onclick=()=>noktaAtisi(null,b.dataset.tip));
  $('#lRontgen').onclick=()=>rontgenBaslat(false);$('#lCheckup').onclick=checkupListe;$('#lDaha').onclick=dahaFazla;kpBagla(ana);
}

/* ---------- GİRİŞ ---------- */
function giris(){
  document.body.classList.remove('sinavda');window.scrollTo({top:0});
  const g=kalanGun(), ks=kapsamKanun();
  const rSoru=ks.reduce((a,k)=>a+(w(k.id)>=4?2:1),0);
  $('#ekran').innerHTML=`
  <section class="girisBas"><span class="lbl">Sınava</span><b>${g} gün</b><p>Önce durumunu görelim. Çalışmış ya da çalışmamış olman fark etmez: nerede eksiğin var onu bulur, sadece orayı kapatırız.</p></section>
  <p class="kucukNot" style="text-align:center">Önce hangisi: müşterek mevzuat mı, branş mevzuatı mı?</p>
  ${kpSecici()}
  <div class="tarama2">
    <div class="kart tur"><span class="rozet">~12 dk · ${rSoru} soru</span><h3>Röntgen</h3>
      <p>Her kanundan bir soru, çok çıkanlardan iki. Yanlış yaptığın kanundan farklı maddelerle iki soru daha sorar, emin olur. Cevaplar sonda.</p>
      <p class="kucukNot">Sonuç: kanun kanun nerede eksiksin + hangi soru tipinde zayıfsın.</p>
      <button class="btn ana" id="bRontgen">Röntgeni çek</button></div>
    <div class="kart tur"><span class="rozet">Bölüm bölüm · ${ks.length} bölüm</span><h3>Check-up</h3>
      <p>Her kanun ayrı bölüm, 8-12 soru, maddelere dağıtılmış. İstediğin bölümü istediğin zaman; bölüm bitince cevaplar hemen.</p>
      <p class="kucukNot">Sonuç: madde madde nerede eksiksin.</p>
      <button class="btn" id="bCheckup">Check-up'a başla</button></div>
  </div>
  <div class="altLinkler"><button id="lDaha">Daha fazla: konu notları · soru bankası · prova</button></div>`;
  kpBagla(ana);
  $('#bRontgen').onclick=()=>rontgenBaslat(false);$('#bCheckup').onclick=checkupListe;$('#lDaha').onclick=dahaFazla;
}

/* ---------- soru seçimi ---------- */
function karistir(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a;}
function maddeyeGoreSec(k,adet,haric){
  const g={};karistir(k.q).forEach(q=>{if(haric&&haric.has(q.i))return;const m=maddeNo(q)||'?';(g[m]=g[m]||[]).push(q);});
  const anahtar=karistir(Object.keys(g));const out=[];let tur=0;
  while(out.length<adet&&anahtar.some(a=>g[a].length)){for(const a of anahtar){if(out.length>=adet)break;if(g[a].length)out.push(g[a].shift());}if(++tur>30)break;}
  return out;
}
/* ---------- RÖNTGEN (uyarlamalı, cevaplar sonda) ---------- */
function rontgenBaslat(sadeceOlculmeyen){
  let ks=kapsamKanun(); if(sadeceOlculmeyen) ks=ks.filter(k=>!kanunDurum(k).n);
  const sorular=[];for(const k of ks){const haric=new Set(Object.keys(K.tani));sorular.push(...maddeyeGoreSec(k,w(k.id)>=4?2:1,haric).concat(maddeyeGoreSec(k,w(k.id)>=4?2:1)).slice(0,w(k.id)>=4?2:1));}
  basla(karistir(sorular),'Röntgen',{tani:true,tur:'rontgen',ek:false});
}
function rontgenEk(){
  if(!S.meta||S.meta.tur!=='rontgen'||S.meta.ek)return false; S.meta.ek=true;
  const zaten=new Set([...S.sorular.map(q=>q.i),...Object.keys(K.tani)]);const ek=[];
  const yanlisK=[...new Set(S.sorular.filter((q,i)=>S.cevap[i]!==q.d).map(q=>q.l))];
  for(const id of yanlisK){const kacanM=new Set(S.sorular.filter((q,i)=>q.l===id&&S.cevap[i]!==q.d).map(maddeNo));
    const havuz=BYID[id].q.filter(q=>!zaten.has(q.i)&&!kacanM.has(maddeNo(q)));const s=maddeyeGoreSec({q:havuz},2);if(s.length<2)s.push(...maddeyeGoreSec({q:BYID[id].q.filter(q=>!zaten.has(q.i)&&!s.includes(q))},2-s.length));ek.push(...s);}
  if(!ek.length)return false;
  S.sorular.push(...karistir(ek));S.i++;toast(`Emin olmak için ${yanlisK.length} kanuna ikişer soru daha`);soruCiz();return true;
}
function rontgenBitir(){
  S.sorular.forEach((q,i)=>{if(S.cevap[i]!==undefined){K.tani[q.i]=S.cevap[i]===q.d?1:0;K.cevap[q.i]=S.cevap[i];}});
  K.rontgen={tarih:bugun(),n:S.sorular.length};K.aktif=null;kaydet();S=null;
  toast('Röntgen tamam. Eksiklerin çıktı.');ana();
}
/* ---------- CHECK-UP (bölüm bölüm, cevaplar bölüm sonunda) ---------- */
function checkupListe(){
  document.body.classList.remove('sinavda');window.scrollTo({top:0});
  const ks=kapsamKanun().map(kanunDurum).sort((a,b)=>(b.durum!=='iyi'&&b.n?1:0)-(a.durum!=='iyi'&&a.n?1:0)||b.oncelik-a.oncelik||w(b.k.id)-w(a.k.id));
  const bolumBoyu=k=>Math.max(8,Math.min(12,w(k.id)*2+6));
  $('#ekran').innerHTML=`<button class="geri" id="geri">‹ Geri</button>
  <div class="mvBas"><div><h2>Check-up</h2><div class="kapsam">${KP_AD[K.kp]} · ${ks.filter(x=>K.checkup[x.k.id]).length}/${ks.length} bölüm · her bölüm 8-12 soru · cevaplar bölüm sonunda</div></div></div>
  <p class="kucukNot">${K.rontgen?'Röntgen\'de zayıf çıkan kanunlar üstte.':'Sınavda çok çıkan kanunlar üstte.'} Bir bölüm ≈ 5 dk.</p>
  <div class="ekler">${ks.map(x=>`<button class="ek tik2 ${K.checkup[x.k.id]?'yapildi':''}" data-id="${x.k.id}" style="--r:${x.durum==='kritik'?'#FF8F86':x.durum==='dikkat'?'var(--altin2)':x.durum==='iyi'?'var(--dogru)':'var(--soluk2)'}"><div class="ekUst"><span class="hd">${K.checkup[x.k.id]?'Yapıldı · '+x.d+'/'+x.n:x.n?'Röntgen: '+x.d+'/'+x.n:'Ölçülmedi'}</span><b>${esc(kisaAd(x.k))}</b><small>${bolumBoyu(x.k)} soru · ağırlık ${w(x.k.id)}</small></div><span class="ok">›</span></button>`).join('')}</div>`;
  $('#geri').onclick=ana;
  document.querySelectorAll('.tik2').forEach(b=>b.onclick=()=>checkupBolum(+b.dataset.id));
}
function checkupBolum(id){
  const k=BYID[id];const adet=Math.max(8,Math.min(12,w(id)*2+6));
  const haric=new Set(Object.keys(K.tani));let s=maddeyeGoreSec(k,adet,haric);if(s.length<adet)s.push(...maddeyeGoreSec({q:k.q.filter(q=>!s.includes(q))},adet-s.length));
  basla(s,`Check-up · ${kisaAd(k)}`,{tani:true,tur:'checkup',kanun:id});
}
function checkupBitir(){
  const id=S.meta.kanun;let d=0,n=0;
  S.sorular.forEach((q,i)=>{if(S.cevap[i]!==undefined){const v=S.cevap[i]===q.d?1:0;K.tani[q.i]=v;K.cevap[q.i]=S.cevap[i];n++;d+=v;}});
  K.checkup[id]={tarih:bugun(),d,n};K.aktif=null;kaydet();
  sonucEkrani(()=>{S=null;ana();},'Eksiklerine dön');
}
/* ---------- KANUNU KAPAT: özet → 10 soru → kaçırılanlar ---------- */
function kanunKapat(id){ozet(id,false);}
function ozet(id,sadeceOku){
  document.body.classList.remove('sinavda');window.scrollTo({top:0});
  const k=BYID[id], kd=kanunDurum(k), kacan=new Set(kd.kacan);
  const yildiz=k.n.filter(n=>n.s), digerKacan=k.n.filter(n=>!n.s&&n.m.some(m=>kacan.has(m)));
  const nokta=n=>`<li class="${n.s?'yildizli':''} ${n.m.some(m=>kacan.has(m))?'kacan':''}">${n.s?'<span class="yld">★</span>':''}${n.m.some(m=>kacan.has(m))?'<span class="etk tz">Yanlış yaptın</span>':''}<b>${esc(n.b)}</b> — ${esc(n.h)}${n.nd?`<div class="nd"><span class="etk nd">Ne demek</span>${esc(n.nd)}</div>`:''}${n.t?`<div class="nd"><span class="etk tz">Tuzak</span>${esc(n.t)}</div>`:''}</li>`;
  $('#ekran').innerHTML=`<button class="geri" id="geri">‹ Eksiklerin</button>
  <div class="mvBas"><div><h2>${esc(kisaAd(k))}</h2><div class="kapsam">Hızlı özet · yalnız çıkmış ★ noktalar${digerKacan.length?' + yanlış yaptığın maddeler':''} · ${yildiz.length+digerKacan.length} nokta · ~${Math.max(2,Math.ceil((yildiz.length+digerKacan.length)/6))} dk</div></div>
    ${sadeceOku?`<button class="btn ana" id="na">Nokta Atışı</button>`:`<button class="btn ana" id="devam">10 soruya geç ›</button>`}</div>
  ${sadeceOku?'':'<p class="kucukNot">Okumak istemiyorsan doğrudan sorulara geçebilirsin; yanlış yaptığın maddeler nokta atışına düşer.</p>'}
  <div class="not"><ul>${digerKacan.map(nokta).join('')}${yildiz.map(nokta).join('')}</ul>
  ${k.tz.length?`<h3>"Yanlıştır" tuzakları</h3><ul>${k.tz.slice(0,10).map(z=>`<li>"${esc(z.y)}" → <b>${esc(z.d)}</b></li>`).join('')}</ul>`:''}
  ${k.sayi.length?`<h3>Sayılar ve süreler</h3><div class="tabloKap"><table>${k.sayi.slice(0,14).map(r=>`<tr><td>${esc(r[0])}</td><td><b>${esc(r[1])}</b></td></tr>`).join('')}</table></div>`:''}
  ${k.makam.length?`<h3>Yetkili makamlar</h3><div class="tabloKap"><table>${k.makam.slice(0,14).map(r=>`<tr><td>${esc(r[0])}</td><td><b>${esc(r[1])}</b></td></tr>`).join('')}</table></div>`:''}
  </div>
  <div class="altLinkler"><button id="tam">Tam konu notunu aç</button></div>`;
  $('#geri').onclick=ana;$('#tam').onclick=()=>mevzuat(id);
  if(sadeceOku)$('#na').onclick=()=>noktaAtisi(id);else $('#devam').onclick=()=>checkupBolum(id);
}
/* ---------- NOKTA ATIŞI ---------- */
let N=null;
function noktaAtisi(kanunId,tipId){
  let kartlar;
  if(kanunId)kartlar=kanunKartlari(kanunDurum(BYID[kanunId])).filter(c=>!kapali(c.id));
  else if(tipId)kartlar=tipKartlari(tipZaaf().find(z=>z.id===tipId)||{id:tipId}).filter(c=>!kapali(c.id));
  else{const tk=tekrarlar(),yeni=yeniKartlar();kartlar=[...tk,...yeni];}
  const g=kalanGun();const doz=kanunId||tipId?Math.min(20,kartlar.length):Math.min(g<=2?20:15,kartlar.length);
  kartlar=kartlar.slice(0,doz);
  if(!kartlar.length){toast('Burada açık nokta kalmadı.');return;}
  N={kartlar,i:0,acik:false,sonuc:{},tip:tipId||null,kanun:kanunId||null,bas:Date.now()};kartCiz();
}
function kartCiz(){
  document.body.classList.add('sinavda');window.scrollTo({top:0});
  const c=N.kartlar[N.i], k=BYID[c.k];
  const on=c.t==='n'?`<span class="kartKanun">${esc(kisaAd(k))}${c.n.m.length?' · m.'+c.n.m.join(', '):''}${c.n.s?' · <span class="yld">★ çıkmış</span>':''}</span><p class="kok">${esc(c.n.b)}</p><p class="ipucu2">Hükmü hatırla: ne diyor, sayı/makam/şart ne?</p>`
    :c.t==='sayi'?`<span class="kartKanun">${esc(kisaAd(k))} · sayı / süre</span><p class="kok">${esc(c.r[0])}</p><p class="ipucu2">Değer ne?</p>`
    :c.t==='makam'?`<span class="kartKanun">${esc(kisaAd(k))} · yetkili makam</span><p class="kok">${esc(c.r[0])}</p><p class="ipucu2">Kim yapar / kim yetkili?</p>`
    :`<span class="kartKanun">${esc(kisaAd(k))} · "yanlıştır" tuzağı</span><p class="kok">"${esc(c.z.y)}"</p><p class="ipucu2">Bu ifade sınavda yanlış şık. Doğrusu ne?</p>`;
  const arka=c.t==='n'?`<p class="hukum">${esc(c.n.h)}</p>${c.n.nd?`<p class="nd"><span class="etk nd">Ne demek</span>${esc(c.n.nd)}</p>`:''}${c.n.t?`<p class="nd"><span class="etk tz">Tuzak</span>${esc(c.n.t)}</p>`:''}`
    :c.t==='sayi'||c.t==='makam'?`<p class="hukum">${esc(c.r[1])}</p>`:`<p class="hukum">${esc(c.z.d)}</p>`;
  const kural=N.tip&&N.i===0&&TIP_KURAL[N.tip]?`<div class="kural"><b>${esc(TIP_KURAL[N.tip][0])}</b><p>${esc(TIP_KURAL[N.tip][1])}</p></div>`:'';
  $('#ekran').innerHTML=`<div class="sinav"><button class="geri" id="geri">‹ Çık</button>
   <div class="sBas"><span class="say">${N.i+1} / ${N.kartlar.length}</span><div class="ilerle"><span style="width:${(N.i+1)/N.kartlar.length*100}%"></span></div></div>
   ${kural}
   <article class="kart nokta">${on}${N.acik?`<div class="arka">${arka}</div>`:''}</article>
   <div class="alt3">${N.acik?`<button class="btn" id="karisti">Karıştırdım</button><button class="btn ana" id="bildi">Biliyordum</button>`:`<button class="btn ana" id="goster" style="flex:1;max-width:none">Cevabı göster</button>`}</div>
   <p class="ipucu"><kbd>Boşluk</kbd> cevabı göster · <kbd>1</kbd> karıştırdım · <kbd>2</kbd> biliyordum</p></div>`;
  $('#geri').onclick=()=>{N=null;ana();};
  if(N.acik){$('#karisti').onclick=()=>kartCevap(false);$('#bildi').onclick=()=>kartCevap(true);}
  else $('#goster').onclick=()=>{N.acik=true;kartCiz();};
}
function kartCevap(bildi){
  const c=N.kartlar[N.i];const d=K.kn[c.id]||{durum:null,sayac:0};const t=bugun();
  if(bildi){ if(!d.durum)Object.assign(d,{durum:'bildi',son:t,sonraki:null});
    else if(d.durum==='ogrendi'||d.durum==='karisti')Object.assign(d,{durum:'dogrulandi',son:t,sonraki:gunEkle(t,3)});
    else if(d.durum==='dogrulandi')Object.assign(d,{durum:'saglam',son:t,sonraki:null}); }
  else Object.assign(d,{durum:'karisti',son:t,sonraki:gunEkle(t,1),sayac:(d.sayac||0)+1});
  K.kn[c.id]=d;N.sonuc[c.id]=bildi;kaydet();
  N.i++;N.acik=false;
  if(N.i<N.kartlar.length)kartCiz();else noktaBitir();
}
function noktaBitir(){
  const karisti=N.kartlar.filter(c=>N.sonuc[c.id]===false);
  // oturum sonu kısa kontrol: karıştırılan madde bazlı noktalardan 5 soru (öğrenme sorusu; teşhise yazılmaz)
  const sorular=[];const kullanilan=new Set();
  for(const c of karisti){if(c.t!=='n'||!c.n.m.length)continue;const q=karistir(BYID[c.k].q.filter(q=>c.n.m.includes(maddeNo(q))&&!kullanilan.has(q.i)))[0];if(q){sorular.push(q);kullanilan.add(q.i);}if(sorular.length>=5)break;}
  const ozetMetin=`${N.kartlar.length} nokta · ${N.kartlar.length-karisti.length} biliyordun · ${karisti.length} yeni öğrendin${karisti.length?` · yarın ${karisti.length} nokta bir kez daha sorulacak`:''}.`;
  N=null;
  if(sorular.length){toast('Karıştırdıklarından kısa kontrol');basla(sorular,'Kısa kontrol',{tani:false,tur:'kontrol',ozet:ozetMetin});}
  else{toast(ozetMetin);ana();}
}
/* ---------- SON KONTROL (son 2 gün) ---------- */
function sonKontrol(){
  const ks=kapsamKanun().sort((a,b)=>w(b.id)-w(a.id));const sorular=[];
  for(const k of ks){if(sorular.length>=30)break;sorular.push(...maddeyeGoreSec(k,Math.min(w(k.id),3),new Set(Object.keys(K.tani))).slice(0,Math.max(1,Math.round(w(k.id)*0.5))));}
  basla(karistir(sorular).slice(0,30),'Son kontrol',{tani:true,tur:'sonkontrol'});
}

/* ---------- SORU MOTORU ---------- */
let S=null;
function aktifKaydet(){if(!S){K.aktif=null;kaydet();return;}K.aktif={ids:S.sorular.map(q=>q.i),ad:S.ad,i:S.i,cevap:S.cevap,meta:S.meta};kaydet();}
function aktifDevam(){const a=K.aktif;if(!a||!a.ids)return false;const sorular=a.ids.map(id=>TUM[id]).filter(Boolean);if(!sorular.length){K.aktif=null;return false;}
  S={sorular,ad:a.ad,i:Math.min(a.i||0,sorular.length-1),cevap:a.cevap||{},meta:a.meta||{}};soruCiz();return true;}
function basla(sorular,ad,meta){if(!sorular.length){toast('Soru bulunamadı.');return;}S={sorular,ad,i:0,cevap:{},meta:meta||{}};soruCiz();}
function soruCiz(kaydir=true){
  aktifKaydet();document.body.classList.add('sinavda');if(kaydir)window.scrollTo({top:0});
  const q=S.sorular[S.i],k=BYID[q.l],c=S.cevap[S.i],cevapli=c!==undefined,goster=cevapli&&!S.meta.tani;
  $('#ekran').innerHTML=`<div class="sinav"><button class="geri" id="geri">‹ Çık</button>
   <div class="sBas"><span class="say">${S.i+1} / ${S.sorular.length}</span><div class="ilerle"><span style="width:${(S.i+1)/S.sorular.length*100}%"></span></div></div>
   <article class="kart soru"><div class="ust2"><span class="cip v">${esc(S.ad)}</span>${S.ad.includes(kisaAd(k).slice(0,20))?'':`<span class="cip">${esc(kisaAd(k).slice(0,60))}</span>`}</div>
     <p class="kok">${esc(q.k)}</p>
     <div class="siklar">${q.s.map((s,j)=>{let cl='';if(goster){if(j===q.d)cl='dogru';else if(j===c)cl='yanlis';else cl='sonuk'}else if(cevapli&&j===c)cl='secili';
       return `<button class="sik ${cl}" data-j="${j}" ${goster?'disabled':''} style="${cl==='secili'?'border-color:var(--vurgu);background:var(--vurguZemin)':''}"><span class="h">${HARF[j]}</span><span>${esc(s)}</span></button>`}).join('')}</div>
     ${goster?`<div class="aciklama ${c===q.d?'iyi':'kotu'}"><div class="hk">${c===q.d?'✓ Doğru. İşte nedeni':'✗ Yanlış. Doğrusu '+HARF[q.d]+' şıkkı'}</div><p>${esc(q.a)}</p>${q.y?`<span class="dayanak">§ ${esc(q.y)}</span>`:''}</div>`:''}
   </article>
   <div class="alt3"><button class="btn" id="onc" ${S.i?'':'disabled style="opacity:.4"'}>‹ Önceki</button><button class="btn ana" id="snr">${S.i===S.sorular.length-1?'Bitir':'Sonraki ›'}</button></div>
   <p class="ipucu"><kbd>A</kbd>–<kbd>E</kbd> cevapla · <kbd>Enter</kbd> sonraki</p></div>`;
  $('#geri').onclick=()=>{S=null;K.aktif=null;kaydet();ana();};
  document.querySelectorAll('.sik').forEach(b=>b.onclick=()=>cevapla(+b.dataset.j));
  $('#onc').onclick=()=>{if(S.i){S.i--;soruCiz();}};$('#snr').onclick=ileri;
}
function cevapla(j){if(!S)return;const q=S.sorular[S.i];if(!S.meta.tani&&S.cevap[S.i]!==undefined)return;S.cevap[S.i]=j;
  if(!S.meta.tani){K.cevap[q.i]=j;kaydet();}
  soruCiz(false);if(!S.meta.tani){const ac=document.querySelector('.aciklama');if(ac)ac.scrollIntoView({block:'nearest',behavior:'smooth'});if(j!==q.d){const b=document.querySelector(`.sik[data-j="${j}"]`);b&&b.classList.add('sallan');}}}
function ileri(){
  if(S.i<S.sorular.length-1){S.i++;soruCiz();return;}
  const t=S.meta.tur;
  if(t==='rontgen'){if(rontgenEk())return;rontgenBitir();return;}
  if(t==='checkup'){checkupBitir();return;}
  if(t==='sonkontrol'){S.sorular.forEach((q,i)=>{if(S.cevap[i]!==undefined){K.tani[q.i]=S.cevap[i]===q.d?1:0;K.cevap[q.i]=S.cevap[i];}});K.aktif=null;kaydet();sonucEkrani(()=>{S=null;ana();},'Eksiklerine dön');return;}
  if(t==='kontrol'){const oz=S.meta.ozet;K.aktif=null;kaydet();S=null;toast(oz||'Tamam');ana();return;}
  K.aktif=null;kaydet();sonucEkrani(()=>{S=null;ana();},'Ana ekran');
}
function sonucEkrani(don,donMetin){
  document.body.classList.remove('sinavda');window.scrollTo({top:0});
  const n=S.sorular.length,dg=S.sorular.filter((q,i)=>S.cevap[i]===q.d).length;const yanlislar=S.sorular.map((q,i)=>[q,i]).filter(([q,i])=>S.cevap[i]!==q.d);
  $('#ekran').innerHTML=`<div class="sinav"><article class="kart sonuc"><span class="cip v">${esc(S.ad)}</span><h2>${dg} / ${n}</h2>
   <p>${yanlislar.length?`Yanlış yaptığın ${yanlislar.length} soru aşağıda; bu maddeler eksik listene düştü.`:'Hepsi doğru. Bu bölümde eksik görünmüyor.'}</p>
   <button class="btn ana" id="don">${donMetin}</button>
   ${yanlislar.length?`<div class="yanlisListe">${yanlislar.map(([q,i])=>`<details><summary>${S.cevap[i]===undefined?'Boş':'✗'} · ${esc(q.y||'')} · ${esc(q.k.slice(0,110))}…</summary><p style="white-space:pre-line">${esc(q.k)}</p>${S.cevap[i]!==undefined?`<p style="color:#FF8F86">Senin cevabın: ${HARF[S.cevap[i]]}) ${esc(q.s[S.cevap[i]])}</p>`:''}<p class="dg">Doğru: ${HARF[q.d]}) ${esc(q.s[q.d])}</p><p>${esc(q.a)}</p></details>`).join('')}</div>`:''}
  </article></div>`;
  $('#don').onclick=don;
}
document.addEventListener('keydown',e=>{
  if(e.metaKey||e.ctrlKey||e.altKey)return;
  if(N){if(e.key===' '){e.preventDefault();if(!N.acik){N.acik=true;kartCiz();}}else if(N.acik&&e.key==='1')kartCevap(false);else if(N.acik&&e.key==='2')kartCevap(true);return;}
  if(!S)return;const j=HARF.indexOf(e.key.toUpperCase());
  if(j>=0&&j<S.sorular[S.i].s.length){e.preventDefault();cevapla(j);}
  else if(e.key==='Enter'||e.key==='ArrowRight'){if(document.activeElement&&document.activeElement.tagName==='BUTTON'&&e.key==='Enter')return;e.preventDefault();ileri();}
  else if(e.key==='ArrowLeft'&&S.i){S.i--;soruCiz();}
});

/* ---------- DAHA FAZLA: konu notları, soru bankası, prova ---------- */
function dahaFazla(){
  document.body.classList.remove('sinavda');window.scrollTo({top:0});
  const ks=kapsamKanun();
  $('#ekran').innerHTML=`<button class="geri" id="geri">‹ Geri</button>
  <div class="mvBas"><div><h2>Daha fazla</h2><div class="kapsam">Konu notları ve soru bankası. Ölçüm değil, serbest çalışma.</div></div>
   <button class="btn" id="prova">Sınav provası · 80 soru</button></div>
  <div class="izgara">${ks.map(k=>`<button class="mv" data-id="${k.id}"><span class="no">${k.g==='mus'?'MÜŞTEREK':'MEBS'} · ${k.q.length} SORU</span><h3>${esc(kisaAd(k))}</h3><span class="alt"><span class="rozet">★ ${k.n.filter(n=>n.s).length}</span></span></button>`).join('')}</div>`;
  $('#geri').onclick=ana;$('#prova').onclick=()=>basla([...karistir(KANUN.filter(k=>k.g==='mus').flatMap(k=>k.q)).slice(0,50),...karistir(KANUN.filter(k=>k.g==='mebs').flatMap(k=>k.q)).slice(0,30)],'Sınav provası',{tani:false,tur:'prova'});
  document.querySelectorAll('.mv').forEach(b=>b.onclick=()=>mevzuat(+b.dataset.id));
}
function mdHazirla(md){return md.replace(/★\s*(çıkmış|20\d\d(?:\/\d+)?)/g,'<span class="yld">★ $1</span>').replace(/(^|\s)★(?!\s*<)/g,'$1<span class="yld">★</span>').replace(/\*Tuzak:\*/g,'<span class="etk tz">Tuzak</span>').replace(/\*\*Ne demek:\*\*/g,'<span class="etk nd">Ne demek</span>').replace(/\*Örnek:\*/g,'<span class="etk or">Örnek</span>');}
function mevzuat(id){
  document.body.classList.remove('sinavda');window.scrollTo({top:0});const k=BYID[id];
  $('#ekran').innerHTML=`<button class="geri" id="geri">‹ Geri</button>
  <div class="mvBas"><div><h2>${esc(k.ad)}</h2><div class="kapsam">Sınav kapsamı: ${esc(k.kap||'—')}</div></div><button class="btn ana" id="coz">Soru çöz · ${k.q.length}</button></div>
  <div class="not" id="not"></div>`;
  const el=$('#not');el.innerHTML=window.marked?marked.parse(mdHazirla(k.md)):'<pre style="white-space:pre-wrap">'+esc(k.md)+'</pre>';
  el.querySelectorAll('table').forEach(t=>{const d=document.createElement('div');d.className='tabloKap';t.parentNode.insertBefore(d,t);d.appendChild(t);});
  el.querySelectorAll('li').forEach(li=>{if(li.querySelector('.yld'))li.classList.add('yildizli');});
  $('#geri').onclick=dahaFazla;$('#coz').onclick=()=>basla(karistir(k.q),kisaAd(k),{tani:false,tur:'serbest'});
}

/* ---------- yardımcı ---------- */
let tz;function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('ac');clearTimeout(tz);tz=setTimeout(()=>t.classList.remove('ac'),3200);}
let sifirOnay=0;
$('#sifirlaBtn').onclick=e=>{if(Date.now()-sifirOnay<4000){K={tani:{},cevap:{},kn:{},kp:K.kp,aktif:null,rontgen:null,checkup:{},son:null};kaydet();e.target.textContent='İlerlemeyi sıfırla';toast('Sıfırlandı.');ana();return;}sifirOnay=Date.now();e.target.textContent='Emin misin? 4 sn içinde tekrar bas';setTimeout(()=>{e.target.textContent='İlerlemeyi sıfırla'},4000);};
(function radar(){const c=$('#radar');if(!c)return;const x=c.getContext('2d'),W=104,M=W/2;let a=0;const az=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function ciz(){x.clearRect(0,0,W,W);x.strokeStyle='rgba(243,194,74,.35)';x.lineWidth=1;[46,32,18].forEach(r=>{x.beginPath();x.arc(M,M,r,0,7);x.stroke()});x.beginPath();x.moveTo(M-48,M);x.lineTo(M+48,M);x.moveTo(M,M-48);x.lineTo(M,M+48);x.stroke();
    const g=x.createConicGradient?x.createConicGradient(a,M,M):null;if(g){g.addColorStop(0,'rgba(248,213,122,.55)');g.addColorStop(.12,'rgba(248,213,122,0)');g.addColorStop(1,'rgba(248,213,122,0)');x.fillStyle=g;x.beginPath();x.arc(M,M,46,0,7);x.fill();}
    x.fillStyle='#F8D57A';x.beginPath();x.arc(M+Math.cos(1.1)*26,M+Math.sin(1.1)*26,3,0,7);x.fill();a+=.03;if(!az)requestAnimationFrame(ciz);}ciz();})();

if(!aktifDevam()) ana();
})();
