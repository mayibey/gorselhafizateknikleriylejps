# Başkan, 3 Eki: "tüm önerilerini uygula" —
# 1) Eksik madde kartında iki düğme yerine tek "Bu maddeyi öğren": Altın Özet'te kartı varsa oraya kayar; yoksa (müşterekte) konu kartı; ikisi de yoksa düğme yok.
# 2) "Yanlışlarımın özeti" düğmesi yanlış sorular listesinin SONUNDA da.
# 3) Yanlış özetinde önemli yerler renkli: sayı/süre/oran altın, doğru şıkkın kelimeleri açıklamada yeşil.
import os
KOK = os.path.dirname(os.path.abspath(__file__))
p = os.path.join(KOK, 'masa4.js'); s = open(p, encoding='utf-8').read()


def r(a, b):
    global s
    assert s.count(a) == 1, (a[:70], s.count(a))
    s = s.replace(a, b)


# 1) tek düğme
r("""<div class="mdBtnler ${k.g==='mus'?'':'tek'}">${k.g==='mus'?`<button class="mdBtn" data-kart="${m}">${IK.kitap}Karta git</button>`:''}<button class="mdBtn dolu" data-ozet="${m}">${IK.belge}Altın özete git</button></div>""",
  """${k.n.some(n=>n.m.includes(m))||k.g==='mus'?`<div class="mdBtnler tek"><button class="mdBtn dolu" data-ogren="${m}">${IK.kitap}Bu maddeyi öğren</button></div>`:''}""")
r("""  document.querySelectorAll('[data-kart]').forEach(b=>b.onclick=()=>kartaGit(k.id,b.dataset.kart));
  document.querySelectorAll('[data-ozet]').forEach(b=>b.onclick=()=>ozet(id,()=>checkupAnaliz(id,geriHedef),'bu',b.dataset.ozet));""",
  """  // "Bu maddeyi öğren": Altın Özet'te bu maddenin kartı varsa oraya; yoksa uygulamadaki konu kartına (yalnız müşterek)
  document.querySelectorAll('[data-ogren]').forEach(b=>b.onclick=()=>{const m=b.dataset.ogren;
    if(k.n.some(n=>n.m.includes(m)))ozet(id,()=>checkupAnaliz(id,geriHedef),'bu',m);else kartaGit(k.id,m);});""")
# özet: hedef maddenin kartı "Eksik maddelerim" listesinde yoksa (madde check-up'ta eksik değil) yine göster
r("  const noktalar=k.n.filter(ilgili);",
  "  const noktalar=k.n.filter(n=>ilgili(n)||(hedefM&&n.m.includes(hedefM)));")
# 2) liste sonunda düğme
r("""  <button class="asagiIpucu" id="asagiIpucu">""",
  """  <button class="anaBtn2" id="yOzetAc2">Yanlışlarımın özeti ${IK.ok}<small>Her yanlışın doğrusu ve nedeni, madde madde</small></button>
  <button class="asagiIpucu" id="asagiIpucu">""")
r("if($('#yOzetAc'))$('#yOzetAc').onclick=()=>yanlisOzet(id);",
  "if($('#yOzetAc'))$('#yOzetAc').onclick=()=>yanlisOzet(id);if($('#yOzetAc2'))$('#yOzetAc2').onclick=()=>yanlisOzet(id);")
# 3) vurgu
r("/* ---------- YANLIŞLARIMIN ÖZETİ ---------- */",
  r"""/* ---------- YANLIŞLARIMIN ÖZETİ ---------- */
// Vurgu: sayı/süre/oran/madde altın; verilen kelimeler (doğru şık) yeşil. Metin önce kaçırılır, sonra işaretlenir.
function vurgula(metin,yesil){ let h=esc(metin||'');
  const kel=[...new Set(String(yesil||'').toLocaleLowerCase('tr').split(/[^a-zçğıöşüâîû0-9]+/).filter(w=>w.length>=5))];
  h=h.replace(/(\d+(?:[.,]\d+)?\s*(?:'?(?:inci|ıncı|üncü|uncu|nci|ncı|ncü|ncu))?\s*(?:gün|ay|yıl|saat|hafta|dakika|kat|lira|TL|yaş|kişi|üye)?(?:ü|ı|i|u|e|a|den|dan|ye|ya)?)/g,'<b class="vAltin">$1</b>');
  h=h.replace(/\b(m\.\s*\d+(?:\/[\w-]+)?)/g,'<b class="vAltin">$1</b>');
  if(kel.length){const re=new RegExp('(^|[^a-zçğıöşüâîû])('+kel.map(w=>w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')+')([a-zçğıöşüâîû]*)','gi');
    h=h.replace(re,(t,a,b,c)=>a+'<b class="vYesil">'+b+c+'</b>');}
  return h; }""")
r("""    <div class="tuzakKutu iyi"><span class="tuzakIk">${IK.tik}</span><div><b>Doğrusu</b><p>${HARF[q.d]}) ${esc(q.s[q.d])}</p></div></div>
    ${q.a?`<div class="yoNeden"><b>Neden?</b> ${esc(q.a)}</div>`:''}</article>`;};""",
  """    <div class="tuzakKutu iyi"><span class="tuzakIk">${IK.tik}</span><div><b>Doğrusu</b><p>${HARF[q.d]}) ${vurgula(q.s[q.d])}</p></div></div>
    ${q.a?`<div class="yoNeden"><b>Neden?</b> ${vurgula(q.a,q.s[q.d])}</div>`:''}</article>`;};""")
r("""    ${kural(m)?`<div class="yoKural"><small>Kural</small><p>${esc(kural(m))}</p></div>`:''}""",
  """    ${kural(m)?`<div class="yoKural"><small>Kural</small><p>${vurgula(kural(m))}</p></div>`:''}""")
open(p, 'w', encoding='utf-8').write(s)
p = os.path.join(KOK, 'stil4.css'); s = open(p, encoding='utf-8').read()
s += "\n.vAltin{color:#F8D57A;font-weight:800}.vYesil{color:#8FE3B5;font-weight:800}\n#yOzetAc2{margin-top:12px}\n"
open(p, 'w', encoding='utf-8').write(s)
print('ok')
