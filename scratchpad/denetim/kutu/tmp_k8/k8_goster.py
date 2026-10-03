# Yardımcı: girdideki kartları okunur biçimde yazdırır (yalnız okuma).
#   python k8_goster.py <kanun_id> <bas_index> <bitis_index> [maxmetin]
import json, sys
sys.stdout.reconfigure(encoding='utf-8')
lid = int(sys.argv[1]); a = int(sys.argv[2]); b = int(sys.argv[3])
mx = int(sys.argv[4]) if len(sys.argv) > 4 else 100000
G = json.load(open(f'D:/GorselHafizaTeknikleriyleJSPS/scratchpad/denetim/kutu/girdi/kanun_{lid}.json', encoding='utf-8'))
for i, k in enumerate(G['kartlar'][a:b], a):
    print(f'#### [{i}] {k["id"]} | madde={k["madde"]} | {k["baslik"]}')
    print('HUKUM:', k['hukum'])
    print('TUZAK_SATIRI:', k['tuzak_satiri'])
    print('MEVCUT_DOGRUSU:', k['mevcut_dogrusu'])
    for t in k['ayni_maddenin_tuzaklari']:
        print('  TZ-Y:', t['yanlis'])
        print('  TZ-D:', t['dogru'])
    for m, v in k['resmi_metin'].items():
        print(f'  RESMI m.{m}:', v[:mx])
    print()
