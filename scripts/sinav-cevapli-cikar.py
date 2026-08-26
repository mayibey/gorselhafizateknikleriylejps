# -*- coding: utf-8 -*-
"""
CEVAPLI ÇIKMIŞ SINAV ÇIKARICI — soru + şıklar + DOĞRU CEVAP tek geçişte. (26 Ağu 2026)

NEDEN BÖYLE: cevaplar PDF'te, sorular ise ayrı bir JSON'da kitapçık koduyla (k1, k9-05…)
duruyordu; ikisini eşleştirmek kırılgan. Soruyu da cevabı da AYNI PDF'ten, AYNI sayfadan
çıkarınca eşleştirme sorunu kökten kalkar.

CEVAP KAYNAKLARI (ikisi de gerçek, hangisi kullanıldığı kayda geçer):
  • anahtar — sınav sonundaki "1. B" listesi (o sınavın tüm sorularını kapsar)
  • kirmizi — kitapçıkta doğru şıkkın KIRMIZI yazılmış olması

SINAV SEGMENTİ: birleşik PDF'te 18 sınav art arda; her sınavda numaralar 1'den başlar.
Numara düşüşü = yeni sınav. Segmentlemezsen bir sınavın sorusuna diğerinin cevabını
bağlarsın (ölçtüm: %29 uyuşma, yani rastgele).

  python scripts/sinav-cevapli-cikar.py           → rapor
  python scripts/sinav-cevapli-cikar.py --yaz     → scripts/veri/sinav-cevapli.json
"""
import glob
import json
import os
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')
import pdfplumber

KLASOR = r"C:\Users\GIGABYTE\OneDrive\Desktop\sınav çıkmış soruları"
CIKTI = "scripts/veri/sinav-cevapli.json"

SORU_BAS = re.compile(r"^\s*(\d{1,3})\s*[\.\)]\s*(\S.*)$")
SIK_BAS = re.compile(r"^\s*([A-E])\s*[\)\.]\s*(.*)$")
ANAHTAR_KALIP = re.compile(r"(?<![\d.])(\d{1,3})\s*[\.\)]\s*([A-E])(?![A-Za-zçğıöşü])")


def kirmizi_mi(renk):
    if not renk:
        return False
    try:
        v = [float(x) for x in renk]
    except (TypeError, ValueError):
        return False
    if len(v) != 3:
        return False
    r, g, b = v
    return r > 0.6 and g < 0.35 and b < 0.35


def _sutun_siniri(chars, genislik, yukseklik=None):
    """GERÇEK sütun boşluğunu bul. (min+max)/2 ile ortadan bölmek YANLIŞ: sayfa kenar
    boşlukları asimetrikse sınır kayar, sağ sütunun satırı sol sütuna karışır ve soru kökü
    yarım/karışık çıkar (ölçüldü: '…Görev ve alanında suç işlenmesini önlemek için ge…').
    Doğrusu: orta bölgede METNİN HİÇ OLMADIĞI en geniş dikey bandı bulmak. Tek sütunlu
    sayfada böyle bir bant yoktur → None döner, sayfa bölünmez."""
    if not genislik:
        return None
    # ⛔ BAŞLIK/ALTBİLGİ TUZAĞI: sayfanın üst ve alt şeritlerinde başlık, sayfa no ve filigran
    # sayfayı BAŞTAN SONA kaplar; orta boşluğu doldurur ve "tek sütun" sanılır. Sonuç: sol ve
    # sağ sütunun satırları birleşir, soru kökü karışır. Yalnız GÖVDE bandına bak.
    govde = chars
    if yukseklik:
        alt, ust = yukseklik * 0.12, yukseklik * 0.92
        sec = [c for c in chars if alt < c["top"] < ust]
        if len(sec) > 40:
            govde = sec
    dolu = [False] * 101
    for c in govde:
        a = max(0, min(100, int(100 * c["x0"] / genislik)))
        b = max(0, min(100, int(100 * c["x1"] / genislik)))
        for i in range(a, b + 1):
            dolu[i] = True
    en_iyi, uzunluk, bas = None, 0, None
    for i in range(30, 71):          # yalnız orta bölge
        if not dolu[i]:
            if bas is None:
                bas = i
            if i - bas + 1 > uzunluk:
                uzunluk = i - bas + 1
                en_iyi = (bas + i) / 2
        else:
            bas = None
    if uzunluk < 3:                  # belirgin boşluk yok → tek sütun
        return None
    return en_iyi * genislik / 100


