# Gözden geçirilmiş adayları tam_metinler.json'a yazar (kanun_id+no tekil; var olan kayıt güncellenir, sıra korunur).
# Her kayıtta iki denetim: (1) baş aynı mı (kesik_uygula.py'nin denetiminin birebir aynısı + normalize başlangıç araması),
# (2) yeni metin kesikten UZUN mu. Geçmeyen YAZILMAZ, ekrana nedeni basılır.
# Kullanım:
#   python yaz.py <kanun_id> [no ...]          aday/<id>.json'daki (TAMAM/TAMAM_FARKLI) adaylardan
#   python yaz.py --dosya <json>               [{kanun_id,no,metin,kaynak[,not][,denetimsiz]}] listesinden
import sys, io, json, os, re

BURA = os.path.dirname(os.path.abspath(__file__))
KOK = os.path.abspath(os.path.join(BURA, '..', '..', '..'))
CIKTI = os.path.join(BURA, 'tam_metinler.json')


def kesik_metin(kid, no):
    yol = os.path.join(KOK, 'gemini_calisma', 'girdi', 'resmi_metin', f'kanun_{kid}.json')
    d = json.load(open(yol, encoding='utf-8'))
    for x in d['maddeler']:
        if str(x['no']) == str(no):
            return x['metin']
    return None


def tr_lower(s):
    return s.replace('I', 'ı').replace('İ', 'i').lower()


def norm(s):
    # "(1)" gibi dipnot işaretleri kesik metinde kalmış olabilir; karşılaştırmada iki tarafta da yok sayılır
    s = re.sub(r'\(\d{1,2}\)', '', s)
    return re.sub(r'[^0-9a-zçğıöşüâîû]+', '', tr_lower(s))


def denetle(eski, metin):
    """(geçti_mi, açıklama)"""
    if eski is None:
        return False, 'girdide bu madde yok'
    # kesik_uygula.py ile birebir aynı denetim
    bas_eski = re.sub(r'\W+', '', eski[:120]).lower()[:60]
    bas_yeni = re.sub(r'\W+', '', metin[:400]).lower()
    if bas_eski[:40] not in bas_yeni:
        return False, f'baş uyuşmuyor (kesik başı: {eski[:80]!r})'
    # ek: normalize edilmiş ilk 60 harf yeni metnin ilk 500 harfinde olmalı
    a, b = norm(eski), norm(metin)
    if a[:60] not in b[:500]:
        return False, 'normalize baş uyuşmuyor'
    if len(metin) <= len(eski):
        return False, f'yeni metin kesikten uzun değil ({len(metin)} <= {len(eski)})'
    return True, f'tamam ({len(eski)} -> {len(metin)})'


def yukle():
    if os.path.exists(CIKTI):
        return json.load(open(CIKTI, encoding='utf-8'))
    return []


def kaydet(liste):
    gecici = CIKTI + '.tmp'
    json.dump(liste, open(gecici, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    os.replace(gecici, CIKTI)


def yaz(kayitlar):
    liste = yukle()
    sira = {(int(x['kanun_id']), str(x['no'])): i for i, x in enumerate(liste)}
    yazilan, atlanan = 0, []
    for k in kayitlar:
        kid, no = int(k['kanun_id']), str(k['no'])
        metin = k['metin'].strip()
        if not k.get('denetimsiz'):
            ok, acik = denetle(kesik_metin(kid, no), metin)
            if not ok:
                atlanan.append((kid, no, acik))
                print(f'  YAZILMADI {kid} m.{no}: {acik}')
                continue
            print(f'  yazıldı   {kid} m.{no}: {acik}')
        else:
            print(f'  yazıldı   {kid} m.{no}: denetimsiz ({k.get("not", "")})')
        kayit = {'kanun_id': kid, 'no': no, 'metin': metin, 'kaynak': k['kaynak']}
        if k.get('not'):
            kayit['not'] = k['not']
        if (kid, no) in sira:
            liste[sira[(kid, no)]] = kayit
        else:
            sira[(kid, no)] = len(liste)
            liste.append(kayit)
        yazilan += 1
    kaydet(liste)
    print(f'  -> {CIKTI}: toplam {len(liste)} kayıt (bu turda {yazilan} yazıldı, {len(atlanan)} atlandı)')
    return atlanan


if __name__ == '__main__':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    arg = sys.argv[1:]
    if arg and arg[0] == '--dosya':
        kayitlar = json.load(open(arg[1], encoding='utf-8'))
    else:
        kid, nolar = arg[0], arg[1:]
        aday = json.load(open(os.path.join(BURA, 'aday', f'{kid}.json'), encoding='utf-8'))
        kayitlar = [x for x in aday if x['durum'] in ('TAMAM', 'TAMAM_FARKLI') and (not nolar or x['no'] in nolar)]
        for x in aday:
            if x['durum'] not in ('TAMAM', 'TAMAM_FARKLI') and (not nolar or x['no'] in nolar):
                print(f'  ADAY DIŞI {kid} m.{x["no"]}: durum={x["durum"]}')
    yaz(kayitlar)
