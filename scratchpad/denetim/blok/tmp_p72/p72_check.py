# p72_check.py — görev talimatındaki sıkı sınırlar (denetçiden ayrı): başlık<=6, öz<=70 ve 2-4 cümle,
# sorulur<=40, akilda<=30, neden<=15 kelime; soru_sayisi 0 ise "Beklenen kalıp:" ile başlama
import json, os, re, sys
sys.stdout.reconfigure(encoding='utf-8')
KOK = r'D:\GorselHafizaTeknikleriyleJSPS'
lid = int(sys.argv[1])
B = json.load(open(os.path.join(KOK, 'scratchpad', 'denetim', 'blok', 'sonuc', f'kanun_{lid}.json'), encoding='utf-8'))
G = json.load(open(os.path.join(KOK, 'scratchpad', 'denetim', 'blok', 'girdi', f'kanun_{lid}.json'), encoding='utf-8'))
ss = {m['no']: m['soru_sayisi'] for m in G['maddeler']}
def k(t): return len(str(t).split())
def cumle(t): return len([x for x in re.split(r'(?<=[^\d][.!?])\s+(?=[A-ZÇĞİÖŞÜ0-9\'"“‘(])', t.strip()) if x])
sorun = 0
for b in B:
    if 'atla' in b: continue
    m = b['madde']; yer = f'm.{m}'
    if k(b['baslik']) > 6: print(yer, 'başlık', k(b['baslik'])); sorun += 1
    if k(b['oz']) > 70: print(yer, 'öz kelime', k(b['oz'])); sorun += 1
    c = cumle(b['oz'])
    if not (2 <= c <= 4): print(yer, 'öz cümle sayısı', c); sorun += 1
    for x in b['sorulur']:
        if k(x) > 40: print(yer, 'sorulur', k(x), x[:50]); sorun += 1
    for x in b['akilda']:
        if k(x) > 30: print(yer, 'akilda', k(x), x[:50]); sorun += 1
    for x in b.get('karis', []):
        if k(x['neden']) > 15: print(yer, 'neden', k(x['neden']), x['neden'][:50]); sorun += 1
    if ss.get(m, 0) == 0 and not b['sorulur'][0].startswith('Beklenen kalıp:'):
        print(yer, 'soru_sayisi 0 ama "Beklenen kalıp:" ile başlamıyor'); sorun += 1
print('sıkı sınır sorunu:', sorun, '· blok:', len(B), '· atla:', sum(1 for b in B if 'atla' in b))
