# b72_dump.py <kanun_id> [madde_no ...]  -> girdiyi okunur biçimde dök
import json, sys
sys.stdout.reconfigure(encoding='utf-8')
lid = sys.argv[1]
G = json.load(open(f'D:/GorselHafizaTeknikleriyleJSPS/scratchpad/denetim/blok/girdi/kanun_{lid}.json', encoding='utf-8'))
istek = sys.argv[2:]
if istek == ['--diger']:
    for k, v in G['diger_maddeler_kisa'].items():
        print(f'[{k}] {v}')
    sys.exit()
for m in G['maddeler']:
    if istek and m['no'] not in istek:
        continue
    print('=' * 100)
    print(f"MADDE {m['no']}  | soru_sayisi={m['soru_sayisi']} | kart={len(m['kartlar'])}")
    print('--- RESMI METIN ---')
    print(m['resmi_metin'])
    for k in m['kartlar']:
        print('--- KART', {kk: vv for kk, vv in k.items()})
    for i, s in enumerate(m['ornek_sorular']):
        print(f'--- SORU {i+1}:', json.dumps(s, ensure_ascii=False))
    print('--- TABLO:', json.dumps(m.get('tablo_satirlari'), ensure_ascii=False))
    print('--- KARIS ADAY:', json.dumps(m.get('karistirilan_adaylari'), ensure_ascii=False))
    extra = {k: v for k, v in m.items() if k not in ('no', 'resmi_metin', 'kartlar', 'ornek_sorular', 'tablo_satirlari', 'karistirilan_adaylari', 'soru_sayisi')}
    if extra:
        print('--- EXTRA:', json.dumps(extra, ensure_ascii=False))
