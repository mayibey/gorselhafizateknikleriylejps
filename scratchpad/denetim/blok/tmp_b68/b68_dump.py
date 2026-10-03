import json, sys
sys.stdout.reconfigure(encoding='utf-8')
lid = int(sys.argv[1])
nos = sys.argv[2:]  # optional madde filter
G = json.load(open(f'D:/GorselHafizaTeknikleriyleJSPS/scratchpad/denetim/blok/girdi/kanun_{lid}.json', encoding='utf-8'))
for m in G['maddeler']:
    if nos and m['no'] not in nos: continue
    print('#'*100)
    print('MADDE', m['no'], '| soru_sayisi', m['soru_sayisi'])
    print('--- RESMI METIN ---')
    print(m['resmi_metin'])
    print('--- KARTLAR ---')
    for k in m['kartlar']:
        print(f"[{k['id']}] {k['baslik']}")
        print('  HUKUM:', k['hukum'])
        print('  SINAVDA:', k.get('sinavda_boyle_yazarlar'))
        print('  DOGRUSU:', k.get('dogrusu'))
    print('--- ORNEK SORULAR ---')
    for s in m['ornek_sorular']:
        print(json.dumps(s, ensure_ascii=False))
    print('--- TABLO ---')
    for t in m['tablo_satirlari']:
        print(json.dumps(t, ensure_ascii=False))
    print('--- KARISTIRILAN ---', json.dumps(m['karistirilan_adaylari'], ensure_ascii=False))
