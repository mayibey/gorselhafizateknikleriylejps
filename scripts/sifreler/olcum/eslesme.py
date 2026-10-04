# Şifre ölçümlerinin ortak eşleştirme kuralları (kok_sik_olc.py ve satir_denetle.py kullanır).
# Başkan kuralı (4 Eki 2026): SOL kelime soru KÖKÜNDE, SAĞ cevap DOĞRU ŞIKTA aranır.
import re

def norm(s):
    s = (s or '').replace('İ', 'i').replace('I', 'ı').lower()
    s = re.sub(r'[âàá]', 'a', s); s = re.sub(r'[îì]', 'i', s); s = re.sub(r'[ûù]', 'u', s)
    return re.sub(r'\s+', ' ', re.sub(r'[^a-z0-9çğıöşü ]', ' ', s)).strip()

BIRLER = {'bir': 1, 'iki': 2, 'üç': 3, 'dört': 4, 'beş': 5, 'altı': 6, 'yedi': 7, 'sekiz': 8, 'dokuz': 9}
ONLAR = {'on': 10, 'yirmi': 20, 'otuz': 30, 'kırk': 40, 'elli': 50, 'altmış': 60, 'yetmiş': 70, 'seksen': 80, 'doksan': 90}

def sayi_tok(words):
    """Türkçe sayı sözcüklerini rakama çevirir: 'onsekiz' / 'on sekiz' → '18', 'yirmi' → '20' (yalnız ölçüm için)."""
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
def kes(w): return w[:5] if len(w) > 5 else w          # ek toleransı: ilk 5 harf
def icinde(kel, metin): return bool(norm(kel)) and norm(kel) in norm(metin)
def kesisir(cev, metin):
    mt = set(kes(w) for w in tok(metin))
    return any(kes(w) in mt for w in tok(cev))
