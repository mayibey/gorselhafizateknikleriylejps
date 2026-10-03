import json,sys
sys.stdout.reconfigure(encoding='utf-8')
d=json.load(open(f'scratchpad/denetim/kutu/girdi/kanun_{sys.argv[1]}.json',encoding='utf-8'))
print(d['ad'])
for k in d['kartlar']:
    print('=====',k['id'],'m.',k['madde'],'|',k['baslik'])
    print('HUKUM:',k['hukum'])
    print('TUZAK:',k.get('tuzak_satiri'))
    print('MEVCUT_DOGRU:',k.get('mevcut_dogrusu'))
    for t in k.get('ayni_maddenin_tuzaklari') or []: print('  AT:',t)
    for m,t in k['resmi_metin'].items(): print('  RESMI',m,':',t[:int(sys.argv[2]) if len(sys.argv)>2 else 3000])
