# Altın Özet konu notlarını KART verisine ayrıştırır (Nokta Atışı için).
#   giriş : scratchpad/calisma/veri.json  (kanun[].md = o mevzuatın konu notu markdown'ı)
#   çıkış : aynı dosyaya kanun[].n (noktalar), .sayi, .makam, .tz eklenir → veri2.json
# Nokta: {i, s(★), b(başlık), h(hüküm), nd(ne demek), o(örnek), t(tuzak), m:[madde no]}
import json, re, sys
kaynak = sys.argv[1]; hedef = sys.argv[2]
V = json.load(open(kaynak, encoding='utf-8'))

def temiz(s):
    s = re.sub(r'\*\*(.+?)\*\*', r'\1', s)       # kalın
    s = re.sub(r'(?<!\*)\*(?!\*)(.+?)\*', r'\1', s)  # italik
    return s.strip(' .·—-').strip()

def maddeler(s):
    out = []
    for m in re.finditer(r'm\.\s*(\d+)(?:/[^\s,;)]+)?(?:\s*(?:,|ve|-)\s*(\d+))*', s):
        for g in m.groups():
            if g and g not in out: out.append(g)
    return out

def bolum(md, baslik_re):
    """'### baslik' ile bir sonraki '###' arasını döndürür."""
    m = re.search(r'(?m)^### ' + baslik_re + r'[^\n]*\n(.*?)(?=^### |\Z)', md, re.S)
    return m.group(1) if m else ''

def noktalar(md, kid):
    out = []
    icerik = bolum(md, r'Altın noktalar')
    for satir in icerik.split('\n'):
        satir = satir.strip()
        if not satir.startswith('- '): continue
        govde = satir[2:]
        star = bool(re.match(r'★', govde))
        govde = re.sub(r'^★\s*(çıkmış|20\d\d(?:/\d+)?)?\s*', '', govde)
        mb = re.match(r'\*\*(.+?)\*\*\s*[—–-]\s*(.*)', govde, re.S)
        if not mb: continue
        baslik, kalan = mb.group(1).strip(), mb.group(2)
        parcalar = re.split(r'\s·\s', kalan)
        hukum = parcalar[0]
        nd = o = t = ''
        for p in parcalar[1:]:
            if '**Ne demek:**' in p: nd = p.split('**Ne demek:**', 1)[1]
            elif '*Örnek:*' in p: o = p.split('*Örnek:*', 1)[1]
            elif '*Tuzak:*' in p: t = p.split('*Tuzak:*', 1)[1]
        kalin = [temiz(x) for x in re.findall(r'\*\*(.+?)\*\*', hukum) if temiz(x)]
        mref = re.search(r'\((m\.[^)]+)\)\s*$', hukum.strip())
        kisa = (' · '.join(kalin) + (f' ({mref.group(1)})' if mref else '')) if kalin else ''
        out.append({'i': f'{kid}-{len(out)}', 's': star, 'b': temiz(baslik), 'h': temiz(hukum), 'k': kisa,
                    'nd': temiz(nd), 'o': temiz(o), 't': temiz(t), 'm': maddeler(hukum)})
    return out

def tablo(md, baslik_re):
    """Tablo satırları → [konu, değer, madde]. Başlık satırından sütunları tanır (Madde | Ne/Konu | Değer, Konu | Değer | Madde …).
    3 Eki: eskiden ilk iki sütun alınıyordu → "Madde | Ne | Değer" tablolarında DEĞER hiç görünmüyordu ("1 · İdari kademe sırası")."""
    icerik = bolum(md, baslik_re)
    rows, bas = [], None
    for satir in icerik.split(chr(10)):
        if not satir.startswith('|') or set(satir.replace('|', '').strip()) <= set('-: '): continue
        h = [temiz(x) for x in satir.strip('|').split('|')]
        if bas is None:
            bas = [x.lower() for x in h]
            if any(x.startswith(('madde', 'konu', 'ne', 'iş', 'yer', 'değer', 'yetkili', 'kavram', 'terim', 'belge', 'süre', 'sayı')) for x in bas): continue
            bas = []   # başlıksız tablo
        mi = next((i for i, x in enumerate(bas) if x.startswith('madde')), None) if bas else None
        diger = [i for i in range(len(h)) if i != mi]
        if len(diger) < 2: continue
        konu, deger = h[diger[0]], h[diger[-1]]
        madde = h[mi] if mi is not None and mi < len(h) else ''
        if konu and deger: rows.append([konu, deger, madde])
    return rows

def tuzaklar(md):
    """İki biçim: müşterek = tablo '| Doğru hüküm | Sınavın çarpıtacağı hâl |'; MEBS = '1. "yanlış" → YANLIŞ; doğrusu.'"""
    icerik = bolum(md, r'"Yanlıştır')
    out = []
    for satir in icerik.split('\n'):
        satir = satir.strip()
        if satir.startswith('|'):
            if set(satir.replace('|', '').strip()) <= set('-: '): continue
            h = [temiz(x) for x in satir.strip('|').split('|')]
            if len(h) >= 2 and not h[0].lower().startswith('doğru hüküm'):
                out.append({'y': h[1], 'd': h[0], 'm': maddeler(h[0])})
            continue
        m = re.match(r'(?:-|\d+\.)\s*[“"](.+?)[”"]\s*→\s*(?:YANLIŞ;?\s*)?(.+)', satir)
        if not m: continue
        dogru = re.sub(r'\s*★.*$', '', m.group(2))
        out.append({'y': temiz(m.group(1)), 'd': temiz(dogru), 'm': maddeler(dogru)})
    return out

top = {'n': 0, 's': 0, 'sayi': 0, 'makam': 0, 'tz': 0}
for k in V['kanun']:
    md = k['md']
    k['n'] = noktalar(md, k['id']); k['sayi'] = tablo(md, r'Sayılar'); k['makam'] = tablo(md, r'Yetkili makam'); k['tz'] = tuzaklar(md)
    top['n'] += len(k['n']); top['s'] += sum(x['s'] for x in k['n']); top['sayi'] += len(k['sayi']); top['makam'] += len(k['makam']); top['tz'] += len(k['tz'])
    print(k['g'], k['id'], k['ad'][:36].ljust(36), 'nokta', str(len(k['n'])).rjust(3), '★', str(sum(x['s'] for x in k['n'])).rjust(3), 'sayı', str(len(k['sayi'])).rjust(2), 'makam', str(len(k['makam'])).rjust(2), 'tz', str(len(k['tz'])).rjust(2), 'maddesiz', sum(1 for x in k['n'] if not x['m']))
print(top)
json.dump(V, open(hedef, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
