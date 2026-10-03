# KIRMIZI KUTU denetçisi: "Sınavda böyle yazarlar" (yanlış cümle) + "Doğrusu" (düzeltilmiş cümle) çiftleri
#   python scripts/harekat-masasi/kutu_denetle.py scratchpad/denetim/kutu/sonuc/kanun_5.json [...]   |   --hepsi
# HATA: biçim, eksik kart, açıklama kalıbı ("denir", "yanlış"…), yanlış cümlenin resmî metinde AYNEN geçmesi (doğru olabilir),
#       sayı uyuşmazlığı, Doğrusu > 25 kelime ya da madde atfıyla bitmiyor, resmî metinde olmayan sayı.
import json, os, re, sys, glob
sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from blok_denetle import kelime_sayilari, rakamlar, madde_atiflarini_sil, kucuk
KOK = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
GIRDI = os.path.join(KOK, 'scratchpad', 'denetim', 'kutu', 'girdi')
SONUC = os.path.join(KOK, 'scratchpad', 'denetim', 'kutu', 'sonuc')
META = re.compile(r'\b(denir|deniyor|yazılır|yanlıştır|yanlış|doğrusu|doğru olan|oysa|aslında|gerçekte|karıştırılır|sanılır|tuzak|çarpıtılır|kaydırılır)\b', re.I)
YASAK = ['kaçırdığın']

def norm(t): return re.sub(r'\s+', ' ', re.sub(r'[“”"\'’‘.,;:()]', ' ', kucuk(t))).strip()
def kelime(t): return len(str(t).split())

def denetle(yol):
    hata, uyari = [], []
    try: D = json.load(open(yol, encoding='utf-8'))
    except Exception as e: return [f'JSON okunamadı: {e}'], [], 0
    lid = int(re.search(r'kanun_(\d+)\.json$', yol.replace('\\', '/')).group(1))
    G = json.load(open(os.path.join(GIRDI, f'kanun_{lid}.json'), encoding='utf-8'))
    kart = {k['id']: k for k in G['kartlar']}
    if not isinstance(D, list): return ['Çıktı liste olmalı'], [], 0
    gor = set()
    for x in D:
        kid = x.get('kart_id'); yer = f'{kid}'
        if x.get('kanun_id') != lid: hata.append(f'{yer}: kanun_id {x.get("kanun_id")} ≠ {lid}')
        if kid not in kart: hata.append(f'{yer}: bu kart girdide yok'); continue
        if kid in gor: hata.append(f'{yer}: iki kez yazılmış')
        gor.add(kid)
        if 'atla' in x:
            if not str(x['atla']).strip(): hata.append(f'{yer}: atla gerekçesi boş')
            continue
        dz = x.get('duzeltme') or {}
        yz, dg = dz.get('sinavda_boyle_yazarlar'), dz.get('dogrusu')
        if not isinstance(yz, list) or not (1 <= len(yz) <= 3) or not all(isinstance(s, str) and s.strip() for s in yz):
            hata.append(f'{yer}: sinavda_boyle_yazarlar 1-3 dolu cümle olmalı'); continue
        if not isinstance(dg, list) or len(dg) != len(yz) or not all(isinstance(s, str) and s.strip() for s in dg):
            hata.append(f'{yer}: dogrusu, sinavda_boyle_yazarlar ile aynı sayıda olmalı ({len(yz)})'); continue
        k = kart[kid]
        resmi = ' '.join(k['resmi_metin'].values()) + ' ' + k['hukum']
        rn = norm(resmi)
        izin = rakamlar(resmi) | kelime_sayilari(resmi) | rakamlar(G['ad'])
        onay = set(int(s) for s in re.findall(r'SAYI_ONAY:\s*(\d+)', str(x.get('aciklama', ''))))
        for y, d in zip(yz, dg):
            if META.search(y): hata.append(f'{yer}: yanlış cümlede açıklama kalıbı var ("{META.search(y).group(0)}"): {y[:80]}')
            if not (3 <= kelime(y) <= 40): hata.append(f'{yer}: yanlış cümle {kelime(y)} kelime (3-40)')
            yn = norm(y)
            if len(yn) > 25 and yn in rn: hata.append(f'{yer}: "yanlış" cümle resmî metinde AYNEN geçiyor, doğru olabilir: {y[:80]}')
            if norm(y) == norm(d): hata.append(f'{yer}: yanlış ve doğru cümle aynı')
            govde = re.sub(r'\s*\([^()]*m\.[^()]*\)\s*\.?\s*$', '', d)
            if kelime(govde) > 25: hata.append(f'{yer}: Doğrusu {kelime(govde)} kelime (en çok 25): {d[:80]}')
            if not re.search(r'\([^()]*m\.\s*[^()]*\)\s*\.?\s*$', d): hata.append(f'{yer}: Doğrusu madde atfıyla bitmeli "(m.X)": {d[-60:]}')
            for s in sorted(rakamlar(madde_atiflarini_sil(d))):
                if s not in izin and s not in onay: hata.append(f'{yer}: Doğrusu\'ndaki {s} resmî metinde yok (düzelt ya da aciklama: "SAYI_ONAY: {s} — gerekçe")')
            for w in YASAK:
                if w in kucuk(y + ' ' + d): hata.append(f'{yer}: yasak ifade "{w}"')
        if 'hukum' in dz: uyari.append(f'{yer}: hüküm de değiştirilmiş (KART_CELISKI) — elle bak')
    eksik = [i for i in kart if i not in gor]
    if eksik: hata.append(f'eksik kart ({len(eksik)}): {", ".join(eksik[:25])}')
    return hata, uyari, len(D)

if __name__ == '__main__':
    yollar = sorted(glob.glob(os.path.join(SONUC, 'kanun_*.json'))) if '--hepsi' in sys.argv else [a for a in sys.argv[1:] if not a.startswith('--')]
    th = 0
    for y in yollar:
        h, u, n = denetle(y); th += len(h)
        print(f'== {os.path.basename(y)}: {n} kayıt · HATA {len(h)} · uyarı {len(u)}')
        for x in h[:60]: print('  HATA ', x)
        for x in u[:15]: print('  uyarı', x)
    print(f'TOPLAM HATA {th}')
    sys.exit(1 if th else 0)
