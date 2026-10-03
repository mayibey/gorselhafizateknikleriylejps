# b67 yardımcı: kanun_67 girdisindeki maddeleri okunur biçimde basar.
#   python b67_goster.py boyut            -> her maddenin metin/kart/soru boyutu
#   python b67_goster.py 6 24 25          -> verilen maddelerin tamamı
import json, sys, os
sys.stdout.reconfigure(encoding='utf-8')
KOK = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', '..'))
G = json.load(open(os.path.join(KOK, 'scratchpad', 'denetim', 'blok', 'girdi', 'kanun_67.json'), encoding='utf-8'))
M = {m['no']: m for m in G['maddeler']}

if sys.argv[1] == 'boyut':
    for m in G['maddeler']:
        print(m['no'], len(m['resmi_metin']), 'kart', len(m['kartlar']), 'soru', m['soru_sayisi'], len(m['ornek_sorular']),
              'tablo', len(m['tablo_satirlari']), 'karis', m['karistirilan_adaylari'])
    sys.exit()

for no in sys.argv[1:]:
    m = M[no]
    print('=' * 100)
    print(f"MADDE {no}  (soru_sayisi={m['soru_sayisi']})")
    print('--- RESMİ METİN ---')
    print(m['resmi_metin'])
    print('--- KARTLAR ---')
    for k in m['kartlar']:
        print(f"[{k['id']}] {k.get('baslik','')}")
        print('  HÜKÜM:', k['hukum'])
        for s in k.get('sinavda_boyle_yazarlar') or []:
            print('  YANLIŞ:', s)
        for s in k.get('dogrusu') or []:
            print('  DOĞRU:', s)
        diger = {kk: vv for kk, vv in k.items() if kk not in ('id', 'baslik', 'hukum', 'sinavda_boyle_yazarlar', 'dogrusu')}
        if diger:
            print('  DİĞER:', json.dumps(diger, ensure_ascii=False))
    print('--- ÖRNEK SORULAR ---')
    for q in m['ornek_sorular']:
        print('  KÖK:', q['kok'].replace('\n', ' | '))
        print('  ŞIKLAR:', ' || '.join(q['siklar']))
        print('  DOĞRU:', q['dogru'])
        diger = {kk: vv for kk, vv in q.items() if kk not in ('kok', 'siklar', 'dogru')}
        if diger:
            print('  DİĞER:', json.dumps(diger, ensure_ascii=False))
    print('--- TABLO ---')
    for t in m['tablo_satirlari']:
        print('  ', t)
    print('--- KARIŞTIRILAN ADAYLARI ---', m['karistirilan_adaylari'])
