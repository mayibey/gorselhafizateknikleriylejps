const BRANS=window.BRANS||{slug:'mebs',ad:'MEBS'}; // hangi branşın sayfası (kur2.py gömer)
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
let K={tani:{},cevap:{},rontgen:null,checkup:{},aktif:null,g:'mus',kayit:{}};
try{const s=JSON.parse(localStorage.getItem(ANAHTAR)||'null');if(s&&s.tani)K=Object.assign(K,s);}catch(e){}
function anahtarGoc(o){const y={};for(const [k,v] of Object.entries(o||{}))y[kid(k)]=v;return y;}
K.tani=anahtarGoc(K.tani);K.cevap=anahtarGoc(K.cevap);
// UYGULAMA KÖPRÜSÜ (Mevzu içinde): uygulama açılışta sunucudaki kaydı window.MERKEZ_KAYIT ile verir,
// biz her değişikliği window.ReactNativeWebView.postMessage ile geri yollarız (uygulama sunucuya yazar).
function birlestir(b){ if(!b||typeof b!=='object')return;
  const bt=anahtarGoc(b.tani),bc=anahtarGoc(b.cevap);
  K.tani=Object.assign({},bt,K.tani);K.cevap=Object.assign({},bc,K.cevap);K.checkup=Object.assign({},b.checkup||{},K.checkup||{});K.kayit=Object.assign({},b.kayit||{},K.kayit||{});
  if(!K.rontgen||(b.rontgen&&b.rontgen.tarih>K.rontgen.tarih))K.rontgen=b.rontgen||K.rontgen;
  const hepsi=[...(b.rontgenler||[]),...(K.rontgenler||[])];const g2={};hepsi.forEach(x=>{if(x&&x.ids)g2[x.saat||x.tarih]=x;});K.rontgenler=Object.values(g2).sort((a,b)=>(a.saat||a.tarih).localeCompare(b.saat||b.tarih)).slice(-8);
  if(!K.aktif&&b.aktif)K.aktif=b.aktif; if(b.g)K.g=K.g||b.g; }
try{ if(window.MERKEZ_KAYIT) birlestir(window.MERKEZ_KAYIT); }catch(e){}
if(K.g!=='mus'&&K.g!==BRANS.slug)K.g='mus'; // başka branşın kaydı / eski 'mebs' değeri
const RN=()=>window.ReactNativeWebView;
const PREMIUM=window.MERKEZ_PREMIUM!==false;
function olay(ad,ayrinti){ try{ if(RN())RN().postMessage(JSON.stringify({tip:'olay',olay:ad,ayrinti:ayrinti||{}})); }catch(e){} }
function kilit(nerede){ if(PREMIUM){olay(nerede);return false;} olay('kilit',{nerede}); if(RN())RN().postMessage(JSON.stringify({tip:'paywall'})); else toast('Bu bölüm Tam Erişim üyelerine özel.'); return true; }
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

/* ---------- GERİ GEZİNME (başkan: "kaydırarak geri çok geriye atıyor") ----------
   Her ekran açılışında tarayıcı geçmişine bir kayıt düşer; geri hareketi bir önceki EKRANA döner (uygulamadan çıkmaz). */
const YIGIN=[];let POP=false;
// Tarayıcı geçmişi KULLANILMAZ (WKWebView'da pushState + kenar hareketi ekranı donduruyordu). Kendi yığınımız:
function iz(f){ if(POP){POP=false;return;} YIGIN.push(f); derinlikBildir(); }
function ekranaDon(){ const f=YIGIN[YIGIN.length-1]; POP=true; if(f)f(); else {POP=false;giris();} }
function derinlikBildir(){ try{ if(window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify({tip:'derinlik',n:YIGIN.length})); }catch(e){} }
window.merkezGeri=function(){ if(S){aktifKaydet();S=null;} if(YIGIN.length>1){ YIGIN.pop(); ekranaDon(); derinlikBildir(); return true; } YIGIN.length=0; giris(); return false; };
// Kenardan sağa kaydırma = geri (kendi algılamamız; uygulamanın yerel hareketi kapalı).
(function(){let x0=null,y0=null,t0=0;
  document.addEventListener('touchstart',e=>{const t=e.touches[0];if(t&&t.clientX<28){x0=t.clientX;y0=t.clientY;t0=Date.now();}else x0=null;},{passive:true});
  document.addEventListener('touchend',e=>{if(x0==null)return;const t=e.changedTouches[0];const dx=t.clientX-x0,dy=Math.abs(t.clientY-y0);x0=null;
    if(dx>70&&dy<60&&Date.now()-t0<800){ if(S){aktifKaydet();S=null;} if(!window.merkezGeri())giris(); }},{passive:true});
})();

/* ---------- ölçüm ---------- */
// Check-up özeti GÜNCEL soru setine göre: kayıttaki kimliklerden kanunda hâlâ duranlar sayılır (soru çıkarılır/eklenir, kapsam değişir).
const cuOzet=(k,cu)=>{const var_=new Set(k.q.map(q=>kid(q.i)));const ids=(cu.ids||[]).filter(i=>var_.has(kid(i)));
  const d=ids.filter(i=>K.tani[kid(i)]===1).length;const n=ids.length;return {d,n,oran:n?d/n:0,kalan:k.q.length-n};};
const kalanSorular=(k,cu)=>{if(!cu)return k.q;const c=new Set((cu.ids||[]).map(x=>kid(x)));return k.q.filter(q=>!c.has(kid(q.i)));};
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
function maddeBaslik(k,m,sorular){const n=k.n.find(n=>n.m.includes(m));if(n)return n.b;const q=(sorular||[]).find(q=>maddeNo(q)===m&&K.tani[kid(q.i)]===0)||(sorular||[]).find(q=>maddeNo(q)===m);return 'Madde '+m;} // 3 Eki: soru kökünden başlık üretme ("bir karar ilan etmiştir. A, bu karara…" gibi anlamsız çıkıyordu)
const bar=(oran,renk)=>`<span class="bar"><i style="width:${Math.max(3,Math.round(oran*100))}%;background:${renk}"></i></span>`;
const oranRenk=o=>o>=.75?'#3FBF7F':o>=.5?'#F3C24A':o>=.3?'#F09A3E':'#E85A4F';

