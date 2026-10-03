import json, sys, re
sys.stdout.reconfigure(encoding='utf-8')
d = json.load(open(r'D:\GorselHafizaTeknikleriyleJSPS\scratchpad\denetim\blok\girdi\kanun_77.json', encoding='utf-8'))
ids = []
for m in d['maddeler']:
    for k in m['kartlar']:
        ids.append(k['id'])
        h_ref = re.findall(r'\(m\.([^)]*)\)', k['hukum'])
        y_ref = [re.findall(r'\(m\.([^)]*)\)', s) for s in (k.get('sinavda_boyle_yazarlar') or [])]
        d_ref = [re.findall(r'\(m\.([^)]*)\)', s) for s in (k.get('dogrusu') or [])]
        print('madde %-4s kart %-6s | hukum refs %s | yanlis refs %s | dogru refs %s | %s' % (m['no'], k['id'], h_ref, y_ref, d_ref, k.get('baslik')))
print()
nums = sorted(int(i.split('-')[1]) for i in ids)
print('kart sayisi', len(ids), 'eksik idler:', [n for n in range(0, max(nums) + 1) if n not in nums])
from collections import Counter
c = Counter(ids)
print('tekrar edenler:', [i for i, n in c.items() if n > 1])
