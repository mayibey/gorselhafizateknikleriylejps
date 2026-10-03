# Yardımcı: girdideki maddeleri okunur biçimde döker.
#   python b99_dok.py <kanun_id> <madde_no> [<madde_no> ...]
#   python b99_dok.py <kanun_id> --diger      (kapsam dışı maddelerin kısa metni)
import json, sys, os
sys.stdout.reconfigure(encoding='utf-8')
KOK = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', '..'))
lid = sys.argv[1]
G = json.load(open(os.path.join(KOK, 'scratchpad', 'denetim', 'blok', 'girdi', f'kanun_{lid}.json'), encoding='utf-8'))
if '--diger' in sys.argv:
    for k, v in G['diger_maddeler_kisa'].items():
        print(f'[{k}] {v}')
    sys.exit()
istek = sys.argv[2:]
for m in G['maddeler']:
    if m['no'] not in istek:
        continue
    print('=' * 100)
    print(f"MADDE {m['no']}  (soru_sayisi={m['soru_sayisi']}, kart={len(m['kartlar'])})")
    print('--- RESMI METIN ---')
    print(m['resmi_metin'])
    if m['kartlar']:
        print('--- KARTLAR ---')
        for k in m['kartlar']:
            print(json.dumps(k, ensure_ascii=False))
    if m.get('tablo_satirlari'):
        print('--- TABLO ---')
        for t in m['tablo_satirlari']:
            print(json.dumps(t, ensure_ascii=False))
    if m.get('karistirilan_adaylari'):
        print('--- KARISTIRILAN ADAYLARI ---')
        print(json.dumps(m['karistirilan_adaylari'], ensure_ascii=False))
    if m.get('ornek_sorular'):
        print('--- ORNEK SORULAR ---')
        for s in m['ornek_sorular']:
            print(json.dumps(s, ensure_ascii=False))
    diger = {k: v for k, v in m.items() if k not in ('no', 'resmi_metin', 'kartlar', 'tablo_satirlari', 'karistirilan_adaylari', 'ornek_sorular', 'soru_sayisi')}
    if diger:
        print('--- DIGER ALANLAR ---')
        print(json.dumps(diger, ensure_ascii=False))