/* ---------- 1. GİRİŞ ---------- */
function giris(){
  YIGIN.length=0;POP=false;derinlikBildir();
  document.body.classList.remove('sinavda');document.body.classList.add('giriste');window.scrollTo({top:0});S=null;
  const g=kalanGun(); const rSoru=rontgenToplam();
  const ozetler=KANUN.filter(k=>K.checkup[k.id]).length;
  const yarimR=K.aktif&&K.aktif.meta&&K.aktif.meta.tur==='rontgen', yarimC=K.aktif&&K.aktif.meta&&K.aktif.meta.tur==='checkup';
  const yarimYazi=a=>`${Object.keys(a.cevap||{}).length}/${a.ids.length}`;
  const gecmis=K.rontgenler||(K.rontgen?[K.rontgen]:[]);
  $('#ekran').innerHTML=`
  <section class="gHero">
    <div class="gBaslik"><span class="gRadar">${IK.radar}</span><span>Harekât <i>Merkezi</i></span></div>
    <div class="gAlt">EKSİĞİNİ BUL · NOKTA ATIŞIYLA KAPAT</div>
    <h2 class="gManset">EKSİKLERİNİ<br><em>HIZLICA</em> NOKTA ATIŞI<br>TESPİT ET</h2>
    <div class="gSinava">SINAVA</div>
    <div class="gGun">${IK.kum}<b>${g} gün</b></div>
  </section>
  <button class="secim" id="bRontgen"><span class="secimIk">${IK.buyutec}</span><span class="secimMetin"><b>Kanunların röntgenini çek</b><small>Hangi kanunda ne kadar hazırsın?</small><em>~${Math.round(rSoru*0.3)} dk · ~${rSoru} soru${gecmis.length?` · ${gecmis.length} sonuç`:''}${yarimR?' · yarım kalan var':''}</em></span><span class="secimOk">${IK.sag}</span></button>
  <button class="secim" id="bCheckup"><span class="secimIk">${IK.belge}</span><span class="secimMetin"><b>Kanunlara check-up yap</b><small>Seçtiğin kanunun çıkabilecek tüm soruları, madde madde</small><em>${IK.hedef} Müşterek / Branş${ozetler?` · ${ozetler} özet kayıtlı`:''}${yarimC?' · yarım kalan var':''}</em></span><span class="secimOk">${IK.sag}</span></button>`;
  $('#bRontgen').onclick=rontgenSayfa;$('#bCheckup').onclick=checkupListe;
}
/* RÖNTGEN SAYFASI: devam et / çek / sonuçlarım */
function rontgenSayfa(){
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
  while(out.length<adet&&anahtar.some(a=>g[a].length)){for(const a of anahtar){if(out.length>=adet)break;if(g[a].length)out.push(g[a].shift());}if(++tur>500)break;}
  return out;
}
/* ---------- 2. RÖNTGEN ---------- */
const RONTGEN_BLOK=40; // sınav düzeni: 40 müşterek + 40 branş
function rontgenDagilim(grup){
  const ks=KANUN.filter(k=>k.g===grup&&k.q.length);if(!ks.length)return [];
  const top=ks.reduce((a,k)=>a+w(k.id),0);
  const pay=ks.map(k=>{const ham=RONTGEN_BLOK*w(k.id)/top;return {k,n:Math.min(Math.floor(ham),k.q.length),kalan:ham-Math.floor(ham)};});
  let kalan=RONTGEN_BLOK-pay.reduce((a,p)=>a+p.n,0);
  pay.sort((a,b)=>b.kalan-a.kalan||w(b.k.id)-w(a.k.id));
  for(let tur=0;kalan>0&&tur<6;tur++){for(const p of pay){if(kalan<=0)break;if(p.n<p.k.q.length){p.n++;kalan--;}}}
  return pay.filter(p=>p.n>0).map(p=>[p.k,p.n]);
}
const rontgenToplam=()=>rontgenDagilim('mus').reduce((a,[,n])=>a+n,0)+rontgenDagilim(BRANS.slug).reduce((a,[,n])=>a+n,0);
function rontgenBaslat(){ if(kilit('rontgen'))return;
  const haric=new Set(Object.keys(K.tani));
  const sec=(k,n)=>{let s=maddeyeGoreSec(k,n,haric);if(s.length<n)s=s.concat(maddeyeGoreSec({q:k.q.filter(q=>!s.includes(q))},n-s.length));return s;};
  const blok=g=>karistir(rontgenDagilim(g).flatMap(([k,n])=>sec(k,n)));
  const mus=blok('mus');
  basla([...mus,...blok(BRANS.slug)],'Röntgen',{tani:true,tur:'rontgen',bolum:mus.length});
}
function rontgenBitir(){
  let d=0,n=0;
  S.sorular.forEach((q,i)=>{if(S.cevap[i]!==undefined){const v=S.cevap[i]===q.d?1:0;K.tani[kid(q.i)]=v;K.cevap[kid(q.i)]=S.cevap[i];n++;d+=v;}});
  K.rontgen={tarih:bugun(),d,n,ids:S.sorular.map(q=>q.i),saat:new Date().toISOString()};K.rontgenler=(K.rontgenler||[]).concat([K.rontgen]).slice(-8);K.aktif=null;kaydet();S=null;YIGIN.pop();rontgenSonuc();
}
/* ---------- 3. RÖNTGEN SONUCU ---------- */
function rontgenSonuc(Rsec,geriHedef){
  iz(()=>rontgenSonuc(Rsec,geriHedef));
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
  <section class="liste">${ks.map(x=>`<div class="satir kb"><span class="satirAd">${esc(kisa(x.k))}</span><span></span><span class="kbAlt">${bar(x.oran,DURUM[x.durum][1])}<span class="satirDeger">${x.d}/${x.n}</span><span class="pill" style="--p:${DURUM[x.durum][1]}">${DURUM[x.durum][0]}</span></span>${x.durum!=='hazir'?`<span class="kbBtn">${K.checkup[x.k.id]?`<button class="btn kucuk" data-oz="${x.k.id}">Özeti aç</button>`:''}<button class="btn kucuk ana" data-cu="${x.k.id}">${K.checkup[x.k.id]?'Yeniden check-up':'Check-up yap'} ${IK.ok}</button></span>`:''}</div>`).join('')}</section>
  <h3 class="bolumBaslik">Soru tipi zaafı</h3>
  <section class="tipIzgara">${tipler.map(t=>`<div class="tipHucre"><span class="tipAd">${esc(t.ad)}</span>${t.n?`<div class="tipAltSatir">${bar(t.oran,oranRenk(t.oran))}<span class="tipYuzde">%${Math.round(t.oran*100)}</span></div><small>${t.d}/${t.n} doğru</small>`:'<small>bu tipte soru çıkmadı</small>'}</div>`).join('')}</section>
  ${ilkEksik?`<button class="anaBtn2" id="eksikBasla">Eksiklerime göre başla ${IK.ok}<small>${esc(kisa(ilkEksik.k))} check-up · 8-12 soru</small></button>`:''}
  <div class="altLinkler"><button id="yenile">Röntgeni yenile</button></div>`;
  $('#geri').onclick=()=>{if(!window.merkezGeri())rontgenSayfa();};$('#yenile').onclick=rontgenBaslat;
  document.querySelectorAll('[data-cu]').forEach(b=>b.onclick=()=>checkupBolum(+b.dataset.cu));
  document.querySelectorAll('[data-oz]').forEach(b=>b.onclick=()=>ozet(+b.dataset.oz,()=>rontgenSonuc(R)));
  if(ilkEksik)$('#eksikBasla').onclick=()=>checkupBolum(ilkEksik.k.id);
}
/* ---------- 4. CHECK-UP LİSTESİ ---------- */
function checkupListe(){
  iz(checkupListe);
  document.body.classList.remove('sinavda','giriste');window.scrollTo({top:0});
  const ks=KANUN.filter(k=>k.g===K.g).map(kanunDurum);
  const bolumBoyu=k=>k.q.length;
  const yarim=K.aktif&&K.aktif.meta&&K.aktif.meta.tur==='checkup'?K.aktif.meta.kanun:null;
  const satir=x=>{const cu=K.checkup[x.k.id];const durum=cu?'tam':yarim===x.k.id?'devam':'yok';
    const oz=cu?cuOzet(x.k,cu):null;const kalanN=cu?kalanSorular(x.k,cu).length:0;const kismi=kalanN>0;
    const pill=kismi&&durum==='tam'?[`Yeni soru · ${kalanN}`,'#F3C24A']:{tam:['Tamamlandı','#3FBF7F'],devam:['Devam ediyor','#F3C24A'],yok:['Başlanmadı','#7FA3AE']}[durum];
    const cevaplanan=durum==='devam'?Object.keys(K.aktif.cevap||{}).length:0;
    const oran=cu?oz.oran:durum==='devam'?cevaplanan/bolumBoyu(x.k):0;
    return `<button class="satir cu" data-id="${x.k.id}"><span class="satirIk">${IK.belge}</span><span class="satirMetin"><b>${esc(kisa(x.k))}</b><small>${bolumBoyu(x.k)} soru ${bar(oran,cu?oranRenk(oran):durum==='devam'?'#F3C24A':'#7FA3AE')}<span>${cu?'%'+Math.round(oran*100)+' doğru':durum==='devam'?cevaplanan+'/'+bolumBoyu(x.k)+' cevaplandı':'%0'}</span></small></span><span class="pill" style="--p:${pill[1]}">${pill[0]}</span><span class="satirOk">${IK.sag}</span></button>`;};
  $('#ekran').innerHTML=`<div class="ustBar"><button class="geriIk" id="geri">‹</button><h2>Check-up</h2><span></span></div>
  <p class="kucukNot" style="text-align:center">Her kanunda o kanundan çıkabilecek bütün sorular sorulur. Yarım bırakırsan kaldığın yerden devam edersin.</p>
  ${KANUN.some(k=>K.checkup[k.id])?`<button class="anaBtn2 ikincil" id="ozetlerim" style="margin:0 0 12px">Özetlerim · ${KANUN.filter(k=>K.checkup[k.id]).length} kanun ${IK.ok}</button>`:""}
  <div class="segment" id="kpSec"><button data-g="mus" aria-pressed="${K.g==='mus'}">Müşterek</button><button data-g="${BRANS.slug}" aria-pressed="${K.g===BRANS.slug}">Branş (${esc(BRANS.ad)})</button></div>
  <section class="liste">${ks.map(satir).join('')}</section>`;
  $('#geri').onclick=()=>{if(!window.merkezGeri())giris();};if($('#ozetlerim'))$('#ozetlerim').onclick=()=>{const ilk=KANUN.find(k=>K.checkup[k.id]);ilk&&ozet(ilk.id,checkupListe,'kayit');};
  document.querySelectorAll('#kpSec button').forEach(b=>b.onclick=()=>{K.g=b.dataset.g;kaydet();YIGIN.pop();POP=true;checkupListe();});
  document.querySelectorAll('.satir.cu').forEach(b=>b.onclick=()=>{const id=+b.dataset.id;if(yarim===id){aktifDevam();return;}K.checkup[id]?checkupAnaliz(id,checkupListe):checkupBolum(id);});
}
function checkupBolum(id,sadeceKalan){ if(kilit('checkup'))return;
  // DETAYLI: kanunun TÜM soruları (başkan: "check-up dediğin detaylı olur"); maddelere dağıtılmış sıra, yarım kalırsa devam eder.
  // sadeceKalan: eski (8-12 soruluk) check-up'ı tamamlamak için yalnız cevaplanmamış sorular; sonuç öncekiyle birleşir.
  const k=BYID[id];const cu=K.checkup[id];
  const haric=sadeceKalan&&cu?new Set(cu.ids.map(kid)):null;
  const s=maddeyeGoreSec(k,k.q.length,haric);
  if(!s.length){toast('Bu kanunun bütün soruları zaten çözülmüş.');return;}
  basla(s,`${kisa(k)} Check-up`,{tani:true,tur:'checkup',kanun:id,kalan:!!sadeceKalan});
}
function checkupBitir(){
  const id=S.meta.kanun;let d=0,n=0;const kacan=[];const ids=S.sorular.map(q=>q.i);
  S.sorular.forEach((q,i)=>{if(S.cevap[i]!==undefined){const v=S.cevap[i]===q.d?1:0;K.tani[kid(q.i)]=v;K.cevap[kid(q.i)]=S.cevap[i];n++;d+=v;if(!v){const m=maddeNo(q);if(m&&!kacan.includes(m))kacan.push(m);}}});
  const tipler=zayifTipler(S.sorular).map(t=>t.id);
  const eski=S.meta.kalan?K.checkup[id]:null;
  K.checkup[id]={tarih:bugun(),d:d+(eski?eski.d:0),n:n+(eski?eski.n:0),kacan:eski?[...new Set([...eski.kacan,...kacan])]:kacan,ids:eski?[...new Set([...eski.ids,...ids])]:ids,tipler:[...new Set([...(eski?.tipler||[]),...tipler])]};
  K.aktif=null;kaydet();S=null;YIGIN.pop();checkupAnaliz(id,checkupListe);
}
/* ---------- 5. CHECK-UP ANALİZİ ---------- */
function checkupAnaliz(id,geriHedef){
  iz(()=>checkupAnaliz(id,geriHedef));
  document.body.classList.remove('sinavda','giriste');window.scrollTo({top:0});
  const k=BYID[id],cu=K.checkup[id];if(!cu){checkupBolum(id);return;}
  const sorular=cu.ids.map(i=>TUM[i]).filter(Boolean);
  const oz=cuOzet(k,cu);const oran=oz.oran;
  // madde bazlı: o maddeden çıkan sorular d/n
  const maddeler={};sorular.forEach(q=>{const m=maddeNo(q);if(!m)return;const o=maddeler[m]=maddeler[m]||{d:0,n:0};o.n++;if(K.tani[kid(q.i)]===1)o.d++;});
  const eksik=Object.entries(maddeler).filter(([,o])=>o.d<o.n).sort((a,b)=>a[1].d/a[1].n-b[1].d/b[1].n);
  const tipler=tipIst(sorular).filter(t=>t.n>=1&&t.d<t.n).sort((a,b)=>(a.oran??1)-(b.oran??1));
  const yanlislar=sorular.filter(q=>K.tani[kid(q.i)]===0);
  $('#ekran').innerHTML=`<div class="ustBar"><button class="geriIk" id="geri">‹</button><h2>${esc(kisa(k))}</h2><span></span></div>
  <section class="hzKart anSkor"><div class="hzIk">${IK.belge}</div><div class="hzMetin"><span class="hzLbl">Check-up sonucu</span><b class="hzSayi kucukSayi">${oz.d}<small> / ${oz.n} doğru</small></b><div class="tipAltSatir">${bar(oran,oranRenk(oran))}<span class="tipYuzde">%${Math.round(oran*100)}</span></div>${kalanSorular(k,cu).length?`<button class="hzYeni" id="kalan">${kalanSorular(k,cu).length} yeni soru · çöz ${IK.sag}</button>`:''}</div></section>
  <div class="anUst">
    ${yanlislar.length?`<button class="anAna" id="ozetAc"><span class="anIk">${IK.kitap}</span><span class="anMetin"><b>Bana özel konu özeti</b><small>${eksik.length} eksik maddenin anlatımı, ipuçları ve tuzakları</small></span><span class="anOk">${IK.sag}</span></button>`:''}
    <div class="anIzgara">
      ${yanlislar.length?`<button class="anKutu" id="yOzetAc">${IK.hedef}<b>Yanlışlarım (${yanlislar.length})</b></button>`:''}
      <button class="anKutu ${yanlislar.length?'':'dolu'}" id="tumOzet">${IK.belge}<b>Tüm kanun özeti</b></button>
      <button class="anKutu" id="yenidenUst">${IK.grafik}<b>Yeniden çöz</b></button>
    </div>
  </div>
  <details class="acilir" open><summary><span class="hedefIk">${IK.hedef}</span>Eksik olduğun maddeler<span class="rozet">${eksik.length}</span><span class="acilirOk">${IK.sag}</span></summary>
  <section class="liste">${eksik.length?eksik.map(([m,o])=>`<div class="mdKart"><div class="mdUst"><span class="satirNo">m.${m}</span><span class="satirAd">${esc(maddeBaslik(k,m,sorular))}</span></div><div class="mdOlcu">${bar(o.d/o.n,oranRenk(o.d/o.n))}<span class="satirDeger">${o.d}/${o.n} doğru</span>${k.n.some(n=>n.m.includes(m))||k.g==='mus'?`<button class="mdOgren" data-ogren="${m}">${IK.kitap}Öğren</button>`:''}</div></div>`).join(''):'<p class="kucukNot">Eksik madde çıkmadı, hepsini doğru yaptın.</p>'}</section></details>
  ${tipler.length?`<details class="acilir"><summary><span class="hedefIk">${IK.hedef}</span>Hangi soru tipinde hata yapıyorsun?<span class="rozet">${tipler.length}</span><span class="acilirOk">${IK.sag}</span></summary>
  <section class="liste">${tipler.map(t=>{const hata=1-t.oran;return `<div class="satir"><span class="satirAd">${esc(t.ad)}</span>${bar(hata,'#E85A4F')}<span class="satirDeger">%${Math.round(hata*100)}</span><span class="satirKucuk">${t.n-t.d}/${t.n} yanlış</span></div>`}).join('')}</section></details>`:''}
  ${yanlislar.length?`<h3 class="bolumBaslik" id="yanlisBaslik"><span class="hedefIk">${IK.hedef}</span>Yanlış yaptığın sorular (${yanlislar.length})</h3><section class="liste yanlisKartlar">${yanlislar.map((q,i)=>`<details class="ySoru"><summary><span class="satirNo">${esc((q.y||'').match(/m\.[\d\/\-]+/)?.[0]||('Soru '+(i+1)))}</span><span class="satirOk">${IK.sag}</span><span class="ySoruK">${esc(q.k.slice(0,120))}${q.k.length>120?'…':''}</span></summary><div class="ySoruIc"><p style="white-space:pre-line">${esc(q.k)}</p>${K.cevap[kid(q.i)]!==undefined?`<p class="ySenin">Senin cevabın: ${HARF[K.cevap[kid(q.i)]]}) ${esc(q.s[K.cevap[kid(q.i)]])}</p>`:''}<p class="dg">Doğru: ${HARF[q.d]}) ${esc(q.s[q.d])}</p><p>${esc(q.a)}</p></div></details>`).join('')}</section>
  <button class="anaBtn2" id="yOzetAc2">Bana özel konu özeti ${IK.ok}<small>yanlış yaptığın maddelerin anlatımı, ipuçları ve tuzakları</small></button>
`:''}
  <div class="altLinkler"><button id="yeniden">Bu kanunu yeniden check-up yap</button></div>`;
  // "Bu maddeyi öğren": Altın Özet'te bu maddenin kartı varsa oraya; yoksa uygulamadaki konu kartına (yalnız müşterek)
  document.querySelectorAll('[data-ogren]').forEach(b=>b.onclick=()=>{const m=b.dataset.ogren;
    if(k.n.some(n=>n.m.includes(m)))ozet(id,()=>checkupAnaliz(id,geriHedef),'bu',m);else kartaGit(k.id,m);});
  if($('#asagiLink'))$('#asagiLink').onclick=()=>$('#yanlisBaslik').scrollIntoView({behavior:'smooth',block:'start'});
  if($('#kalan'))$('#kalan').onclick=()=>checkupBolum(id,true);
  $('#geri').onclick=()=>{if(!window.merkezGeri())checkupListe();};if($('#ozetAc'))$('#ozetAc').onclick=()=>ozet(id,()=>checkupAnaliz(id,geriHedef),'bu');$('#tumOzet').onclick=()=>ozet(id,()=>checkupAnaliz(id,geriHedef),'tum');if($('#yOzetAc'))$('#yOzetAc').onclick=()=>yanlisOzet(id);if($('#yOzetAc2'))$('#yOzetAc2').onclick=()=>ozet(id,()=>checkupAnaliz(id,geriHedef),'bu');$('#yeniden').onclick=()=>checkupBolum(id);$('#yenidenUst').onclick=()=>checkupBolum(id);
}
function kartaGit(kanunId,m){ if(window.ReactNativeWebView){window.ReactNativeWebView.postMessage(JSON.stringify({tip:'kart',kanun:kanunId,madde:String(m)}));} else toast('Konu kartı uygulamada açılır.'); }
/* ---------- YANLIŞLARIMIN ÖZETİ ---------- */
// Vurgu: sayı/süre/oran/madde altın; verilen kelimeler (doğru şık) yeşil. Metin önce kaçırılır, sonra işaretlenir.
function vurgula(metin,yesil){ let h=esc(metin||'');
  const kel=[...new Set(String(yesil||'').toLocaleLowerCase('tr').split(/[^a-zçğıöşüâîû0-9]+/).filter(w=>w.length>=5))];
  const SAYI=/(\d+(?:[.,]\d+)?\s*(?:'?(?:inci|ıncı|üncü|uncu|nci|ncı|ncü|ncu))?\s*(?:gün|ay|yıl|saat|hafta|dakika|kat|lira|TL|yaş|kişi|üye)?(?:ü|ı|i|u|e|a|den|dan|ye|ya)?)/g;
  // madde atıfları (m.2/B) bütün olarak altın; geri kalan metinde sayı/süre altın
  h=h.split(/(m\.\s*\d+(?:\/[\wçğıöşüÇĞİÖŞÜ-]+)?|\(\d+\/[\wçğıöşüÇĞİÖŞÜ-]+\))/).map((p,i)=>i%2?'<b class="vAltin">'+p+'</b>':p.replace(SAYI,'<b class="vAltin">$1</b>')).join('');
  if(kel.length){const re=new RegExp('(^|[^a-zçğıöşüâîû>])('+kel.map(w=>w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')+')([a-zçğıöşüâîû]*)','gi');
    h=h.replace(re,(t,a,b,c)=>a+'<b class="vYesil">'+b+c+'</b>');}
  // makam/onay anahtarları
  h=h.replace(/(Cumhurbaşkanı(?:nın)? onayı(?:yla|na)?|kanunla|kanun ile|valinin|kaymakamın|İçişleri Bakan(?:ı|lığı)(?:nın)?)/gi,'<b class="vYesil">$1</b>');
  return h; }
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
    <div class="tuzakKutu iyi"><span class="tuzakIk">${IK.tik}</span><div><b>Doğrusu</b><p>${HARF[q.d]}) ${vurgula(q.s[q.d])}</p></div></div>
    ${q.a?`<div class="yoNeden"><b>Neden?</b> ${vurgula(q.a,q.s[q.d])}</div>`:''}</article>`;};
  $('#ekran').innerHTML=`<div class="ustBar"><button class="geriIk" id="geri">‹</button><h2>Yanlışlarım</h2><span></span></div>
  <p class="ozOzet">${esc(kisa(k))} · ${ys.length} yanlış · ${sira.length} madde</p>
  ${ys.length?sira.map(m=>`<section class="yoMadde"><h3 class="yoBaslik"><span class="ozNo">${m==='?'?'':'m.'+m}</span>${esc(m==='?'?'Diğer':maddeBaslik(k,m))}<span class="rozet">${grup[m].length}</span></h3>
    ${kural(m)?`<div class="yoKural"><small>Kural</small><p>${vurgula(kural(m))}</p></div>`:''}
    ${grup[m].map(soruKart).join('')}</section>`).join(''):'<p class="kucukNot">Bu check-up\'ta yanlışın yok.</p>'}
  ${ys.length?`<button class="anaBtn2" id="tekrarCoz">Yanlışları tekrar çöz · ${ys.length} soru ${IK.ok}<small>doğru yaptıkların özetten düşer</small></button>`:''}
  <button class="anaBtn2 ikincil" id="ozetGit">Bana özel konu özeti ${IK.ok}<small>yanlış yaptığın maddelerin anlatımı, ipuçları ve tuzakları</small></button>`;
  $('#geri').onclick=()=>{if(!window.merkezGeri())checkupAnaliz(id);};
  $('#ozetGit').onclick=()=>ozet(id,()=>yanlisOzet(id),'bu');
  if($('#tekrarCoz'))$('#tekrarCoz').onclick=()=>basla(karistir(ys),`${kisa(k)} · yanlışlar`,{tani:true,tur:'tekrar',kanun:id});
}
/* ---------- 6. ALTIN ÖZET ---------- */
function ozet(id,geriHedef,sekme,hedefM){ if(kilit('ozet'))return;
  iz(()=>ozet(id,geriHedef,sekme));
  document.body.classList.remove('sinavda','giriste');window.scrollTo({top:0});
  const k=BYID[id],cu=K.checkup[id];if(!cu){checkupBolum(id);return;}
  sekme=sekme||'bu';
  // eksik maddeler GÜNCEL soru setinden (çıkarılan sorunun maddesi eksik sayılmaz)
  const ozC=cuOzet(k,cu);const kacanL=[...new Set(cu.ids.map(i=>TUM[i]).filter(q=>q&&K.tani[kid(q.i)]===0).map(maddeNo).filter(Boolean))];
  const kacan=new Set(kacanL);
  const ilgili=n=>n.m.some(m=>kacan.has(m));
  const noktalar=k.n.filter(n=>ilgili(n)||(hedefM&&n.m.includes(hedefM)));
  const tuzaklar=k.tz.filter(z=>z.m.some(m=>kacan.has(m))||kacanL.some(m=>new RegExp('(^|[^\\d])'+m+'(/|[^\\d]|$)').test(z.d)));
  const takviye=noktalar.length<3?k.n.filter(n=>n.s&&!ilgili(n)).slice(0,6):[];
  const tipler=cu.tipler||[];
  const kayitli=KANUN.filter(x=>K.checkup[x.id]).sort((a,b)=>K.checkup[b.id].tarih.localeCompare(K.checkup[a.id].tarih));
  K.kayit=K.kayit||{};
  const kayitBtn=id=>`<button class="kaydet ${K.kayit[id]?'acik':''}" data-kaydet="${id}">${IK.yerimi}${K.kayit[id]?'Kaydedildi':'Kaydet'}</button>`;
  const tirnakSil0=t=>String(t).replace(/^[\s"“”']+|[\s"“”']+$/g,'');
  const tzMadde0=z=>z.m[0]||((String(z.d).match(/\((\d+)(?:\/[^)]*)?\)\s*$/)||[])[1])||'';
  const kullanilanTz=new Set();
  // Kısa özet: kalın anahtar parçalar; yoksa uzun hükmün ilk parçası; o da yoksa başlık
  const kisaOzet=n=>{ if(n.k)return n.k; const h=String(n.h||''); if(h.length>170){const p=h.split(/;|,\s(?=[a-zçğıöşü])/)[0];return p.length<h.length?p.trim()+' …':h.slice(0,150).trim()+' …';} return n.b; };
  // Madde kartı: hüküm = doğrusu; altında kırmızı "Sınavda böyle yazarlar" (noktanın kendi tuzağı + aynı maddenin yanlış şıkları)
  // TUZAK → NOKTA EŞLEŞMESİ (içerikle): aynı maddedeki noktalardan kelime/sayı örtüşmesi en yüksek olana; eşik 2.
  const tzEsle=kk=>{ if(kk._tzEs)return kk._tzEs; const kel=t=>new Set(String(t||'').toLocaleLowerCase('tr').replace(/[^a-zçğıöşü0-9\-\/ ]/g,' ').split(/\s+/).filter(w=>w.length>=4||/\d/.test(w)));
    const es={}; kk.tz.forEach((z,zi)=>{if(z.bag){(es[z.bag]=es[z.bag]||[]).push(zi);return;}const m=tzMadde0(z);if(!m)return;const zk=kel(z.d+' '+z.y);let en=null,enP=0;
      for(const n of kk.n){if(!n.m.includes(m)||n.tzKapat)continue;const nk=kel(n.b+' '+n.h+' '+(n.t||''));let p=0;zk.forEach(w=>{if(nk.has(w))p+=(/\d/.test(w)?2:1);});if(p>enP){enP=p;en=n;}}
      if(en&&enP>=2)(es[en.i]=es[en.i]||[]).push(zi);}); return kk._tzEs=es; };
  const parcala=y=>String(y||'').split(/"\s*(?:\/|,|veya|ya da)\s*"/).map(tirnakSil0).filter(Boolean).map(x=>'“'+x+'”');
  const kart=(n,kk)=>{kk=kk||k;const mm=n.m[0];const ekTz=(tzEsle(kk)[n.i]||[]).map(zi=>kk.tz[zi]);ekTz.forEach(z=>kullanilanTz.add(kk.id+'-tz'+kk.tz.indexOf(z)));
    const yanlislar=n.yz?n.yz.slice():[...new Set([n.t,...ekTz.flatMap(z=>parcala(z.y))].filter(Boolean))];
    const dogrular=n.dg?n.dg.slice():[...new Set(ekTz.map(z=>tirnakSil0(z.d)).filter(Boolean))];
    if(!dogrular.length)dogrular.push(kisaOzet(n));  // tuzak yoksa hükmün anahtar parçaları
    return `<article class="ozKart" data-m="${mm}"><div class="ozUst"><span class="ozNo">${mm?'m.'+mm:''}</span><b>${esc(n.b)}</b>${kayitBtn(n.i)}</div><p class="ozHukum">${esc(n.h)}</p>${n.nd?`<p class="ozNd">${esc(n.nd)}</p>`:''}${yanlislar.length?`<div class="tzYanlis"><span class="tzIk">✕</span><div><small>Sınavda böyle yazarlar</small>${yanlislar.map(x=>`<p>${esc(x)}</p>`).join('')}</div></div>`:''}${dogrular.length?`<div class="tuzakKutu iyi"><span class="tuzakIk">${IK.tik}</span><div><b>Doğrusu</b>${dogrular.map(d=>`<p>${esc(d)}</p>`).join('')}</div></div>`:''}</article>`;};
  const tirnakSil=t=>String(t).replace(/^[\s"“”']+|[\s"“”']+$/g,'');
  const tzMadde=z=>z.m[0]||((String(z.d).match(/\((\d+)(?:\/[^)]*)?\)\s*$/)||[])[1])||'';
  // Eşleşmeyen tuzak kartı da üstte madde açıklamasıyla (başkan, 3 Eki: "bunlarda neden üstte açıklama yok"):
  // aynı maddenin noktası varsa onun başlığı + hükmü; yoksa yalnız madde numarası.
  const maddeNoktasi=z=>{const m=tzMadde(z);return m?k.n.find(n=>n.m.includes(m)):null;};
  const tuzakKart=(z,i)=>{const mn=maddeNoktasi(z);return `<article class="ozKart tzKart"><div class="ozUst"><span class="ozNo">${tzMadde(z)?'m.'+tzMadde(z):''}</span><b>${esc(mn?mn.b:'Madde '+tzMadde(z))}</b>${kayitBtn(k.id+'-tz'+k.tz.indexOf(z))}</div>
    ${mn?`<p class="ozHukum">${esc(mn.h)}</p>`:''}
    <div class="tzYanlis"><span class="tzIk">✕</span><div><small>Sınavda böyle yazarlar</small>${parcala(z.y).map(x=>`<p>${esc(x)}</p>`).join('')}</div></div>
    <div class="tuzakKutu iyi"><span class="tuzakIk">${IK.tik}</span><div><b>Doğrusu</b><p>${esc(z.d)}</p></div></div></article>`;};
  // Ezber tablosu: konu → DEĞER (altın, büyük) · madde. (3 Eki: değer sütunu eskiden görünmüyordu.)
  const tablo=(baslik,rows,alt)=>rows.length?`<h3 class="bolumBaslik">${baslik}</h3><p class="kucukNot">${alt}</p><div class="ezber">${rows.slice(0,20).map(r=>`<div class="ezSatir"><span class="ezKonu">${esc(r[0])}${r[2]?` <em>${esc(/^m\./.test(r[2])?r[2]:'m.'+r[2])}</em>`:''}</span><b class="ezDeger">${esc(r[1])}</b></div>`).join('')}</div>`:'';
  // ---- MADDE BLOKLARI ----
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
    return `<details class="mBlok ${qm&&qm.y.length?'hatali':''}" data-m="${m}" ${acik?'open':''}><summary class="mBas"><span class="ozNo">m.${esc(m)}</span><b>${esc(maddeBaslik(k,m))}${ns.length>1?`<em class="mKonu">+${ns.length-1} konu</em>`:''}</b>${qm&&qm.y.length?`<span class="mYanlis">${qm.y.length}/${qm.n} yanlış</span>`:''}<span class="acilirOk">${IK.sag}</span></summary>
      ${bana&&qm&&qm.y.length?`<details class="mSorular"><summary>${IK.hedef}<span>Bu maddede yanlış yaptığın ${qm.y.length} soru</span><span class="acilirOk">${IK.sag}</span></summary>${qm.y.map(q=>{const c=K.cevap[kid(q.i)];return `<div class="mSoru"><p class="yoSoru">${esc(q.k)}</p>${c!==undefined?`<p class="mSenin">✕ ${HARF[c]}) ${esc(q.s[c])}</p>`:''}<p class="mDogru">✓ ${HARF[q.d]}) ${vurgula(q.s[q.d])}</p>${q.a?`<p class="mNeden">${vurgula(q.a,q.s[q.d])}</p>`:''}</div>`;}).join('')}</details>`:''}
      ${ip.length?`<div class="mIpucu"><small>${IK.hedef} Sınavda nasıl soruluyor</small>${ip.map(x=>`<p>${vurgula(x)}</p>`).join('')}</div>`:''}
      ${ns.map(n=>kart(n)).join('')}
      ${bana?artikTz.filter(z=>!kullanilanTz.has(k.id+'-tz'+k.tz.indexOf(z))).map(tuzakKart).join(''):''}
      ${ts.length?`<div class="ezber mEzber"><small>Ezberle</small>${ts.map(r=>`<div class="ezSatir"><span class="ezKonu">${esc(r[0])}</span><b class="ezDeger">${esc(r[1])}</b></div>`).join('')}</div>`:''}
      ${kr.length?`<div class="mKaris"><small>Karıştırılan maddeler</small><div>${kr.map(x=>`<button class="mGit" data-git="${esc(x)}">m.${esc(x)} · ${esc(maddeBaslik(k,x))}</button>`).join('')}</div></div>`:''}
    </details>`;};
  const banaM=Object.keys(qMadde).filter(m=>qMadde[m].y.length&&maddeNolari.includes(m)).sort((a,b)=>qMadde[b].y.length-qMadde[a].y.length);
  const yanlisToplam=Object.values(qMadde).reduce((a,o)=>a+o.y.length,0);
  const bu=`<p class="ozOzet">${esc(kisa(k))} · check-up ${tarihYaz(cu.tarih)} · ${ozC.d}/${ozC.n} doğru · ${yanlisToplam} yanlış, ${banaM.length} madde</p>
    ${tipler.length?`<details class="tipIpucu"><summary>${IK.unlem}<span>Zorlandığın soru tipleri: <b>${tipler.map(t=>esc((TIPLER.find(x=>x[0]===t)||[])[1]||t)).join(', ')}</b></span><span class="acilirOk">${IK.sag}</span></summary>${tipler.map(t=>`<p><b>${esc((TIPLER.find(x=>x[0]===t)||[])[1]||t)}:</b> ${esc(TIP_TAVSIYE[t]||'')}</p>`).join('')}</details>`:''}
    ${banaM.length?banaM.map((m,i)=>blok(m,i<3,true)).join(''):'<p class="kucukNot">Bu check-up\'ta yanlışın yok. Kanunun tamamına "Tüm kanun" sekmesinden bakabilirsin.</p>'}
    <button class="anaBtn2 ikincil" id="tumGec">Kanunun tüm Altın Özeti ${IK.ok}<small>bütün maddeler, sırayla</small></button>`;
  const tum=`<p class="ozOzet">${esc(kisa(k))} · ${maddeNolari.length} madde · ${k.n.length} nokta</p>
    ${maddeNolari.map(m=>blok(m,false,false)).join('')}
    ${tablo('Sayılar ve süreler',k.sayi||[],'Sınavda en çok oynanan rakamlar.')}${tablo('Yetkili makamlar',k.makam||[],'Hangi işi kim yapar?')}`;
  const kayitKartlar=[];for(const kk of KANUN){kk.n.forEach(n=>{if(K.kayit[n.i])kayitKartlar.push({k:kk,h:kart(n,kk)});});kk.tz.forEach((z,i)=>{if(K.kayit[kk.id+'-tz'+i])kayitKartlar.push({k:kk,h:tuzakKart(z,i)});});}
  const kayitliHtml=kayitKartlar.length?`<p class="ozOzet">${kayitKartlar.length} kayıtlı kart · dokunup kaldırabilirsin</p>${kayitKartlar.map(x=>`<p class="ozKanun">${esc(kisa(x.k))}</p>${x.h}`).join('')}<h3 class="bolumBaslik">Check-up yaptığın kanunlar</h3>`:'<p class="kucukNot">Henüz kart kaydetmedin. Kartların sağ üstündeki "Kaydet"e dokun.</p>';
  const eskiKayitliHtml=`<section class="liste">${kayitli.map(x=>`<button class="satir cu" data-oz="${x.id}"><span class="satirIk">${IK.belge}</span><span class="satirMetin"><b>${esc(kisa(x))}</b><small>${tarihYaz(K.checkup[x.id].tarih)} · ${K.checkup[x.id].d}/${K.checkup[x.id].n} · ${K.checkup[x.id].kacan.length?'eksik: '+K.checkup[x.id].kacan.map(m=>'m.'+m).join(', '):'eksik yok'}</small></span><span class="satirOk">${IK.sag}</span></button>`).join('')}</section>`;
  $('#ekran').innerHTML=`<div class="ustBar"><button class="geriIk" id="geri">‹</button><h2>${sekme==='tum'?'Altın Özet':sekme==='kayit'?'Kaydettiklerim':'Bana özel konu özeti'}</h2><span></span></div>
  <div class="segment uclu" id="ozSekme"><button data-s="bu" aria-pressed="${sekme==='bu'}">Bana özel</button><button data-s="tum" aria-pressed="${sekme==='tum'}">Tüm kanun</button><button data-s="kayit" aria-pressed="${sekme==='kayit'}">Kaydettiklerim</button></div>
  ${sekme==='bu'?bu:sekme==='tum'?tum:kayitliHtml+(kayitKartlar.length?eskiKayitliHtml:'')}`;
  if($('#tumGec'))$('#tumGec').onclick=()=>{YIGIN.pop();POP=true;ozet(id,geriHedef,'tum');};
  // karıştırılan madde: bu sayfada bloğu varsa aç ve kaydır; yoksa Tüm kanun sekmesinde aç
  const blokAc=m=>{const b=document.querySelector(`.mBlok[data-m="${m}"]`);if(!b)return false;b.open=true;setTimeout(()=>{b.scrollIntoView({behavior:'smooth',block:'start'});b.classList.add('vurgu');setTimeout(()=>b.classList.remove('vurgu'),1800);},60);return true;};
  document.querySelectorAll('[data-git]').forEach(x=>x.onclick=()=>{if(!blokAc(x.dataset.git)){YIGIN.pop();POP=true;ozet(id,geriHedef,'tum',x.dataset.git);}});
  $('#geri').onclick=()=>{if(!window.merkezGeri())giris();};
  document.querySelectorAll('#ozSekme button').forEach(b=>b.onclick=()=>{YIGIN.pop();POP=true;ozet(id,geriHedef,b.dataset.s);});
  if(hedefM&&!blokAc(hedefM)&&sekme==='bu'){YIGIN.pop();POP=true;ozet(id,geriHedef,'tum',hedefM);return;}
  document.querySelectorAll('[data-oz]').forEach(b=>b.onclick=()=>ozet(+b.dataset.oz,geriHedef,'bu'));
  document.querySelectorAll('[data-kaydet]').forEach(b=>b.onclick=()=>{const id=b.dataset.kaydet;if(K.kayit[id])delete K.kayit[id];else K.kayit[id]=true;kaydet();b.classList.toggle('acik',!!K.kayit[id]);b.innerHTML=IK.yerimi+(K.kayit[id]?'Kaydedildi':'Kaydet');toast(K.kayit[id]?'Kaydedildi. Kaydettiklerim sekmesinden ulaşırsın.':'Kayıttan kaldırıldı.');});
  if($('#tumu'))$('#tumu').onclick=()=>ozet(id,geriHedef,'kayit');
}

