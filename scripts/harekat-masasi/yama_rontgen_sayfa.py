# Röntgen sayfası: giriş sade; "Röntgen Çek" → Devam et / Röntgen çek (Yeniden çek) / Sonuçlarım
import os
KOK = os.path.dirname(os.path.abspath(__file__))
p = os.path.join(KOK, 'masa4.js'); s = open(p, encoding='utf-8').read()


def r(a, b):
    global s
    assert a in s, a[:70]
    s = s.replace(a, b, 1)


bas = s.index('  <section class="blok">\n    <button class="secim" id="bRontgen">')
son = s.index('/* önceki röntgenler */')
yeni = r'''  <button class="secim" id="bRontgen"><span class="secimIk">${IK.buyutec}</span><span class="secimMetin"><b>Röntgen Çek</b><small>Kanun bazında ne kadar hazırsın?</small><em>~${Math.round(rSoru*0.3)} dk · ~${rSoru} soru${gecmis.length?` · ${gecmis.length} sonuç`:''}${yarimR?' · yarım kalan var':''}</em></span><span class="secimOk">${IK.sag}</span></button>
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
  <section class="hzKart"><div class="hzIk">${IK.buyutec}</div><div class="hzMetin"><span class="hzLbl">Kanun bazında hazırlık</span><b class="hzSayi kucukSayi">~${rSoru}<small> soru · ~${Math.round(rSoru*0.3)} dk</small></b><p>Her kanundan bir soru, çok çıkanlardan iki. Cevaplar sonda; bitince hangi kanunda ne kadar hazır olduğunu görürsün.</p></div></section>
  ${yarim?`<button class="anaBtn2" id="devamR">Devam et ${IK.ok}<small>${Object.keys(yarim.cevap||{}).length}/${yarim.ids.length} cevaplandı · kaldığın yerden</small></button>`:''}
  <button class="anaBtn2 ${yarim?'ikincil':''}" id="cek">${g.length||yarim?'Yeniden çek':'Röntgen çek'} ${IK.ok}<small>${yarim?'yarım kalan silinir, sıfırdan başlar':'yeni sorularla, ~'+Math.round(rSoru*0.3)+' dk'}</small></button>
  <h3 class="bolumBaslik"><span class="hedefIk">${IK.grafik}</span>Sonuçlarım</h3>
  ${g.length?`<section class="liste">${g.map((R,i)=>{const h=H(R);return `<button class="satir cu" data-i="${i}"><span class="satirIk">${IK.grafik}</span><span class="satirMetin"><b>${tarihYaz(R.tarih)}${i===0?' · son röntgen':''}</b><small>${R.d}/${R.n} doğru${h!=null?` · hazırlık ${h}/100`:''}</small></span><span class="satirOk">${IK.sag}</span></button>`}).join('')}</section>`:'<p class="kucukNot">Henüz röntgen çekmedin. İlk röntgen ~12 dakika sürer.</p>'}`;
  $('#geri').onclick=giris;$('#cek').onclick=()=>{if(yarim){K.aktif=null;kaydet();}rontgenBaslat();};
  if($('#devamR'))$('#devamR').onclick=aktifDevam;
  document.querySelectorAll('.satir.cu').forEach(b=>b.onclick=()=>rontgenSonuc(g[+b.dataset.i],rontgenSayfa));
}
'''
s = s[:bas] + yeni + s[son:]
r("  $('#geri').onclick=()=>geriHedef?geriHedef():giris();$('#yenile').onclick=rontgenBaslat;\n  document.querySelectorAll('[data-cu]')",
  "  $('#geri').onclick=()=>geriHedef?geriHedef():rontgenSayfa();$('#yenile').onclick=rontgenBaslat;\n  document.querySelectorAll('[data-cu]')")
r('<p class="kucukNot" style="text-align:center">Her kanunun tüm soruları. Yarım bırakırsan kaldığın yerden devam eder.</p>',
  '<p class="kucukNot" style="text-align:center">Her kanunun tüm soruları. Yarım bırakırsan kaldığın yerden devam eder.</p>\n  ${KANUN.some(k=>K.checkup[k.id])?`<button class="anaBtn2 ikincil" id="ozetlerim" style="margin:0 0 12px">Özetlerim · ${KANUN.filter(k=>K.checkup[k.id]).length} kanun ${IK.ok}</button>`:""}')
r("  $('#geri').onclick=giris;\n  document.querySelectorAll('#kpSec button').forEach(b=>b.onclick=()=>{K.g=b.dataset.g;kaydet();checkupListe();});",
  "  $('#geri').onclick=giris;if($('#ozetlerim'))$('#ozetlerim').onclick=()=>{const ilk=KANUN.find(k=>K.checkup[k.id]);ilk&&ozet(ilk.id,checkupListe,'kayit');};\n  document.querySelectorAll('#kpSec button').forEach(b=>b.onclick=()=>{K.g=b.dataset.g;kaydet();checkupListe();});")
r("  $('#geri').onclick=()=>{aktifKaydet();S=null;giris();};",
  "  $('#geri').onclick=()=>{const t=S.meta.tur;aktifKaydet();S=null;t==='rontgen'?rontgenSayfa():t==='checkup'?checkupListe():giris();};")
open(p, 'w', encoding='utf-8').write(s)
p = os.path.join(KOK, 'stil4.css'); s = open(p, encoding='utf-8').read()
s += "\n.anaBtn2.ikincil{background:rgba(243,194,74,.1);color:#F8D57A;border:1.5px solid rgba(243,194,74,.6);box-shadow:none}\n.anaBtn2+.anaBtn2{margin-top:10px}\n"
open(p, 'w', encoding='utf-8').write(s)
print('ok')
