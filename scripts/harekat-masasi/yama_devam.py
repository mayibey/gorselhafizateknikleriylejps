import os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
s = open('sablon.html', encoding='utf-8').read()


def r(a, b):
    global s
    assert a in s, a[:70]
    s = s.replace(a, b, 1)


# bulut birleştirmede yarım test: bu cihazdaki varsa o, yoksa buluttaki
r("  return {q,s:Object.assign({},b.s||{},a.s||{}),",
  "  return {q,aktif:a.aktif||b.aktif||null,s:Object.assign({},b.s||{},a.s||{}),")

# mevzuat: kaldığın sorudan başla (ilk çözülmemiş; hepsi çözüldüyse ilk yanlış)
r("  $('#coz').onclick=()=>basla(sirali(),k.ad.replace(' (müşterek kapsam)',''));",
  """  let i0=k.q.findIndex(q=>!K.q[q.i]); if(i0<0) i0=Math.max(0,k.q.findIndex(q=>!K.q[q.i][2]));
  if(i0>0) $('#coz').textContent=`Kaldığın yerden devam · ${i0+1}/${k.q.length}`;
  $('#coz').onclick=()=>basla(k.q,k.ad.replace(' (müşterek kapsam)',''),false,i0);""")

# yarım testi kaydet / geri yükle
r("function basla(sorular,ad,prova=false){", """function aktifKaydet(){
  if(!S){K.aktif=null;kaydet();return;}
  K.aktif={ids:S.sorular.map(q=>q.i),ad:S.ad,i:S.i,prova:S.prova,cevap:S.cevap,seri:S.seri,g:S.don};kaydet();
}
function aktifDevam(){
  const a=K.aktif; if(!a||!a.ids) return false;
  const sorular=a.ids.map(id=>TUM[id]).filter(Boolean); if(!sorular.length){K.aktif=null;return false;}
  if(a.g&&a.g!==GRUP){GRUP=a.g;document.body.classList.toggle('mebs',GRUP==='mebs');document.querySelectorAll('#hat button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.g===GRUP));}
  S={sorular,ad:a.ad,i:Math.min(a.i||0,sorular.length-1),cevap:a.cevap||{},seri:a.seri||0,prova:!!a.prova,don:a.g||GRUP};
  soruCiz(); return true;
}
function testCik(){S=null;aktifKaydet();ana();}
function basla(sorular,ad,prova=false,i0=0){""")
r("  S={sorular,ad,i:0,cevap:{},seri:0,prova,don:GRUP};", "  S={sorular,ad,i:i0,cevap:{},seri:0,prova,don:GRUP};")
# her soru çiziminde konumu kaydet
r("function soruCiz(kaydir=true){\n", "function soruCiz(kaydir=true){\n  aktifKaydet();\n")
# ilerleme çubuğu: bulunduğun yer
r('<span style="width:${bitti/S.sorular.length*100}%"></span>', '<span style="width:${(S.i+1)/S.sorular.length*100}%"></span>')
r("  $('#geri').onclick=()=>{S=null;ana()};", "  $('#geri').onclick=testCik;")
r("  $('#don').onclick=()=>{S=null;ana()};", "  $('#don').onclick=testCik;")
# sonuç ekranına gelince yarım test biter
r("function sonuc(){\n", "function sonuc(){\n  K.aktif=null; kaydet();\n")
# açılışta yarım test varsa oradan devam
r("grupSec(GRUP==='mebs'?'mebs':'mus');", "grupSec(GRUP==='mebs'?'mebs':'mus');\naktifDevam();")
# bulut gelince: ana ekrandaysak ve yarım test varsa devam
r("    if(document.querySelector('.pano')) ana();\n", "    if(document.querySelector('.pano')){ if(!aktifDevam()) ana(); }\n")

open('sablon.html', 'w', encoding='utf-8').write(s)
v = open('veri.json', encoding='utf-8').read().replace('</', '<\\/')
open('harekat-masasi.html', 'w', encoding='utf-8').write(s.replace('__VERI__', v))
print('ok')
