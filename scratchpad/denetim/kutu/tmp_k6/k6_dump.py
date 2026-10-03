import json, sys
sys.stdout.reconfigure(encoding='utf-8')
lid = int(sys.argv[1])
bas = int(sys.argv[2]) if len(sys.argv) > 2 else 0
son = int(sys.argv[3]) if len(sys.argv) > 3 else 9999
metin = '--metin' in sys.argv
G = json.load(open(f'D:/GorselHafizaTeknikleriyleJSPS/scratchpad/denetim/kutu/girdi/kanun_{lid}.json', encoding='utf-8'))
gorulen = set()
for i, k in enumerate(G['kartlar']):
    if i < bas or i > son:
        continue
    print('=' * 100)
    print(f"[{k['id']}] madde={k['madde']} | {k['baslik']}")
    print('HUKUM :', k['hukum'])
    print('TUZAK :', k.get('tuzak_satiri'))
    print('MEVCUT:', k.get('mevcut_dogrusu'))
    for t in k.get('ayni_maddenin_tuzaklari') or []:
        print('  AYNI:', json.dumps(t, ensure_ascii=False))
    if metin:
        for m, txt in k['resmi_metin'].items():
            if m in gorulen and '--tekrar' not in sys.argv:
                print(f'  -- m.{m}: (yukarıda)')
                continue
            gorulen.add(m)
            print(f'  -- m.{m}:')
            print('   ', txt.replace('\n', ' '))
