import sys, os
# kullanım: python p108_duzelt.py dosya.json duzeltme.txt   (duzeltme.txt: her satır  ESKI ||| YENI)
B = os.path.dirname(os.path.abspath(__file__))
yol = os.path.join(B, sys.argv[1])
t = open(yol, encoding='utf-8').read()
for satir in open(os.path.join(B, sys.argv[2]), encoding='utf-8').read().splitlines():
    if '|||' not in satir: continue
    eski, yeni = [x.strip() for x in satir.split('|||', 1)]
    n = t.count(eski)
    if n == 0: print('BULUNAMADI:', eski[:70]); continue
    t = t.replace(eski, yeni)
open(yol, 'w', encoding='utf-8').write(t)
print('tamam')
