# 2. AŞAMA madde blokları denetçisi (ajanlar her kanunu bitirince çalıştırır; yayın öncesi de toplu çalışır)
#   python scripts/harekat-masasi/blok_denetle.py scratchpad/denetim/blok/sonuc/kanun_5.json [kanun_7.json ...]
#   python scripts/harekat-masasi/blok_denetle.py --hepsi
# Girdi: scratchpad/denetim/blok/girdi/kanun_<id>.json (resmî metin + kartlar). Çıkış kodu: hata varsa 1.
# HATA  : biçim, eksik madde, yasak kelime, resmî metinde OLMAYAN sayı (kontrol alanında "SAYI_ONAY: <sayı>" ile gerekçelendirilmemişse)
# UYARI : bilinmeyen madde atfı, uzunluk sınırına yakınlık
import json, os, re, sys, glob
sys.stdout.reconfigure(encoding='utf-8')
KOK = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
GIRDI = os.path.join(KOK, 'scratchpad', 'denetim', 'blok', 'girdi')
SONUC = os.path.join(KOK, 'scratchpad', 'denetim', 'blok', 'sonuc')
YASAK = ['kaçırdığın', 'kaçırdın', 'kaçırdığınız']
SINIR = {'baslik': 8, 'oz': 75, 'sorulur': 45, 'akilda': 35, 'neden': 22}   # kelime

BIRLER = {'bir': 1, 'iki': 2, 'üç': 3, 'dört': 4, 'beş': 5, 'altı': 6, 'yedi': 7, 'sekiz': 8, 'dokuz': 9}
ONLAR = {'on': 10, 'yirmi': 20, 'otuz': 30, 'kırk': 40, 'elli': 50, 'altmış': 60, 'yetmiş': 70, 'seksen': 80, 'doksan': 90}
BUYUK = {'yüz': 100, 'bin': 1000, 'milyon': 1000000}
MORF = sorted(list(BIRLER) + list(ONLAR) + list(BUYUK), key=len, reverse=True)

def kucuk(t): return str(t).replace('İ', 'i').replace('I', 'ı').lower()

def kelime_sayilari(metin):
    """Yazıyla yazılmış sayıları (on beş, onbeş, yüz yirmi, üçte bir…) rakam kümesine çevirir; izin kümesi için geniş tutulur."""
    out = set(); toplam = cur = 0; dizide = False
    def bitir():
        nonlocal toplam, cur, dizide
        if dizide: out.add(toplam + cur)
        toplam = cur = 0; dizide = False
    for w in re.findall(r'[a-zçğıöşü]+', kucuk(metin)):
        i = 0; parca = []
        while i < len(w):
            for m in MORF:
                if w.startswith(m, i): parca.append(m); i += len(m); break
            else: break
        if not parca: bitir(); continue
        for m in parca:
            out.add(BIRLER.get(m) or ONLAR.get(m) or BUYUK.get(m)); dizide = True
            if m in BIRLER: cur += BIRLER[m]
            elif m in ONLAR: cur += ONLAR[m]
            elif m == 'yüz': cur = (cur or 1) * 100
            else: toplam += (cur or 1) * BUYUK[m]; cur = 0
        if i < len(w): bitir()      # ekli kelime (onbeşinci, yüzde) dizinin sonu
    bitir()
    return out

def rakamlar(metin):
    return set(int(x) for x in re.findall(r'(?<![\d.,])\d{1,9}(?![\d])', str(metin).replace('.', ' ').replace(',', ' ')))

def madde_atiflarini_sil(t):
    return re.sub(r'm\.\s*(?:Ek|Geçici)?\s*\d+(?:\s*/\s*[0-9A-Za-zÇĞİÖŞÜçğıöşü]+(?:\s*-\s*[0-9A-Za-zÇĞİÖŞÜçğıöşü]+)?)*', ' ', str(t), flags=re.I)

def madde_atiflari(t):
    return [re.sub(r'\s+', ' ', x) for x in re.findall(r'm\.\s*((?:Ek|Geçici)\s*\d+|\d+)', str(t), flags=re.I)]

def kelime(t): return len(str(t).split())

