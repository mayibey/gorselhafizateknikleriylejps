import json, sys
sys.stdout.reconfigure(encoding='utf-8')
lid = int(sys.argv[1])
bas = int(sys.argv[2]) if len(sys.argv) > 2 else 0
son = int(sys.argv[3]) if len(sys.argv) > 3 else 9999
G = json.load(open(f'D:/GorselHafizaTeknikleriyleJSPS/scratchpad/denetim/kutu/girdi/kanun_{lid}.json', encoding='utf-8'))
print('###', G['kanun_id'], G['ad'], G['kart_sayisi'])
for i, k in enumerate(G['kartlar']):
    if i < bas or i >= son: continue
    print('=' * 100)
    print(f"[{i}] KART {k['id']} | madde {k['madde']} | {k['baslik']}")
    print('HUKUM:', k['hukum'])
    print('TUZAK_SATIRI:', k['tuzak_satiri'])
    print('MEVCUT_DOGRUSU:', k['mevcut_dogrusu'])
    for t in k['ayni_maddenin_tuzaklari']:
        print('  TZ-Y:', t['yanlis'])
        print('  TZ-D:', t['dogru'])
    for m, v in k['resmi_metin'].items():
        print(f'  RESMI m.{m}:', v)
