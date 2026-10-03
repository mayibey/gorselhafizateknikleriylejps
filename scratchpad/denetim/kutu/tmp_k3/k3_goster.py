# Kart gösterici (parti 3): resmî metni madde başına bir kez basar.
#   python k3_goster.py <kanun_id> [bas] [son] [--metinsiz]
import json, sys
sys.stdout.reconfigure(encoding='utf-8')
lid = int(sys.argv[1])
bas = int(sys.argv[2]) if len(sys.argv) > 2 and not sys.argv[2].startswith('--') else 0
son = int(sys.argv[3]) if len(sys.argv) > 3 and not sys.argv[3].startswith('--') else 10**6
metinsiz = '--metinsiz' in sys.argv
G = json.load(open(f'D:/GorselHafizaTeknikleriyleJSPS/scratchpad/denetim/kutu/girdi/kanun_{lid}.json', encoding='utf-8'))
basildi = set()
for i, k in enumerate(G['kartlar']):
    if i < bas or i >= son: continue
    print(f"===== [{i}] {k['id']} madde {k['madde']} | {k['baslik']}")
    print('HUKUM:', k['hukum'])
    print('TUZAK:', k['tuzak_satiri'])
    if k['mevcut_dogrusu']: print('MEVCUT_DG:', k['mevcut_dogrusu'])
    for t in k['ayni_maddenin_tuzaklari']:
        print('  Y:', t['yanlis'], '|| D:', t['dogru'])
    if metinsiz: continue
    for m, v in k['resmi_metin'].items():
        if m in basildi:
            print(f'  (m.{m} metni yukarıda)')
        else:
            basildi.add(m)
            print(f'  RESMI m.{m}: {v}')
