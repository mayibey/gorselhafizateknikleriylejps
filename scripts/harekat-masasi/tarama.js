/* ---------- EKSİK TARAMASI (check-up + röntgen) ---------- */
// Ağırlık = sınavdaki soru payı. Müşterek: karma denemelerin 50 soruluk MEBS dağılımı (karma-brans-uret.mjs AGIRLIK_MEBS).
// MEBS: 30 soruluk branş bloğu, 2024 MEBS kitapçığındaki ★ yoğunluğuyla orantılı.
const AGIRLIK={1:7,2:3,3:2,4:1,5:3,6:3,7:3,8:1,9:1,10:1,11:1,12:3,13:1,14:1,15:4,16:1,17:4,18:1,19:1,20:1,21:1,22:3,23:1,24:1,25:1,
  68:4,97:4,98:3,99:3,100:3,101:3,102:4,142:3,103:3};
// Çıkmış sınavlardaki soru tipi payı (scripts/cikmis-referans.json tipAgirlik, 2.367 mevzuat sorusu).
const TIP_PAY={olumsuz:34.5,makam:21.1,bosluk:5.1,onculu:4.8,tanim:1.8};
const SINAV_AN=new Date('2026-10-10T10:00:00+03:00');
const w=id=>AGIRLIK[id]||1;
const maddeNo=q=>{const m=(q.y||'').match(/m\.\s*(\d+)/i);return m?m[1]:'?';};
const kapsamKanun=kp=>KANUN.filter(k=>kp==='hepsi'||k.g===kp);
function maddeyeGoreSec(k,adet,haric){
  const gruplar={};karistir(k.q).forEach(q=>{if(haric&&haric.has(q.i))return;(gruplar[maddeNo(q)]=gruplar[maddeNo(q)]||[]).push(q)});
  const anahtar=karistir(Object.keys(gruplar));const out=[];
  let tur=0;while(out.length<adet&&anahtar.some(a=>gruplar[a].length)){for(const a of anahtar){if(out.length>=adet)break;const g=gruplar[a];if(g.length)out.push(g.shift());}if(++tur>20)break;}
  return out;
}
function taramaBaslat(tur,kp){
  const kanunlar=kapsamKanun(kp);let sorular=[];
  for(const k of kanunlar){
    const adet=tur==='check'?(w(k.id)>=4?2:1):Math.max(6,Math.min(15,w(k.id)*4));
    sorular.push(...maddeyeGoreSec(k,adet));
  }
  if(tur==='check') sorular=karistir(sorular);
  const ad=tur==='check'?'Hızlı Check-up':'Detaylı Röntgen';
  basla(sorular,ad,true,0);
  S.tarama={tur,kp,ek:false,bas:Date.now()};aktifKaydet();soruCiz(false);
}
// Check-up: ilk tur bitince yanlış çıkan her kanundan farklı bir maddeden 1 soru daha (dikkatsizlik mi, eksik mi?).
function checkupEk(){
  if(!S.tarama||S.tarama.tur!=='check'||S.tarama.ek) return false;
  S.tarama.ek=true;const zaten=new Set(S.sorular.map(q=>q.i));const ek=[];
  const yanlisK=[...new Set(S.sorular.filter((q,i)=>S.cevap[i]!==q.d).map(q=>q.l))];
  for(const id of yanlisK){const s=maddeyeGoreSec(BYID[id],1,zaten);if(s.length)ek.push(s[0]);}
  if(!ek.length) return false;
  S.sorular.push(...karistir(ek));S.i++;toast(`${ek.length} kanunda emin olmak için birer soru daha`);soruCiz();return true;
}
function taramaBitir(){
  const T=S.tarama;K.aktif=null;
  S.sorular.forEach((q,i)=>{if(S.cevap[i]!==undefined) isle(q,S.cevap[i]===q.d,S.cevap[i])});rutbeCiz();
  const sonuc={};S.sorular.forEach((q,i)=>{sonuc[q.i]=S.cevap[i]===undefined?-1:(S.cevap[i]===q.d?1:0)});
  const kayit={id:Date.now(),tur:T.tur,kp:T.kp,tarih:new Date().toISOString(),sure:Math.round((Date.now()-T.bas)/60000),sonuc,plan:{}};
  K.taramalar=(K.taramalar||[]).concat([kayit]).slice(-8);kaydet();S=null;recete(kayit.id);
}
function taramaGiris(){
  document.body.classList.remove('sinavda');window.scrollTo({top:0});
  const son=(K.taramalar||[]).slice(-1)[0];
  $('#ekran').innerHTML=`<button class="geri" id="geri">‹ Ana ekran</button>
  <div class="mvBas"><div><h2>Eksik taraması</h2><div class="kapsam">Sınav öncesi nerede eksik olduğunu bulur, sana özel çalışma planı çıkarır</div></div></div>
  <div class="rapor">
   <div class="kart"><h3>Neyi tarayalım?</h3><div class="ara" id="kpSec">
     <button class="anahtar" data-kp="hepsi" aria-pressed="true">Müşterek + MEBS</button>
     <button class="anahtar" data-kp="mus" aria-pressed="false">Yalnız Müşterek</button>
     <button class="anahtar" data-kp="mebs" aria-pressed="false">Yalnız MEBS</button></div></div>
   <div class="tarama2">
    <div class="kart tur"><span class="rozet">≈ 15-20 dk</span><h3>Hızlı Check-up</h3>
      <p>Her kanundan 1 soru, sınavda çok soru çıkan kanunlardan 2. Yanlış yaptığın kanuna, dikkatsizlik mi eksik mi anlamak için bir soru daha gelir. Cevaplar sonda gösterilir.</p>
      <p class="kucukNot" id="nCheck"></p><button class="btn ana" id="bCheck">Check-up'ı başlat</button></div>
    <div class="kart tur"><span class="rozet">≈ 2-3 saat · ara verebilirsin</span><h3>Detaylı Röntgen</h3>
      <p>Her kanunun farklı maddelerinden, sınav ağırlığına göre 6-15 soru. Madde madde, soru tipi soru tipi nerede eksik olduğunu çıkarır. Kapatırsan kaldığın yerden devam eder.</p>
      <p class="kucukNot" id="nRontgen"></p><button class="btn ana" id="bRontgen">Röntgeni başlat</button></div>
   </div>
   ${son?`<div class="kart"><h3>Son taraman</h3><p style="margin:0 0 10px;color:var(--soluk)">${son.tur==='check'?'Hızlı Check-up':'Detaylı Röntgen'} · ${new Date(son.tarih).toLocaleDateString('tr-TR',{day:'numeric',month:'long',hour:'2-digit',minute:'2-digit'})}</p><button class="btn" id="sonRecete">Reçeteni aç</button></div>`:''}
  </div>`;
  let kp='hepsi';
  const say=()=>{const ks=kapsamKanun(kp);$('#nCheck').textContent=`${ks.reduce((a,k)=>a+(w(k.id)>=4?2:1),0)} soru + gerekirse birkaç ek`;
    $('#nRontgen').textContent=`${ks.reduce((a,k)=>a+Math.min(k.q.length,Math.max(6,Math.min(15,w(k.id)*4))),0)} soru`;};
  say();
  document.querySelectorAll('#kpSec button').forEach(b=>b.onclick=()=>{kp=b.dataset.kp;document.querySelectorAll('#kpSec button').forEach(x=>x.setAttribute('aria-pressed',x===b));say();});
  $('#geri').onclick=ana;$('#bCheck').onclick=()=>taramaBaslat('check',kp);$('#bRontgen').onclick=()=>taramaBaslat('rontgen',kp);
  if($('#sonRecete')) $('#sonRecete').onclick=()=>recete(son.id);
}
function recete(id){
  document.body.classList.remove('sinavda');window.scrollTo({top:0});
  const R=(K.taramalar||[]).find(t=>t.id===id);if(!R){taramaGiris();return;}
  const onceki=(K.taramalar||[]).filter(t=>t.id<id&&t.kp===R.kp).slice(-1)[0];
  const cevaplar=Object.entries(R.sonuc).map(([qi,v])=>({q:TUM[qi],v})).filter(x=>x.q);
  const dg=cevaplar.filter(x=>x.v===1).length,top=cevaplar.length;
  // kanun bazında
  const kan={};for(const {q,v} of cevaplar){const o=kan[q.l]=kan[q.l]||{k:BYID[q.l],d:0,n:0,kacan:[]};o.n++;if(v===1)o.d++;else o.kacan.push(q);}
  const oncekiOran={};if(onceki){for(const [qi,v] of Object.entries(onceki.sonuc)){const q=TUM[qi];if(!q)continue;const o=oncekiOran[q.l]=oncekiOran[q.l]||[0,0];o[1]++;if(v===1)o[0]++;}}
  const durum=o=>{const r=o.d/o.n;return r>=.75?'hazir':r>=.4?'zayif':'kritik'};
  const liste=Object.values(kan).map(o=>({...o,oran:o.d/o.n,durum:durum(o),oncelik:w(o.k.id)*(1-o.d/o.n)})).sort((a,b)=>b.oncelik-a.oncelik||a.oran-b.oran);
  const sayac={hazir:0,zayif:0,kritik:0};liste.forEach(x=>sayac[x.durum]++);
  // soru tipi
  const genel=top?dg/top:0;
  const tipler=TIPLER.map(([tid,ad,f,tav])=>{const c=cevaplar.filter(x=>f(x.q));const d=c.filter(x=>x.v===1).length;return {tid,ad,f,tav,n:c.length,oran:c.length?d/c.length:0}}).filter(t=>t.n>=3);
  const zayifTip=tipler.filter(t=>t.oran<Math.min(.6,genel-.1)||t.oran<genel-.15).sort((a,b)=>a.oran-b.oran);
  // plan
  const kalanGun=Math.max(0,Math.floor((SINAV_AN-new Date())/86400000));
  const odak=liste.filter(x=>x.durum!=='hazir');
  const gunler=[];
  const calismaGunu=Math.max(0,kalanGun-2);
  if(calismaGunu>0){
    const kuyruk=odak.length?odak:liste.slice(0,4);
    const gunBasi=Math.max(1,Math.ceil(kuyruk.length/calismaGunu));
    for(let g=0;g<calismaGunu;g++){
      let secilen=kuyruk.slice(g*gunBasi,(g+1)*gunBasi);
      if(!secilen.length) secilen=kuyruk.slice(0,2); // hepsi bitti → en kritik kanunlara ikinci tur
      const is=[];
      secilen.forEach(x=>{is.push({t:'not',id:x.k.id,m:`${kisaAd(x.k)}: konu notunda ★ ve Tuzak satırlarını oku`});
        is.push({t:'soru',id:x.k.id,m:`${kisaAd(x.k)}: 15 soru çöz (önce kaçırdığın maddeler)`});});
      if(zayifTip.length){const t=zayifTip[g%zayifTip.length];is.push({t:'tip',tid:t.tid,m:`${t.ad}: 12 soruluk tip çalışması`});}
      is.push({t:'defter',m:'Yanlış defterini boşalt (dünkü yanlışlar)'});
      gunler.push({ad:g===0?'Bugün':g===1?'Yarın':`${g+1}. gün`,is});
    }
  }
  if(kalanGun>=2) gunler.push({ad:'Sınavdan 2 gün önce',is:[{t:'prova',m:'Sınav provası: 80 soru (50 müşterek + 30 MEBS), süre tutarak'},{t:'defter',m:'Provadaki yanlışları yanlış defterinden kapat'}]});
  if(kalanGun>=1) gunler.push({ad:'Sınavdan 1 gün önce',is:[{t:'son',m:'Son tekrar listeleri + her kanunun yalnız ★ satırları. Yeni konuya girme.'},{t:'tekrar',m:`Tekrar taraması: Hızlı Check-up (ilerlemeni gör)`}]});
  const plan=R.plan||{};
  const yz=x=>Math.round(x*100);
  const rozetRenk={hazir:'var(--dogru)',zayif:'var(--altin2)',kritik:'#FF8F86'};
  const durumAd={hazir:'Hazır',zayif:'Zayıf',kritik:'Kritik'};
  const fark=x=>{const o=oncekiOran[x.k.id];if(!o)return '';const d=yz(x.oran)-yz(o[0]/o[1]);return d?`<span class="fark" style="color:${d>0?'var(--dogru)':'#FF8F86'}">${d>0?'▲':'▼'}${Math.abs(d)}</span>`:''};
  const oz=`<p><b>${top}</b> sorunun <b>${dg}</b>'ini doğru yaptın (%${yz(genel)}). ${sayac.hazir} kanunda hazırsın, ${sayac.zayif} kanunda zayıf, ${sayac.kritik} kanunda kritik eksiğin var.</p>`+
    (liste[0]&&liste[0].durum!=='hazir'?`<p><b>En çok puan kaybettireceğin yer:</b> ${liste.filter(x=>x.durum!=='hazir').slice(0,3).map(x=>esc(kisaAd(x.k))).join(', ')}. Hem sınavda çok soru çıkıyor hem de bu taramada kaçırdın.</p>`:'<p>Taranan kanunların hepsinde iyi durumdasın. Planı tekrar ve prova ağırlıklı kurdum.</p>')+
    (zayifTip.length?zayifTip.slice(0,2).map(t=>`<p><b>${esc(t.ad)}:</b> bu tipte %${yz(t.oran)} doğru, genel ortalamanın altında.${TIP_PAY[t.tid]?` Çıkmış sınav sorularının yaklaşık %${TIP_PAY[t.tid]}'i bu tipte.`:''} ${esc(t.tav)}</p>`).join(''):'<p>Soru tiplerinde belirgin bir zaafın çıkmadı; eksikler konu bilgisinden geliyor.</p>')+
    `<p style="color:var(--soluk)">Sınava ${kalanGun} gün var. Aşağıdaki plan eksiklerini sınav ağırlığına göre sıraladı; her maddeye dokununca ilgili çalışma açılır.</p>`;
  $('#ekran').innerHTML=`<button class="geri" id="geri">‹ Eksik taraması</button>
  <div class="mvBas"><div><h2>Sınav reçeten</h2><div class="kapsam">${R.tur==='check'?'Hızlı Check-up':'Detaylı Röntgen'} · ${new Date(R.tarih).toLocaleDateString('tr-TR',{day:'numeric',month:'long'})} · ${R.sure} dk${onceki?' · ▲▼ önceki taramaya göre':''}</div></div>
    <button class="btn" id="yenidenTara">Yeniden tara</button></div>
  <div class="rapor">
   <div class="kart"><h3>Teşhis</h3><div class="yorum">${oz}</div></div>
   <div class="kart"><h3>Hazırlık haritası</h3><p class="kucukNot">Sıra: sınav ağırlığı × eksiklik. Dokun: konu notu açılır.</p>
     <div class="harita">${liste.map(x=>`<button class="hk" data-id="${x.k.id}" style="--r:${rozetRenk[x.durum]}"><span class="hd">${durumAd[x.durum]}</span><b>${esc(kisaAd(x.k))}</b><small>${x.d}/${x.n} doğru ${fark(x)}${x.kacan.length?` · kaçan: ${[...new Set(x.kacan.map(maddeNo))].slice(0,5).map(m=>'m.'+m).join(', ')}`:''}</small></button>`).join('')}</div></div>
   ${tipler.length?`<div class="kart"><h3>Soru tipine göre</h3><div class="satirlar">${tipler.map(t=>`<div class="satir"><span>${esc(t.ad)}<small>${t.n} soru${TIP_PAY[t.tid]?` · sınavdaki payı ≈%${TIP_PAY[t.tid]}`:''}</small></span><span class="c"><i style="width:${Math.max(3,yz(t.oran))}%;background:linear-gradient(90deg,var(--dogru),var(--altin))"></i></span><span class="o">%${yz(t.oran)}</span></div>`).join('')}</div><p class="kucukNot" style="margin-top:8px">Çubuk: bu tipteki doğru oranın.</p></div>`:''}
   <div class="kart"><h3>Çalışma planın</h3><div class="plan">${gunler.map((g,gi)=>`<div class="gun"><h4>${g.ad}</h4>${g.is.map((x,ii)=>{const key=gi+'-'+ii;return `<div class="is${plan[key]?' bitti':''}"><button class="tik" data-k="${key}" aria-label="Tamamlandı">${plan[key]?'✓':''}</button><span>${esc(x.m)}</span>${x.t==='son'||x.t==='tekrar'||x.t==='not'||x.t==='soru'||x.t==='tip'||x.t==='defter'||x.t==='prova'?`<button class="git" data-gi="${gi}" data-ii="${ii}">Aç ›</button>`:''}</div>`}).join('')}</div>`).join('')||'<p>Sınav günü geldi. Bol şans komutanım!</p>'}</div></div>
   <div class="kart"><h3>Claude'un yorumu</h3><div class="aiKutu bekle" id="ai">Kaçırdığın soruları okuyup ortak hatanı ve en kısa yoldan ne yapman gerektiğini söyler.</div><div style="margin-top:12px"><button class="btn" id="aiBtn">Reçetemi Claude yorumlasın</button></div></div>
  </div>`;
  $('#geri').onclick=taramaGiris;$('#yenidenTara').onclick=taramaGiris;
  document.querySelectorAll('.hk').forEach(b=>b.onclick=()=>mevzuat(+b.dataset.id,'konu'));
  document.querySelectorAll('.tik').forEach(b=>b.onclick=()=>{const k=b.dataset.k;R.plan=R.plan||{};R.plan[k]=!R.plan[k];kaydet();b.textContent=R.plan[k]?'✓':'';b.parentNode.classList.toggle('bitti',!!R.plan[k]);});
  document.querySelectorAll('.git').forEach(b=>b.onclick=()=>{const x=gunler[+b.dataset.gi].is[+b.dataset.ii];
    if(x.t==='not') mevzuat(x.id,'konu');
    else if(x.t==='soru'){const k=BYID[x.id];const kacan=new Set((kan[x.id]||{kacan:[]}).kacan.map(maddeNo));
      const sira=[...k.q.filter(q=>kacan.has(maddeNo(q))),...karistir(k.q.filter(q=>!kacan.has(maddeNo(q))&&!(K.q[q.i]&&K.q[q.i][2]))),...karistir(k.q)];
      basla([...new Map(sira.map(q=>[q.i,q])).values()].slice(0,15),kisaAd(k)+' · reçete');}
    else if(x.t==='tip'){const t=TIPLER.find(y=>y[0]===x.tid);const odakId=new Set(odak.map(o=>o.k.id));
      const havuz=kapsamKanun(R.kp).flatMap(k=>k.q).filter(t[2]);basla([...karistir(havuz.filter(q=>odakId.has(q.l))),...karistir(havuz)].filter((q,i,a)=>a.findIndex(z=>z.i===q.i)===i).slice(0,12),t[1]);}
    else if(x.t==='defter'){const y=kapsamKanun(R.kp).flatMap(k=>k.q).filter(q=>K.q[q.i]&&!K.q[q.i][2]);y.length?basla(karistir(y),'Yanlış defteri'):toast('Yanlış defterin boş, harika!');}
    else if(x.t==='prova') basla([...karistir(grupSorular('mus')).slice(0,50),...karistir(grupSorular('mebs')).slice(0,30)],'Sınav provası',true);
    else if(x.t==='son'){GRUP='mus';ana();setTimeout(()=>{const e=$('#ekNot');e&&e.scrollIntoView({behavior:'smooth'})},100);}
    else if(x.t==='tekrar') taramaBaslat('check',R.kp);});
  $('#aiBtn').onclick=()=>receteAi(R,liste,tipler);
}
async function receteAi(R,liste,tipler){
  const kutu=$('#ai'),btn=$('#aiBtn');let sample=null;
  try{sample=window.claude&&claude.use?await claude.use('sample'):null;}catch(e){}
  if(!sample){kutu.textContent='Bu görünümde Claude yorumu kullanılamıyor. Yukarıdaki teşhis ve plan yine geçerli.';return;}
  const kacan=Object.entries(R.sonuc).filter(([,v])=>v!==1).map(([qi])=>TUM[qi]).filter(Boolean).slice(0,35);
  const satir=kacan.map((q,n)=>{const j=(K.s||{})[q.i];return `${n+1}) [${kisaAd(BYID[q.l])}] ${q.k.replace(/\s+/g,' ').slice(0,350)}\n   Cevabım: ${j!=null?HARF[j]+') '+q.s[j]:'boş'}\n   Doğru: ${HARF[q.d]}) ${q.s[q.d]}\n   Dayanak: ${q.y||'-'}`}).join('\n');
  const istem=`Sen JSPS (Jandarma ve Sahil Güvenlik Personel Seçme) sınavına ${Math.max(0,Math.floor((SINAV_AN-new Date())/86400000))} gün kalmış bir adaya koçluk yapıyorsun. Aday bir eksik taraması çözdü.
Kanun durumu (sınav ağırlığına göre sıralı): ${liste.map(x=>`${kisaAd(x.k)} ${x.d}/${x.n}`).join('; ')}.
Soru tipi doğru oranları: ${tipler.map(t=>`${t.ad} %${Math.round(t.oran*100)} (${t.n} soru)`).join('; ')||'yetersiz veri'}.
Kaçırdığı sorular:
${satir}
Görevin: hatalarındaki ORTAK DESENİ bul (hangi kavramları karıştırıyor, hangi tuzağa düşüyor, sayı-süre mi, makam mı, olumsuz kök mü). Her tespiti somut bir soru örneği ve dayanak maddeyle bağla; uydurma bilgi verme, yalnız verilen doğru cevaplardan çıkarım yap. Sonra kalan günlere göre en kısa yoldan ne yapması gerektiğini söyle.
Biçim: Türkçe, samimi, kısa. En fazla 5 madde, "•" ile, her biri 2-3 cümle. Markdown başlık ve kalın yazı kullanma. Sonunda "Bugün şunu yap:" ile başlayan tek somut adım.`;
  if(aiIptal) aiIptal.abort(); aiIptal=new AbortController();
  btn.disabled=true;btn.textContent='Claude okuyor…';kutu.classList.add('bekle');kutu.textContent='Düşünüyor… (ilk kullanımda izin penceresi çıkabilir)';
  try{const r=await sample(istem,{modelTier:'complex',cache:false,signal:aiIptal.signal,onText:({text})=>{kutu.classList.remove('bekle');kutu.textContent=text}});kutu.classList.remove('bekle');kutu.textContent=r.text;}
  catch(e){if(e&&e.code==='cancelled')return;kutu.classList.remove('bekle');kutu.textContent=(e&&e.text)?e.text:(e&&e.code==='not_granted'?'Claude yorumuna izin verilmedi.':e&&e.code==='rate_limited'?'Şu an çok istek var, birkaç dakika sonra tekrar dene.':'Yorum alınamadı. Birazdan tekrar dene.');}
  finally{btn.disabled=false;btn.textContent='Yeniden yorumlasın';}
}
