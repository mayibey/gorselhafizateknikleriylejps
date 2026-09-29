import os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
s = open('sablon.html', encoding='utf-8').read()


def r(a, b):
    global s
    assert a in s, a[:60]
    s = s.replace(a, b, 1)


# kayıt: yanlış seçilen şık
r("function isle(q,dogru){", "function isle(q,dogru,j){\n  if(!dogru&&j!==undefined){K.s=K.s||{};K.s[q.i]=j;}")
r("const dogru=j===q.d; isle(q,dogru);", "const dogru=j===q.d; isle(q,dogru,j);")
r("if(S.cevap[i]!==undefined) isle(q,S.cevap[i]===q.d)", "if(S.cevap[i]!==undefined) isle(q,S.cevap[i]===q.d,S.cevap[i])")
r("  return {q,xp:Math.max(a.xp||0,b.xp||0),enSeri:Math.max(a.enSeri||0,b.enSeri||0),gun};",
  "  return {q,s:Object.assign({},b.s||{},a.s||{}),xp:Math.max(a.xp||0,b.xp||0),enSeri:Math.max(a.enSeri||0,b.enSeri||0),gun};")
# görev düğmesi
r("""      <button class="gorev" id="g-prova">""", """      <button class="gorev" id="g-analiz"><span class="ik">${IK.analiz}</span><span><b>Zayıf nokta raporu</b><small>Nerede takıldığını çıkarır, ona göre 20 soru verir.</small></span><span class="ok">›</span></button>
      <button class="gorev" id="g-prova">""")
r("  $('#g-prova').onclick=", "  $('#g-analiz').onclick=analiz;\n  $('#g-prova').onclick=")
r("  yeni:'<svg", "  analiz:'<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\"><circle cx=\"11\" cy=\"11\" r=\"7\"/><path d=\"M20 20l-4-4M7 11h2l1-3 2 6 1-3h2\"/></svg>',\n  yeni:'<svg")
# CSS
r(".bos{padding:30px;", """.rapor{display:grid;gap:14px}
.rapor .kart{padding:18px 20px}
.rapor h3{font-family:var(--baslik);font-size:19px;margin:0 0 10px;color:var(--altin2)}
.rapor .yorum{font-size:15px;line-height:1.65;max-width:75ch}
.rapor .yorum p{margin:0 0 8px}
.satirlar{display:grid;gap:8px}
.satir{display:grid;grid-template-columns:1fr 110px 54px;gap:12px;align-items:center;font-size:14px;text-align:left;padding:8px 10px;border-radius:10px;border:1px solid transparent}
button.satir:hover{border-color:var(--cizgi2);background:rgba(6,19,31,.5)}
.satir .c{height:8px;border-radius:9px;background:var(--cizgi);overflow:hidden}
.satir .c i{display:block;height:100%;background:linear-gradient(90deg,var(--altin),var(--yanlis))}
.satir .o{font-family:var(--mono);font-size:13px;text-align:right;font-variant-numeric:tabular-nums}
.satir small{display:block;color:var(--soluk);font-size:12px}
@media (max-width:480px){.satir{grid-template-columns:1fr 60px 46px;gap:8px}}
.aiKutu{white-space:pre-line;font-size:15px;line-height:1.65;max-width:75ch}
.aiKutu.bekle{color:var(--soluk)}
.bos{padding:30px;""")

JS = open('analiz.js', encoding='utf-8').read()
r("/* ---------- SINAV ---------- */", JS + "\n/* ---------- SINAV ---------- */")
open('sablon.html', 'w', encoding='utf-8').write(s)
v = open('veri.json', encoding='utf-8').read().replace('</', '<\\/')
open('harekat-masasi.html', 'w', encoding='utf-8').write(s.replace('__VERI__', v))
print('ok')
