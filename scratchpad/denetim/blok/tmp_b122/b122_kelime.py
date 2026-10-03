# Yardımcı: görev metnindeki sıkı kelime sınırlarını (başlık 6, öz 70, sorulur 40, akılda 30, neden 15) denetler.
#   python b122_kelime.py <sonuc_json>
import json, sys
sys.stdout.reconfigure(encoding='utf-8')
S = {'baslik': 6, 'oz': 70, 'sorulur': 40, 'akilda': 30, 'neden': 15}
B = json.load(open(sys.argv[1], encoding='utf-8'))
n = 0
for b in B:
    if 'atla' in b:
        continue
    m = b['madde']
    def k(t): return len(str(t).split())
    if k(b['baslik']) > S['baslik']: print(m, 'baslik', k(b['baslik'])); n += 1
    if k(b['oz']) > S['oz']: print(m, 'oz', k(b['oz'])); n += 1
    oz_cumle = [c for c in b['oz'].replace('?', '.').split('. ') if c.strip()]
    if not (2 <= len(oz_cumle) <= 4): print(m, 'oz cümle sayısı', len(oz_cumle))
    for a in ('sorulur', 'akilda'):
        for i, x in enumerate(b[a]):
            if k(x) > S[a]: print(m, a, i, k(x)); n += 1
    for x in b.get('karis', []):
        if k(x['neden']) > S['neden']: print(m, 'neden', x['madde'], k(x['neden'])); n += 1
print('sıkı sınır aşımı:', n)
