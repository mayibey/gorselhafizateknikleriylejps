# Yazıcı betiğe (scripts/sifreler/yazici/kN.py) satır ekler: python ekle.py <satirlar.py>  (dosyada LID ve K tanımlı)
import sys, os, runpy
sys.stdout.reconfigure(encoding='utf-8')
Y = 'D:/GorselHafizaTeknikleriyleJSPS/scripts/sifreler/yazici'
g = runpy.run_path(sys.argv[1]); lid, K = g['LID'], g['K']
p = f'{Y}/k{lid}.py'; s = open(p, encoding='utf-8').read()
i = s.rfind('\n]\nyaz('); assert i > 0
s = s[:i] + '\n' + ''.join(' ' + repr(t) + ',\n' for t in K).rstrip('\n') + s[i:]
open(p, 'w', encoding='utf-8').write(s); print(f'k{lid}: {len(K)} satır eklendi')
