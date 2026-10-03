import json, sys
sys.stdout.reconfigure(encoding='utf-8')
lid = int(sys.argv[1]); bas = int(sys.argv[2]); son = int(sys.argv[3])
d = json.load(open(f'D:/GorselHafizaTeknikleriyleJSPS/scratchpad/denetim/kutu/girdi/kanun_{lid}.json', encoding='utf-8'))
basildi = {}
for i, k in enumerate(d['kartlar'][bas:son], bas):
    print(f'######## [{i}] {k["id"]} | madde {k["madde"]} | {k["baslik"]}')
    print('HUKUM:', k['hukum'])
    print('TUZAK_SATIRI:', k['tuzak_satiri'])
    print('MEVCUT_DOGRUSU:', k['mevcut_dogrusu'])
    for z in k['ayni_maddenin_tuzaklari']:
        print('  TZ-Y:', z['yanlis']); print('  TZ-D:', z['dogru'])
    for m, t in k['resmi_metin'].items():
        if basildi.get(m) == t:
            print(f'--- RESMI m.{m}: (yukarıda basıldı)')
        else:
            print(f'--- RESMI m.{m}:'); print(t); basildi[m] = t
    print()
