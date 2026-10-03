# -*- coding: utf-8 -*-
"""Yardımcı (YALNIZ OKUR): kart id'leri için duzeltmeler.json + kutu/sonuc kayıtlarını ve etkin (birleşik) düzeltmeyi gösterir."""
import json, sys, glob

sys.stdout.reconfigure(encoding='utf-8')
ROOT = 'D:/GorselHafizaTeknikleriyleJSPS'
D = json.load(open(f'{ROOT}/scripts/harekat-masasi/duzeltmeler.json', encoding='utf-8'))
K = []
for f in sorted(glob.glob(f'{ROOT}/scratchpad/denetim/kutu/sonuc/kanun_*.json')):
    for x in json.load(open(f, encoding='utf-8')):
        x['_dosya'] = f.split('/')[-1]
        K.append(x)

for kid in sys.argv[1:]:
    print('=' * 90)
    print('KART', kid)
    birlesik = {}
    for i, d in enumerate(D):
        if d.get('kart_id') == kid:
            print(f'  duzeltmeler[{i}] kanun={d.get("kanun_id")} sorun={d.get("sorun")} aciklama={d.get("aciklama")}')
            print('     ', json.dumps(d.get('duzeltme'), ensure_ascii=False))
            birlesik.update(d.get('duzeltme') or {})
    for x in K:
        if x.get('kart_id') == kid:
            print(f'  kutu/{x["_dosya"]} sorun={x.get("sorun")} aciklama={x.get("aciklama")}')
            print('     ', json.dumps(x.get('duzeltme'), ensure_ascii=False))
    print('  ETKİN (duzeltmeler sırası):', json.dumps(birlesik, ensure_ascii=False))
