# -*- coding: utf-8 -*-
"""YARIM CÜMLE DENETİMİ — tüm oyunlarda (SADECE rapor, yazmaz).

Başkanın yakaladığı kusur (7 Ağu): Asmaca'da "Kaçak eşya naklinde kullanılan taşıta ……."
ipucu, cümlenin sonundaki işlemi söylemiyordu. Kök sebep: korpustaki madde metninin KENDİSİ
yarım ("…taşıta elkoyma[11]" diye kesilmiş) — cümle ayırıcı bu kuyruğu cümle sandı.

Bu yüzden tek tek bakmak yetmez; ölçüt şu: oyuncuya gösterilen metin TAM CÜMLE mi?
  · sonu cümle bitirici noktalama ile bitmeli (. ! ? :)
  · boşluk ("……") metnin EN SONUNDA olmamalı — sonrasında ne olacağı yazmalı
  · içinde kırpma izi ("...", "[11]") olmamalı
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


BITIS = re.compile(r'[.!?:…»"\')\]]\s*$')
KIRPMA = re.compile(r'\.\.\.|\[\s*\d{1,3}\s*\]')
BOSLUK_SONDA = re.compile(r'……\s*[.…\s]*$')


def denetle(ad, kayitlar, alan_fn):
    kusur = []
    for x in kayitlar:
        m = alan_fn(x)
        if not m:
            continue
        m = m.strip()
        neden = []
        if BOSLUK_SONDA.search(m):
            neden.append('boşluk SONDA (işlem yazmıyor)')
        elif not BITIS.search(m):
            neden.append('cümle bitmiyor')
        if KIRPMA.search(m):
            neden.append('kırpma izi')
        if neden:
            kusur.append((m, ' + '.join(neden), x.get('ref') or x.get('k') or ''))
    print('%-22s %4d kayıt · %d kusurlu' % (ad, len(kayitlar), len(kusur)))
    for m, n, r in kusur[:12]:
        print('    [%s] %s  <%s>' % (n, m, r))
    return kusur


toplam = []
toplam += denetle('Adam Asmaca', blok('ASMACA', '[', ']'), lambda x: x.get('ip'))
toplam += denetle('Boşluk Doldurma', havuz('bosluk'),
                  lambda x: (x.get('on') or '') + ' …… ' + (x.get('son') or ''))
toplam += denetle('Yalancı Madde', havuz('yalan'), lambda x: x.get('ger'))
toplam += denetle('Doğru/Yanlış', havuz('dy'), lambda x: x.get('s'))
toplam += denetle('Hangi Kanun', havuz('hangi'), lambda x: x.get('k'))
toplam += denetle('TCK mı CMK mı', havuz('ayrim'), lambda x: x.get('k'))
toplam += denetle('Süre Şeridi', havuz('sure'), lambda x: x.get('t'))
toplam += denetle('Kim Yapar', havuz('kim'), lambda x: x.get('is'))
toplam += denetle('Ceza Terazisi (fiil)', [x for x in havuz('ceza') if 'mt' in x],
                  lambda x: x.get('mt') + '.')     # fiil kutusu cümle değil, nokta ekleyip bak
print()
print('TOPLAM KUSURLU:', len(toplam))

# Çengel ipuçları ayrı yapıda
C = blok('CENGELLER', '[', ']')
ck = [k for t in C for k in t['kelimeler']]
toplam += denetle('Çengel ipuçları', ck, lambda x: x.get('ipucu'))
