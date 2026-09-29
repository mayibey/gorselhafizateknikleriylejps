(()=>{
/* ===== HAREKÂT MERKEZİ v4 — GPT taslağına birebir düzen (29 Eyl). Akış v3 ile aynı:
   Giriş → Röntgen (direkt sorular) → Röntgen Sonucu (Hazırlık, kanun bazında, tip zaafı)
   Check-up (Müşterek/Branş listesi) → kanun → Check-up Analizi → Altın Özet (kayıtlı) ===== */
const V=JSON.parse(document.getElementById('veri').textContent);
const KANUN=V.kanun, BYID={}; KANUN.forEach(k=>{BYID[k.id]=k; k.q.forEach(q=>q.l=k.id);});
const TUM={}; KANUN.forEach(k=>k.q.forEach(q=>TUM[q.i]=q));
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const HARF='ABCDE';
const kisaAd=k=>k.ad.replace(' (müşterek kapsam)','');
const KISALT={1:'5237 TCK',2:'2803 Jandarma K.',3:'6698 KVKK',4:'7201 Tebligat',5:'5442 İl İdaresi',6:'5326 Kabahatler',7:'3713 TMK',8:'2935 OHAL',9:'5816 Atatürk K.',10:'6284 Aile K.',11:'2893 Bayrak K.',12:'7068 Disiplin',13:'4678 Sözleşmeli K.',14:'5070 E-İmza',15:'Resmî Yazışma Yön.',16:'Sözleşmeli Sb/Asb Yön.',17:'Jandarma Teşkilat Yön.',18:'KVK Silme Yön.',19:'Bilgi Edinme Yön.',20:'2521 Av Tüfekleri Yön.',21:'6284 Uygulama Yön.',22:'JGK-SGK Personel Yön.',23:'Hizmet Esasları Yön.',24:'İzin Yön.',25:'6136 Silah K.',68:'5809 Elektronik Hab.',97:'Yetkilendirme Yön.',98:'Taşınır Mal Yön.',99:'Harcama Belgeleri Yön.',100:'Kriptolu Hab. Yön.',101:'Telsiz Yön.',102:'2019/12 Genelge',142:'2024/7 Tasarruf',103:'BİG Rehberi'};
const kisa=k=>kisaAd(k); // başkan: kanun adları TAM yazılsın
const SINAV_AN=new Date('2026-10-10T10:00:00+03:00');
const kalanGun=()=>Math.max(0,Math.floor((SINAV_AN-new Date())/86400000));
const bugun=()=>new Date().toISOString().slice(0,10);
const tarihYaz=iso=>new Date(iso+'T12:00:00').toLocaleDateString('tr-TR',{day:'numeric',month:'long'});
const AGIRLIK={1:7,2:3,3:2,4:1,5:3,6:3,7:3,8:1,9:1,10:1,11:1,12:3,13:1,14:1,15:4,16:1,17:4,18:1,19:1,20:1,21:1,22:3,23:1,24:1,25:1,68:4,97:4,98:3,99:3,100:3,101:3,102:4,142:3,103:3};
const w=id=>AGIRLIK[id]||1;
// Soru kimliklerinde '/' ve '.' var (2010/616-S-003); bulut kaydı bu anahtarları yutuyor → temiz anahtar
const kid=id=>String(id).replace(/[^A-Za-z0-9_-]/g,c=>'_'+c.charCodeAt(0).toString(16)+'_');
const maddeNo=q=>{const m=(q.y||'').match(/m\.\s*(\d+)/i);return m?m[1]:null;};
const SURE_RE=/(gün|\bay\b|ayı|yıl|saat|dakika|hafta|süre)/i;
// Soru tipleri: [id, ad, tanıyıcı]
const TIPLER=[
 ['sayi','Sayılar',q=>q.s.filter(x=>/\d|\bbir\b|\biki\b|\büç\b|dört|\bbeş\b|altı|yedi|sekiz|dokuz|\bon\b|yarı|üçte|dörtte|kat/i.test(x)).length>=4&&!(q.s.filter(x=>SURE_RE.test(x)).length>=3)],
 ['sure','Süreler',q=>q.s.filter(x=>SURE_RE.test(x)&&/\d|\bbir\b|\biki\b|\büç\b|dört|\bbeş\b|altı|yedi|on|yirmi|otuz|kırk|elli|altmış/i.test(x)).length>=3],
 ['makam','Yetkili makam',q=>/(\bkim\b|hangi (makam|merci|kurum|birim|kurul|komutan)|yetkili|tarafından|onaylanır|karar ver)/i.test(q.k)],
 ['olumsuz','Olumsuz kök',q=>/(değildir|yanlıştır|yoktur|söylenemez|olamaz|aykırıdır|bulunmaz|sayılmaz|yer almaz|gerekmez|dışındadır)\s*\??\s*$/i.test(q.k.trim())||/hangisi(si)?\s+(yanlış|değil)/i.test(q.k)],
 ['onculu','Öncüllü',q=>/(^|\n|\s)(I|II|III|IV)[\.\)\-]\s/.test(q.k)],
 ['bosluk','Boşluk doldurma',q=>/(boş bırakılan|boşluğa|\.{4,}|_{3,})/i.test(q.k)],
];
const TIP_TAVSIYE={
 olumsuz:'Olumsuz kökte "değil / yanlış" kelimesinin altını çiz; her şıkkı "maddede böyle mi?" diye tek tek ele.',
 makam:'Şıklarda komşu makamlar yer değiştirir (vali↔kaymakam, Bakanlık↔Kurum). Yetkili makam tablosunu ezberle.',
 sayi:'Sayılarda şıklar bir kademe kaydırılır. Sayı tablosunu ezberle.',
 sure:'Sürelerde 1 ay↔3 ay, 15 gün↔30 gün oyunu yapılır. Süre tablosunu ezberle.',
 onculu:'Öncüllüde emin olduğun tek öncülü kullan: onu içermeyen (ya da yanlışsa içeren) şıkları at.',
 bosluk:'Boşluğun SONRASINI oku; şıkkı yerine koyup cümleyi sesli tamamla.',
};
const IK={
 radar:'<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2"><circle cx="24" cy="24" r="18"/><circle cx="24" cy="24" r="10" opacity=".7"/><circle cx="24" cy="24" r="3" fill="currentColor" stroke="none"/><path d="M24 24l13-9" stroke-linecap="round"/></svg>',
 buyutec:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21M8 10.5h5M10.5 8v5"/></svg>',
 belge:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M10 12h5M10 16h5"/></svg>',
 kitap:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 5h7a2 2 0 012 2v13a2 2 0 00-2-2H3zM21 5h-7a2 2 0 00-2 2v13a2 2 0 012-2h7z"/></svg>',
 hedef:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke-linecap="round"/></svg>',
 grafik:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 19v-5M10 19v-9M15 19v-12M20 19V3"/></svg>',
 ok:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
 sag:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
 kum:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12M6 21h12M7 3c0 5 5 6 5 9s-5 4-5 9M17 3c0 5-5 6-5 9s5 4 5 9"/></svg>',
 unlem:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v5M12 16.2h.01"/></svg>',
 yerimi:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M6 3h12v18l-6-4-6 4z"/></svg>',
 tik:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg>',
};

/* ---------- kayıt ---------- */
const ANAHTAR='harekat-merkezi-v3';
let K={tani:{},cevap:{},rontgen:null,checkup:{},aktif:null,g:'mus'};
try{const s=JSON.parse(localStorage.getItem(ANAHTAR)||'null');if(s&&s.tani)K=Object.assign(K,s);}catch(e){}
function anahtarGoc(o){const y={};for(const [k,v] of Object.entries(o||{}))y[kid(k)]=v;return y;}
K.tani=anahtarGoc(K.tani);K.cevap=anahtarGoc(K.cevap);
// UYGULAMA KÖPRÜSÜ (Mevzu içinde): uygulama açılışta sunucudaki kaydı window.MERKEZ_KAYIT ile verir,
// biz her değişikliği window.ReactNativeWebView.postMessage ile geri yollarız (uygulama sunucuya yazar).
function birlestir(b){ if(!b||typeof b!=='object')return;
  const bt=anahtarGoc(b.tani),bc=anahtarGoc(b.cevap);
  K.tani=Object.assign({},bt,K.tani);K.cevap=Object.assign({},bc,K.cevap);K.checkup=Object.assign({},b.checkup||{},K.checkup||{});
  if(!K.rontgen||(b.rontgen&&b.rontgen.tarih>K.rontgen.tarih))K.rontgen=b.rontgen||K.rontgen;
  const hepsi=[...(b.rontgenler||[]),...(K.rontgenler||[])];const g2={};hepsi.forEach(x=>{if(x&&x.ids)g2[x.saat||x.tarih]=x;});K.rontgenler=Object.values(g2).sort((a,b)=>(a.saat||a.tarih).localeCompare(b.saat||b.tarih)).slice(-8);
  if(!K.aktif&&b.aktif)K.aktif=b.aktif; if(b.g)K.g=K.g||b.g; }
try{ if(window.MERKEZ_KAYIT) birlestir(window.MERKEZ_KAYIT); }catch(e){}
const RN=()=>window.ReactNativeWebView;
let rnZ=null;
function rnGonder(){ if(!RN())return; clearTimeout(rnZ); try{RN().postMessage(JSON.stringify({tip:'kaydet',veri:K}));}catch(e){} }
window.merkezFlush=rnGonder; // uygulama arka plana geçince çağırır
let bulutRef=null,bulutZ=null;
function kaydet(){try{localStorage.setItem(ANAHTAR,JSON.stringify(K))}catch(e){} if(bulutRef){clearTimeout(bulutZ);bulutZ=setTimeout(bulutaYaz,1500);} if(RN()){clearTimeout(rnZ);rnZ=setTimeout(rnGonder,1200);}}
function bulutaYaz(){if(!bulutRef)return;clearTimeout(bulutZ);bulutRef.set(JSON.parse(JSON.stringify(K))).catch(()=>{});}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'){if(bulutZ)bulutaYaz();if(rnZ)rnGonder();}});
(async()=>{try{
  if(!window.claude||!claude.use)return;
  const [db,user]=await Promise.all([claude.use('db'),claude.use('user')]); if(!db||!user)return;
  const uid=await user.id(); if(!uid)return;
  const ref=db.doc('data/users/'+uid+'/merkez3'); const sn=await ref.get();
  if(sn.exists){const b=sn.data(); if(!Object.keys(K.tani).length){K=Object.assign(K,b);K.tani=anahtarGoc(K.tani);K.cevap=anahtarGoc(K.cevap);} else {for(const a of ['tani','cevap','checkup'])K[a]=Object.assign({},a==='checkup'?(b[a]||{}):anahtarGoc(b[a]),K[a]||{});K.rontgen=K.rontgen||b.rontgen||null;}
    try{localStorage.setItem(ANAHTAR,JSON.stringify(K))}catch(e){}}
  bulutRef=ref; bulutaYaz(); if(!S&&document.querySelector('.gHero')) giris();
}catch(e){}})();

/* ---------- ölçüm ---------- */
function kanunDurum(k,sadece){
  if(!(sadece instanceof Set))sadece=null; // .map(kanunDurum) indeks geçirir
  let d=0,n=0;const kacan=[];const yanlisQ=[];
  for(const q of k.q){if(sadece&&!sadece.has(q.i))continue;const v=K.tani[kid(q.i)];if(v===undefined)continue;n++;if(v===1)d++;else{yanlisQ.push(q);const m=maddeNo(q);if(m&&!kacan.includes(m))kacan.push(m);}}
  let durum='yok';
  if(n){const o=d/n; durum=n>=6?(o>=.75?'hazir':o>=.5?'orta':o>=.3?'zayif':'kritik'):(n-d===0?'hazir':n-d===1?'orta':'kritik');}
  return {k,d,n,kacan,yanlisQ,durum,oran:n?d/n:0};
}
const DURUM={hazir:['Hazır','#3FBF7F'],orta:['Orta','#F3C24A'],zayif:['Zayıf','#F09A3E'],kritik:['Kritik','#E85A4F'],yok:['Ölçülmedi','#7FA3AE']};
function tipIst(sorular){ // her tip için d/n (verilen sorular)
  return TIPLER.map(([id,ad,f])=>{const c=sorular.filter(f);const d=c.filter(q=>K.tani[kid(q.i)]===1).length;return {id,ad,n:c.length,d,oran:c.length?d/c.length:null};});
}
const zayifTipler=sorular=>tipIst(sorular).filter(t=>t.n>=2&&t.d/t.n<=.5).sort((a,b)=>a.oran-b.oran);
function hazirlik(sadece){const ks=KANUN.map(k=>kanunDurum(k,sadece)).filter(x=>x.n);if(!ks.length)return null;let wt=0,ws=0;ks.forEach(x=>{wt+=w(x.k.id);ws+=w(x.k.id)*x.oran;});return Math.round(ws/wt*100);}
function maddeBaslik(k,m,sorular){const n=k.n.find(n=>n.m.includes(m));if(n)return n.b;const q=(sorular||[]).find(q=>maddeNo(q)===m&&K.tani[kid(q.i)]===0)||(sorular||[]).find(q=>maddeNo(q)===m);if(!q)return 'Madde '+m;const t=q.k.replace(/^.*?göre,?\s*/i,'').replace(/\s+/g,' ');return t.length>70?t.slice(0,70)+'…':t;}
const bar=(oran,renk)=>`<span class="bar"><i style="width:${Math.max(3,Math.round(oran*100))}%;background:${renk}"></i></span>`;
const oranRenk=o=>o>=.75?'#3FBF7F':o>=.5?'#F3C24A':o>=.3?'#F09A3E':'#E85A4F';

/* ---------- 1. GİRİŞ ---------- */
function giris(){
  document.body.classList.remove('sinavda');document.body.classList.add('giriste');window.scrollTo({top:0});S=null;
  const g=kalanGun(); const rSoru=KANUN.reduce((a,k)=>a+(w(k.id)>=4?2:1),0);
  const ozetler=KANUN.filter(k=>K.checkup[k.id]).length;
  const yarimR=K.aktif&&K.aktif.meta&&K.aktif.meta.tur==='rontgen', yarimC=K.aktif&&K.aktif.meta&&K.aktif.meta.tur==='checkup';
  const yarimYazi=a=>`${Object.keys(a.cevap||{}).length}/${a.ids.length}`;
  const gecmis=K.rontgenler||(K.rontgen?[K.rontgen]:[]);
  $('#ekran').innerHTML=`
  <section class="gHero">
    <div class="gBaslik"><span class="gRadar">${IK.radar}</span><span>Harekât <i>Merkezi</i></span></div>
    <div class="gAlt">EKSİĞİNİ BUL · NOKTA ATIŞIYLA KAPAT</div>
    <div class="gSinava">SINAVA</div>
    <div class="gGun">${IK.kum}<b>${g} gün</b></div>
    <p class="gSlogan">Eksiğini bul.<br>Nokta atışıyla kapat.</p>
  </section>
  <button class="secim" id="bRontgen"><span class="secimIk">${IK.buyutec}</span><span class="secimMetin"><b>Röntgen Çek</b><small>Hangi kanunda ne kadar hazırsın?</small><em>~${Math.round(rSoru*0.3)} dk · ~${rSoru} soru${gecmis.length?` · ${gecmis.length} sonuç`:''}${yarimR?' · yarım kalan var':''}</em></span><span class="secimOk">${IK.sag}</span></button>
  <button class="secim" id="bCheckup"><span class="secimIk">${IK.belge}</span><span class="secimMetin"><b>Check-up</b><small>Madde madde detaylı tarama</small><em>${IK.hedef} Müşterek / Branş${ozetler?` · ${ozetler} özet kayıtlı`:''}${yarimC?' · yarım kalan var':''}</em></span><span class="secimOk">${IK.sag}</span></button>`;
  $('#bRontgen').onclick=rontgenSayfa;$('#bCheckup').onclick=checkupListe;
}
/* RÖNTGEN SAYFASI: devam et / çek / sonuçlarım */
function rontgenSayfa(){
  document.body.classList.remove('sinavda','giriste');window.scrollTo({top:0});
  const rSoru=KANUN.reduce((a,k)=>a+(w(k.id)>=4?2:1),0);
  const yarim=K.aktif&&K.aktif.meta&&K.aktif.meta.tur==='rontgen'?K.aktif:null;
  const g=(K.rontgenler||(K.rontgen?[K.rontgen]:[])).slice().reverse();
  const H=R=>hazirlik(new Set(R.ids));
  $('#ekran').innerHTML=`<div class="ustBar"><button class="geriIk" id="geri">‹</button><h2>Röntgen</h2><span></span></div>
  <section class="hzKart"><div class="hzIk">${IK.buyutec}</div><div class="hzMetin"><span class="hzLbl">Hızlı tarama</span><b class="hzSayi kucukSayi">~${rSoru}<small> soru · ~${Math.round(rSoru*0.3)} dk</small></b><p>Sınav kapsamındaki her kanundan bir soru sorar, sınavda çok soru çıkan kanunlardan iki. Cevapları sonunda görürsün; hangi kanunda ne kadar hazır olduğun kanun kanun ortaya çıkar.</p></div></section>
  ${yarim?`<button class="anaBtn2" id="devamR">Devam et ${IK.ok}<small>${Object.keys(yarim.cevap||{}).length}/${yarim.ids.length} soruyu cevapladın, kaldığın yerden sürer</small></button>`:''}
  <button class="anaBtn2 ${yarim?'ikincil':''}" id="cek">${g.length||yarim?'Yeniden çek':'Röntgen çek'} ${IK.ok}<small>${yarim?'yarım kalan röntgen silinir, baştan başlarsın':'yeni sorularla, yaklaşık '+Math.round(rSoru*0.3)+' dakika'}</small></button>
  <h3 class="bolumBaslik"><span class="hedefIk">${IK.grafik}</span>Sonuçlarım</h3>
  ${g.length?`<section class="liste">${g.map((R,i)=>{const h=H(R);return `<button class="satir cu" data-i="${i}"><span class="satirIk">${IK.grafik}</span><span class="satirMetin"><b>${tarihYaz(R.tarih)}${i===0?' · son röntgen':''}</b><small>${R.d}/${R.n} doğru${h!=null?` · hazırlık ${h}/100`:''}</small></span><span class="satirOk">${IK.sag}</span></button>`}).join('')}</section>`:'<p class="kucukNot">Henüz röntgen çekmedin. İlk röntgen yaklaşık 12 dakika sürer.</p>'}`;
  $('#geri').onclick=giris;$('#cek').onclick=()=>{if(yarim){K.aktif=null;kaydet();}rontgenBaslat();};
  if($('#devamR'))$('#devamR').onclick=aktifDevam;
  document.querySelectorAll('.satir.cu').forEach(b=>b.onclick=()=>rontgenSonuc(g[+b.dataset.i],rontgenSayfa));
}
/* önceki röntgenler */
function rontgenGecmis(){
  document.body.classList.remove('sinavda','giriste');window.scrollTo({top:0});
  const g=(K.rontgenler||(K.rontgen?[K.rontgen]:[])).slice().reverse();
  $('#ekran').innerHTML=`<div class="ustBar"><button class="geriIk" id="geri">‹</button><h2>Önceki röntgenler</h2><span></span></div>
  <section class="liste">${g.map((R,i)=>`<button class="satir cu" data-i="${i}"><span class="satirIk">${IK.grafik}</span><span class="satirMetin"><b>${tarihYaz(R.tarih)}${i===0?' · son':''}</b><small>${R.d}/${R.n} doğru · ${R.n} soru</small></span><span class="satirOk">${IK.sag}</span></button>`).join('')}</section>`;
  $('#geri').onclick=giris;document.querySelectorAll('.satir.cu').forEach(b=>b.onclick=()=>rontgenSonuc(g[+b.dataset.i],rontgenGecmis));
}

/* ---------- soru seçimi ---------- */
function karistir(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a;}
function maddeyeGoreSec(k,adet,haric){
  const g={};karistir(k.q).forEach(q=>{if(haric&&haric.has(kid(q.i)))return;const m=maddeNo(q)||'?';(g[m]=g[m]||[]).push(q);});
  const anahtar=karistir(Object.keys(g));const out=[];let tur=0;
  while(out.length<adet&&anahtar.some(a=>g[a].length)){for(const a of anahtar){if(out.length>=adet)break;if(g[a].length)out.push(g[a].shift());}if(++tur>30)break;}
  return out;
}
/* ---------- 2. RÖNTGEN ---------- */
function rontgenBaslat(){
  const sorular=[];const haric=new Set(Object.keys(K.tani));
  for(const k of KANUN){const n=w(k.id)>=4?2:1;let s=maddeyeGoreSec(k,n,haric);if(s.length<n)s=s.concat(maddeyeGoreSec({q:k.q.filter(q=>!s.includes(q))},n-s.length));sorular.push(...s);}
  basla(karistir(sorular),'Röntgen',{tani:true,tur:'rontgen'});
}
function rontgenBitir(){
  let d=0,n=0;
  S.sorular.forEach((q,i)=>{if(S.cevap[i]!==undefined){const v=S.cevap[i]===q.d?1:0;K.tani[kid(q.i)]=v;K.cevap[kid(q.i)]=S.cevap[i];n++;d+=v;}});
  K.rontgen={tarih:bugun(),d,n,ids:S.sorular.map(q=>q.i),saat:new Date().toISOString()};K.rontgenler=(K.rontgenler||[]).concat([K.rontgen]).slice(-8);K.aktif=null;kaydet();S=null;rontgenSonuc();
}
/* ---------- 3. RÖNTGEN SONUCU ---------- */
function rontgenSonuc(Rsec,geriHedef){
  document.body.classList.remove('sinavda','giriste');window.scrollTo({top:0});
  const R=(Rsec&&Rsec.ids)?Rsec:K.rontgen;if(!R){giris();return;}
  const sorular=R.ids.map(i=>TUM[i]).filter(Boolean);const sadece=new Set(R.ids);
  const ks=KANUN.map(k=>kanunDurum(k,sadece)).filter(x=>x.n);
  const sira={kritik:0,zayif:1,orta:2,hazir:3};ks.sort((a,b)=>sira[a.durum]-sira[b.durum]||w(b.k.id)-w(a.k.id));
  const H=hazirlik(sadece);
  const cumle=H>=75?'Durumun iyi. Birkaç kanunda küçük eksiklerin var.':H>=50?'Genel durumun iyi, ancak bazı temel alanlarda eksiğin var.':H>=30?'Birçok kanunda eksiğin var. Sınavda en çok soru çıkan kanunlardan başla.':'Temel henüz oturmamış. Kritik kanunları check-up ile tek tek kapat.';
  const tipler=tipIst(sorular).filter(t=>t.id!=='bosluk'&&t.id!=='onculu'||t.n>=2).slice(0,4);
  const ilkEksik=ks.find(x=>x.durum==='kritik'||x.durum==='zayif'||x.durum==='orta');
  $('#ekran').innerHTML=`<div class="ustBar"><button class="geriIk" id="geri">‹</button><h2>Röntgen Sonucu</h2><span></span></div>
  <p class="ozOzet" style="text-align:center">${tarihYaz(R.tarih)} · ${R.d}/${R.n} doğru</p>
  <section class="hzKart"><div class="hzIk">${IK.grafik}</div><div class="hzMetin"><span class="hzLbl">Hazırlık</span><b class="hzSayi">${H}<small>/100</small></b><p>${cumle}</p></div></section>
  <h3 class="bolumBaslik">Kanun bazında analiz</h3>
  <section class="liste">${ks.map(x=>`<button class="satir kb" data-cu="${x.k.id}"><span class="satirAd">${esc(kisa(x.k))}</span><span class="satirOk">${IK.sag}</span><span class="kbAlt">${bar(x.oran,DURUM[x.durum][1])}<span class="satirDeger">${x.d}/${x.n}</span><span class="pill" style="--p:${DURUM[x.durum][1]}">${DURUM[x.durum][0]}</span></span></button>`).join('')}</section>
  <h3 class="bolumBaslik">Soru tipi zaafı</h3>
  <section class="tipIzgara">${tipler.map(t=>`<div class="tipHucre"><span class="tipAd">${esc(t.ad)}</span>${t.n?`<div class="tipAltSatir">${bar(t.oran,oranRenk(t.oran))}<span class="tipYuzde">%${Math.round(t.oran*100)}</span></div><small>${t.d}/${t.n} doğru</small>`:'<small>bu tipte soru çıkmadı</small>'}</div>`).join('')}</section>
  ${ilkEksik?`<button class="anaBtn2" id="eksikBasla">Eksiklerime göre başla ${IK.ok}<small>${esc(kisa(ilkEksik.k))} check-up · 8-12 soru</small></button>`:''}
  <div class="altLinkler"><button id="yenile">Röntgeni yenile</button></div>`;
  $('#geri').onclick=()=>geriHedef?geriHedef():rontgenSayfa();$('#yenile').onclick=rontgenBaslat;
  document.querySelectorAll('[data-cu]').forEach(b=>b.onclick=()=>K.checkup[+b.dataset.cu]?ozet(+b.dataset.cu,rontgenSonuc):checkupBolum(+b.dataset.cu));
  if(ilkEksik)$('#eksikBasla').onclick=()=>checkupBolum(ilkEksik.k.id);
}
/* ---------- 4. CHECK-UP LİSTESİ ---------- */
function checkupListe(){
  document.body.classList.remove('sinavda','giriste');window.scrollTo({top:0});
  const ks=KANUN.filter(k=>k.g===K.g).map(kanunDurum);
  const bolumBoyu=k=>k.q.length;
  const yarim=K.aktif&&K.aktif.meta&&K.aktif.meta.tur==='checkup'?K.aktif.meta.kanun:null;
  const satir=x=>{const cu=K.checkup[x.k.id];const durum=cu?'tam':yarim===x.k.id?'devam':'yok';
    const pill={tam:['Tamamlandı','#3FBF7F'],devam:['Devam ediyor','#F3C24A'],yok:['Başlanmadı','#7FA3AE']}[durum];
    const cevaplanan=durum==='devam'?Object.keys(K.aktif.cevap||{}).length:0;
    const oran=cu?cu.d/cu.n:durum==='devam'?cevaplanan/bolumBoyu(x.k):0;
    return `<button class="satir cu" data-id="${x.k.id}"><span class="satirIk">${IK.belge}</span><span class="satirMetin"><b>${esc(kisa(x.k))}</b><small>${bolumBoyu(x.k)} soru ${bar(oran,cu?oranRenk(oran):durum==='devam'?'#F3C24A':'#7FA3AE')}<span>${cu?'%'+Math.round(oran*100)+' doğru':durum==='devam'?cevaplanan+'/'+bolumBoyu(x.k)+' cevaplandı':'%0'}</span></small></span><span class="pill" style="--p:${pill[1]}">${pill[0]}</span><span class="satirOk">${IK.sag}</span></button>`;};
  $('#ekran').innerHTML=`<div class="ustBar"><button class="geriIk" id="geri">‹</button><h2>Check-up</h2><span></span></div>
  <p class="kucukNot" style="text-align:center">Her kanunun bütün soruları sorulur. Yarım bırakırsan kaldığın yerden devam edersin.</p>
  ${KANUN.some(k=>K.checkup[k.id])?`<button class="anaBtn2 ikincil" id="ozetlerim" style="margin:0 0 12px">Özetlerim · ${KANUN.filter(k=>K.checkup[k.id]).length} kanun ${IK.ok}</button>`:""}
  <div class="segment" id="kpSec"><button data-g="mus" aria-pressed="${K.g==='mus'}">Müşterek</button><button data-g="mebs" aria-pressed="${K.g==='mebs'}">Branş (MEBS)</button></div>
  <section class="liste">${ks.map(satir).join('')}</section>`;
  $('#geri').onclick=giris;if($('#ozetlerim'))$('#ozetlerim').onclick=()=>{const ilk=KANUN.find(k=>K.checkup[k.id]);ilk&&ozet(ilk.id,checkupListe,'kayit');};
  document.querySelectorAll('#kpSec button').forEach(b=>b.onclick=()=>{K.g=b.dataset.g;kaydet();checkupListe();});
  document.querySelectorAll('.satir.cu').forEach(b=>b.onclick=()=>{const id=+b.dataset.id;if(yarim===id){aktifDevam();return;}K.checkup[id]?checkupAnaliz(id,checkupListe):checkupBolum(id);});
}
function checkupBolum(id){
  // DETAYLI: kanunun TÜM soruları (başkan: "check-up dediğin detaylı olur"); maddelere dağıtılmış sıra, yarım kalırsa devam eder
  const k=BYID[id];const s=maddeyeGoreSec(k,k.q.length);
  basla(s,`${kisa(k)} Check-up`,{tani:true,tur:'checkup',kanun:id});
}
function checkupBitir(){
  const id=S.meta.kanun;let d=0,n=0;const kacan=[];const ids=S.sorular.map(q=>q.i);
  S.sorular.forEach((q,i)=>{if(S.cevap[i]!==undefined){const v=S.cevap[i]===q.d?1:0;K.tani[kid(q.i)]=v;K.cevap[kid(q.i)]=S.cevap[i];n++;d+=v;if(!v){const m=maddeNo(q);if(m&&!kacan.includes(m))kacan.push(m);}}});
  const tipler=zayifTipler(S.sorular).map(t=>t.id);
  const eski=K.checkup[id];
  K.checkup[id]={tarih:bugun(),d,n,kacan:eski?[...new Set([...eski.kacan,...kacan])]:kacan,ids:eski?[...new Set([...eski.ids,...ids])]:ids,tipler:[...new Set([...(eski?.tipler||[]),...tipler])]};
  K.aktif=null;kaydet();S=null;checkupAnaliz(id,checkupListe);
}
/* ---------- 5. CHECK-UP ANALİZİ ---------- */
function checkupAnaliz(id,geriHedef){
  document.body.classList.remove('sinavda','giriste');window.scrollTo({top:0});
  const k=BYID[id],cu=K.checkup[id];if(!cu){checkupBolum(id);return;}
  const sorular=cu.ids.map(i=>TUM[i]).filter(Boolean);
  const oran=cu.d/cu.n;
  // madde bazlı: o maddeden çıkan sorular d/n
  const maddeler={};sorular.forEach(q=>{const m=maddeNo(q);if(!m)return;const o=maddeler[m]=maddeler[m]||{d:0,n:0};o.n++;if(K.tani[kid(q.i)]===1)o.d++;});
  const eksik=Object.entries(maddeler).filter(([,o])=>o.d<o.n).sort((a,b)=>a[1].d/a[1].n-b[1].d/b[1].n);
  const tipler=tipIst(sorular).filter(t=>t.n>=1).sort((a,b)=>(a.oran??1)-(b.oran??1));
  const yanlislar=sorular.filter(q=>K.tani[kid(q.i)]===0);
  $('#ekran').innerHTML=`<div class="ustBar"><button class="geriIk" id="geri">‹</button><h2>${esc(kisa(k))} Check-up</h2><span></span></div>
  <section class="hzKart"><div class="hzIk">${IK.belge}</div><div class="hzMetin"><b class="hzSayi kucukSayi">${cu.d}<small> / ${cu.n} doğru</small></b><div class="tipAltSatir">${bar(oran,oranRenk(oran))}<span class="tipYuzde">%${Math.round(oran*100)}</span></div></div></section>
  <h3 class="bolumBaslik"><span class="hedefIk">${IK.hedef}</span>Eksik olduğun maddeler</h3>
  <section class="liste">${eksik.length?eksik.map(([m,o])=>`<div class="satir"><span class="satirNo">m.${m}</span><span class="satirAd">${esc(maddeBaslik(k,m,sorular))}</span>${bar(o.d/o.n,oranRenk(o.d/o.n))}<span class="satirDeger">${o.d}/${o.n}</span></div>`).join(''):'<p class="kucukNot">Eksik madde çıkmadı, hepsini doğru yaptın.</p>'}</section>
  <h3 class="bolumBaslik"><span class="hedefIk">${IK.hedef}</span>Hangi soru tipinde hata yapıyorsun?</h3>
  <section class="liste">${tipler.map(t=>{const hata=1-t.oran;return `<div class="satir"><span class="satirAd">${esc(t.ad)}</span>${bar(hata,oranRenk(1-hata))}<span class="satirDeger">%${Math.round(hata*100)}</span><span class="satirKucuk">${t.n-t.d}/${t.n} yanlış</span></div>`}).join('')||'<p class="kucukNot">Tip ayrımı için yeterli soru yok.</p>'}</section>
  <button class="anaBtn2" id="ozetAc">Altın Özeti aç ${IK.ok}<small>Eksik kaldığın maddelerin notları ve tuzakları. Özet kaydedildi.</small></button>
  ${yanlislar.length?`<h3 class="bolumBaslik"><span class="hedefIk">${IK.hedef}</span>Yanlış yaptığın sorular (${yanlislar.length})</h3><section class="liste yanlisKartlar">${yanlislar.map((q,i)=>`<details class="ySoru"><summary><span class="satirNo">${esc((q.y||'').match(/m\.[\d\/\-]+/)?.[0]||('Soru '+(i+1)))}</span><span class="satirOk">${IK.sag}</span><span class="ySoruK">${esc(q.k.slice(0,120))}${q.k.length>120?'…':''}</span></summary><div class="ySoruIc"><p style="white-space:pre-line">${esc(q.k)}</p>${K.cevap[kid(q.i)]!==undefined?`<p class="ySenin">Senin cevabın: ${HARF[K.cevap[kid(q.i)]]}) ${esc(q.s[K.cevap[kid(q.i)]])}</p>`:''}<p class="dg">Doğru: ${HARF[q.d]}) ${esc(q.s[q.d])}</p><p>${esc(q.a)}</p></div></details>`).join('')}</section>`:''}
  <div class="altLinkler"><button id="yeniden">Bu kanunu yeniden check-up yap</button></div>`;
  $('#geri').onclick=()=>geriHedef?geriHedef():checkupListe();$('#ozetAc').onclick=()=>ozet(id,()=>checkupAnaliz(id,geriHedef));$('#yeniden').onclick=()=>checkupBolum(id);
}
/* ---------- 6. ALTIN ÖZET ---------- */
function ozet(id,geriHedef,sekme){
  document.body.classList.remove('sinavda','giriste');window.scrollTo({top:0});
  const k=BYID[id],cu=K.checkup[id];if(!cu){checkupBolum(id);return;}
  sekme=sekme||'bu';
  const kacan=new Set(cu.kacan);
  const ilgili=n=>n.m.some(m=>kacan.has(m));
  const noktalar=k.n.filter(ilgili);
  const tuzaklar=k.tz.filter(z=>z.m.some(m=>kacan.has(m))||cu.kacan.some(m=>new RegExp('(^|[^\\d])'+m+'(/|[^\\d]|$)').test(z.d)));
  const takviye=noktalar.length<3?k.n.filter(n=>n.s&&!ilgili(n)).slice(0,6):[];
  const tipler=cu.tipler||[];
  const kayitli=KANUN.filter(x=>K.checkup[x.id]).sort((a,b)=>K.checkup[b.id].tarih.localeCompare(K.checkup[a.id].tarih));
  const kart=n=>`<article class="ozKart"><div class="ozUst"><span class="ozNo">${n.m.length?'m.'+n.m[0]:''}</span><b>${esc(n.b)}</b><span class="kaydedildi">${IK.yerimi}Kaydedildi</span></div><p class="ozHukum">${esc(n.h)}</p>${n.nd?`<p class="ozNd">${esc(n.nd)}</p>`:''}${n.t?`<div class="tuzakKutu"><span class="tuzakIk">${IK.unlem}</span><div><b>Tuzak</b><p>${esc(n.t)}</p></div></div>`:''}</article>`;
  const tuzakKart=z=>`<article class="ozKart"><div class="ozUst"><span class="ozNo">${z.m.length?'m.'+z.m[0]:''}</span><b>Yanlış şık</b></div><p class="ozHukum">"${esc(z.y)}"</p><div class="tuzakKutu iyi"><span class="tuzakIk">${IK.tik}</span><div><b>Doğrusu</b><p>${esc(z.d)}</p></div></div></article>`;
  const tablo=(baslik,rows)=>rows.length?`<h3 class="bolumBaslik">${baslik}</h3><div class="tabloKap ozTablo"><table>${rows.slice(0,16).map(r=>`<tr><td>${esc(r[0])}</td><td><b>${esc(r[1])}</b></td></tr>`).join('')}</table></div>`:'';
  const bu=`<p class="ozOzet">${esc(kisa(k))} · check-up ${tarihYaz(cu.tarih)} · ${cu.d}/${cu.n} doğru${cu.kacan.length?' · eksik: '+cu.kacan.map(m=>'m.'+m).join(', '):''}</p>
    ${tipler.length?`<div class="tuzakKutu bilgi"><span class="tuzakIk">${IK.unlem}</span><div><b>Hata yaptığın soru tipi: ${tipler.map(t=>esc((TIPLER.find(x=>x[0]===t)||[])[1]||t)).join(', ')}</b><p>${tipler.map(t=>esc(TIP_TAVSIYE[t]||'')).join(' ')}</p></div></div>`:''}
    ${noktalar.map(kart).join('')}
    ${tuzaklar.map(tuzakKart).join('')}
    ${!noktalar.length&&!tuzaklar.length?'<p class="kucukNot">Bu maddeler için özet notu yok. Yanlış yaptığın sorulara check-up analizinden bakabilirsin.</p>':''}
    ${tipler.includes('sayi')||tipler.includes('sure')?tablo('Sayılar ve süreler',k.sayi):''}
    ${tipler.includes('makam')?tablo('Yetkili makamlar',k.makam):''}
    ${takviye.length?`<h3 class="bolumBaslik">Bu kanundan sınavda çıkmış noktalar</h3>${takviye.map(kart).join('')}`:''}
    <div class="kayitBaslik"><b>Kaydedilen özetler (${kayitli.length})</b><button id="tumu">Tümünü gör ›</button></div>
    <section class="liste">${kayitli.slice(0,3).map(x=>`<button class="satir cu" data-oz="${x.id}"><span class="satirIk">${IK.belge}</span><span class="satirMetin"><b>${esc(kisa(x))}</b><small>${K.checkup[x.id].kacan.length?'eksik: '+K.checkup[x.id].kacan.map(m=>'m.'+m).join(', '):'eksik madde çıkmadı'}</small></span><span class="satirOk">${IK.sag}</span></button>`).join('')}</section>`;
  const kayitliHtml=`<section class="liste">${kayitli.map(x=>`<button class="satir cu" data-oz="${x.id}"><span class="satirIk">${IK.belge}</span><span class="satirMetin"><b>${esc(kisa(x))}</b><small>${tarihYaz(K.checkup[x.id].tarih)} · ${K.checkup[x.id].d}/${K.checkup[x.id].n} · ${K.checkup[x.id].kacan.length?'eksik: '+K.checkup[x.id].kacan.map(m=>'m.'+m).join(', '):'eksik yok'}</small></span><span class="satirOk">${IK.sag}</span></button>`).join('')}</section>`;
  $('#ekran').innerHTML=`<div class="ustBar"><button class="geriIk" id="geri">‹</button><h2>Altın Özet</h2><span></span></div>
  <div class="segment" id="ozSekme"><button data-s="bu" aria-pressed="${sekme==='bu'}">Bu kanun özeti</button><button data-s="kayit" aria-pressed="${sekme==='kayit'}">Kaydedilenler</button></div>
  ${sekme==='bu'?bu:kayitliHtml}`;
  $('#geri').onclick=()=>geriHedef?geriHedef():giris();
  document.querySelectorAll('#ozSekme button').forEach(b=>b.onclick=()=>ozet(id,geriHedef,b.dataset.s));
  document.querySelectorAll('[data-oz]').forEach(b=>b.onclick=()=>ozet(+b.dataset.oz,geriHedef,'bu'));
  if($('#tumu'))$('#tumu').onclick=()=>ozet(id,geriHedef,'kayit');
}

