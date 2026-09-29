# Altın Özet kartı: üstte orijinal hüküm → kırmızı "Sınavda böyle yazarlar" → yeşil "Doğrusu" KISA ÖZET
# (tuzağın doğru ifadesi; yoksa hükmün KALIN anahtar parçaları " · " ile; o da yoksa başlık / ilk parça)
import os, re
KOK = os.path.dirname(os.path.abspath(__file__))

# 1) nokta_ayristir.py: her noktaya k (kısa özet = kalın parçalar + madde) alanı
p = os.path.join(KOK, 'nokta_ayristir.py'); s = open(p, encoding='utf-8').read()
a = """        out.append({'i': f'{kid}-{len(out)}', 's': star, 'b': temiz(baslik), 'h': temiz(hukum),
                    'nd': temiz(nd), 'o': temiz(o), 't': temiz(t), 'm': maddeler(hukum)})"""
b = """        kalin = [temiz(x) for x in re.findall(r'\\*\\*(.+?)\\*\\*', hukum) if temiz(x)]
        mref = re.search(r'\\((m\\.[^)]+)\\)\\s*$', hukum.strip())
        kisa = (' · '.join(kalin) + (f' ({mref.group(1)})' if mref else '')) if kalin else ''
        out.append({'i': f'{kid}-{len(out)}', 's': star, 'b': temiz(baslik), 'h': temiz(hukum), 'k': kisa,
                    'nd': temiz(nd), 'o': temiz(o), 't': temiz(t), 'm': maddeler(hukum)})"""
assert a in s; s = s.replace(a, b, 1); open(p, 'w', encoding='utf-8').write(s)

# 2) masa4.js: kart sırası ve yeşil kutu içeriği
p = os.path.join(KOK, 'masa4.js'); s = open(p, encoding='utf-8').read()
a = """    const dogrular=[...new Set(ekTz.map(z=>tirnakSil0(z.d)).filter(Boolean))];
    const ustte=n.nd||(dogrular.length?n.h:'');   // üstte madde açıklaması
    if(!dogrular.length)dogrular.push(n.h);        // tuzak yoksa hüküm yeşil kutuda (her kartta yeşil var)
    return `<article class="ozKart"><div class="ozUst"><span class="ozNo">${mm?'m.'+mm:''}</span><b>${esc(n.b)}</b>${kayitBtn(n.i)}</div>${ustte?`<p class="ozHukum">${esc(ustte)}</p>`:''}"""
b = """    const dogrular=[...new Set(ekTz.map(z=>tirnakSil0(z.d)).filter(Boolean))];
    if(!dogrular.length)dogrular.push(kisaOzet(n));  // tuzak yoksa hükmün anahtar parçaları
    return `<article class="ozKart"><div class="ozUst"><span class="ozNo">${mm?'m.'+mm:''}</span><b>${esc(n.b)}</b>${kayitBtn(n.i)}</div><p class="ozHukum">${esc(n.h)}</p>${n.nd?`<p class="ozNd">${esc(n.nd)}</p>`:''}"""
assert a in s; s = s.replace(a, b, 1)
a = "  const kullanilanTz=new Set();\n"
b = """  const kullanilanTz=new Set();
  // Kısa özet: kalın anahtar parçalar; yoksa uzun hükmün ilk parçası; o da yoksa başlık
  const kisaOzet=n=>{ if(n.k)return n.k; const h=String(n.h||''); if(h.length>170){const p=h.split(/;|,\\s(?=[a-zçğıöşü])/)[0];return p.length<h.length?p.trim()+' …':h.slice(0,150).trim()+' …';} return n.b; };
"""
assert a in s; s = s.replace(a, b, 1)
open(p, 'w', encoding='utf-8').write(s)
print('ok')