def denetle(yol):
    hata, uyari = [], []
    try: B = json.load(open(yol, encoding='utf-8'))
    except Exception as e: return [f'JSON okunamadı: {e}'], [], 0
    lid = int(re.search(r'kanun_(\d+)\.json$', yol.replace('\\', '/')).group(1))
    G = json.load(open(os.path.join(GIRDI, f'kanun_{lid}.json'), encoding='utf-8'))
    metin = {m['no']: m['resmi_metin'] for m in G['maddeler']}
    kart_metin = {m['no']: ' '.join(k['hukum'] + ' ' + ' '.join(k.get('dogrusu') or []) for k in m['kartlar']) for m in G['maddeler']}
    tum = set(G['tum_madde_nolari']); kap = [m['no'] for m in G['maddeler']]
    kanun_sayi = rakamlar(G['ad'])
    if not isinstance(B, list): return ['Çıktı bir liste olmalı'], [], 0
    gor = {}
    for i, b in enumerate(B):
        yer = f"#{i} m.{b.get('madde')}"
        if b.get('kanun_id') != lid: hata.append(f'{yer}: kanun_id {b.get("kanun_id")} ≠ {lid}')
        m = str(b.get('madde', ''))
        if m in gor: hata.append(f'{yer}: madde iki kez yazılmış')
        gor[m] = b
        if m not in kap: hata.append(f'{yer}: madde kapsam listesinde yok (kapsam: girdi.maddeler)')
        if 'atla' in b:
            if not str(b['atla']).strip(): hata.append(f'{yer}: atla gerekçesi boş')
            continue
        for alan in ('baslik', 'oz', 'kontrol'):
            if not isinstance(b.get(alan), str) or not b[alan].strip(): hata.append(f'{yer}: "{alan}" eksik/boş')
        for alan, en_az, en_cok in (('sorulur', 1, 3), ('akilda', 1, 3)):
            v = b.get(alan)
            if not isinstance(v, list) or not (en_az <= len(v) <= en_cok) or not all(isinstance(x, str) and x.strip() for x in v):
                hata.append(f'{yer}: "{alan}" {en_az}-{en_cok} dolu metin listesi olmalı')
        kr = b.get('karis', [])
        if not isinstance(kr, list) or len(kr) > 3: hata.append(f'{yer}: "karis" en çok 3 öğeli liste olmalı'); kr = []
        for x in kr:
            if not isinstance(x, dict) or not x.get('madde') or not x.get('neden'): hata.append(f'{yer}: karis öğesi {{madde, neden}} olmalı'); continue
            if str(x['madde']) == m: hata.append(f'{yer}: karis kendi maddesini gösteriyor')
            elif str(x['madde']) not in tum: hata.append(f'{yer}: karis m.{x["madde"]} bu mevzuatta yok')
            if kelime(x['neden']) > SINIR['neden']: uyari.append(f'{yer}: karis nedeni uzun ({kelime(x["neden"])} kelime)')
        if isinstance(b.get('baslik'), str) and kelime(b['baslik']) > SINIR['baslik']: hata.append(f'{yer}: başlık {kelime(b["baslik"])} kelime (en çok {SINIR["baslik"]})')
        if isinstance(b.get('oz'), str) and kelime(b['oz']) > SINIR['oz']: hata.append(f'{yer}: öz {kelime(b["oz"])} kelime (en çok {SINIR["oz"]})')
        for alan in ('sorulur', 'akilda'):
            for x in b.get(alan) or []:
                if isinstance(x, str) and kelime(x) > SINIR[alan]: hata.append(f'{yer}: {alan} satırı {kelime(x)} kelime (en çok {SINIR[alan]})')
        yazi = ' '.join([str(b.get('baslik', '')), str(b.get('oz', ''))] + [str(x) for x in (b.get('sorulur') or []) + (b.get('akilda') or [])] + [str(x.get('neden', '')) for x in kr if isinstance(x, dict)])
        for y in YASAK:
            if y in kucuk(yazi): hata.append(f'{yer}: yasak ifade "{y}"')
        # sayı denetimi: blokta geçen her rakam bu maddenin / karıştırılan maddelerin resmî metninde ya da kartlarında olmalı
        izin_metin = metin.get(m, '') + ' ' + kart_metin.get(m, '') + ' ' + ' '.join(metin.get(str(x.get('madde')), '') or G['diger_maddeler_kisa'].get(str(x.get('madde')), '') for x in kr if isinstance(x, dict))
        izin = rakamlar(izin_metin) | kelime_sayilari(izin_metin) | kanun_sayi
        onay = set(int(x) for x in re.findall(r'SAYI_ONAY:\s*(\d+)', str(b.get('kontrol', ''))))
        for s in sorted(rakamlar(madde_atiflarini_sil(yazi))):
            if s not in izin and s not in onay:
                hata.append(f'{yer}: {s} sayısı bu maddenin resmî metninde/kartlarında yok (düzelt ya da kontrol alanına "SAYI_ONAY: {s} — gerekçe" yaz)')
        for a in madde_atiflari(yazi):
            if a not in tum: uyari.append(f'{yer}: "m.{a}" bu mevzuatta yok (başka mevzuat ise adını yaz)')
    eksik = [m for m in kap if m not in gor]
    if eksik: hata.append(f'eksik madde bloğu ({len(eksik)}): {", ".join(eksik[:30])}')
    return hata, uyari, len(B)

if __name__ == '__main__':
    yollar = sorted(glob.glob(os.path.join(SONUC, 'kanun_*.json'))) if '--hepsi' in sys.argv else [a for a in sys.argv[1:] if not a.startswith('--')]
    toplam_h = 0
    for y in yollar:
        h, u, n = denetle(y)
        toplam_h += len(h)
        print(f'== {os.path.basename(y)}: {n} blok · HATA {len(h)} · uyarı {len(u)}')
        for x in h[:60]: print('  HATA ', x)
        for x in u[:20]: print('  uyarı', x)
    print(f'TOPLAM HATA {toplam_h}')
    sys.exit(1 if toplam_h else 0)
