# Branş bloklarını ORTAK HAVUZDAN kurar (26 Eyl 2026, 3. dalga).
# Aynı mevzuat birden çok branşta aynı kapsamla geçtiği için sorular mevzuat bazında yazılır
# (kaynak/L<law>-N.json) ve daha önce yazılmış branş blokları da havuza girer. Her branş için:
#   - kanunu branşın listesinde olan ve KANITI o branşın paket metninde birebir bulunan sorular alınır,
#   - aynı kök bir kez (tekilleştirme), müşterek bloklar hariç,
#   - 3 blok × ADET soru, kanunlar arasında sırayla (tek mevzuat bloğu ele geçirmesin), bloklar arası tekrar yok.
# python scripts/premium-deneme/brans-havuz-kur.py <brans> [adet=40]  → kaynak/<brans>-h1.json, -h2.json, -h3.json
import json, glob, os, re, sys, random
brans = sys.argv[1]; ADET = int(sys.argv[2]) if len(sys.argv) > 2 else 40
K = 'scripts/premium-deneme/kaynak/'
def norm(t):
    t = t.replace('İ', 'i').replace('I', 'ı').lower().replace('â', 'a').replace('î', 'i').replace('û', 'u')
    return re.sub(r'[^0-9a-zçğıöşü%]+', '', t)
liste = json.load(open(f'scripts/altin-ozet/paketler/{brans}/liste.json', encoding='utf-8'))
metin = {}
for x in liste:
    p = f"scripts/altin-ozet/paketler/{brans}/pack_{x['law_id']}.json"
    if os.path.exists(p):
        metin[x['law_id']] = norm(' '.join(m['metin'] for m in json.load(open(p, encoding='utf-8'))['maddeler']))
HARIC = ('mus-', 'ue-mus', 'uzm-', 'bakim-b', 'bakim-ek-', f'{brans}-h')
havuz, gorulen = {}, set()
for f in sorted(glob.glob(K + '*.json')):
    if os.path.basename(f).startswith(HARIC): continue
    for q in json.load(open(f, encoding='utf-8')):
        l = q['law']
        if l not in metin or q['k'] in gorulen: continue
        if not all(norm(k) in metin[l] for k in q['kanit']): continue
        gorulen.add(q['k']); havuz.setdefault(l, []).append(q)
rnd = random.Random(f'{brans}-havuz')
for l in havuz: rnd.shuffle(havuz[l])
toplam = sum(len(v) for v in havuz.values())
print(brans, '· havuz', toplam, 'soru ·', {l: len(v) for l, v in sorted(havuz.items())})
if toplam < 3 * ADET: print(f'UYARI: {3*ADET} gerekli, {toplam} var → bloklar eksik kalır')
bloklar = [[], [], []]
kanunlar = sorted(havuz, key=lambda l: -len(havuz[l]))
b, bos = 0, 0
while any(len(x) < ADET for x in bloklar) and bos < len(kanunlar) * 3:
    ilerledi = False
    for l in kanunlar:
        for _ in range(3):
            if len(bloklar[b]) >= ADET: b = (b + 1) % 3; continue
            if havuz[l]:
                bloklar[b].append(havuz[l].pop()); ilerledi = True
            b = (b + 1) % 3
    bos = 0 if ilerledi else bos + 1
    if not ilerledi: break
for i, bl in enumerate(bloklar, 1):
    json.dump(bl, open(K + f'{brans}-h{i}.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    from collections import Counter
    print(f'  blok {i}: {len(bl)} soru · kanun sayısı {len(set(q["law"] for q in bl))} · tip {dict(Counter(q.get("tip","duz") for q in bl))}')
