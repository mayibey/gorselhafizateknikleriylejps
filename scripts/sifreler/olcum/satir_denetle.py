# SATIR DENETİMİ — her şifre satırını başkan kuralına göre denetler ve kanun başına çalışma dökümü yazar.
#   python scripts/sifreler/olcum/satir_denetle.py <arsiv_dir> <cikti_dir> [lid ...]
# Kural (4 Eki 2026): SOL = soru KÖKÜNDE görülecek ifade, SAĞ = DOĞRU ŞIKTA aranacak 1-4 kelime.
# Bayraklar:
#   ✓n     n cevaplı soruda SOL kökte + SAĞ doğru şıkta (çalışıyor)
#   ⇄n     SOL n sorunun DOĞRU ŞIKKINDA geçiyor → cevap solda yazılmış (ters)
#   ∅      SOL hiçbir sorunun kökünde yok, şıkta da yok (soruyla bağı yok)
#   UZUN   SAĞ 6+ kelime (yapıştırılacak kelime gömülü)
#   SAYI   SOL'da sayı var, SAĞ'da yok (süre/sayı cevabı solda)
#   TEKRAR aynı SOL ya da aynı madde+SAĞ başka satırda da var
import json, glob, re, sys, os, math, collections
sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from eslesme import norm, tok, kes, icinde, kesisir

A, OUT = sys.argv[1], sys.argv[2]
LIDS = [int(x) for x in sys.argv[3:]] or list(range(1, 26))
KOK = 'D:/GorselHafizaTeknikleriyleJSPS'
os.makedirs(OUT, exist_ok=True)
H = json.load(open(f'{A}/havuz_sonuc.json', encoding='utf-8'))
SAYI = re.compile(r'\b(\d+|bir|iki|üç|dört|beş|altı|yedi|sekiz|dokuz|on|onbeş|yirmi|yirmidört|otuz|kırk|kırksekiz|elli|altmış|doksan|yüz|bin)\b', re.I)

def satirlari_oku(lid):
    kod = open(f'{KOK}/scripts/sifreler/yazici/k{lid}.py', encoding='utf-8').read().replace('from ortak import yaz', '')
    ns = {'yaz': lambda *a, **k: None, '__file__': f'{KOK}/scripts/sifreler/yazici/k{lid}.py'}
    exec(kod, ns)
    return ns['K']

def madde_anahtar(m):
    s = str(m); n = re.match(r'(\d+)', s)
    return (0, int(n.group(1)), s) if n else (1, 0, s)

def kisalt(kok):
    k = re.sub(r'\s+', ' ', kok or '').strip()
    m = re.match(r'^(.{0,170}?)\bgöre\b,?\s*', k)
    if m and len(k) - m.end() > 25: k = k[m.end():]
    return k[:230]

