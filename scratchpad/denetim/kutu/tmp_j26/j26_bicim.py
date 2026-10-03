import json, sys
sys.stdout.reconfigure(encoding='utf-8')
lid = int(sys.argv[1])
D = json.load(open(f'D:/GorselHafizaTeknikleriyleJSPS/scratchpad/denetim/kutu/sonuc/kanun_{lid}.json', encoding='utf-8'))
sorun = 0
for x in D:
    dz = x.get('duzeltme') or {}
    for y in dz.get('sinavda_boyle_yazarlar', []):
        if not (y.startswith('“') and y.endswith('”')) or y.count('“') != 1 or y.count('”') != 1:
            print('TIRNAK', x['kart_id'], y); sorun += 1
        if 'kaçırdığın' in y.lower(): print('YASAK', x['kart_id']); sorun += 1
    for d in dz.get('dogrusu', []):
        if '“' in d or '”' in d: print('DOGRUSU TIRNAK', x['kart_id'], d); sorun += 1
        if 'kaçırdığın' in d.lower(): print('YASAK', x['kart_id']); sorun += 1
print('kayit', len(D), 'bicim sorunu', sorun)
