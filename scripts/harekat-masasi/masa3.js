(()=>{
/* ===== HAREKÂT MERKEZİ v3 (başkan, 29 Eyl): iki seçenek → Röntgen: direkt sorular → kanun bazlı hazırlık.
   Check-up: Müşterek/Branş listesi → kanun → 8-12 soru → hangi tipte hata + eksik maddeler → KAYITLI ÖZET
   (Altın Özet'ten yalnız eksik maddelerin noktaları ve tuzakları). ===== */
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
const tarihYaz=iso=>new Date(iso+'T12:00:00').toLocaleDateString('tr-TR',{day:'numeric',month:'long'});
const AGIRLIK={1:7,2:3,3:2,4:1,5:3,6:3,7:3,8:1,9:1,10:1,11:1,12:3,13:1,14:1,15:4,16:1,17:4,18:1,19:1,20:1,21:1,22:3,23:1,24:1,25:1,68:4,97:4,98:3,99:3,100:3,101:3,102:4,142:3,103:3};
const w=id=>AGIRLIK[id]||1;
const maddeNo=q=>{const m=(q.y||'').match(/m\.\s*(\d+)/i);return m?m[1]:null;};
const GRUP_AD={mus:'Müşterek',mebs:'Branş (MEBS)'};
// Soru tipleri: [id, ad, sınavdaki pay %, tanıyıcı]
const TIPLER=[
 ['olumsuz','Olumsuz kök ("değildir / yanlıştır")',34.5,q=>/(değildir|yanlıştır|yoktur|söylenemez|olamaz|aykırıdır|bulunmaz|sayılmaz|yer almaz|gerekmez|dışındadır)\s*\??\s*$/i.test(q.k.trim())||/hangisi(si)?\s+(yanlış|değil)/i.test(q.k)],
 ['makam','Yetkili makam / kim yapar',21.1,q=>/(\bkim\b|hangi (makam|merci|kurum|birim|kurul|komutan)|yetkili|tarafından|onaylanır|karar ver)/i.test(q.k)],
 ['sayi','Sayı, süre ve oranlar',null,q=>q.s.filter(x=>/\d|\bbir\b|\biki\b|\büç\b|dört|\bbeş\b|altı|yedi|sekiz|dokuz|\bon\b|yarı|gün|\bay\b|yıl|saat/i.test(x)).length>=4],
 ['onculu','Öncüllü sorular (I, II, III…)',4.8,q=>/(^|\n|\s)(I|II|III|IV)[\.\)\-]\s/.test(q.k)],
 ['bosluk','Boşluk doldurma',5.1,q=>/(boş bırakılan|boşluğa|\.{4,}|_{3,})/i.test(q.k)],
 ['tanim','Tanım / kavram',1.8,q=>/(tanım|ne ad verilir|olarak adlandırılır|kavram|neyi ifade)/i.test(q.k)],
];
const TIP_TAVSIYE={
 olumsuz:'Olumsuz kökte "değil / yanlış" kelimesinin altını çiz; her şıkkı "maddede böyle mi?" diye tek tek ele.',
 makam:'Şıklarda komşu makamlar yer değiştirir (vali↔kaymakam, Bakanlık↔Kurum). Aşağıdaki yetkili makam tablosunu ezberle.',
 sayi:'Sayı-sürede şıklar bir kademe kaydırılır (1 ay↔3 ay). Aşağıdaki sayı-süre tablosunu ezberle.',
 onculu:'Öncüllüde emin olduğun tek öncülü kullan: onu içermeyen (ya da yanlışsa içeren) şıkları at.',
 bosluk:'Boşluğun SONRASINI oku; şıkkı yerine koyup cümleyi sesli tamamla.',
 tanim:'Yakın kavram çiftlerini ayıran tek kelimeyi ezberle (abone/kullanıcı, zimmet/irtikâp).',
};

/* ---------- kayıt ---------- */
const ANAHTAR='harekat-merkezi-v3';
let K={tani:{},cevap:{},rontgen:null,checkup:{},aktif:null,g:'mus'};
try{const s=JSON.parse(localStorage.getItem(ANAHTAR)||'null');if(s&&s.tani)K=Object.assign(K,s);}catch(e){}
let bulutRef=null,bulutZ=null;
function kaydet(){try{localStorage.setItem(ANAHTAR,JSON.stringify(K))}catch(e){} if(bulutRef){clearTimeout(bulutZ);bulutZ=setTimeout(bulutaYaz,1500);}}
function bulutaYaz(){if(!bulutRef)return;clearTimeout(bulutZ);bulutRef.set(JSON.parse(JSON.stringify(K))).catch(()=>{});}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&bulutZ)bulutaYaz();});
(async()=>{try{
  if(!window.claude||!claude.use)return;
  const [db,user]=await Promise.all([claude.use('db'),claude.use('user')]); if(!db||!user)return;
  const uid=await user.id(); if(!uid)return;
  const ref=db.doc('data/users/'+uid+'/merkez3'); const sn=await ref.get();
  if(sn.exists){const b=sn.data(); if(!Object.keys(K.tani).length){K=Object.assign(K,b);} else {for(const a of ['tani','cevap','checkup'])K[a]=Object.assign({},b[a]||{},K[a]||{});K.rontgen=K.rontgen||b.rontgen||null;}
    try{localStorage.setItem(ANAHTAR,JSON.stringify(K))}catch(e){}}
  bulutRef=ref; bulutaYaz(); if(!S&&document.querySelector('.hero')) giris();
}catch(e){}})();

