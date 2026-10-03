import json, sys
sys.stdout.reconfigure(encoding='utf-8')
d = json.load(open(r'D:\GorselHafizaTeknikleriyleJSPS\scratchpad\denetim\blok\girdi\kanun_77.json', encoding='utf-8'))
nolar = sys.argv[1:]
if nolar == ['diger']:
    for k, v in d['diger_maddeler_kisa'].items():
        print(k, '::', v)
    sys.exit()
for m in d['maddeler']:
    if nolar and m['no'] not in nolar:
        continue
    print('=' * 100)
    print('MADDE', m['no'], '| soru_sayisi', m['soru_sayisi'])
    print('--- RESMI METIN ---')
    print(m['resmi_metin'])
    print('--- KARTLAR ---')
    for k in m['kartlar']:
        print(' [%s] %s' % (k['id'], k.get('baslik')))
        print('   HUKUM:', k['hukum'])
        for s in k.get('sinavda_boyle_yazarlar') or []:
            print('   YANLIS:', s)
        for s in k.get('dogrusu') or []:
            print('   DOGRU:', s)
        for kk, vv in k.items():
            if kk not in ('id', 'baslik', 'hukum', 'sinavda_boyle_yazarlar', 'dogrusu'):
                print('   %s: %s' % (kk, vv))
    print('--- TABLO ---')
    for t in m.get('tablo_satirlari') or []:
        print(' ', t)
    print('--- ORNEK SORULAR ---')
    for q in m['ornek_sorular']:
        print(' *', json.dumps(q, ensure_ascii=False))
    print('--- KARIS ADAY ---', m.get('karistirilan_adaylari'))
