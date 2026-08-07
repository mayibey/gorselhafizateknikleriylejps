# -*- coding: utf-8 -*-
"""KIRPIK ŞIK DENETİMİ — çoktan seçmeli bütün oyunlarda (SADECE rapor).

Başkanın tespiti (7 Ağu): Rütbe Merdiveni'nde C şıkkı "…yakalama anından itibare" diye
KELİME ORTASINDA kesilmiş. Böyle şık, doğru cevabı ele veriyor (oyuncu "yarım olan yanlıştır"
diye eliyor) ve okunmuyor.

İki bağımsız işaret aranıyor:
  1. ÖN-EK: şık, aynı sorunun BAŞKA bir şıkkının başlangıcı ise (kırpılmış kopya)
  2. NOKTALAMA UYUMSUZLUĞU: kardeş şıkların çoğu "." ile bitiyorken bu bitmiyorsa
  3. SON KELİME KIRIK: son kelime, kardeş şıklardaki daha uzun bir kelimenin ön eki ise
     ("itibare" <- "itibaren")
"""
import io
import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
OYUN = r'D:\GorselHafizaTeknikleriyleJSPS\assets\oyun\oyun-merkezi.html'
s = io.open(OYUN, encoding='utf-8').read()


def blok(ad, ac, kp):
    i = s.index('const %s=' % ad) + len('const %s=' % ad)
    d = 0
    for j in range(i, len(s)):
        if s[j] == ac:
            d += 1
        elif s[j] == kp:
            d -= 1
            if d == 0:
                return json.loads(s[i:j + 1])


H = s[s.index('const HAVUZ=') + len('const HAVUZ='):]
d = 0
for j in range(len(H)):
    if H[j] == '{':
        d += 1
    elif H[j] == '}':
        d -= 1
        if d == 0:
            break
H = H[:j + 1]


def havuz(ad):
    m = re.search(re.escape(ad) + r'\s*:\s*\[', H)
    if not m:
        return []
    b = m.end() - 1
    d = 0
    for e in range(b, len(H)):
        if H[e] == '[':
            d += 1
        elif H[e] == ']':
            d -= 1
            if d == 0:
                return json.loads(H[b:e + 1])
    return []


def nrm(t):
    return re.sub(r'\s+', ' ', (t or '')).strip()


def kelimeler(t):
    return re.findall(r'[0-9A-Za-zÇĞİÖŞÜçğıöşüâîû]+', t)


def denetle(ad, sorular, sik_fn, metin_fn):
    kusur = []
    for q in sorular:
        siklar = [nrm(x) for x in (sik_fn(q) or []) if nrm(x)]
        if len(siklar) < 2:
            continue
        noktali = sum(1 for x in siklar if x.endswith(('.', '?', '!')))
        # aynı sorudaki TÜM kelimelerin havuzu (son-kelime kırık testi için)
        tum_kelime = {k for x in siklar for k in kelimeler(x)}
        for i, x in enumerate(siklar):
            neden = []
            # ⚠️ SIKILASTIRMA: ilk turda "hâkim" (cunku "hâkimler" var), "on" (cunku "onbes" var),
            # "mahkeme" gibi MESRU kisa siklar kirik sanildi — 164 uydurma kusur. Kirpilma yalnizca
            # UZUN, cumle bicimli siklarda anlamli; kisa tek-kelime siklar zaten dogal olarak
            # birbirinin on eki olabiliyor. O yuzden ölçüt: uzunluk >= 25 VE kardesler nokta ile
            # bitiyorken bu bitmiyor. Diger iki isaret yalnizca DESTEK olarak yaziliyor.
            if len(x) < 25:
                continue
            if not (noktali >= len(siklar) - 1 and noktali >= 2 and not x.endswith(('.', '?', '!'))):
                continue
            neden.append('kardesler nokta ile bitiyor, bu bitmiyor')
            for k, y in enumerate(siklar):
                if k != i and len(y) > len(x) + 1 and y.startswith(x):
                    neden.append('baska sikkin ON EKI')
                    break
            son = (kelimeler(x) or [''])[-1]
            if len(son) >= 4 and any(
                    w != son and w.startswith(son) and len(w) > len(son) for w in tum_kelime):
                neden.append('son kelime KIRIK (%s)' % son)
            if neden:
                kusur.append((ad, metin_fn(q), x, ' + '.join(sorted(set(neden)))))
    print('%-22s %4d soru · %d kusurlu sik' % (ad, len(sorular), len(kusur)))
    for a, soru, sik, n in kusur[:14]:
        print('    SORU: %s' % nrm(soru)[:100])
        print('     ŞIK: "%s"   [%s]' % (sik, n))
    return kusur


toplam = []
M = blok('MILYONER_KUSAK', '[', ']')
toplam += denetle('Rütbe Merdiveni', [q for k in M for q in k],
                  lambda q: q.get('sik'), lambda q: q.get('s'))
toplam += denetle('Boşluk Doldurma', havuz('bosluk'), lambda q: q.get('sik'),
                  lambda q: (q.get('on') or '') + ' …… ' + (q.get('son') or ''))
toplam += denetle('Kuşatma/Bayrak', [], lambda q: q.get('sik'), lambda q: q.get('s'))
toplam += denetle('Ceza Terazisi (oran)', [x for x in havuz('ceza') if 'sik' in x],
                  lambda q: q.get('sik'), lambda q: q.get('bag'))
toplam += denetle('Yalancı Madde', havuz('yalan'), lambda q: q.get('sah'),
                  lambda q: q.get('ger'))
toplam += denetle('Kim Yapar', havuz('kim'), lambda q: q.get('sik'), lambda q: q.get('is'))
print()
print('TOPLAM KUSURLU ŞIK:', len(toplam))
