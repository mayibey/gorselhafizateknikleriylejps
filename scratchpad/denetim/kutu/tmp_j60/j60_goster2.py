import json,sys
sys.stdout.reconfigure(encoding='utf-8')
lid=int(sys.argv[1]); bas=int(sys.argv[2]); son=int(sys.argv[3])
d=json.load(open(f'girdi/kanun_{lid}.json',encoding='utf-8'))
gor=set()
for i,k in enumerate(d['kartlar']):
    if i<bas:
        for m,v in k['resmi_metin'].items(): gor.add((m,v))
        continue
    if i>=son: break
    print('='*100)
    print('ID:',k['id'],'| MADDE:',k['madde'],'| BASLIK:',k['baslik'])
    print('HUKUM:',k['hukum'])
    print('TUZAK_SATIRI:',k['tuzak_satiri'])
    print('MEVCUT_DOGRUSU:',k['mevcut_dogrusu'])
    for t in k['ayni_maddenin_tuzaklari']: print('   Y:',t['yanlis'],'| D:',t['dogru'])
    for m,v in k['resmi_metin'].items():
        if (m,v) in gor: print('  [m.'+m+'] (yukarıda basıldı)')
        else: print('  [m.'+m+']',v); gor.add((m,v))
