# Check-up (başkan, 3 Eki): "tamamladıktan sonra soru ekledik, tamamlandı diyor, yeni soruları çözemiyorum, direkt özete atıyor".
# 1) Kalan soru SAYIYLA değil KİMLİKLE: kanunda olup bu check-up'ta cevaplanmamış sorular (yeni eklenenler dahil).
# 2) Listede: kalan varsa "Yeni soru · N" rozeti. 3) Analiz ekranında üstte görünür "Yeniden check-up yap" + "Kalan/yeni N soruyu çöz".
import os
KOK = os.path.dirname(os.path.abspath(__file__))
p = os.path.join(KOK, 'masa4.js'); s = open(p, encoding='utf-8').read()


def r(a, b, n=1):
    global s
    assert s.count(a) == n, (a[:70], s.count(a))
    s = s.replace(a, b)


# yardımcı: kalan sorular (kimlikle)
r("function kanunDurum(k,sadece){",
  "const kalanSorular=(k,cu)=>{if(!cu)return k.q;const c=new Set((cu.ids||[]).map(String));return k.q.filter(q=>!c.has(String(q.i)));};\nfunction kanunDurum(k,sadece){")
# liste rozeti
r("    const kismi=cu&&cu.n<x.k.q.length;\n    const pill=kismi&&durum==='tam'?[`Kısmi · ${cu.n}/${x.k.q.length}`,'#F3C24A']:",
  "    const kalanN=cu?kalanSorular(x.k,cu).length:0;const kismi=kalanN>0;\n    const pill=kismi&&durum==='tam'?[`Yeni soru · ${kalanN}`,'#F3C24A']:")
# analiz: kalan düğmesi (kimlikle) + üstte yeniden check-up
r("""  ${cu.n<k.q.length?`<button class="anaBtn2 ikincil" id="kalan">Kalan ${k.q.length-cu.n} soruyu çöz ${IK.ok}<small>sonuç bu check-up'la birleşir</small></button>`:''}""",
  """  ${kalanSorular(k,cu).length?`<button class="anaBtn2 ikincil" id="kalan">Yeni / kalan ${kalanSorular(k,cu).length} soruyu çöz ${IK.ok}<small>sonuç bu check-up'la birleşir</small></button>`:''}
  <button class="anaBtn2 ikincil" id="yenidenUst">Yeniden check-up yap ${IK.ok}<small>bu kanunun bütün sorularıyla baştan</small></button>""")
r("$('#yeniden').onclick=()=>checkupBolum(id);", "$('#yeniden').onclick=()=>checkupBolum(id);$('#yenidenUst').onclick=()=>checkupBolum(id);")
open(p, 'w', encoding='utf-8').write(s)

# sadeceKalan seçimi de kimlikle (zaten haric=cu.ids) — doğrula
assert "const haric=sadeceKalan&&cu?new Set(cu.ids.map(kid)):null;" in s
print('ok')
