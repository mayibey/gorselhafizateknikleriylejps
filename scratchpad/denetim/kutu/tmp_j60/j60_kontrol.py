import json,sys,re
sys.stdout.reconfigure(encoding='utf-8')
toplam=0
for lid in [60,61,62,63,64,65,66,68]:
    d=json.load(open(f'sonuc/kanun_{lid}.json',encoding='utf-8'))
    g=json.load(open(f'girdi/kanun_{lid}.json',encoding='utf-8'))
    toplam+=len(d)
    assert len(d)==len(g['kartlar']), lid
    for x in d:
        dz=x['duzeltme']
        for y in dz['sinavda_boyle_yazarlar']:
            if not (y.startswith('“') and y.endswith('”')): print('TIRNAK', x['kart_id'], y[:60])
            if re.search(r'\b(en geç|en az|en fazla|en çok|ancak|yalnız|yalnızca|sadece)\b', y, re.I):
                print('KALIP', x['kart_id'], '|', y)
print('toplam kayıt', toplam)
