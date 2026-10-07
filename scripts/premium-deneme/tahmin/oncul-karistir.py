# Öncüllü soru kalıbını kırar (8 Eki 2026, başkan: "kalıbı düzelt").
# Sorun: öncüllü soruların doğru cevabı 1. provada 79/100, 2. provada 21/25 "I ve II" idi → ezberle işaretlenebiliyordu.
# Çözüm: her öncüllü soruda öncüllerin SIRASI karıştırılır, şık etiketleri yeniden yazılır; DOĞRU ŞIK AYNI HARFTE KALIR
# (q['dogru'] değişmez) → bitirmiş adayların sonucu bozulmaz. İfadelerin içeriği değişmez.
# İdempotent: işlenen soruya 'oncul_karisik': True yazılır, ikinci çalıştırmada atlanır.
# Çalıştır: python -X utf8 scripts/premium-deneme/tahmin/oncul-karistir.py  (sonra prova-uret.py)
# NOT: birlestir.py ile deneme YENİDEN kurulursa bu adım tekrar çalıştırılmalı (kaynak/ dosyaları eski sırada).
import collections, glob, hashlib, json, re, sys

sys.stdout.reconfigure(encoding='utf-8')
R = ['I', 'II', 'III']
HAVUZ = ['Yalnız I', 'Yalnız II', 'Yalnız III', 'I ve II', 'I ve III', 'II ve III', 'I, II ve III']


def etiket_kume(e):
    e = e.strip()
    if e in ('I, II ve III', 'I, II ve III.'):
        return {1, 2, 3}
    m = re.fullmatch(r'Yalnız (I{1,3})', e)
    if m:
        return {R.index(m.group(1)) + 1}
    m = re.fullmatch(r'(I{1,3}) ve (I{1,3})', e)
    if m:
        return {R.index(m.group(1)) + 1, R.index(m.group(2)) + 1}
    return None


def kume_etiket(k):
    k = sorted(k)
    if k == [1, 2, 3]:
        return 'I, II ve III'
    if len(k) == 1:
        return f'Yalnız {R[k[0] - 1]}'
    return f'{R[k[0] - 1]} ve {R[k[1] - 1]}'


hedef_iki = ['I ve III', 'II ve III', 'I ve II']   # 2 doğru öncüllüde sırayla bu hedefler
hedef_bir = ['Yalnız II', 'Yalnız III', 'Yalnız I']
sayac = collections.Counter()
ozet = collections.Counter()
atla = collections.Counter()
for f in sorted(glob.glob('scripts/premium-deneme/tahmin/TAHMIN*.json')):
    d = json.load(open(f, encoding='utf-8'))
    degisti = False
    for q in d['sorular']:
        if q.get('tip') != 'oncullu' or q.get('oncul_karisik'):
            continue
        satir = q['soru'].split('\n')
        idx = [i for i, s in enumerate(satir) if re.match(r'^(I|II|III)\.\s', s.strip())]
        if len(idx) != 3 or [re.match(r'^(I{1,3})\.', satir[i].strip()).group(1) for i in idx] != R:
            atla['öncül biçimi'] += 1
            continue
        dogru_k = etiket_kume(q['siklar'][q['dogru']])
        if dogru_k is None or any(etiket_kume(s) is None for s in q['siklar']):
            atla['şık biçimi'] += 1
            continue
        govde = [re.sub(r'^(I|II|III)\.\s*', '', satir[i].strip()) for i in idx]
        if len(dogru_k) == 3:
            yeni_k, perm = dogru_k, [0, 1, 2]
        else:
            hedefler = hedef_iki if len(dogru_k) == 2 else hedef_bir
            hedef = etiket_kume(hedefler[sayac[len(dogru_k)] % 3])
            sayac[len(dogru_k)] += 1
            dogrular = [i for i in range(3) if i + 1 in dogru_k]
            yanlislar = [i for i in range(3) if i + 1 not in dogru_k]
            perm = [None] * 3  # perm[yeni_konum] = eski_index
            for konum in sorted(hedef):
                perm[konum - 1] = dogrular.pop(0)
            for konum in range(3):
                if perm[konum] is None:
                    perm[konum] = yanlislar.pop(0)
            yeni_k = hedef
        for n, i in enumerate(idx):
            satir[i] = f'{R[n]}. {govde[perm[n]]}'
        q['soru'] = '\n'.join(satir)
        dogru_etiket = kume_etiket(yeni_k)
        h = int(hashlib.md5(q['soru'].encode()).hexdigest(), 16)
        digerleri = [e for e in HAVUZ if e != dogru_etiket]
        digerleri = sorted(digerleri, key=lambda e: hashlib.md5((e + str(h)).encode()).hexdigest())[:4]
        yeni_siklar, j = [], 0
        for k in range(5):
            if k == q['dogru']:
                yeni_siklar.append(dogru_etiket)
            else:
                yeni_siklar.append(digerleri[j]); j += 1
        assert len(set(yeni_siklar)) == 5 and yeni_siklar[q['dogru']] == dogru_etiket
        q['siklar'] = yeni_siklar
        q['oncul_karisik'] = True
        ozet[dogru_etiket] += 1
        degisti = True
    if degisti:
        json.dump(d, open(f, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('yeni doğru cevap dağılımı:', dict(ozet))
print('atlanan:', dict(atla))
