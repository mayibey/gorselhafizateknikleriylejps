# b15 yardımcı: bir kanunun belirtilen maddelerini okunur biçimde döker
# python b15_goster.py <kanun_id> <madde_no> [<madde_no> ...]
import json, sys, os
sys.stdout.reconfigure(encoding='utf-8')
KOK = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', '..'))
lid = sys.argv[1]
G = json.load(open(os.path.join(KOK, 'scratchpad', 'denetim', 'blok', 'girdi', f'kanun_{lid}.json'), encoding='utf-8'))
istek = sys.argv[2:]
for m in G['maddeler']:
    if istek and m['no'] not in istek:
        continue
    print('=' * 100)
    print(f"MADDE {m['no']}  | soru_sayisi={m.get('soru_sayisi')}")
    print('--- RESMI METIN ---')
    print(m['resmi_metin'])
    for k in m.get('kartlar', []):
        print(f"--- KART {k['id']} : {k.get('baslik')}")
        print('  HUKUM:', k.get('hukum'))
        print('  SINAVDA:', k.get('sinavda_boyle_yazarlar'))
        print('  DOGRUSU:', k.get('dogrusu'))
    for i, s in enumerate(m.get('ornek_sorular', [])):
        print(f'--- SORU {i+1}')
        print(json.dumps(s, ensure_ascii=False))
    if m.get('tablo_satirlari'):
        print('--- TABLO:', json.dumps(m['tablo_satirlari'], ensure_ascii=False))
    if m.get('karistirilan_adaylari'):
        print('--- KARIS ADAY:', json.dumps(m['karistirilan_adaylari'], ensure_ascii=False))