/* ---------- ölçüm ---------- */
function kanunDurum(k){
  let d=0,n=0;const kacan=[];const yanlisQ=[];
  for(const q of k.q){const v=K.tani[q.i];if(v===undefined)continue;n++;if(v===1)d++;else{yanlisQ.push(q);const m=maddeNo(q);if(m&&!kacan.includes(m))kacan.push(m);}}
  let durum='yok';
  if(n){const o=d/n; durum=n>=6?(o>=.75?'hazir':o>=.5?'orta':'eksik'):(n-d===0?'hazir':n-d===1?'orta':'eksik');}
  return {k,d,n,kacan,yanlisQ,durum,oran:n?d/n:0};
}
function tipAnaliz(sorular){ // verilen sorular üstünde tip bazlı doğru/yanlış
  return TIPLER.map(([id,ad,pay,f])=>{const c=sorular.filter(q=>f(q));const y=c.filter(q=>K.tani[q.i]===0).length;return {id,ad,pay,n:c.length,y};}).filter(t=>t.n>=2&&t.y>=2&&t.y/t.n>=.5).sort((a,b)=>b.y/b.n-a.y/a.n);
}
const DURUM={hazir:['Hazır','var(--dogru)'],orta:['Şüpheli','var(--altin2)'],eksik:['Eksik','#FF8F86'],yok:['Ölçülmedi','var(--soluk2)']};

