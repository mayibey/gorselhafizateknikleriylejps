# Sınav provası kapsam denetimi: her sorunun kanıt cümlesinin geldiği madde, o bölümün (müşterek / branş) Ek-1 emrinde
# sayılan maddeler arasında mı? Kaynak: scripts/_emir-madde-kapsam.json (yalnız madde listesi açık yazılmış kalemler).
# Ayrıca uzman müşterekinde 4678 (law 13) ve Sözleşmeli Yönetmelik (law 16) olmamalı.
# Çalıştır: python -X utf8 scripts/premium-deneme/tahmin/kapsam-denetle.py
import glob, json, os, re, sys
sys.stdout.reconfigure(encoding='utf-8')
K = 'scripts/premium-deneme/kaynak/'
P = 'scripts/altin-ozet/paketler/'
KAP = json.load(open('scripts/_emir-madde-kapsam.json', encoding='utf-8'))['kapsam']


def norm(t):
    t = t.replace('İ', 'i').replace('I', 'ı').lower().replace('â', 'a').replace('î', 'i').replace('û', 'u')
    return re.sub(r'[^0-9a-zçğıöşü%]+', '', t)


def bolum(dosya):
    ad = os.path.basename(dosya)[len('tahmin-'):-5]
    if ad in ('mus-a', 'mus-b', 'mus-c', 'asb-mus', 'uzm-mus', 'mebs-ek', 'asb-mebs-ek', 'brans-havacilik-ek'):
        return 'müşterek', ''
    if ad in ('jan-a', 'jan-b', 'uzm-jan', 'asb-jan'):
        return 'jandarma', 'jandarma'
    if ad in ('mebs-brans', 'asb-mebs-brans'):
        return 'mebs', 'mebs'
    if ad.startswith('brans-'):
        b = ad[len('brans-'):]
        return b, b
    return None, None


# Emirde AÇIKÇA sayılan ek maddeler (json yalnız sayı tutuyor): (bölüm, law) → paket 'no' değerleri
EK_IZIN = {('müşterek', 7): {'Ek'}, ('jandarma', 40): {'13/A'}, ('maliye', 140): {'13/A'}}  # emirde açıkça: 3713 Ek Madde 2; 2559 m.13/A; 2803 mali hükümler 13/A
paket = {}
sorun = 0
toplam = 0
for f in sorted(glob.glob(K + 'tahmin-*.json')):
    kb, klas = bolum(f)
    if kb is None:
        continue
    for i, q in enumerate(json.load(open(f, encoding='utf-8')), 1):
        toplam += 1
        L = q['law']
        if os.path.basename(f) == 'tahmin-uzm-mus.json' and L in (13, 16):
            print(f'X {os.path.basename(f)} #{i}: uzman müşterekinde law {L} (yalnız Sb/Asb)')
            sorun += 1
        izin = KAP.get(kb, {}).get(str(L))
        if izin is None:
            continue  # emirde "Tamamı"/bölüm: madde sınırı yok
        yol = P + (klas + '/' if klas else '') + f'pack_{L}.json'
        if yol not in paket:
            paket[yol] = json.load(open(yol, encoding='utf-8'))['maddeler']
        for kn in q['kanit']:
            nk = norm(kn)
            m = next((m for m in paket[yol] if nk in norm(m['metin'])), None)
            if m is None:
                print(f'? {os.path.basename(f)} #{i}: kanıt maddede bulunamadı')
                sorun += 1
                continue
            no = str(m['no'])
            sayi = re.match(r'(\d+)', no)
            if no in EK_IZIN.get((kb, L), set()):
                continue
            if not sayi or no.startswith(('Ek', 'Geçici')) or sayi.group(1) != no:  # 13/A, 12/C gibi ara maddeler 13'e sayılmaz
                print(f'? {os.path.basename(f)} #{i} law {L} m.{no}: emir yalnız {izin} maddelerini sayıyor (ek/geçici madde, elle bak)')
                sorun += 1
            elif int(sayi.group(1)) not in izin:
                print(f'X {os.path.basename(f)} #{i} law {L} m.{no} KAPSAM DIŞI (emir: {izin}) | {q["k"][:90]}')
                sorun += 1
print(f'denetlenen soru {toplam} · sorunlu {sorun}')
