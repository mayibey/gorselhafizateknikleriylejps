import json, sys
sys.stdout.reconfigure(encoding='utf-8')
for lid in sys.argv[1:]:
    D = json.load(open(f'D:/GorselHafizaTeknikleriyleJSPS/scratchpad/denetim/kutu/sonuc/kanun_{lid}.json', encoding='utf-8'))
    for x in D:
        dz = x['duzeltme']
        print(f"--- {x['kart_id']}" + ("  [HUKUM DEĞİŞTİ]" if 'hukum' in dz else ''))
        for y, d in zip(dz['sinavda_boyle_yazarlar'], dz['dogrusu']):
            print('  Y:', y)
            print('  D:', d)