/* ---------- GİRİŞ (iki seçenek + kayıtlar) ---------- */
const IK={
 saat:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
 belge:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M10 12h5M10 16h5"/></svg>',
 soru:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 015 0c0 1.8-2.5 2-2.5 3.5M12 17h.01"/></svg>',
 radar:'<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="24" cy="24" r="17"/><circle cx="24" cy="24" r="9" opacity=".7"/><circle cx="24" cy="24" r="3" fill="currentColor" stroke="none"/><path d="M24 7v6M24 35v6M7 24h6M35 24h6" stroke-linecap="round"/><path d="M24 24l12-9" stroke-linecap="round"/></svg>',
 tara:'<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 8h16l8 8v10"/><path d="M28 8v8h8M12 8v32h14"/><path d="M17 20h11M17 26h8"/><circle cx="33" cy="33" r="6"/><path d="M37.5 37.5L42 42"/></svg>',
 simsek:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></svg>',
 cubuk:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M5 19v-4M10 19v-8M15 19v-12M20 19V4"/></svg>',
 tik:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 12.5l4 4 8-9"/></svg>',
 kitap:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 5h7a2 2 0 012 2v13a2 2 0 00-2-2H3zM21 5h-7a2 2 0 00-2 2v13a2 2 0 012-2h7z"/></svg>',
 ok:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
};
function giris(){
  document.body.classList.remove('sinavda');document.body.classList.add('giriste');window.scrollTo({top:0});S=null;
  const g=kalanGun(); const rSoru=KANUN.reduce((a,k)=>a+(w(k.id)>=4?2:1),0);
  const ozetler=KANUN.filter(k=>K.checkup[k.id]);
  $('#ekran').innerHTML=`
  <section class="hero">
    <span class="gunRozet">${IK.saat}<span>SINAVA ${g} GÜN</span></span>
    <h2 class="heroBas">EKSİĞİNİ BUL.<em>İSTER KANUNDA, İSTER MADDEDE.</em></h2>
    <p class="heroAlt">Hızlıca tarat ya da madde madde in. Nerede açık verdiğini bulalım.</p>
  </section>
  <section class="secKart">
    <div class="secUst"><div class="secIkon">${IK.radar}</div><div class="secBaslik"><span class="secRozet">${IK.simsek}HIZLI</span><h3>Hızlı Röntgen</h3><div class="secMeta"><span>${IK.saat}~${Math.round(rSoru*0.3)} dk</span><i></i><span>${IK.belge}~${rSoru} soru</span></div></div></div>
    <p class="secAc">Her kanundan bir soru. Hangi kanundan ne kadar hazırsın, kanun kanun gösterir.</p>
    <ul class="secListe"><li>${IK.tik}Müşterek + branş</li><li>${IK.tik}Kanun bazında hazırlık</li><li>${IK.tik}Soru tipi zaafı</li></ul>
    <button class="secBtn" id="bRontgen">${K.rontgen?'RÖNTGENİ YENİLE':'RÖNTGENİ BAŞLAT'} ${IK.ok}</button>
    ${K.rontgen?`<button class="kayitSatir" id="sonRontgen"><span>Son röntgen · ${tarihYaz(K.rontgen.tarih)} · ${K.rontgen.d}/${K.rontgen.n} doğru</span><b>Sonucu aç ›</b></button>`:''}
  </section>
  <section class="secKart">
    <div class="secUst"><div class="secIkon">${IK.tara}</div><div class="secBaslik"><span class="secRozet">${IK.cubuk}DERİN TARAMA</span><h3>Detaylı Check-up</h3><div class="secMeta"><span>${IK.belge}kanun kanun</span><i></i><span>${IK.soru}8–12 soru</span></div></div></div>
    <p class="secAc">Kanunu seç, madde madde tarasın. Hangi tipte hata yaptığın ve eksik maddelerinin özeti kaydedilir.</p>
    <ul class="secListe"><li>${IK.tik}Madde madde eksik</li><li>${IK.tik}Soru tipi analizi</li><li>${IK.tik}Kayıtlı özet + tuzaklar</li></ul>
    <button class="secBtn" id="bCheckup">CHECK-UP'A BAŞLA ${IK.ok}</button>
    ${ozetler.length?`<button class="kayitSatir" id="ozetlerim"><span>${IK.kitap}Özetlerim · ${ozetler.length} kanun</span><b>Aç ›</b></button>`:''}
  </section>`;
  $('#bRontgen').onclick=rontgenBaslat;$('#bCheckup').onclick=checkupListe;
  if($('#sonRontgen'))$('#sonRontgen').onclick=rontgenSonuc;
  if($('#ozetlerim'))$('#ozetlerim').onclick=ozetlerim;
}

