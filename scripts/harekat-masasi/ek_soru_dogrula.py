# Yazılan ek soruları doğrular ve scripts/harekat-masasi/ek_sorular/ altına kopyalar.
#   python ek_soru_dogrula.py <sonuc_*.json ...>
import json, sys, os, re, glob
sys.stdout.reconfigure(encoding='utf-8')
KOK = os.path.dirname(os.path.abspath(__file__))
HEDEF = os.path.join(KOK, 'ek_sorular'); os.makedirs(HEDEF, exist_ok=True)
EMIR = json.load(open(os.path.join(KOK, '..', '_emir-madde-kapsam.json'), encoding='utf-8'))['kapsam']
kapsamli = {}
for br, t in EMIR.items():
    for lid, lst in t.items(): kapsamli.setdefault(int(lid), set()).update(int(x) for x in lst)
gor = set(); toplam = sorunlu = 0
for f in sys.argv[1:]:
    d = json.load(open(f, encoding='utf-8')); iyi = []
    for q in d:
        toplam += 1; hata = []
        if q.get('i') in gor: hata.append('tekrar id')
        if not isinstance(q.get('s'), list) or len(q['s']) != 5 or len(set(x.strip() for x in q['s'])) != 5: hata.append('şık sayısı/tekrar')
        if not isinstance(q.get('d'), int) or not 0 <= q['d'] <= 4: hata.append('d')
        if not q.get('k') or not q.get('a'): hata.append('kök/açıklama boş')
        if 'kaçırdığın' in (q.get('k', '') + q.get('a', '')).lower(): hata.append('yasak kelime')
        m = re.search(r'm\.\s*(\d+)', q.get('y') or '')
        lid = int(q['kanun_id'])
        if m and lid in kapsamli and int(m.group(1)) not in kapsamli[lid]: hata.append(f'kapsam dışı madde {m.group(1)}')
        if hata: sorunlu += 1; print('  ATILDI', q.get('i'), hata)
        else: iyi.append(q); gor.add(q['i'])
    ad = 'ek_' + os.path.basename(f)
    json.dump(iyi, open(os.path.join(HEDEF, ad), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(os.path.basename(f), len(d), '→', len(iyi))
print('toplam', toplam, '· atılan', sorunlu)