def sayfa_satirlari(sayfa):
    """[(sütun, y, metin, kırmızı_mı)] — sütun farkındalıklı, yukarıdan aşağı."""
    chars = sayfa.chars
    if not chars:
        return []
    orta = _sutun_siniri(chars, sayfa.width, sayfa.height)
    grup = {}
    for c in chars:
        sut = 0 if orta is None else (0 if c["x0"] < orta else 1)
        anahtar = (sut, round(c["top"] / 3))
        grup.setdefault(anahtar, []).append(c)
    out = []
    for (sut, y) in sorted(grup, key=lambda k: (k[0], k[1])):
        parca = sorted(grup[(sut, y)], key=lambda c: c["x0"])
        metin = "".join(c.get("text", "") for c in parca).strip()
        if not metin:
            continue
        bas_kirmizi = any(kirmizi_mi(c.get("non_stroking_color")) for c in parca[:3])
        out.append((sut, y, metin, bas_kirmizi))
    return out


def _grid_anahtar(metin):
    """IKINCI BICIM: '1 2 3 ... 20' satiri + altinda 'DEEBACEBABCDBCDCBACA' harf dizisi.
    Filigran harfleri araya karisabildigi icin SONDAN N harf alinir (ornek: satirin basindaki
    'AUNNAIVDEORLSITES' filigrani atilir, son 10 harf gercek cevaplardir)."""
    bulunan = {}
    satirlar = [s.strip() for s in (metin or "").splitlines()]
    for i, s in enumerate(satirlar):
        nolar = re.findall(r"(\d{1,3})", s)
        if len(nolar) < 8:
            continue
        nolar = [int(x) for x in nolar]
        if not all(nolar[k] + 1 == nolar[k + 1] for k in range(len(nolar) - 1)):
            continue  # ardisik degilse numara satiri degil
        for j in range(i + 1, min(i + 4, len(satirlar))):
            harfler = re.findall(r"[A-E]", satirlar[j])
            if len(harfler) >= len(nolar):
                for k, no in enumerate(nolar):
                    bulunan[no] = harfler[len(harfler) - len(nolar) + k]
                break
    return bulunan


def anahtar_sayfasi_mi(metin):
    bulunan = {}
    for m in ANAHTAR_KALIP.finditer(metin or ""):
        no = int(m.group(1))
        if 1 <= no <= 200:
            bulunan[no] = m.group(2)
    if len(bulunan) >= 15:
        return bulunan
    g = _grid_anahtar(metin)
    return g if len(g) >= 15 else None


