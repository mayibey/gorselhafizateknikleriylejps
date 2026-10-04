# KÖK→ŞIK ölçümü (başkan kuralı, 4 Eki 2026): SOL kelime soru KÖKÜNDE, SAĞ cevap DOĞRU ŞIKTA aranır.
#   python scripts/sifreler/olcum/kok_sik_olc.py <arsiv_dir>   (arsiv_olc.py'nin havuz_sonuc.json'u)
# Her cevaplı soru için: DÜZ = bir şifrenin kelimesi kökte VE cevabı doğru şıkta · TERS = kelimesi doğru şıkta VE cevabı kökte
# (çevrilince çözer) · YOK = ikisi de değil. Çoktan seçmeli olmayan/cevapsız sorular sayılmaz.
import json, glob, re, sys, collections
sys.stdout.reconfigure(encoding='utf-8')
A = sys.argv[1]; KOK = 'D:/GorselHafizaTeknikleriyleJSPS'
def norm(s): return re.sub(r'\s+', ' ', re.sub(r'[^a-z0-9çğıöşüâîû ]', ' ', (s or '').replace('İ', 'i').replace('I', 'ı').lower())).strip()
BIRLER = {'bir':1,'iki':2,'üç':3,'dört':4,'beş':5,'altı':6,'yedi':7,'sekiz':8,'dokuz':9}
ONLAR = {'on':10,'yirmi':20,'otuz':30,'kırk':40,'elli':50,'altmış':60,'yetmiş':70,'seksen':80,'doksan':90}
def sayi_tok(words):
    """Türkçe sayı sözcüklerini rakama çevirir: 'onsekiz' / 'on sekiz' → '18', 'yirmi' → '20', 'beş' → '5' (ölçüm için)."""
    out, i = [], 0
    while i < len(words):
        w = words[i]; v = None
        if w in ONLAR:
            v = ONLAR[w]
            if i + 1 < len(words) and words[i + 1] in BIRLER: v += BIRLER[words[i + 1]]; i += 1
        elif w in BIRLER: v = BIRLER[w]
        else:
            for o, ov in ONLAR.items():
                if w.startswith(o) and w[len(o):] in BIRLER: v = ov + BIRLER[w[len(o):]]; break
        out.append(str(v) if v is not None else w); i += 1
    return out
def tok(s): return [w for w in sayi_tok(norm(s).split()) if len(w) >= 4 or w.isdigit()]
def kes(w): return w[:5] if len(w) > 5 else w   # ek toleransı: ilk 5 harf
def icinde(kel, metin): return norm(kel) in norm(metin)
def kesisir(cev, metin):
    mt = set(kes(w) for w in tok(metin))
    return any(kes(w) in mt for w in tok(cev))
S = {}
for f in glob.glob(f'{KOK}/gemini_calisma/kodlama_secme/kanun_*.json'):
    d = json.load(open(f, encoding='utf-8')); S[d['id']] = [(k['tetikleyici'], k['cevap'], k.get('i')) for k in d['kodlar']]
H = json.load(open(f'{A}/havuz_sonuc.json', encoding='utf-8'))
T = collections.defaultdict(lambda: collections.Counter()); ORN = collections.defaultdict(list)
for q in H:
    d = q.get('d'); sec = q.get('sec') or {}
    if not d or d not in sec or not q.get('lid') or q['lid'] not in S: continue
    kok, dogru = q['kok'], sec[d]
    yanlis = ' '.join(v for k, v in sec.items() if k != d)
    duz = ters = False
    for kel, cev, i in S[q['lid']]:
        if icinde(kel, kok) and kesisir(cev, dogru): duz = True; break
    if not duz:
        for kel, cev, i in S[q['lid']]:
            if icinde(kel, dogru) and kesisir(cev, kok): ters = True; break
    g = q['grup']; T[g]['soru'] += 1; T['TOPLAM']['soru'] += 1
    k = 'duz' if duz else ('ters' if ters else 'yok'); T[g][k] += 1; T['TOPLAM'][k] += 1
    L = T[('kanun', q['lid'])]; L['soru'] += 1; L[k] += 1
    if k == 'yok' and len(ORN[q['lid']]) < 3: ORN[q['lid']].append((q['id'], kok[:110], dogru[:60]))
def satir(ad, c): 
    n = c['soru'] or 1
    return f"| {ad} | {c['soru']} | {c['duz']} (%{100*c['duz']//n}) | {c['ters']} (%{100*c['ters']//n}) | {c['yok']} (%{100*c['yok']//n}) |"
print('| kaynak | cevaplı soru | DÜZ çözer (kök→şık) | TERS (çevrilince çözer) | YOK |'); print('|---|---|---|---|---|')
for g in ['gerçek sınav 2026', 'arşiv', 'TOPLAM']:
    if g in T: print(satir(g, T[g]))
print('\n| kanun | soru | DÜZ | TERS | YOK |'); print('|---|---|---|---|---|')
AD = {}
for f in glob.glob(f'{KOK}/gemini_calisma/kodlama_secme/kanun_*.json'):
    d = json.load(open(f, encoding='utf-8')); AD[d['id']] = re.sub(r'\s*\(.*?kapsam[ıi]\)', '', d['ad'])[:38]
for key in sorted(k for k in T if isinstance(k, tuple)):
    print(satir(f"{key[1]} {AD.get(key[1], '')}", T[key]))
json.dump({str(k if not isinstance(k, tuple) else k[1]): dict(v) for k, v in T.items()}, open(f'{A}/kok_sik_ozet.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