/* ---------- soru seçimi ---------- */
function karistir(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a;}
function maddeyeGoreSec(k,adet,haric){
  const g={};karistir(k.q).forEach(q=>{if(haric&&haric.has(q.i))return;const m=maddeNo(q)||'?';(g[m]=g[m]||[]).push(q);});
  const anahtar=karistir(Object.keys(g));const out=[];let tur=0;
  while(out.length<adet&&anahtar.some(a=>g[a].length)){for(const a of anahtar){if(out.length>=adet)break;if(g[a].length)out.push(g[a].shift());}if(++tur>30)break;}
  return out;
}
/* ---------- RÖNTGEN: direkt sorular → kanun bazlı hazırlık ---------- */
function rontgenBaslat(){
  const sorular=[];const haric=new Set(Object.keys(K.tani));
  for(const k of KANUN){const n=w(k.id)>=4?2:1;let s=maddeyeGoreSec(k,n,haric);if(s.length<n)s=s.concat(maddeyeGoreSec({q:k.q.filter(q=>!s.includes(q))},n-s.length));sorular.push(...s);}
  basla(karistir(sorular),'Röntgen',{tani:true,tur:'rontgen'});
}
function rontgenBitir(){
  let d=0,n=0;
  S.sorular.forEach((q,i)=>{if(S.cevap[i]!==undefined){const v=S.cevap[i]===q.d?1:0;K.tani[q.i]=v;K.cevap[q.i]=S.cevap[i];n++;d+=v;}});
  K.rontgen={tarih:bugun(),d,n,ids:S.sorular.map(q=>q.i)};K.aktif=null;kaydet();S=null;rontgenSonuc();
}
function rontgenSonuc(){
  document.body.classList.remove('sinavda','giriste');window.scrollTo({top:0});
  const R=K.rontgen;if(!R){giris();return;}
  const sorular=R.ids.map(i=>TUM[i]).filter(Boolean);
  const ks=KANUN.map(kanunDurum).filter(x=>x.n);
  const sira={eksik:0,orta:1,hazir:2};ks.sort((a,b)=>sira[a.durum]-sira[b.durum]||w(b.k.id)-w(a.k.id));
  const tipler=tipAnaliz(sorular);
  const say={hazir:0,orta:0,eksik:0};ks.forEach(x=>say[x.durum]++);
  const satir=x=>`<div class="ek" style="--r:${DURUM[x.durum][1]}"><div class="ekUst"><span class="hd">${DURUM[x.durum][0]}</span><b>${esc(kisaAd(x.k))}</b><small>${x.d}/${x.n} doğru${x.kacan.length?' · yanlış: '+x.kacan.map(m=>'m.'+m).join(', '):''}${K.checkup[x.k.id]?' · check-up yapıldı':''}</small></div>
    <div class="ekAlt">${K.checkup[x.k.id]?`<button class="btn kucuk" data-ozet="${x.k.id}">Özet</button>`:''}<button class="btn kucuk ${x.durum==='eksik'?'ana':''}" data-cu="${x.k.id}">Check-up</button></div></div>`;
  $('#ekran').innerHTML=`<button class="geri" id="geri">‹ Harekât Merkezi</button>
  <div class="mvBas"><div><h2>Röntgen sonucu</h2><div class="kapsam">${tarihYaz(R.tarih)} · ${R.d}/${R.n} doğru · ${say.eksik} eksik · ${say.orta} şüpheli · ${say.hazir} hazır</div></div></div>
  ${tipler.length?`<div class="kart tipKutu"><b>Soru tipi zaafın:</b> ${tipler.map(t=>`${esc(t.ad)} (${t.n} sorunun ${t.y}'i yanlış)`).join(' · ')}. <span class="kucukNot">Check-up özetlerinde bu tiplerin tabloları öne alınır.</span></div>`:''}
  <p class="kucukNot">Eksik ve şüpheli kanunlarda "Check-up" ile madde düzeyine in; bitince eksik maddelerinin özeti kaydedilir.</p>
  <div class="ekler">${ks.map(satir).join('')}</div>
  <div class="altLinkler"><button id="yenile">Röntgeni yenile</button></div>`;
  $('#geri').onclick=giris;$('#yenile').onclick=rontgenBaslat;
  document.querySelectorAll('[data-cu]').forEach(b=>b.onclick=()=>checkupBolum(+b.dataset.cu));
  document.querySelectorAll('[data-ozet]').forEach(b=>b.onclick=()=>ozet(+b.dataset.ozet,rontgenSonuc));
}
/* ---------- CHECK-UP: Müşterek / Branş listesi → kanun ---------- */
function checkupListe(){
  document.body.classList.remove('sinavda','giriste');window.scrollTo({top:0});
  const ks=KANUN.filter(k=>k.g===K.g).map(kanunDurum);
  const bolumBoyu=k=>Math.max(8,Math.min(12,w(k.id)*2+6));
  const satir=x=>{const cu=K.checkup[x.k.id];
    return `<div class="ek" style="--r:${cu?DURUM[x.durum][1]:x.n?DURUM[x.durum][1]:'var(--soluk2)'}"><div class="ekUst"><span class="hd">${cu?`Check-up · ${tarihYaz(cu.tarih)} · ${cu.d}/${cu.n}`:x.n?`Röntgen: ${DURUM[x.durum][0]} (${x.d}/${x.n})`:'Henüz ölçülmedi'}</span><b>${esc(kisaAd(x.k))}</b><small>${bolumBoyu(x.k)} soru · sınav ağırlığı ${w(x.k.id)}${cu&&cu.kacan.length?' · eksik: '+cu.kacan.map(m=>'m.'+m).join(', '):''}</small></div>
    <div class="ekAlt">${cu?`<button class="btn kucuk ana" data-ozet="${x.k.id}">Özeti aç</button><button class="btn kucuk" data-cu="${x.k.id}">Yeniden</button>`:`<button class="btn kucuk ana" data-cu="${x.k.id}">Check-up yap</button>`}</div></div>`;};
  $('#ekran').innerHTML=`<button class="geri" id="geri">‹ Harekât Merkezi</button>
  <div class="mvBas"><div><h2>Detaylı Check-up</h2><div class="kapsam">Kanunu seç · 8-12 soru · bitince eksik maddelerinin özeti kaydedilir</div></div></div>
  <div class="kpSec" id="kpSec"><button class="anahtar" data-g="mus" aria-pressed="${K.g==='mus'}">Müşterek (25)</button><button class="anahtar" data-g="mebs" aria-pressed="${K.g==='mebs'}">Branş (MEBS) (9)</button></div>
  <div class="ekler">${ks.map(satir).join('')}</div>`;
  $('#geri').onclick=giris;
  document.querySelectorAll('#kpSec button').forEach(b=>b.onclick=()=>{K.g=b.dataset.g;kaydet();checkupListe();});
  document.querySelectorAll('[data-cu]').forEach(b=>b.onclick=()=>checkupBolum(+b.dataset.cu));
  document.querySelectorAll('[data-ozet]').forEach(b=>b.onclick=()=>ozet(+b.dataset.ozet,checkupListe));
}
function checkupBolum(id){
  const k=BYID[id];const adet=Math.max(8,Math.min(12,w(id)*2+6));
  const haric=new Set(Object.keys(K.tani));let s=maddeyeGoreSec(k,adet,haric);if(s.length<adet)s=s.concat(maddeyeGoreSec({q:k.q.filter(q=>!s.includes(q))},adet-s.length));
  basla(s,`Check-up · ${kisaAd(k)}`,{tani:true,tur:'checkup',kanun:id});
}
function checkupBitir(){
  const id=S.meta.kanun;let d=0,n=0;const kacan=[];const ids=S.sorular.map(q=>q.i);
  S.sorular.forEach((q,i)=>{if(S.cevap[i]!==undefined){const v=S.cevap[i]===q.d?1:0;K.tani[q.i]=v;K.cevap[q.i]=S.cevap[i];n++;d+=v;if(!v){const m=maddeNo(q);if(m&&!kacan.includes(m))kacan.push(m);}}});
  const tipler=tipAnaliz(S.sorular).map(t=>t.id);
  const eski=K.checkup[id];
  K.checkup[id]={tarih:bugun(),d,n,kacan:eski?[...new Set([...eski.kacan,...kacan])]:kacan,ids:eski?[...eski.ids,...ids]:ids,tipler:[...new Set([...(eski?.tipler||[]),...tipler])]};
  K.aktif=null;kaydet();
  sonucEkrani(()=>ozet(id,checkupListe),'Eksik maddelerimin özetini aç');
}
/* ---------- ÖZET (kayıtlı; yalnız eksik maddeler + tuzaklar) ---------- */
function ozet(id,geriHedef){
  document.body.classList.remove('sinavda','giriste');window.scrollTo({top:0});
  const k=BYID[id], cu=K.checkup[id];if(!cu){checkupBolum(id);return;}
  const kacan=new Set(cu.kacan);
  const ilgili=n=>n.m.some(m=>kacan.has(m));
  const noktalar=k.n.filter(ilgili), tuzaklar=k.tz.filter(z=>z.m.some(m=>kacan.has(m))||cu.kacan.some(m=>new RegExp('\\b'+m+'(/|\\b)').test(z.d)));
  const yildizEk=k.n.filter(n=>n.s&&!ilgili(n)).slice(0,8); // az bulunduysa: kanunun çıkmış noktalarından takviye
  const tipler=cu.tipler||[];
  const yanlisSorular=(cu.ids||[]).map(i=>TUM[i]).filter(q=>q&&K.tani[q.i]===0);
  const noktaHtml=n=>`<li class="${n.s?'yildizli':''}">${n.s?'<span class="yld">★ çıkmış</span>':''}<b>${esc(n.b)}</b> — ${esc(n.h)}${n.nd?`<div class="nd"><span class="etk nd">Ne demek</span>${esc(n.nd)}</div>`:''}${n.t?`<div class="nd"><span class="etk tz">Tuzak</span>${esc(n.t)}</div>`:''}</li>`;
  const tablo=(baslik,rows)=>rows.length?`<h3>${baslik}</h3><div class="tabloKap"><table>${rows.slice(0,16).map(r=>`<tr><td>${esc(r[0])}</td><td><b>${esc(r[1])}</b></td></tr>`).join('')}</table></div>`:'';
  $('#ekran').innerHTML=`<button class="geri" id="geri">‹ Geri</button>
  <div class="mvBas"><div><h2>${esc(kisaAd(k))}</h2><div class="kapsam">Özetin · check-up ${tarihYaz(cu.tarih)} · ${cu.d}/${cu.n} doğru${cu.kacan.length?' · eksik maddeler: '+cu.kacan.map(m=>'m.'+m).join(', '):' · eksik madde çıkmadı'}</div></div>
    <button class="btn" id="yeniden">Yeniden check-up</button></div>
  ${tipler.length?`<div class="kart tipKutu"><b>Bu kanunda hata yaptığın soru tipi:</b> ${tipler.map(t=>esc((TIPLER.find(x=>x[0]===t)||[])[1]||t)).join(' · ')}.<br>${tipler.map(t=>esc(TIP_TAVSIYE[t]||'')).join(' ')}</div>`:''}
  <div class="not">
    ${noktalar.length?`<h3>Eksik maddelerinin altın noktaları</h3><ul>${noktalar.map(noktaHtml).join('')}</ul>`:'<h3>Eksik maddelerin</h3><p class="kucukNot">Bu maddeler için özet notu yok; aşağıda yanlış yaptığın soruların doğru cevapları var.</p>'}
    ${tuzaklar.length?`<h3>"Yanlıştır" tuzakları</h3><ul>${tuzaklar.map(z=>`<li><span class="etk tz">Yanlış şık</span>"${esc(z.y)}"<div class="nd"><span class="etk or">Doğrusu</span>${esc(z.d)}</div></li>`).join('')}</ul>`:''}
    ${tipler.includes('sayi')?tablo('Sayılar ve süreler (zayıf tipin)',k.sayi):''}
    ${tipler.includes('makam')?tablo('Yetkili makamlar (zayıf tipin)',k.makam):''}
    ${yanlisSorular.length?`<h3>Yanlış yaptığın sorular</h3><div class="yanlisListe">${yanlisSorular.map(q=>`<details><summary>${esc(q.y||'')} · ${esc(q.k.slice(0,100))}…</summary><p style="white-space:pre-line">${esc(q.k)}</p>${K.cevap[q.i]!==undefined?`<p style="color:#FF8F86">Senin cevabın: ${HARF[K.cevap[q.i]]}) ${esc(q.s[K.cevap[q.i]])}</p>`:''}<p class="dg">Doğru: ${HARF[q.d]}) ${esc(q.s[q.d])}</p><p>${esc(q.a)}</p></details>`).join('')}</div>`:''}
    ${yildizEk.length&&noktalar.length<4?`<h3>Bu kanunun çıkmış noktaları (takviye)</h3><ul>${yildizEk.map(noktaHtml).join('')}</ul>`:''}
  </div>
  <div class="alt3 sabit"><button class="btn" id="geri2">‹ Geri</button><button class="btn ana" id="liste">Özetlerim ›</button></div>`;
  const geri=()=>geriHedef?geriHedef():giris();
  $('#geri').onclick=geri;$('#geri2').onclick=geri;$('#liste').onclick=ozetlerim;$('#yeniden').onclick=()=>checkupBolum(id);
}
function ozetlerim(){
  document.body.classList.remove('sinavda','giriste');window.scrollTo({top:0});
  const ks=KANUN.filter(k=>K.checkup[k.id]).map(kanunDurum).sort((a,b)=>K.checkup[b.k.id].tarih.localeCompare(K.checkup[a.k.id].tarih));
  $('#ekran').innerHTML=`<button class="geri" id="geri">‹ Harekât Merkezi</button>
  <div class="mvBas"><div><h2>Özetlerim</h2><div class="kapsam">Check-up yaptığın kanunların eksik madde özetleri. İstediğin an aç, oku.</div></div></div>
  ${ks.length?`<div class="ekler">${ks.map(x=>{const cu=K.checkup[x.k.id];return `<button class="ek tik2" data-id="${x.k.id}" style="--r:${DURUM[x.durum][1]}"><div class="ekUst"><span class="hd">${tarihYaz(cu.tarih)} · ${cu.d}/${cu.n} doğru</span><b>${esc(kisaAd(x.k))}</b><small>${cu.kacan.length?'eksik: '+cu.kacan.map(m=>'m.'+m).join(', '):'eksik madde çıkmadı'}</small></div><span class="ok">›</span></button>`}).join('')}</div>`:'<p class="kucukNot">Henüz check-up yapmadın.</p>'}`;
  $('#geri').onclick=giris;document.querySelectorAll('.tik2').forEach(b=>b.onclick=()=>ozet(+b.dataset.id,ozetlerim));
}

