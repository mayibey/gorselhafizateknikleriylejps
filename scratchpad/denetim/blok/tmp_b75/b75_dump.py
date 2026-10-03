import json, sys, os
sys.stdout.reconfigure(encoding='utf-8')
kid = sys.argv[1]
nolar = sys.argv[2:]
d = json.load(open(f'D:/GorselHafizaTeknikleriyleJSPS/scratchpad/denetim/blok/girdi/kanun_{kid}.json', encoding='utf-8'))
for m in d['maddeler']:
    if nolar and m['no'] not in nolar:
        continue
    print('=' * 100)
    print(f"MADDE {m['no']}  soru_sayisi={m['soru_sayisi']}")
    print('--- RESMI METIN ---')
    print(m['resmi_metin'])
    print('--- KARTLAR ---')
    for k in m['kartlar']:
        print(f"[{k['id']}] {k.get('baslik')}")
        print('  HUKUM:', k.get('hukum'))
        for s in k.get('sinavda_boyle_yazarlar') or []:
            print('  YAZARLAR:', s)
        for s in k.get('dogrusu') or []:
            print('  DOGRUSU:', s)
    print('--- ORNEK SORULAR ---')
    for i, q in enumerate(m['ornek_sorular']):
        print(f"Q{i+1}: {q.get('kok')}")
        for s in q.get('siklar') or []:
            print('   -', s)
        print('   DOGRU:', q.get('dogru'))
    print('--- TABLO ---')
    for t in m['tablo_satirlari']:
        print('  ', json.dumps(t, ensure_ascii=False))
    print('--- KARISTIRILAN ADAYLARI ---')
    print('  ', json.dumps(m['karistirilan_adaylari'], ensure_ascii=False))
