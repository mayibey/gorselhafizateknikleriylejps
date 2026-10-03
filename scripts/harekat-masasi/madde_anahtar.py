# Madde anahtarı (3 Eki): soru kaynağından ve kart metninden "hangi madde?" sorusunun TEK cevabı.
#   ana madde      "5442 m.11/C"        → "11"        (/C fıkra)
#   harfli madde   "5271 m.38/A"        → "38/A"      (yalnız resmî madde listesinde 38/A AYRI madde ise; yoksa fıkra sayılır)
#   ek / geçici    "2803 Ek m.2"        → "Ek 2"      ("Ek Madde 1", "Geçici m.5", "Ek Geçici m.98" de)
# Eskiden "Ek m.1" ana m.1'e, "m.38/A" ana m.38'e düşüyordu → soru/kart yanlış madde bloğunda görünüyordu.
import os, re, json, glob
KOK = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
HARF = 'A-Za-zÇĞİÖŞÜçğıöşü'
_HARFLI = None

def _paketler():
    global _HARFLI
    if _HARFLI is not None: return _HARFLI
    _HARFLI = {}
    for f in glob.glob(os.path.join(KOK, 'scripts', 'altin-ozet', 'paketler', '**', 'pack_*.json'), recursive=True):
        try: p = json.load(open(f, encoding='utf-8'))
        except Exception: continue
        lid = p.get('law_id')
        if lid is None: continue
        s = _HARFLI.setdefault(int(lid), set())
        for m in p.get('maddeler', []):
            no = re.sub(r'\s+', '', str(m.get('no', '')))
            if re.fullmatch(r'\d+/[' + HARF + r']', no): s.add(no.split('/')[0] + '/' + no.split('/')[1].upper())
    return _HARFLI

def harfli_maddeler(lid):
    return _paketler().get(int(lid), set()) if lid is not None else set()

def ek_tur(s):
    s = re.sub(r'\s+', ' ', s.replace('İ', 'i').replace('I', 'ı')).strip().lower()
    return {'ek geçici': 'Ek Geçici', 'geçici': 'Geçici', 'ek': 'Ek'}.get(s, s.title())

EK_RE = re.compile(r'(?<![' + HARF + r'])(Ek\s+Geçici|Geçici|Ek)\s*(?:m\.|madde)?\s*(\d+)', re.I)
ANA_RE = re.compile(r'm\.\s*(\d+)(?:\s*/\s*([' + HARF + r'])(?![' + HARF + r']))?', re.I)

def soru_maddesi(y, lid=None):
    """Sorunun kaynak alanından madde anahtarı (metin) ya da None."""
    y = y or ''
    e = EK_RE.search(y)
    if e: return ek_tur(e.group(1)) + ' ' + e.group(2)
    m = ANA_RE.search(y)
    if not m: return None
    if m.group(2):
        h = m.group(1) + '/' + m.group(2).upper()
        if h in harfli_maddeler(lid): return h
    return m.group(1)

def metin_maddeleri(s, lid=None):
    """Kart hükmündeki bütün madde atıfları (sıra korunur): "(m.2/B)", "(m.11, 31)", "(Ek m.3)", "(m.38/A)"."""
    out = []
    def ekle(x):
        if x and x not in out: out.append(x)
    s = str(s)
    for e in EK_RE.finditer(s): ekle(ek_tur(e.group(1)) + ' ' + e.group(2))
    s2 = EK_RE.sub(' ', s)
    harfli = harfli_maddeler(lid)
    for m in re.finditer(r'm\.\s*(\d+)(?:\s*/\s*([' + HARF + r'0-9\-]+))?((?:\s*(?:,|ve|-)\s*\d+)*)', s2):
        h = m.group(1) + '/' + m.group(2).upper() if m.group(2) and re.fullmatch('[' + HARF + ']', m.group(2)) else None
        ekle(h if h and h in harfli else m.group(1))
        for g in re.findall(r'\d+', m.group(3) or ''): ekle(g)
    return out