/* ---------- SORU MOTORU (cevaplar sonda) ---------- */
let S=null;
function aktifKaydet(){if(!S){K.aktif=null;kaydet();return;}K.aktif={ids:S.sorular.map(q=>q.i),ad:S.ad,i:S.i,cevap:S.cevap,meta:S.meta};kaydet();}
function aktifDevam(){const a=K.aktif;if(!a||!a.ids)return false;const sorular=a.ids.map(id=>TUM[id]).filter(Boolean);if(!sorular.length){K.aktif=null;return false;}
  S={sorular,ad:a.ad,i:Math.min(a.i||0,sorular.length-1),cevap:a.cevap||{},meta:a.meta||{}};soruCiz();return true;}
function basla(sorular,ad,meta){if(!sorular.length){toast('Soru bulunamadı.');return;}S={sorular,ad,i:0,cevap:{},meta:meta||{}};soruCiz();}
function soruCiz(kaydir=true){
  aktifKaydet();document.body.classList.remove('giriste');document.body.classList.add('sinavda');if(kaydir)window.scrollTo({top:0});
  const q=S.sorular[S.i],k=BYID[q.l],c=S.cevap[S.i],cevapli=c!==undefined;
  $('#ekran').innerHTML=`<div class="sinav"><button class="geri" id="geri">‹ Çık</button>
   <div class="sBas"><span class="say">${S.i+1} / ${S.sorular.length}</span><div class="ilerle"><span style="width:${(S.i+1)/S.sorular.length*100}%"></span></div></div>
   <article class="kart soru"><div class="ust2"><span class="cip v">${esc(S.ad)}</span>${S.ad.includes(kisaAd(k).slice(0,20))?'':`<span class="cip">${esc(kisaAd(k).slice(0,60))}</span>`}</div>
     <p class="kok">${esc(q.k)}</p>
     <div class="siklar">${q.s.map((s,j)=>`<button class="sik" data-j="${j}" style="${cevapli&&j===c?'border-color:var(--vurgu);background:var(--vurguZemin)':''}"><span class="h">${HARF[j]}</span><span>${esc(s)}</span></button>`).join('')}</div>
   </article>
   <div class="alt3"><button class="btn" id="onc" ${S.i?'':'disabled style="opacity:.4"'}>‹ Önceki</button><button class="btn ana" id="snr">${S.i===S.sorular.length-1?'Bitir':'Sonraki ›'}</button></div>
   <p class="ipucu"><kbd>A</kbd>–<kbd>E</kbd> cevapla · <kbd>Enter</kbd> sonraki</p></div>`;
  $('#geri').onclick=()=>{S=null;K.aktif=null;kaydet();giris();};
  document.querySelectorAll('.sik').forEach(b=>b.onclick=()=>{S.cevap[S.i]=+b.dataset.j;aktifKaydet();if(S.i<S.sorular.length-1){S.i++;soruCiz();}else soruCiz(false);});
  $('#onc').onclick=()=>{if(S.i){S.i--;soruCiz();}};$('#snr').onclick=ileri;
}
function ileri(){
  if(S.i<S.sorular.length-1){S.i++;soruCiz();return;}
  const bos=S.sorular.filter((q,i)=>S.cevap[i]===undefined).length;
  if(bos&&!S.meta.bosOnay){S.meta.bosOnay=true;toast(`${bos} soru boş. Bitirmek için tekrar bas, ya da geri dönüp cevapla.`);return;}
  if(S.meta.tur==='rontgen')rontgenBitir();else checkupBitir();
}
function sonucEkrani(don,donMetin){
  document.body.classList.remove('sinavda');window.scrollTo({top:0});
  const n=S.sorular.length,dg=S.sorular.filter((q,i)=>S.cevap[i]===q.d).length;const yanlislar=S.sorular.map((q,i)=>[q,i]).filter(([q,i])=>S.cevap[i]!==q.d);
  const tipler=tipAnaliz(S.sorular);
  $('#ekran').innerHTML=`<div class="sinav"><article class="kart sonuc"><span class="cip v">${esc(S.ad)}</span><h2>${dg} / ${n}</h2>
   <p>${yanlislar.length?`${yanlislar.length} soru yanlış${tipler.length?`. Hata yaptığın tip: <b>${tipler.map(t=>esc(t.ad)).join(', ')}</b>`:''}.`:'Hepsi doğru. Bu kanunda eksik görünmüyor.'}</p>
   <button class="btn ana" id="don">${donMetin}</button>
   ${yanlislar.length?`<div class="yanlisListe">${yanlislar.map(([q,i])=>`<details><summary>${S.cevap[i]===undefined?'Boş':'✗'} · ${esc(q.y||'')} · ${esc(q.k.slice(0,100))}…</summary><p style="white-space:pre-line">${esc(q.k)}</p>${S.cevap[i]!==undefined?`<p style="color:#FF8F86">Senin cevabın: ${HARF[S.cevap[i]]}) ${esc(q.s[S.cevap[i]])}</p>`:''}<p class="dg">Doğru: ${HARF[q.d]}) ${esc(q.s[q.d])}</p><p>${esc(q.a)}</p></details>`).join('')}</div>`:''}
  </article></div>`;
  S=null;$('#don').onclick=don;
}
document.addEventListener('keydown',e=>{
  if(e.metaKey||e.ctrlKey||e.altKey||!S)return;const j=HARF.indexOf(e.key.toUpperCase());
  if(j>=0&&j<S.sorular[S.i].s.length){e.preventDefault();S.cevap[S.i]=j;aktifKaydet();if(S.i<S.sorular.length-1){S.i++;soruCiz();}else soruCiz(false);}
  else if(e.key==='Enter'||e.key==='ArrowRight'){if(document.activeElement&&document.activeElement.tagName==='BUTTON'&&e.key==='Enter')return;e.preventDefault();ileri();}
  else if(e.key==='ArrowLeft'&&S.i){S.i--;soruCiz();}
});
let tz;function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('ac');clearTimeout(tz);tz=setTimeout(()=>t.classList.remove('ac'),3200);}
let sifirOnay=0;
$('#sifirlaBtn').onclick=e=>{if(Date.now()-sifirOnay<4000){K={tani:{},cevap:{},rontgen:null,checkup:{},aktif:null,g:K.g};kaydet();e.target.textContent='İlerlemeyi sıfırla';toast('Sıfırlandı.');giris();return;}sifirOnay=Date.now();e.target.textContent='Emin misin? 4 sn içinde tekrar bas';setTimeout(()=>{e.target.textContent='İlerlemeyi sıfırla'},4000);};
if(!aktifDevam()) giris();
})();
