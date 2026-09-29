# Altın Özet madde kartı sırası (başkan): üstte madde açıklaması → kırmızı "Sınavda böyle yazarlar" → yeşil "Doğrusu" (tuzağın doğru ifadesi)
import os
KOK = os.path.dirname(os.path.abspath(__file__))
p = os.path.join(KOK, 'masa4.js'); s = open(p, encoding='utf-8').read()
eski = """    return `<article class="ozKart"><div class="ozUst"><span class="ozNo">${mm?'m.'+mm:''}</span><b>${esc(n.b)}</b>${kayitBtn(n.i)}</div>${n.nd?`<p class="ozNd">${esc(n.nd)}</p>`:''}<div class="tuzakKutu iyi"><span class="tuzakIk">${IK.tik}</span><div><b>Doğrusu</b><p>${esc(n.h)}</p></div></div>${yanlislar.length?`<div class="tzYanlis"><span class="tzIk">✕</span><div><small>Sınavda böyle yazarlar</small>${yanlislar.map(x=>`<p>${esc(x)}</p>`).join('')}</div></div>`:''}</article>`;};"""
yeni = """    const dogrular=[...new Set(ekTz.map(z=>tirnakSil0(z.d)).filter(Boolean))];
    const ustte=n.nd?n.nd:n.h;              // üstte madde açıklaması
    if(!dogrular.length&&n.nd)dogrular.push(n.h); // tuzak yoksa hüküm yeşil kutuya
    return `<article class="ozKart"><div class="ozUst"><span class="ozNo">${mm?'m.'+mm:''}</span><b>${esc(n.b)}</b>${kayitBtn(n.i)}</div><p class="ozHukum">${esc(ustte)}</p>${yanlislar.length?`<div class="tzYanlis"><span class="tzIk">✕</span><div><small>Sınavda böyle yazarlar</small>${yanlislar.map(x=>`<p>${esc(x)}</p>`).join('')}</div></div>`:''}${dogrular.length?`<div class="tuzakKutu iyi"><span class="tuzakIk">${IK.tik}</span><div><b>Doğrusu</b>${dogrular.map(d=>`<p>${esc(d)}</p>`).join('')}</div></div>`:''}</article>`;};"""
assert eski in s
s = s.replace(eski, yeni, 1)
open(p, 'w', encoding='utf-8').write(s)
p = os.path.join(KOK, 'stil4.css'); s = open(p, encoding='utf-8').read()
s += "\n.ozKart .ozHukum{margin:0 0 4px}.ozKart .tuzakKutu.iyi p+p{margin-top:4px}\n"
open(p, 'w', encoding='utf-8').write(s)
print('ok')
