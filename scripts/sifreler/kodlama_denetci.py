# -*- coding: utf-8 -*-
"""KODLAMA (kilit kelime / şifre) ZORUNLU DENETÇİSİ — DEĞİŞTİRME.

Kullanım:
  python gemini_calisma/girdi/kodlama_denetci.py            # bütün mevzuat
  python gemini_calisma/girdi/kodlama_denetci.py --kanun 5  # tek mevzuat

Okur : gemini_calisma/kodlama/kanun_<id>.json
Kaynak: gemini_calisma/girdi/resmi_metin/kanun_<id>.json  +  girdi/kapsam.json

Bir mevzuat yalnız "BİTTİ" (HATA 0) dendiğinde biter. UYARI'lar bitirmeye engel değildir
ama RAPOR'da sayılır.
"""
import json, os, re, sys, glob

sys.stdout.reconfigure(encoding='utf-8')
GIRDI = os.path.dirname(os.path.abspath(__file__))
KOK = os.path.dirname(GIRDI)
SECME = '--secme' in sys.argv  # seçme modu: yalnız gerçek şifreler; her maddeyi kapsama ŞARTI YOK
CIKTI = os.path.join(KOK, 'kodlama_secme' if SECME else 'kodlama')
KAP = json.load(open(os.path.join(GIRDI, 'kapsam.json'), encoding='utf-8'))['mevzuatlar']

TIPLER = {'makam', 'sure', 'sayi_oran', 'ceza', 'kosul', 'istisna', 'tanim', 'suc_adi',
          'yasak', 'gorev_yetki', 'sira_usul'}
ATLAMA_NEDENLERI = ('yürürlük', 'yürütme', 'mülga', 'yürürlükten kaldırılan', 'değişiklik maddesi')
YASAK_KALIPLAR = ['yer tutucu', 'önemli hükümler', 'anahtar kelimeler', 'yanlış seçenek', 'ilgili madde uyarınca',
                  'dikkat edilecek', 'madde konusu', 'örnek kod', 'kilit kelime', 'tetikleyici', 'todo', 'lorem',
                  'kaçırdığın', '...']


def norm(t):
    t = str(t).replace('İ', 'i').replace('I', 'ı').lower()
    t = t.replace('â', 'a').replace('î', 'i').replace('û', 'u').replace('’', "'").replace('‘', "'")
    t = t.replace('“', '"').replace('”', '"')
    return re.sub(r'\s+', ' ', t).strip()


def rakamlar(t):
    return set(re.findall(r'(?<![\d])\d+(?![\d])', str(t).replace('.', ' ').replace(',', ' ')))


def icerik_kelimeleri(t):
    return [w for w in re.findall(r'[a-zçğıöşü]+', norm(t)) if len(w) >= 4]


def gecer_mi(ifade, metin):
    """ifade metinde kelime sınırıyla geçiyor mu (Türkçe ek alabilir: sağ sınır serbest)."""
    return re.search(r'(?<![a-zçğıöşü0-9])' + re.escape(ifade), metin) is not None


