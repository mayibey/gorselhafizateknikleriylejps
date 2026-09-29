/* ---------- ZAYIF NOKTA ---------- */
const TIPLER=[
 ['olumsuz','Olumsuz soru kökü ("değildir / yanlıştır")',q=>/(değildir|yanlıştır|yoktur|söylenemez|olamaz|aykırıdır|bulunmaz|sayılmaz|yer almaz|gerekmez|dışındadır)\s*\??\s*$/i.test(q.k.trim())||/hangisi(si)?\s+(yanlış|değil)/i.test(q.k),
   'Olumsuz kökte aklın doğru şıkka kayıyor. Kökteki "değil / yanlış" kelimesini okuyunca dur; her şıkkı "bu maddede var mı?" diye tek tek ele, olmayanı bul.'],
 ['onculu','Öncüllü sorular (I, II, III…)',q=>/(^|\n|\s)(I|II|III|IV)[\.\)\-]\s/.test(q.k),
   'Öncüllü sorularda tek öncülü yanlış değerlendirmek şıkkı kaybettiriyor. Önce emin olduğun öncülü işaretle, onu içermeyen şıkları at, kalanlarda karar ver.'],
 ['sayi','Sayı, süre ve oranlar',q=>q.s.filter(x=>/\d|\bbir\b|\biki\b|\büç\b|dört|\bbeş\b|altı|yedi|sekiz|dokuz|\bon\b|yarı|gün|\bay\b|yıl|saat/i.test(x)).length>=4,
   'Rakam ve sürelerde kayıyorsun. Konu notundaki "Sayılar ve süreler" kısımlarını kendi tablona yaz ve her gün bir kez sesli tekrar et; sınav bu sayıları hep bir kademe kaydırır.'],
 ['makam','Yetkili makam / kim yapar',q=>/(\bkim\b|hangi (makam|merci|kurum|birim|kurul|komutan)|yetkili|tarafından|onaylanır|karar ver)/i.test(q.k),
   'Yetkili makamları karıştırıyorsun. Konu notundaki makam listelerini "iş → kim yapar" eşleştirmesi olarak çalış; şıklarda hep yakın makamlar (vali/kaymakam, Bakanlık/Kurum) yer değiştirir.'],
 ['bosluk','Boşluk doldurma',q=>/(boş bırakılan|boşluğa|\.{4,}|_{3,})/i.test(q.k),
   'Madde cümlesindeki kalıp kelimeleri tam hatırlamıyorsun. ★ satırlardaki kalın kelimelere odaklan; bu sorular madde cümlesinin kendisinden gelir.'],
 ['tanim','Tanım ve kavram',q=>/(tanım|ne ad verilir|olarak adlandırılır|kavram|neyi ifade)/i.test(q.k),
   'Tanımlarda yakın kavramları ayıramıyorsun. Konu notlarındaki kavram çiftlerini (ör. abone/kullanıcı, zimmet/irtikâp) ayıran tek kelimeyi ezberle.'],
 ['vaka','Olay / vaka soruları',q=>q.k.length>260||/Astsubay [A-ZÇŞ]\b|\bEr [A-ZÇŞ]\b|Uzman Çavuş [A-ZÇŞ]|\b[A-ZÇŞ]\s(isimli|adlı)/.test(q.k),
   'Vaka sorularında olayı doğru maddeye bağlayamıyorsun. Olaydaki fiili tek kelimeye indir, sonra o maddenin şartlarını şıklarla karşılaştır.'],
];
const kisaAd=k=>k.ad.replace(' (müşterek kapsam)','');
function analizVeri(){
  const liste=grupSorular(GRUP);
  const coz=liste.filter(q=>K.q[q.i]);
  let D=0,Y=0; coz.forEach(q=>{D+=K.q[q.i][0];Y+=K.q[q.i][1]});
  const genel=D+Y?Y/(D+Y):0;
  const kanunlar=KANUN.filter(k=>k.g===GRUP).map(k=>{let d=0,y=0,n=0;k.q.forEach(q=>{const r=K.q[q.i];if(r){d+=r[0];y+=r[1];n++}});return {k,d,y,n,oran:d+y?y/(d+y):0}}).filter(x=>x.d+x.y>=3).sort((a,b)=>b.oran-a.oran);
  const tipler=TIPLER.map(([id,ad,f,tavsiye])=>{let d=0,y=0;coz.filter(f).forEach(q=>{d+=K.q[q.i][0];y+=K.q[q.i][1]});return {id,ad,f,tavsiye,d,y,oran:d+y?y/(d+y):0}}).filter(t=>t.d+t.y>=4).sort((a,b)=>b.oran-a.oran);
  const inatci=coz.filter(q=>K.q[q.i][1]>=2&&!K.q[q.i][2]);
  return {liste,coz,D,Y,genel,kanunlar,tipler,inatci};
}
function zayifSec(A){
  const zk=A.kanunlar.filter(x=>x.oran>A.genel||x.oran>=.3).slice(0,4).map(x=>x.k.id);
  const zt=A.tipler.filter(t=>t.oran>A.genel+.05).slice(0,2);
  const skor=q=>{const r=K.q[q.i];let p=0;if(zk.includes(q.l))p+=3;if(zt.some(t=>t.f(q)))p+=2;if(r&&!r[2])p+=3;else if(!r)p+=1;else p-=2;return p+Math.random()*1.5};
  return A.liste.map(q=>[skor(q),q]).sort((a,b)=>b[0]-a[0]).slice(0,20).map(x=>x[1]);
}
function analiz(){
  document.body.classList.remove('sinavda'); window.scrollTo({top:0});
  const A=analizVeri(), adG=GRUP==='mus'?'Müşterek':'MEBS';
  if(A.D+A.Y<15){
    $('#ekran').innerHTML=`<button class="geri" id="geri">‹ ${adG}</button><div class="kart bos"><h3 style="font-family:var(--baslik);color:var(--altin2);margin-top:0">Rapor için biraz daha soru lazım</h3><p>${adG} tarafında şu ana kadar ${A.D+A.Y} cevabın var. En az 15 soru çöz, sonra nerede takıldığını çıkarayım.</p><button class="btn ana" id="bas20">Karışık 20 soru ile başla</button></div>`;
    $('#geri').onclick=ana; $('#bas20').onclick=()=>basla(karistir(A.liste).slice(0,20),'Karışık 20 soru'); return;
  }
  const yz=x=>Math.round(x*100);
  const kotuK=A.kanunlar.filter(x=>x.oran>=Math.max(.25,A.genel+.05)).slice(0,3);
  const kotuT=A.tipler.filter(t=>t.oran>=A.genel+.08).slice(0,2);
  const iyiK=A.kanunlar.filter(x=>x.oran<=.12&&x.d+x.y>=5).slice(-3);
  let yorum=`<p>${adG} tarafında <b>${A.D+A.Y}</b> cevabın var; genel yanlış oranın <b>%${yz(A.genel)}</b>. ${A.genel<=.15?'Seviyen iyi, artık ince ayar yapıyoruz.':A.genel<=.3?'Temel oturmuş, belirli yerlerde puan kaçıyor.':'Temel henüz oturmamış; önce konu notlarını okuyup sonra soru çözmek daha verimli olur.'}</p>`;
  if(kotuK.length) yorum+=`<p><b>En çok puan kaybettiğin yer:</b> ${kotuK.map(x=>`${esc(kisaAd(x.k))} (%${yz(x.oran)} yanlış)`).join(', ')}. Bunların konu notunu “★ Yalnız çıkmış noktalar” açıkken bir kez oku, sonra soruya dön.</p>`;
  if(kotuT.length) yorum+=kotuT.map(t=>`<p><b>${esc(t.ad)}:</b> yanlış oranın %${yz(t.oran)}, ortalamanın üstünde. ${esc(t.tavsiye)}</p>`).join('');
  else if(A.tipler.length) yorum+=`<p>Soru tiplerine göre belirgin bir zaafın yok; hatalar konu bilgisinden geliyor.</p>`;
  if(A.inatci.length) yorum+=`<p><b>${A.inatci.length} soruyu en az iki kez yanlış yaptın.</b> Bunlar ezber boşluğu; aşağıdaki “İnatçı sorular” ile tek tek kapat.</p>`;
  if(iyiK.length) yorum+=`<p style="color:var(--soluk)">Sağlam olduğun yerler: ${iyiK.map(x=>esc(kisaAd(x.k))).join(', ')}. Buralara şimdilik az zaman ayır.</p>`;
  const cubuk=(ad,alt,oran,id)=>`<${id?'button':'div'} class="satir" ${id?`data-id="${id}"`:''}><span>${ad}${alt?`<small>${alt}</small>`:''}</span><span class="c"><i style="width:${Math.max(3,yz(oran))}%"></i></span><span class="o">%${yz(oran)}</span></${id?'button':'div'}>`;
  $('#ekran').innerHTML=`<button class="geri" id="geri">‹ ${adG}</button>
  <div class="mvBas"><div><h2>Zayıf nokta raporu</h2><div class="kapsam">${adG} · ${A.coz.length} farklı soru · ${A.D+A.Y} cevap</div></div>
   <button class="btn ana" id="zayif20">Zayıf noktalarıma göre 20 soru</button></div>
  <div class="rapor">
   <div class="kart"><h3>Yorum</h3><div class="yorum">${yorum}</div></div>
   <div class="kart"><h3>Claude'un yorumu</h3><div class="aiKutu bekle" id="ai">Yanlış yaptığın soruları tek tek okuyup ortak hatanı söyler. İlk kullanımda izin ister.</div><div style="margin-top:12px"><button class="btn" id="aiBtn">Yanlışlarımı Claude yorumlasın</button></div></div>
   <div class="kart"><h3>Mevzuata göre yanlış oranı</h3><div class="satirlar">${A.kanunlar.map(x=>cubuk(esc(kisaAd(x.k)),`${x.n} soru · ${x.y} yanlış cevap · dokun: konu notu`,x.oran,x.k.id)).join('')||'<p style="color:var(--soluk)">Bir mevzuattan en az 3 cevap gelince burada görünür.</p>'}</div></div>
   <div class="kart"><h3>Soru tipine göre yanlış oranı</h3><div class="satirlar">${A.tipler.map(t=>cubuk(esc(t.ad),`${t.d+t.y} cevap`,t.oran)).join('')||'<p style="color:var(--soluk)">Daha çok soru çözünce tipler ayrışır.</p>'}</div></div>
   ${A.inatci.length?`<div class="kart"><h3>İnatçı sorular (${A.inatci.length})</h3><p style="color:var(--soluk);margin:0 0 10px">En az iki kez yanlış yaptığın ve hâlâ doğru bilemediğin sorular.</p><button class="btn ana" id="inatci">İnatçı soruları çöz</button></div>`:''}
  </div>`;
  $('#geri').onclick=ana;
  $('#zayif20').onclick=()=>basla(zayifSec(A),'Zayıf nokta 20');
  if($('#inatci')) $('#inatci').onclick=()=>basla(karistir(A.inatci),'İnatçı sorular');
  document.querySelectorAll('.satir[data-id]').forEach(b=>b.onclick=()=>mevzuat(+b.dataset.id,'konu'));
  $('#aiBtn').onclick=()=>aiYorum(A);
}
let aiIptal=null;
async function aiYorum(A){
  const kutu=$('#ai'), btn=$('#aiBtn');
  let sample=null;
  try{ sample=window.claude&&claude.use?await claude.use('sample'):null; }catch(e){}
  if(!sample){kutu.textContent='Bu görünümde Claude yorumu kullanılamıyor. Yukarıdaki yorum yine geçerli.';return;}
  const yanlis=A.coz.filter(q=>!K.q[q.i][2]).sort((a,b)=>K.q[b.i][1]-K.q[a.i][1]).slice(0,30);
  if(!yanlis.length){kutu.textContent='Şu an yanlış defterinde soru yok. Önce birkaç soru çöz.';return;}
  const satirlar=yanlis.map((q,n)=>{const j=(K.s||{})[q.i];return `${n+1}) [${kisaAd(BYID[q.l])}] ${q.k.replace(/\s+/g,' ').slice(0,400)}\n   Benim cevabım: ${j!=null?HARF[j]+') '+q.s[j]:'bilinmiyor'}\n   Doğru: ${HARF[q.d]}) ${q.s[q.d]}\n   Dayanak: ${q.y||'-'} · ${K.q[q.i][1]} kez yanlış`}).join('\n');
  const ozet=`Genel yanlış oranı %${Math.round(A.genel*100)}. Mevzuat bazında: ${A.kanunlar.slice(0,6).map(x=>kisaAd(x.k)+' %'+Math.round(x.oran*100)).join('; ')}. Soru tipi bazında: ${A.tipler.map(t=>t.ad+' %'+Math.round(t.oran*100)).join('; ')}.`;
  const istem=`Sen JSPS (Jandarma ve Sahil Güvenlik Personel Seçme) sınavına hazırlanan birine koçluk yapıyorsun. Aşağıda ${GRUP==='mus'?'müşterek':'MEBS'} mevzuatından yanlış yaptığı sorular ve istatistikleri var.
Görevin: hatalarındaki ORTAK DESENİ bul (hangi kavramları karıştırıyor, hangi tuzağa düşüyor, hangi madde türünde zayıf). Her tespiti somut bir soru örneğine ve dayanak maddeye bağla. Uydurma bilgi verme; yalnız verilen soruların doğru cevaplarından ve dayanaklarından çıkarım yap.
Biçim: Türkçe, samimi ve kısa. En fazla 5 madde, her biri 2-3 cümle, madde işareti olarak "•" kullan. Markdown başlık ve kalın yazı kullanma. Sonunda "Şimdi şunu yap:" diye başlayan tek bir somut çalışma adımı yaz.

İSTATİSTİK: ${ozet}

YANLIŞ SORULAR:
${satirlar}`;
  if(aiIptal) aiIptal.abort(); aiIptal=new AbortController();
  btn.disabled=true; btn.textContent='Claude okuyor…'; kutu.classList.add('bekle'); kutu.textContent='Düşünüyor… (ilk kullanımda izin penceresi çıkabilir)';
  try{
    const r=await sample(istem,{modelTier:'complex',cache:false,signal:aiIptal.signal,onText:({text})=>{kutu.classList.remove('bekle');kutu.textContent=text}});
    kutu.classList.remove('bekle'); kutu.textContent=r.text;
  }catch(e){
    if(e&&e.code==='cancelled') return;
    kutu.classList.remove('bekle');
    kutu.textContent=(e&&e.text)?e.text:(e&&e.code==='not_granted'?'Claude yorumuna izin verilmedi. Yukarıdaki yorum yine geçerli.':e&&e.code==='rate_limited'?'Şu an çok istek var, birkaç dakika sonra tekrar dene.':'Yorum alınamadı. Birazdan tekrar dene.');
  }finally{btn.disabled=false;btn.textContent='Yeniden yorumlasın';}
}
