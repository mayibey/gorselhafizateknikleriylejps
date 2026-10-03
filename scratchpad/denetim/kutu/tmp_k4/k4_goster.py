# k4 yardimci: girdideki kartlari okunur bicimde basar. Resmi metni her madde icin bir kez basar.
#   python k4_goster.py <kanun_id> <bas_index> <son_index>
import json, sys
sys.stdout.reconfigure(encoding='utf-8')
lid, a, b = int(sys.argv[1]), int(sys.argv[2]), int(sys.argv[3])
G = json.load(open(f'D:/GorselHafizaTeknikleriyleJSPS/scratchpad/denetim/kutu/girdi/kanun_{lid}.json', encoding='utf-8'))
basilan = set()
for k in G['kartlar'][a:b]:
    print('=' * 100)
    print(f"[{k['id']}] madde={k['madde']} | {k['baslik']}")
    print('HUKUM :', k['hukum'])
    print('TUZAK :', k['tuzak_satiri'])
    if k['mevcut_dogrusu']: print('MEVCUT_DG:', k['mevcut_dogrusu'])
    for t in k['ayni_maddenin_tuzaklari']:
        print('   tz-y:', t['yanlis'], ' || tz-d:', t['dogru'])
    for m, met in k['resmi_metin'].items():
        if m in basilan:
            print(f'   (m.{m} metni yukarida)')
        else:
            basilan.add(m)
            print(f'   RESMI m.{m}: {met}')