def denetle(lid):
    H, U = [], []
    yol = os.path.join(CIKTI, f'kanun_{lid}.json')
    r = json.load(open(os.path.join(GIRDI, 'resmi_metin', f'kanun_{lid}.json'), encoding='utf-8'))
    metin = {m['no']: norm(m['metin']) for m in r['maddeler']}
    kap = [m['no'] for m in r['maddeler'] if m.get('kapsamda')]
    if not os.path.exists(yol):
        return 'YOK', ['dosya yok'], [], {'kapsam': len(kap)}
    try:
        d = json.load(open(yol, encoding='utf-8'))
    except Exception as e:
        return 'HATALI', [f'JSON okunamadı: {e}'], [], {'kapsam': len(kap)}

    r_metin = {m['no']: norm(m['metin']) for m in r['maddeler']}
    atl = {}
    for a in d.get('atlanan_maddeler', []):
        no, neden = str(a.get('madde')), norm(a.get('neden', ''))
        if no not in kap:
            H.append(f'atlanan m.{no} kapsamda değil')
        elif not (len(r_metin.get(no, '')) < 600 and re.search(r'yürürlüğe girer|yürürlükten kaldırıl|hükümlerini .{0,40}yürütür|\(mülga|mülga', r_metin.get(no, ''))):
            H.append(f'atlanan m.{no}: metni yürürlük/yürütme/mülga maddesi değil, atlanamaz')
        else:
            atl[no] = neden
    hedef = [m for m in kap if m not in atl]
    if kap and len(atl) > max(2, len(kap) // 5):
        U.append(f'atlanan madde çok: {len(atl)}/{len(kap)}')

    kodlar = d.get('kodlar', [])
    goruldu_id, kapsanan, cevaplar, tetikler = set(), set(), [], []
    for k in kodlar:
        i = k.get('i', '?')
        if i in goruldu_id: H.append(f'{i}: tekrar eden kimlik')
        goruldu_id.add(i)
        no = str(k.get('madde', ''))
        tet, cev, kan = k.get('tetikleyici', ''), k.get('cevap', ''), k.get('kanit', '')
        sif, tip = k.get('sifre', ''), k.get('tip', '')
        if no not in kap:
            H.append(f'{i}: m.{no} kapsam dışı/yok'); continue
        if tip not in TIPLER: H.append(f'{i}: tip "{tip}" geçersiz ({", ".join(sorted(TIPLER))})')
        for alan, deger in (('tetikleyici', tet), ('cevap', cev), ('kanit', kan), ('sifre', sif)):
            nd = norm(deger)
            for y in YASAK_KALIPLAR:
                if y in nd: H.append(f'{i}: {alan} yasak/yer tutucu kalıp içeriyor ("{y}")')
        nt, nc, nk = norm(tet), norm(cev), norm(kan)
        if len(nk) < 20: H.append(f'{i}: kanit çok kısa (en az 20 harf, resmî metinden aynen alıntı)')
        elif nk not in metin[no]: H.append(f'{i}: kanit m.{no} resmî metninde AYNEN geçmiyor')
        if len(nt) < 4: H.append(f'{i}: tetikleyici çok kısa')
        elif nt not in nk: H.append(f'{i}: tetikleyici kanit içinde aynen geçmiyor')
        if not nc: H.append(f'{i}: cevap boş')
        elif len(nc.split()) > 10: H.append(f'{i}: cevap 10 kelimeyi aşıyor')
        elif tip != 'suc_adi' and not any(w in nk for w in icerik_kelimeleri(cev)):
            H.append(f'{i}: cevabın hiçbir içerik kelimesi kanitta yok (cevap metinden gelmeli)')
        if nc and nt and nc == nt: H.append(f'{i}: cevap tetikleyiciyle aynı')
        if len(norm(sif).split()) > 14: H.append(f'{i}: sifre 14 kelimeyi aşıyor')
        uydurma = (rakamlar(cev) | rakamlar(sif)) - rakamlar(kan) - rakamlar(no)
        if uydurma: H.append(f'{i}: kanitta olmayan sayı: {", ".join(sorted(uydurma))}')
        # TEKİLLİK: tetikleyici aynı mevzuatın başka kapsam maddesinde geçiyorsa karıştırılan olarak bildirilmeli
        if len(nt) >= 4:
            baska = [m for m in kap if m != no and gecer_mi(nt, metin.get(m, ''))]
            bildirilen = {str(x.get('madde')) for x in k.get('karistirilan', [])}
            eksik = [m for m in baska if m not in bildirilen]
            if eksik:
                H.append(f'{i}: tetikleyici "{tet}" m.{", m.".join(eksik[:6])} metninde de geçiyor → ya daha özgül tetikleyici seç ya da bu maddeleri "karistirilan"a farkıyla yaz')
            for x in k.get('karistirilan', []):
                xm = str(x.get('madde'))
                if xm not in metin: H.append(f'{i}: karistirilan m.{xm} mevzuatta yok')
                if len(norm(x.get('fark', '')).split()) < 3: H.append(f'{i}: karistirilan m.{xm} için "fark" yazılmamış')
        kapsanan.add(no); cevaplar.append(nc); tetikler.append(nt)
    eksik = [m for m in hedef if m not in kapsanan]
    if eksik and not SECME: H.append(f'kodu olmayan kapsam maddesi ({len(eksik)}/{len(hedef)}): {", ".join(eksik[:25])}')
    if len(cevaplar) >= 6:
        enc = max(cevaplar.count(c) for c in set(cevaplar))
        if enc > max(3, len(cevaplar) * 0.3): H.append(f'aynı cevap {enc} kez tekrar ediyor (kalıp üretimi şüphesi)')
    if len(tetikler) != len(set(tetikler)): U.append('aynı tetikleyici birden çok kodda')
    # 4 Eki 2026: Antigravity 520 kodu hepsi "tanim", cevap rastgele tek kelime, şifre = tetikleyicinin büyük harflisi diye bastı
    if SECME:
        for k in kodlar:
            if len(norm(k.get('tetikleyici', '')).split()) > 5: H.append(f'{k.get("i")}: kilit kelime 5 kelimeyi aşıyor (kelime olsun, cümle değil)')
    if len(kodlar) >= 8 and not SECME:
        tipler = [k.get('tip') for k in kodlar]
        enc = max(tipler.count(t) for t in set(tipler))
        if enc > len(kodlar) * 0.7: H.append(f'kodların %{enc * 100 // len(kodlar)}\'i tek tipte (kalıp üretimi şüphesi)')
        tek = [k for k in kodlar if k.get('tip') != 'suc_adi' and len(norm(k.get('cevap', '')).split()) == 1]
        if len(tek) > len(kodlar) * 0.5: H.append(f'cevapların {len(tek)}/{len(kodlar)}\'i tek kelime (cevap anlamlı bir hüküm olmalı)')
    for k in kodlar:
        s, t = norm(k.get('sifre', '')), norm(k.get('tetikleyici', ''))
        if s and t and (s.startswith(t) or s.split('=')[0].strip() == t):
            H.append(f'{k.get("i")}: şifre tetikleyicinin tekrarı; kısa, akılda kalan bir çağrışım yaz')
        if re.search(r'madde\s*\d+\s*[-–]|\(\d+\)\s*$|^[a-zçğıöşü]\)\s', t):
            H.append(f'{k.get("i")}: tetikleyici madde başlığı/fıkra numarası parçası içeriyor')
    oz = {'kapsam': len(hedef), 'kod': len(kodlar), 'kapsanan': len([m for m in hedef if m in kapsanan]), 'tet': set(tetikler)}
    return ('BİTTİ' if not H else 'EKSİK'), H, U, oz


def capraz(sonuclar):
    """Müşterek mevzuatlar arasında aynı tetikleyici → UYARI (öğrenci karıştırır)."""
    mus = [l for l in sonuclar if KAP[str(l)].get('grup') == 'müşterek']
    say = {}
    for l in mus:
        for t in sonuclar[l][3].get('tet', set()):
            say.setdefault(t, set()).add(l)
    return {t: sorted(ls) for t, ls in say.items() if len(ls) > 1}


def main():
    tek = None
    if '--kanun' in sys.argv: tek = int(sys.argv[sys.argv.index('--kanun') + 1])
    ids = [tek] if tek else sorted(int(x) for x in KAP)
    sonuc, top = {}, {'kapsam': 0, 'kod': 0, 'kapsanan': 0}
    biten = 0
    for lid in ids:
        durum, H, U, oz = denetle(lid)
        sonuc[lid] = (durum, H, U, oz)
        for k in top: top[k] += oz.get(k, 0)
        biten += durum == 'BİTTİ'
        print(f'== kanun {lid}: {durum} · kod {oz.get("kod", 0)} · kapsam {oz.get("kapsam", 0)} madde (kodlu {oz.get("kapsanan", 0)})')
        for h in H[:40]: print('   HATA ', h)
        if len(H) > 40: print(f'   HATA  ... +{len(H) - 40} hata daha')
        for u in U: print('   UYARI', u)
    if not tek:
        c = capraz(sonuc)
        for t, ls in sorted(c.items())[:50]: print(f'   UYARI müşterek çapraz: "{t}" → kanun {", ".join(map(str, ls))}')
        print(f'\nÖZET: {biten}/{len(ids)} mevzuat BİTTİ · kod {top["kod"]} · kapsam karşılama %{top["kapsanan"] * 100 // max(1, top["kapsam"])} · müşterek çapraz tetikleyici {len(c)}')


if __name__ == '__main__':
    main()
