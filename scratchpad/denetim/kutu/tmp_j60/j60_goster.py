import json,sys
sys.stdout.reconfigure(encoding='utf-8')
lid=int(sys.argv[1]); bas=int(sys.argv[2]) if len(sys.argv)>2 else 0; son=int(sys.argv[3]) if len(sys.argv)>3 else 999
d=json.load(open(f'girdi/kanun_{lid}.json',encoding='utf-8'))
for i,k in enumerate(d['kartlar']):
    if i<bas or i>=son: continue
    print('='*100)
    print('ID:',k['id'],'| MADDE:',k['madde'],'| BASLIK:',k['baslik'])
    print('HUKUM:',k['hukum'])
    print('TUZAK_SATIRI:',k['tuzak_satiri'])
    print('MEVCUT_DOGRUSU:',k['mevcut_dogrusu'])
    print('AYNI_MADDE_TUZAKLARI:')
    for t in k['ayni_maddenin_tuzaklari']: print('   Y:',t['yanlis'],'\n   D:',t['dogru'])
    print('RESMI_METIN:')
    for m,v in k['resmi_metin'].items(): print('  [m.'+m+']',v)