/* ---------- Konu notları / Soru bankası ---------- */
function kanunListesi(mod){
  iz(()=>kanunListesi(mod));
  document.body.classList.remove('sinavda','giriste');window.scrollTo({top:0});
  const ks=KANUN.filter(k=>k.g===K.g);
  $('#ekran').innerHTML=`<div class="ustBar"><button class="geriIk" id="geri">‹</button><h2>${mod==='not'?'Konu notları':'Soru bankası'}</h2><span></span></div>
  <div class="segment" id="kpSec"><button data-g="mus" aria-pressed="${K.g==='mus'}">Müşterek</button><button data-g="${BRANS.slug}" aria-pressed="${K.g===BRANS.slug}">Branş (${esc(BRANS.ad)})</button></div>
  <section class="liste">${ks.map(k=>`<button class="satir cu" data-id="${k.id}"><span class="satirIk">${mod==='not'?IK.kitap:IK.belge}</span><span class="satirMetin"><b>${esc(kisa(k))}</b><small>${mod==='not'?`${k.n.length} nokta · ★ ${k.n.filter(n=>n.s).length} çıkmış`:`${k.q.length} soru`}</small></span><span class="satirOk">${IK.sag}</span></button>`).join('')}</section>`;
  $('#geri').onclick=giris;
  document.querySelectorAll('#kpSec button').forEach(b=>b.onclick=()=>{K.g=b.dataset.g;kaydet();kanunListesi(mod);});
  document.querySelectorAll('.satir.cu').forEach(b=>b.onclick=()=>{const k=BYID[+b.dataset.id];mod==='not'?konuNotu(k.id):basla(karistir(k.q).slice(0,20),kisa(k),{tani:false,tur:'serbest'});});
}
function mdHazirla(md){return md.replace(/★\s*(çıkmış|20\d\d(?:\/\d+)?)/g,'<span class="yld">★ $1</span>').replace(/(^|\s)★(?!\s*<)/g,'$1<span class="yld">★</span>').replace(/\*Tuzak:\*/g,'<span class="etk tz">Tuzak</span>').replace(/\*\*Ne demek:\*\*/g,'<span class="etk nd">Ne demek</span>').replace(/\*Örnek:\*/g,'<span class="etk or">Örnek</span>');}
function konuNotu(id){
  iz(()=>konuNotu(id));
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
function aktifDevam(){if(kilit('devam'))return false;const a=K.aktif;if(!a||!a.ids)return false;const sorular=a.ids.map(id=>TUM[id]).filter(Boolean);if(!sorular.length){K.aktif=null;return false;}
  S={sorular,ad:a.ad,i:Math.min(a.i||0,sorular.length-1),cevap:a.cevap||{},meta:a.meta||{}};iz(()=>{if(!aktifDevam())giris();});soruCiz();return true;}
function basla(sorular,ad,meta){if(!sorular.length){toast('Soru bulunamadı.');return;}S={sorular,ad,i:0,cevap:{},meta:meta||{}};iz(()=>{if(!aktifDevam())giris();});soruCiz();}
function soruCiz(kaydir=true){
  aktifKaydet();document.body.classList.remove('giriste');document.body.classList.add('sinavda');if(kaydir)window.scrollTo({top:0});
  const q=S.sorular[S.i],k=BYID[q.l],c=S.cevap[S.i],cevapli=c!==undefined;
  const mod=S.meta.tur==='rontgen'?'Röntgen Modu':S.meta.tur==='checkup'?'Check-up Modu':S.ad;
  $('#ekran').innerHTML=`<div class="sinav">
   <div class="ustBar"><button class="geriIk" id="geri">‹</button><h2>${esc(S.meta.tur==='rontgen'?'Röntgen':S.meta.tur==='checkup'?'Check-up':S.ad)}</h2><span></span></div>
   <div class="ilerleSatir"><div class="ilerle"><span style="width:${(S.i+1)/S.sorular.length*100}%"></span></div><span class="say">${S.i+1} / ${S.sorular.length}</span>${S.meta.bolum?`<span class="blokEtiket">${S.i<S.meta.bolum?'Müşterek':'Branş'}</span>`:''}</div>
   <div class="cipSatir"><span class="cipK">${IK.hedef}${esc(kisa(k))}</span><span class="cipMod">${IK.radar}${esc(mod)}</span></div>
   <article class="kart soru"><div class="soruNo">Soru ${S.i+1}</div>
     <p class="kok">${esc(q.k)}</p>
     <div class="siklar">${q.s.map((s,j)=>`<button class="sik ${cevapli&&j===c?'secili':''}" data-j="${j}"><span class="h">${HARF[j]}</span><span>${esc(s)}</span></button>`).join('')}</div>
     <div class="soruBtn"><button class="btn" id="onc" ${S.i?'':'disabled style="opacity:.4"'}>Önceki</button><button class="btn ana" id="snr">${S.i===S.sorular.length-1?'Bitir':'Sonraki'} ${IK.ok}</button></div>
   </article></div>`;
  $('#geri').onclick=()=>{aktifKaydet();S=null;if(!window.merkezGeri())giris();};
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
  YIGIN.pop();iz(()=>giris());
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
