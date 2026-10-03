# Yardımcı: girdi dosyasından seçili maddeleri okunur biçimde döker.
#   python b122_dump.py <kanun_id> <no1> [<no2> ...]
import json, sys, os
sys.stdout.reconfigure(encoding='utf-8')
KOK = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', '..'))
kid = sys.argv[1]
nolar = sys.argv[2:]
d = json.load(open(os.path.join(KOK, 'scratchpad', 'denetim', 'blok', 'girdi', f'kanun_{kid}.json'), encoding='utf-8'))
for m in d['maddeler']:
    if nolar and m['no'] not in nolar:
        continue
    print('=' * 100)
    print('MADDE', m['no'], '| soru', m.get('soru_sayisi'), '| karis', [(x['madde'], x['kac_celdiricide']) for x in m.get('karistirilan_adaylari') or []])
    print('-' * 40, 'RESMI METIN')
    print(m['resmi_metin'])
    for k in m.get('kartlar') or []:
        print('-' * 40, 'KART')
        print(json.dumps(k, ensure_ascii=False, indent=1))
    for i, s in enumerate(m.get('ornek_sorular') or []):
        print('-' * 40, f'SORU {i+1}')
        print('KOK:', s['kok'])
        for sk in s['siklar']:
            print('   ', '*' if sk == s['dogru'] else ' ', sk)
    if m.get('tablo_satirlari'):
        print('-' * 40, 'TABLO')
        print(json.dumps(m['tablo_satirlari'], ensure_ascii=False, indent=1))