tum = []
ozet = []
for yol in sorted(glob.glob(os.path.join(KLASOR, "*.pdf"))):
    ad = os.path.basename(yol)
    sinavlar = []          # her sinav: {kitapcik, sorular:{no:{...}}, anahtar:{}}
    aktif = None
    son_no = 0
    baslik = None
    yeni_sinav_zorla = False
    try:
        with pdfplumber.open(yol) as pdf:
            for sayfa_no, sayfa in enumerate(pdf.pages, 1):
                duz = sayfa.extract_text() or ""
                for t in ("UZMAN ERBAŞ", "UZMAN JANDARMA", "ASTSUBAY", "SUBAY"):
                    if t in duz:
                        baslik = t
                        break
                # 0) KAPAK SAYFASI = yeni sınavın kesin başlangıcı. Numara sıfırlanmasına
                # bakmak yanılttı: bir kitapçıkta GENEL bölümü 1..N, MESLEK bölümü yine 1..M
                # diye numaralanıyor; bunu "yeni sınav" sanınca kitapçık ikiye bölünüyor ve
                # anahtar yalnız ikinci parçaya yapışıyordu (s.77'deki 68 soru cevapsız kaldı).
                if ("ADAYIN" in duz and "ADI SOYADI" in duz) or "Bu kitapçıkta" in duz:
                    yeni_sinav_zorla = True
                    continue
                # 1) Anahtar sayfası mı?
                anah = anahtar_sayfasi_mi(duz)
                if anah:
                    # ⛔ ANAHTAR SAYFASI = O SINAVIN SONU. Bunu kurala baglamazsan bir sonraki
                    # sinavin sorulari ayni segmentte kalir, anahtar onlara da yapisir ve
                    # ARKASINDAKI sinav cevapsiz kalir (olculdu: s.129'daki 100 cevap yanlis
                    # sinava yapisti, 130+ sinavi bos kaldi).
                    if aktif is not None:
                        aktif["anahtar"].update(anah)
                    yeni_sinav_zorla = True
                    continue
                # 2) Soru sayfası
                soru_no = None
                for sut, y, metin, kirm in sayfa_satirlari(sayfa):
                    m = SORU_BAS.match(metin)
                    if m and len(metin) > 8:
                        no = int(m.group(1))
                        if 1 <= no <= 200:
                            # numara DÜŞTÜYSE yeni sınav başlamıştır
                            # ⛔ Yeni sınav ancak numara BAŞA dönünce (no<=3) ve önceki
                            # sınav ilerlemişse (son_no>=20). Her küçük düşüşte bölersen
                            # tek sınav 20 parçaya ayrılır, anahtar sayfası da yanlış
                            # segmente düşer (ölçtüm: 18 sınav 72 göründü).
                            # ⛔ Metin icindeki "1." gibi sayilar yeni sinav sanilip sinavi
                            # ORTADAN boluyordu (100 soruluk sinav 66+39 diye ikiye ayrildi,
                            # anahtar yalniz bir parcaya yapisti). Bolme artik SADECE:
                            #  (a) anahtar sayfasi gecildiginde, ya da
                            #  (b) numara basa dondu VE mevcut sinav zaten dolmus (>=60 soru).
                            # Bölme sebepleri (uc tanesi de gerekli):
                            #  (a) kapak sayfasi / anahtar sayfasi gecildi  -> yeni_sinav_zorla
                            #  (b) numara basa dondu VE segment zaten dolmus (>=60): ayni
                            #      kitapcikta GENEL ve MESLEK bolumleri ayri ayri 1'den
                            #      numaralaniyor; birlestirirsen ayni numarali sorular
                            #      birbirini EZER (olculdu: 2.300 soru -> 1.785'e dustu).
                            if aktif is None or yeni_sinav_zorla or (no <= 2 and len(aktif["sorular"]) >= 60):
                                yeni_sinav_zorla = False
                                aktif = {"dosya": ad, "kitapcik": baslik, "baslangicSayfa": sayfa_no,
                                         "sorular": {}, "anahtar": {}}
                                sinavlar.append(aktif)
                            son_no = no
                            soru_no = no
                            aktif["sorular"].setdefault(no, {"no": no, "kok": m.group(2), "siklar": {}, "kirmizi": None})
                            continue
                    if soru_no is None or aktif is None:
                        continue
                    s = SIK_BAS.match(metin)
                    if s:
                        harf = s.group(1)
                        aktif["sorular"][soru_no]["siklar"][harf] = s.group(2)
                        if kirm:
                            aktif["sorular"][soru_no]["kirmizi"] = harf
                    elif aktif["sorular"][soru_no]["siklar"]:
                        # şık devamı
                        sonh = sorted(aktif["sorular"][soru_no]["siklar"])[-1]
                        aktif["sorular"][soru_no]["siklar"][sonh] += " " + metin
                    else:
                        aktif["sorular"][soru_no]["kok"] += " " + metin
    except Exception as e:
        print(f"{ad}: HATA {str(e)[:70]}")
        continue

    dosya_soru = 0
    dosya_cevap = 0
    for sv in sinavlar:
        for no, q in sv["sorular"].items():
            if len(q["siklar"]) < 4:
                continue
            cevap, kaynak = None, None
            if no in sv["anahtar"]:
                cevap, kaynak = sv["anahtar"][no], "anahtar"
            elif q["kirmizi"]:
                cevap, kaynak = q["kirmizi"], "kirmizi"
            dosya_soru += 1
            if cevap:
                dosya_cevap += 1
            tum.append({
                "dosya": ad, "kitapcik": sv["kitapcik"], "sayfa": sv["baslangicSayfa"], "no": no,
                "kok": re.sub(r"\s+", " ", q["kok"]).strip()[:600],
                "siklar": {h: re.sub(r"\s+", " ", v).strip()[:300] for h, v in sorted(q["siklar"].items())},
                "cevap": cevap, "cevapKaynak": kaynak,
            })
    print(f"{ad:46} sınav:{len(sinavlar):3}  soru:{dosya_soru:5}  cevaplı:{dosya_cevap:5}")
    ozet.append({"dosya": ad, "sinav": len(sinavlar), "soru": dosya_soru, "cevapli": dosya_cevap})

cevapli = [q for q in tum if q["cevap"]]
print(f"\nTOPLAM: {len(tum)} soru · {len(cevapli)} tanesi CEVAPLI")
d = {}
for q in cevapli:
    d[q["cevap"]] = d.get(q["cevap"], 0) + 1
print("cevap dağılımı:", " ".join(f"{h}:%{100*n/len(cevapli):.0f}" for h, n in sorted(d.items())))

if "--yaz" in sys.argv:
    with open(CIKTI, "w", encoding="utf-8") as f:
        json.dump({"kaynak": KLASOR, "ozet": ozet, "sorular": tum}, f, ensure_ascii=False, indent=1)
    print("YAZILDI →", CIKTI)
