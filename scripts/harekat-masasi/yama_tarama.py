import os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
s = open('sablon.html', encoding='utf-8').read()


def r(a, b):
    global s
    assert a in s, a[:70]
    s = s.replace(a, b, 1)


# yarım kalan taramayı da kaydet / geri yükle
r("K.aktif={ids:S.sorular.map(q=>q.i),ad:S.ad,i:S.i,prova:S.prova,cevap:S.cevap,seri:S.seri,g:S.don};kaydet();",
  "K.aktif={ids:S.sorular.map(q=>q.i),ad:S.ad,i:S.i,prova:S.prova,cevap:S.cevap,seri:S.seri,g:S.don,tarama:S.tarama||null};kaydet();")
r("S={sorular,ad:a.ad,i:Math.min(a.i||0,sorular.length-1),cevap:a.cevap||{},seri:a.seri||0,prova:!!a.prova,don:a.g||GRUP};",
  "S={sorular,ad:a.ad,i:Math.min(a.i||0,sorular.length-1),cevap:a.cevap||{},seri:a.seri||0,prova:!!a.prova,don:a.g||GRUP,tarama:a.tarama||null};")
# son soruda: tarama ise ek soru / reçete
r("  if(S.i<S.sorular.length-1){ S.i++; soruCiz(); return; }\n  sonuc();",
  "  if(S.i<S.sorular.length-1){ S.i++; soruCiz(); return; }\n  if(S.tarama){ if(checkupEk()) return; taramaBitir(); return; }\n  sonuc();")
r("${S.i===S.sorular.length-1?(S.prova?'Sınavı bitir':'Bitir'):'Sonraki ›'}",
  "${S.i===S.sorular.length-1?(S.tarama?'Taramayı bitir':S.prova?'Sınavı bitir':'Bitir'):'Sonraki ›'}")
# ana ekran: tarama kartı
r("""  $('#ekran').innerHTML=`
  <section class="pano">""", """  const sonT=(K.taramalar||[]).slice(-1)[0];
  $('#ekran').innerHTML=`
  <button class="taramaSerit" id="taramaAc"><span class="ik">${IK.analiz}</span><span><b>Eksik taraması</b><small>${sonT?'Reçeten hazır · yeniden tarayabilir ya da planına devam edebilirsin':'Hızlı Check-up ya da Detaylı Röntgen: nerede eksiksin, sınava kadar ne çalışmalısın?'}</small></span><span class="ok">›</span></button>
  <section class="pano">""")
r("  $('#g-analiz').onclick=analiz;", "  $('#g-analiz').onclick=analiz;\n  $('#taramaAc').onclick=()=>{const t=(K.taramalar||[]).slice(-1)[0];t?recete(t.id):taramaGiris();};")
# CSS
r(".bos{padding:30px;", """.taramaSerit{display:flex;align-items:center;gap:14px;width:100%;text-align:left;padding:14px 18px;margin-bottom:16px;border-radius:var(--r);
  border:1px solid var(--altin);background:linear-gradient(100deg,rgba(217,178,74,.16),rgba(76,195,217,.08));transition:.18s}
.taramaSerit:hover{transform:translateY(-1px);box-shadow:0 10px 30px rgba(0,0,0,.35)}
.taramaSerit .ik{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;background:var(--altinZemin);color:var(--altin2);flex:none}
.taramaSerit .ik svg{width:22px;height:22px}
.taramaSerit b{display:block;font-size:15.5px}.taramaSerit small{color:var(--soluk);font-size:12.5px;line-height:1.4;display:block}
.taramaSerit .ok{margin-left:auto;color:var(--altin2);font-size:20px}
.tarama2{display:grid;grid-template-columns:1fr 1fr;gap:14px}@media (max-width:720px){.tarama2{grid-template-columns:1fr}}
.tur{display:flex;flex-direction:column;gap:6px}.tur p{margin:0;color:var(--metin);font-size:14px;line-height:1.55}.tur .btn{margin-top:auto;align-self:flex-start}
.kucukNot{color:var(--soluk)!important;font-size:12.5px!important;margin:0 0 10px}
.harita{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:8px}
.hk{text-align:left;padding:10px 12px;border-radius:11px;border:1px solid var(--cizgi);border-left:4px solid var(--r);background:rgba(6,19,31,.5);display:flex;flex-direction:column;gap:2px}
.hk:hover{background:var(--vurguZemin)}.hk .hd{font-size:10.5px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;color:var(--r)}
.hk b{font-size:13.5px;line-height:1.3}.hk small{color:var(--soluk);font-size:11.5px;font-family:var(--mono)}
.fark{font-weight:700;margin-left:4px}
.plan{display:grid;gap:14px}.gun h4{margin:0 0 8px;font-family:var(--baslik);font-size:17px;color:var(--metin)}
.is{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:10px;border:1px solid var(--cizgi);background:rgba(6,19,31,.45);margin-bottom:6px;font-size:14px}
.is.bitti span{text-decoration:line-through;color:var(--soluk2)}
.tik{width:24px;height:24px;border-radius:7px;border:1.5px solid var(--cizgi2);flex:none;display:grid;place-items:center;color:var(--dogru);font-weight:800}
.is.bitti .tik{border-color:var(--dogru);background:var(--dogruZemin)}
.git{margin-left:auto;font-size:12.5px;font-weight:700;color:var(--vurgu);padding:4px 10px;border-radius:8px;border:1px solid var(--cizgi2);white-space:nowrap}
.git:hover{border-color:var(--vurgu)}
.bos{padding:30px;""")
JS = open('tarama.js', encoding='utf-8').read()
r("/* ---------- SINAV ---------- */", JS + "\n/* ---------- SINAV ---------- */")
open('sablon.html', 'w', encoding='utf-8').write(s)
v = open('veri.json', encoding='utf-8').read().replace('</', '<\\/')
open('harekat-masasi.html', 'w', encoding='utf-8').write(s.replace('__VERI__', v))
print('ok')