OZET = []
for lid in LIDS:
    R = json.load(open(f'{KOK}/gemini_calisma/girdi/resmi_metin/kanun_{lid}.json', encoding='utf-8'))
    MT = {m['no']: m['metin'] for m in R['maddeler'] if m.get('kapsamda')}
    ad = json.load(open(f'{KOK}/gemini_calisma/kodlama_secme/kanun_{lid}.json', encoding='utf-8'))['ad']
    K = satirlari_oku(lid)
    # --- madde ataması (IDF ile en çok örtüşen madde) ---
    mtok = {m: set(kes(w) for w in tok(t)) for m, t in MT.items()}
    df = collections.Counter(w for s in mtok.values() for w in s); N = max(1, len(mtok))
    def ata(q):
        mq = str(q.get('madde') or '')
        if mq in MT: return mq
        qt = set(kes(w) for w in tok(q['kok'] + ' ' + (q['sec'].get(q['d'], '') if q.get('d') else ' '.join((q.get('sec') or {}).values()))))
        best, bs = None, 0
        for m, s in mtok.items():
            sc = sum(math.log(N / df[w]) for w in qt & s)
            if sc > bs: best, bs = m, sc
        return best or '?'
    QS = [q for q in H if q.get('lid') == lid]
    for q in QS: q['_m'] = ata(q)
    CEV = [q for q in QS if q.get('d') and q['d'] in (q.get('sec') or {})]
    # --- satır bayrakları ---
    bay, cozen = [], collections.defaultdict(set)
    solsay = collections.Counter(norm(r[2]) for r in K)
    msag = collections.Counter((r[0], norm(r[3])) for r in K)
    for n, r in enumerate(K, 1):
        m, tip, sol, sag = r[0], r[1], r[2], r[3]
        duz = [q['id'] for q in CEV if icinde(sol, q['kok']) and kesisir(sag, q['sec'][q['d']])]
        for x in duz: cozen[x].add(n)
        ters = [q['id'] for q in CEV if q['id'] not in duz and icinde(sol, q['sec'][q['d']])]
        kokte = sum(1 for q in QS if icinde(sol, q['kok']))
        f = []
        if duz: f.append(f'✓{len(duz)}')
        if ters: f.append(f'⇄{len(ters)}')
        if not duz and not ters and not kokte: f.append('∅')
        if len(sag.split()) >= 6: f.append('UZUN')
        if SAYI.search(sol) and not SAYI.search(sag): f.append('SAYI')
        if solsay[norm(sol)] > 1 or msag[(m, norm(sag))] > 1: f.append('TEKRAR')
        bay.append(f)
    duzq = sum(1 for q in CEV if q['id'] in cozen)
    # ters: hiçbir satır çözmüyor ama bir satırın SOL'u doğru şıkta geçiyor
    tersq = sum(1 for q in CEV if q['id'] not in cozen and any(icinde(r[2], q['sec'][q['d']]) and kesisir(r[3], q['kok']) for r in K))
    sayac = collections.Counter(x if not x[0] in '✓⇄' else x[0] for f in bay for x in f)
    calisan = sum(1 for f in bay if any(x.startswith('✓') for x in f))
    OZET.append((lid, ad, len(K), calisan, sayac['⇄'], sayac['∅'], sayac['UZUN'], sayac['SAYI'], sayac['TEKRAR'], len(CEV), duzq, tersq))
    # --- döküm ---
    L = [f'# k{lid} · {ad}', f'satır {len(K)} · çalışan {calisan} · ters {sayac["⇄"]} · bağsız {sayac["∅"]} · uzun {sayac["UZUN"]} · sayı solda {sayac["SAYI"]} · tekrar {sayac["TEKRAR"]}',
         f'cevaplı soru {len(CEV)} · çözülen {duzq} (%{100*duzq//max(1,len(CEV))}) · anahtarsız {len(QS)-len(CEV)}', '']
    maddeler = sorted(set(MT) | {str(r[0]) for r in K}, key=madde_anahtar)
    for m in maddeler:
        rows = [(n, r, bay[n - 1]) for n, r in enumerate(K, 1) if str(r[0]) == m]
        acik = [q for q in CEV if q['_m'] == m and q['id'] not in cozen]
        anahtarsiz = [q for q in QS if q['_m'] == m and q not in CEV]
        cozulen = sum(1 for q in CEV if q['_m'] == m and q['id'] in cozen)
        if not rows and not acik and not anahtarsiz: continue
        L.append(f'## m.{m} · satır {len(rows)} · çözülen {cozulen} · açık {len(acik)} · anahtarsız {len(anahtarsiz)}')
        if acik or anahtarsiz:
            t = re.sub(r'\s+', ' ', MT.get(m, ''))
            L.append(f'METİN ({len(t)}): {t[:4000]}')
        for n, r, f in rows:
            L.append(f'  [{n}] {repr(tuple(r))}   # {" ".join(f) or "-"}')
        grup = collections.OrderedDict()
        for q in acik:
            key = (norm(q['sec'][q['d']])[:50], norm(kisalt(q['kok']))[:50])
            grup.setdefault(key, []).append(q)
        for qs in grup.values():
            q = qs[0]; c = f'({len(qs)}x) ' if len(qs) > 1 else ''
            L.append(f'  ? {c}{kisalt(q["kok"])}  ⇒  {q["sec"][q["d"]][:110]}   [{q["id"]}]')
        for q in anahtarsiz[:8]:
            L.append(f'  ¿ {kisalt(q["kok"])}  [şıklar: {" | ".join(v[:40] for v in (q.get("sec") or {}).values())}]')
        L.append('')
    open(f'{OUT}/k{lid}.md', 'w', encoding='utf-8').write('\n'.join(L))

print('| kanun | satır | çalışan | ters | bağsız | uzun | sayı solda | tekrar | cevaplı soru | çözülen | ters duran |')
print('|---|---|---|---|---|---|---|---|---|---|---|')
T = [0] * 10
for o in OZET:
    print(f'| {o[0]} {re.sub(r"\s*\(.*?kapsam[ıi]\)", "", o[1])[:34]} | ' + ' | '.join(str(x) for x in o[2:9]) + f' | {o[9]} | {o[10]} (%{100*o[10]//max(1,o[9])}) | {o[11]} |')
    T = [a + b for a, b in zip(T, o[2:12])]
print(f'| TOPLAM | ' + ' | '.join(str(x) for x in T[:7]) + f' | {T[7]} | {T[8]} (%{100*T[8]//max(1,T[7])}) | {T[9]} |')