/* ---------- Konu notları / Soru bankası ---------- */
function kanunListesi(mod){
  document.body.classList.remove('sinavda','giriste');window.scrollTo({top:0});
  const ks=KANUN.filter(k=>k.g===K.g);
  $('#ekran').innerHTML=`<div class="ustBar"><button class="geriIk" id="geri">‹</button><h2>${mod==='not'?'Konu notları':'Soru bankası'}</h2><span></span></div>
  <div class="segment" id="kpSec"><button data-g="mus" aria-pressed="${K.g==='mus'}">Müşterek</button><button data-g="mebs" aria-pressed="${K.g==='mebs'}">Branş (MEBS)</button></div>
  <section class="liste">${ks.map(k=>`<button class="satir cu" data-id="${k.id}"><span class="satirIk">${mod==='not'?IK.kitap:IK.belge}</span><span class="satirMetin"><b>${esc(kisa(k))}</b><small>${mod==='not'?`${k.n.length} nokta · ★ ${k.n.filter(n=>n.s).length} çıkmış`:`${k.q.length} soru`}</small></span><span class="satirOk">${IK.sag}</span></button>`).join('')}</section>`;
  $('#geri').onclick=giris;
  document.querySelectorAll('#kpSec button').forEach(b=>b.onclick=()=>{K.g=b.dataset.g;kaydet();kanunListesi(mod);});
  document.querySelectorAll('.satir.cu').forEach(b=>b.onclick=()=>{const k=BYID[+b.dataset.id];mod==='not'?konuNotu(k.id):basla(karistir(k.q).slice(0,20),kisa(k),{tani:false,tur:'serbest'});});
}
function mdHazirla(md){return md.replace(/★\s*(çıkmış|20\d\d(?:\/\d+)?)/g,'<span class="yld">★ $1</span>').replace(/(^|\s)★(?!\s*<)/g,'$1<span class="yld">★</span>').replace(/\*Tuzak:\*/g,'<span class="etk tz">Tuzak</span>').replace(/\*\*Ne demek:\*\*/g,'<span class="etk nd">Ne demek</span>').replace(/\*Örnek:\*/g,'<span class="etk or">Örnek</span>');}
function konuNotu(id){
  document.body.classList.remove('sinavda','giriste');window.scrollTo({top:0});const k=BYID[id];
  $('#ekran').innerHTML=`<div class="ustBar"><button class="geriIk" id="geri">‹</button><h2>${esc(kisa(k))}</h2><span></span></div><p class="ozOzet">${esc(k.ad)} · Sınav kapsamı: ${esc(k.kap||'—')}</p><div class="not" id="not"></div>`;
  const el=$('#not');el.innerHTML=window.marked?marked.parse(mdHazirla(k.md)):'<pre style="white-space:pre-wrap">'+esc(k.md)+'</pre>';
  el.querySelectorAll('table').forEach(t=>{const d=document.createElement('div');d.className='tabloKap';t.parentNode.insertBefore(d,t);d.appendChild(t);});
  el.querySelectorAll('li').forEach(li=>{if(li.querySelector('.yld'))li.classList.add('yildizli');});
  $('#geri').onclick=()=>kanunListesi('not');
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
  const mod=S.meta.tur==='rontgen'?'Röntgen Modu':S.meta.tur==='checkup'?'Check-up Modu':S.ad;
  $('#ekran').innerHTML=`<div class="sinav">
   <div class="ustBar"><button class="geriIk" id="geri">‹</button><h2>${esc(S.meta.tur==='rontgen'?'Röntgen':S.meta.tur==='checkup'?'Check-up':S.ad)}</h2><span></span></div>
   <div class="ilerleSatir"><div class="ilerle"><span style="width:${(S.i+1)/S.sorular.length*100}%"></span></div><span class="say">${S.i+1} / ${S.sorular.length}</span></div>
   <div class="cipSatir"><span class="cipK">${IK.hedef}${esc(kisa(k))}</span><span class="cipMod">${IK.radar}${esc(mod)}</span></div>
   <article class="kart soru"><div class="soruNo">Soru ${S.i+1}</div>
     <p class="kok">${esc(q.k)}</p>
     <div class="siklar">${q.s.map((s,j)=>`<button class="sik ${cevapli&&j===c?'secili':''}" data-j="${j}"><span class="h">${HARF[j]}</span><span>${esc(s)}</span></button>`).join('')}</div>
     <div class="soruBtn"><button class="btn" id="onc" ${S.i?'':'disabled style="opacity:.4"'}>Önceki</button><button class="btn ana" id="snr">${S.i===S.sorular.length-1?'Bitir':'Sonraki'} ${IK.ok}</button></div>
   </article></div>`;
  $('#geri').onclick=()=>{const t=S.meta.tur;aktifKaydet();S=null;t==='rontgen'?rontgenSayfa():t==='checkup'?checkupListe():giris();};
  document.querySelectorAll('.sik').forEach(b=>b.onclick=()=>{S.cevap[S.i]=+b.dataset.j;aktifKaydet();if(S.i<S.sorular.length-1){S.i++;soruCiz();}else soruCiz(false);});
  $('#onc').onclick=()=>{if(S.i){S.i--;soruCiz();}};$('#snr').onclick=ileri;
}
function ileri(){
  if(S.i<S.sorular.length-1){S.i++;soruCiz();return;}
  const bos=S.sorular.filter((q,i)=>S.cevap[i]===undefined).length;
  if(bos&&!S.meta.bosOnay){S.meta.bosOnay=true;toast(`${bos} soru boş. Bitirmek için tekrar bas, ya da geri dönüp cevapla.`);return;}
  if(S.meta.tur==='rontgen')rontgenBitir();else if(S.meta.tur==='checkup')checkupBitir();else serbestBitir();
}
function serbestBitir(){
  document.body.classList.remove('sinavda');window.scrollTo({top:0});
  const n=S.sorular.length,dg=S.sorular.filter((q,i)=>S.cevap[i]===q.d).length;const yanlislar=S.sorular.map((q,i)=>[q,i]).filter(([q,i])=>S.cevap[i]!==q.d);
  $('#ekran').innerHTML=`<div class="ustBar"><button class="geriIk" id="geri">‹</button><h2>${esc(S.ad)}</h2><span></span></div>
  <section class="hzKart"><div class="hzIk">${IK.belge}</div><div class="hzMetin"><b class="hzSayi kucukSayi">${dg}<small> / ${n} doğru</small></b><div class="tipAltSatir">${bar(dg/n,oranRenk(dg/n))}<span class="tipYuzde">%${Math.round(dg/n*100)}</span></div></div></section>
  ${yanlislar.length?`<h3 class="bolumBaslik">Yanlış yaptıkların</h3><div class="yanlisListe">${yanlislar.map(([q,i])=>`<details><summary>${S.cevap[i]===undefined?'Boş':'✗'} · ${esc(q.y||'')} · ${esc(q.k.slice(0,90))}…</summary><p style="white-space:pre-line">${esc(q.k)}</p>${S.cevap[i]!==undefined?`<p style="color:#FF8F86">Senin cevabın: ${HARF[S.cevap[i]]}) ${esc(q.s[S.cevap[i]])}</p>`:''}<p class="dg">Doğru: ${HARF[q.d]}) ${esc(q.s[q.d])}</p><p>${esc(q.a)}</p></details>`).join('')}</div>`:'<p class="kucukNot">Hepsi doğru.</p>'}`;
  K.aktif=null;kaydet();S=null;$('#geri').onclick=giris;
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
giris();
})();
