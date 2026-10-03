# Kart görüntüleyici: python j52_goster.py <kanun_id> [bas] [son] [--metin]
import json, sys
sys.stdout.reconfigure(encoding='utf-8')
lid = int(sys.argv[1])
bas = int(sys.argv[2]) if len(sys.argv) > 2 and not sys.argv[2].startswith('--') else 0
son = int(sys.argv[3]) if len(sys.argv) > 3 and not sys.argv[3].startswith('--') else 10**9
metin = '--metin' in sys.argv
d = json.load(open(f'D:/GorselHafizaTeknikleriyleJSPS/scratchpad/denetim/kutu/girdi/kanun_{lid}.json', encoding='utf-8'))
print('AD:', d['ad'])
for i, k in enumerate(d['kartlar']):
    if i < bas or i > son: continue
    print('=' * 100)
    print(f"#{i} id={k['id']} madde={k['madde']} baslik={k['baslik']}")
    print('HUKUM:', k['hukum'])
    print('TUZAK_SATIRI:', k['tuzak_satiri'])
    print('MEVCUT_DOGRUSU:', k['mevcut_dogrusu'])
    for t in k['ayni_maddenin_tuzaklari']:
        print('  TZ-Y:', t['yanlis'])
        print('  TZ-D:', t['dogru'])
    if metin:
        for m, t in k['resmi_metin'].items():
            print(f'  --- RESMI m.{m} ({len(t)} kar):')
            print('  ', t)
