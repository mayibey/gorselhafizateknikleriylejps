# 11 Eki: site yeni ölçüye geçer — BİREBİR (bizde aynı soru) + ÇOK BENZER (bilgi farklı soruda / Altın Özet'te). Madde kartı ve kısmi yok.
p = 'D:/Mevzu/JSPS/uygulama/scratchpad/ekim10-site-sablon.html'
s = open(p, encoding='utf-8').read()
def R(a, b):
    global s
    assert s.count(a) == 1, a[:90]
    s = s.replace(a, b)
R("<title>10 Ekim 2026 JSPS Sınavı — Kaçını Tutturduk? | Mevzu · JSPS</title>",
  "<title>10 Ekim 2026 JSPS Sınavı Soru Analizi | Mevzu · JSPS</title>")
R('content="10 Ekim 2026 JSPS sınavında kaç soruyu tutturduk? Rütbeni ve branşını seç, tutturduğumuz soruların tamamını gör."',
  'content="10 Ekim 2026 JSPS sınavını soru soru inceledik. Rütbeni ve branşını seç, sınavdan önce Mevzu’da olan soruları tek tek gör."')
R('<meta property="og:title" content="10 Ekim 2026 JSPS sınavında kaçını tutturduk?" />',
  '<meta property="og:title" content="10 Ekim 2026 JSPS: 80 sorunun kaçı sınavdan önce Mevzu’daydı?" />')
R('<meta property="og:description" content="Rütbeni ve branşını seç, tutturduğumuz soruların tamamını gör." />',
  '<meta property="og:description" content="Rütbeni ve branşını seç, soruları kanıtıyla tek tek gör." />')
R("<h1>10 Ekim 2026 JSPS sınavında<em>kaçını tutturduk?</em></h1>",
  "<h1>10 Ekim 2026 JSPS sınavı<em>sınavdan önce Mevzu’daydı</em></h1>")
R("<p>Rütbeni ve branşını seç, o sınavda tutturduğumuz soruların tamamını gör.</p>",
  "<p>Rütbeni ve branşını seç; sınavdaki soruların cevabını uygulamada nerede öğrettiğimizi tek tek gör.</p>")
R('<div class="yan"><b id="sayi"></b><span>soruyu tutturduk</span></div>',
  '<div class="yan"><b id="sayi"></b><span>soru sınavdan önce Mevzu’daydı</span></div>')
R('<a class="indir" href="#sorular"><span>Tutturduğumuz soruları gör ↓</span></a>',
  '<a class="indir" href="#sorular"><span>Soruları tek tek gör ↓</span></a>')
R("""        <p class="notu">Kitapçıktaki sorular bize aittir (Mevzu JSPS soru bankası ve sitemizdeki sınav provaları).
          Sınav sorularının metni ve şıkları yayımlanmaz; her başlıkta yalnızca ölçülen konu kendi cümlemizle yazılıdır.</p>""",
  """        <p class="notu"><b>Nasıl saydık?</b> Bir soruyu, doğru cevabı bulduran bilgiler uygulamada <b>çalışma sorusuyla</b> ya da
          <b>Altın Özet</b>’te öğretilmişse saydık. Kanun metnini (madde kartları) saymadık; şıkları yalnızca ikiye indiren bilgiyi de saymadık.
          İlk yayımladığımız “tutturduk” sayımını bu ölçüyle güncelledik.</p>""")
R('<h2 class="lbas" id="lbas">Tutturduğumuz sorular</h2>', '<h2 class="lbas" id="lbas">Sorular</h2>')
R('<p class="lalt">Sorular bize aittir. Sınavdaki sorunun metni yayımlanmaz; her kartta yalnızca sınavda ölçülen konu kendi cümlemizle yazılıdır.</p>',
  '<p class="lalt">Sağdaki sorular ve özetler bize aittir. Sınavdaki sorunun metni yayımlanmaz; solda yalnızca ne sorulduğu kendi cümlemizle yazılıdır.</p>')
R("""        <li><span class="rz b">BİREBİR</span><span>Bizdeki soruyu çözen, sınavdaki soruyu da doğru yapardı.</span></li>
        <li><span class="rz k">KISMİ</span><span>Bilgi bizde vardı ama iki soruyu birleştirmek gerekiyordu ya da şıkları ikiye indiriyordu.</span></li>""",
  """        <li><span class="rz b">BİREBİR</span><span>Bizde aynı soru vardı: aynı bilgiyi soruyor, cevabı aynı.</span></li>
        <li><span class="rz k">ÇOK BENZER</span><span>Sınavın sorduğu bilgiler bizde farklı soru kalıbıyla ya da Altın Özet’te öğretilmişti; gösterilen sorular birlikte doğru şıkkı buldurur.</span></li>""")
