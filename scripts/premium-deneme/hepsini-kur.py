# Bütün premium denemeleri kaynak bloklardan YENİDEN kurar (26 Eyl 2026).
# Kaynak sorular düzeltildiğinde (QA vb.) tek komut: python -X utf8 scripts/premium-deneme/hepsini-kur.py
#  1) türev bloklar: mus-2b-uzm/mus-3b-uzm (13/16 çıkar), bakim-bN-ikmal + bakim-ek-N, <brans>-hN (havuz)
#  2) birlestir.py ile 75 deneme (kimlik, başlık, rütbe eşleşmesi değişmez → numaralar/ sonuçlar korunur)
import json, subprocess, sys
K = 'scripts/premium-deneme/kaynak/'
PY = [sys.executable, '-X', 'utf8']
def oku(f): return json.load(open(K + f + '.json', encoding='utf-8'))
def yaz(f, v): json.dump(v, open(K + f + '.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

# --- 1) türev bloklar ---
for n in ('2', '3'):
    yaz(f'mus-{n}b-uzm', [q for q in oku(f'mus-{n}b') if q['law'] not in (13, 16)])
ek = oku('bakim-ek')
for n in (1, 2, 3):
    yaz(f'bakim-b{n}-ikmal', oku(f'ikmal-b{n}-b')[:-1])
    yaz(f'bakim-ek-{n}', [ek[n - 1]])
HAVUZ = ['istihkam', 'tabip', 'eczaci', 'saglik', 'kimyager', 'veteriner', 'muhendis', 'bando']
for b in HAVUZ:
    subprocess.run(PY + ['scripts/premium-deneme/brans-havuz-kur.py', b], check=True)

# --- 2) denemeler ---
M = {1: [('mus-1', '')], 2: [('mus-2a', ''), ('mus-2b', '')], 3: [('mus-3a', ''), ('mus-3b', '')]}
MU = {1: [('ue-mus-a', ''), ('ue-mus-b', '')], 2: [('mus-2a', ''), ('mus-2b-uzm', ''), ('uzm-yedek-2', '')],
      3: [('mus-3a', ''), ('mus-3b-uzm', ''), ('uzm-yedek-3', '')]}
JB = {1: [('sb-jandarma-1', 'jandarma')], 2: [('ue-jan-a', 'jandarma'), ('ue-jan-b', 'jandarma')],
      3: [('jan-b3a', 'jandarma'), ('jan-b3b', 'jandarma')]}
tarif = []  # (id, başlık, rütbe, branş, parçalar)
# Jandarma (1. dalga): sb M1+B1, M2+B2, M3+B3 · asb M1+B2, M2+B3, M3+B1 · uzmerb MU1+B2, MU2+B3, MU3+B1
for d, (m, b) in {1: (1, 1), 2: (2, 2), 3: (3, 3)}.items():
    tarif.append((f'P-SB-JAN-0{d}', f'Jandarma Subay — Premium Deneme {d}', 'sb', 'jandarma', M[m] + JB[b]))
for d, (m, b) in {1: (1, 2), 2: (2, 3), 3: (3, 1)}.items():
    tarif.append((f'P-ASB-JAN-0{d}', f'Jandarma Astsubay — Premium Deneme {d}', 'asb', 'jandarma', M[m] + JB[b]))
    tarif.append((f'P-UE-JAN-0{d}', f'Jandarma Uzman Erbaş — Premium Deneme {d}', 'uzmerb', 'jandarma', MU[m] + JB[b]))
# 2. ve 3. dalga
SIRA = {'sb': {1: 1, 2: 2, 3: 3}, 'asb': {1: 2, 2: 3, 3: 1}}
RUT = {'sb': ('SB', 'Subay'), 'asb': ('ASB', 'Astsubay')}
def blok(br, n):
    if br == 'bakim': return [(f'ikmal-b{n}-a', 'ikmal'), (f'bakim-b{n}-ikmal', 'ikmal'), (f'bakim-ek-{n}', 'bakim')]
    if br in HAVUZ: return [(f'{br}-h{n}', br)]
    return [(f'{br}-b{n}-a', br), (f'{br}-b{n}-b', br)]
DALGA = [('havacilik', 'HAV', 'Havacılık', 'sb asb'), ('mebs', 'MEBS', 'MEBS', 'sb asb'), ('personel', 'PER', 'Personel', 'sb asb'),
         ('bakim', 'BAK', 'Bakım', 'sb asb'), ('maliye', 'MAL', 'Maliye', 'sb asb'), ('ikmal', 'IKM', 'İkmal', 'sb asb'),
         ('istihkam', 'IST', 'İstihkam', 'sb asb'), ('tabip', 'TAB', 'Tabip', 'sb'), ('eczaci', 'ECZ', 'Eczacı', 'sb'),
         ('saglik', 'SAG', 'Sağlık', 'asb'), ('kimyager', 'KIM', 'Kimyager', 'sb'), ('veteriner', 'VET', 'Veteriner', 'sb'),
         ('muhendis', 'MUH', 'Mühendis', 'sb'), ('bando', 'BAN', 'Bando', 'sb asb')]
for br, kisa, ad, ruts in DALGA:
    for r in ruts.split():
        rk, rad = RUT[r]
        for d in (1, 2, 3):
            parca = M[d] + ([(f'mus-mebs-ek-{d}', '')] if br == 'mebs' else []) + blok(br, SIRA[r][d])
            tarif.append((f'P-{rk}-{kisa}-0{d}', f'{ad} {rad} — Premium Deneme {d}', r, br, parca))
hata = 0
for did, baslik, r, br, parca in tarif:
    out = subprocess.run(PY + ['scripts/premium-deneme/birlestir.py', did, baslik, r, br] + [f'{K}{f}.json:{k}' for f, k in parca],
                         capture_output=True, text=True, encoding='utf-8')
    if out.returncode: hata += 1; print('HATA', did, out.stdout[-200:], out.stderr[-300:])
    else: print(out.stdout.strip()[:70])
print(len(tarif), 'deneme kuruldu · hata', hata)