R("""        <li><span class="rz m">MADDE KARTI</span><span>Cevap, uygulamada o maddenin kartında (madde metni / sesli anlatım) yazıyordu.</span></li>
""", "")
R("""  $('#yuzde').textContent='%'+o.oran;
  $('#sayi').textContent=`${o.kar} / ${o.top}`;
  $('#kirilim').textContent=`${o.bir} soru birebir, ${o.kis} soru kısmi · ${o.yok} soruda karşılık yok`+(o.eksik?` · ${o.eksik} sorunun görüntüsü elimizde yok, hesaba katılmadı`:'');""",
  """  $('#yuzde').textContent=`${o.kar}/${o.top}`;
  $('#sayi').textContent='%'+o.oran;
  $('#kirilim').textContent=`${o.bir} birebir · ${o.kis} çok benzer · sadece ${o.yok} soruda karşılık yok`;""")
R("""const o=OLCUM[brans], n={hepsi:V.length,b:V.filter(x=>x.tip==='birebir').length,k:V.filter(x=>x.tip==='kismi').length,m:V.filter(x=>x.kartta).length,a:V.filter(x=>x.altin).length};
  $('#lbas').textContent=`${o.ad} · tutturduğumuz ${V.length} soru`;
  $('#suz').innerHTML=[['hepsi','Hepsi'],['b','Birebir'],['k','Kısmi'],['m','Madde kartından'],['a','Altın Özet’ten']]""",
  """const o=OLCUM[brans], n={hepsi:V.length,b:V.filter(x=>x.tip==='birebir').length,k:V.filter(x=>x.tip==='benzer').length,a:V.filter(x=>x.altin).length};
  $('#lbas').textContent=`${o.ad} · sınavdan önce Mevzu’da olan ${V.length} soru`;
  $('#suz').innerHTML=[['hepsi','Hepsi'],['b','Birebir'],['k','Çok benzer'],['a','Altın Özet’ten']]""")
R("if((suz==='b'&&x.tip!=='birebir')||(suz==='k'&&x.tip!=='kismi')||(suz==='m'&&!x.kartta)||(suz==='a'&&!x.altin)) continue;",
  "if((suz==='b'&&x.tip!=='birebir')||(suz==='k'&&x.tip!=='benzer')||(suz==='a'&&!x.altin)) continue;")
R("const grup=x.tip==='birebir'?'Birebir tutturduklarımız':'Kısmi tutturduklarımız';",
  "const grup=x.tip==='birebir'?'Birebir · bizde aynı soru vardı':'Çok benzer · bilgi bizde öğretilmişti';")
R("    if(x.altin) ic+=`<div class=\"bz\"><div class=\"bzb\"><span class=\"rz a\">ALTIN ÖZET</span>${esc(x.altin.baslik.replace(/^Altın Özet · /,''))}</div>",
  "    if(x.altin) ic+=`<div class=\"bz\"><div class=\"bzb\"><span class=\"rz a\">ALTIN ÖZET</span>${esc(x.altin.baslik)}</div>")
R("    if(x.madde) ic+=`<div class=\"bz\"><div class=\"bzb\"><span class=\"rz m\">MADDE KARTI</span>Uygulamadaki madde metni</div><div class=\"mad\">${esc(x.madde)}</div>${nere(x.kartyer)}</div>`;\n", "")
R("""<span class="rz ${x.tip==='birebir'?'b':'k'}">${x.tip==='birebir'?'BİREBİR':'KISMİ'}</span><span class="rz g">${x.bolum==='musterek'?'MÜŞTEREK':'BRANŞ'}</span>${x.kartta?'<span class="rz m">MADDE KARTI</span>':''}""",
  """<span class="rz ${x.tip==='birebir'?'b':'k'}">${x.tip==='birebir'?'BİREBİR':'ÇOK BENZER'}</span><span class="rz g">${x.bolum==='musterek'?'MÜŞTEREK':'BRANŞ'}</span>""")
R("/* Katı ölçü: birebir = bizdeki tek soru / madde kartı doğru cevabı tek başına buldurur; kısmi = iki kaynak birleşir ya da şıklar ikiye iner. */",
  "/* 11 Eki ölçüsü: birebir = bizde aynı soru; çok benzer = doğru şıkkı buldurduran bilgi çalışma sorularıyla / Altın Özet'le öğretilmiş (aynı mevzuat içinde). Madde kartı sayılmaz. */")
open(p, 'w', encoding='utf-8').write(s)
print('tamam')
