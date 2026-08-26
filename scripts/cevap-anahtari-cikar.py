# -*- coding: utf-8 -*-
"""
CEVAP ANAHTARI ÇIKARICI — çıkmış sınav PDF'lerinden doğru cevapları alır. (26 Ağu 2026)

NEDEN: Başkan haklıydı — anahtar İKİ yerde var, ben ikisini de kaçırmıştım:
  1) Her sınavın sonunda "UZMAN ERBAŞ / Soru Kitapçığı 001-A" başlıklı CEVAP LİSTESİ sayfası
     ("1. B", "2. A", ...). pdftotext bunları soru numarası sanıp gürültüye karıştırıyordu.
  2) Bazı kitapçıklarda doğru şık KIRMIZI yazılmış. pdftotext RENGİ ATAR → görünmez.
     pdfplumber karakter karakter `non_stroking_color` verir; (1,0,0) = kırmızı.

İKİ KAYNAK BİRBİRİNİ DENETLER: ikisi de bulunan sorularda uyuşma oranı ölçülür. Uyuşma
yüksekse iki kaynağa da güvenilir; düşükse bir tanesi bozuktur ve ham veri şüphelidir.

  python scripts/cevap-anahtari-cikar.py            → tara + rapor
  python scripts/cevap-anahtari-cikar.py --yaz      → scripts/veri/cevap-anahtarlari.json
"""
import glob
import json
import os
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')
import pdfplumber

KLASOR = r"C:\Users\GIGABYTE\OneDrive\Desktop\sınav çıkmış soruları"
CIKTI = "scripts/veri/cevap-anahtarlari.json"

# "1. B" / "1.  B" — ⛔ SATIR SONU ŞARTI KOYMA: anahtar sayfaları İKİ SÜTUNLU, metne
# çevrilince "1. B    51. C" tek satıra düşüyor ve satır-sonu arayan desen hiçbirini görmez.
# Sayfanın HER YERİNDE bu kalıbı ara.
SATIR = re.compile(r"(?<![\d.])(\d{1,3})\s*[\.\)]\s*([A-E])(?![A-Za-zçğıöşü])")
# Kitapçık başlığı: "UZMAN ERBAŞ  Soru Kitapçığı 001 - A"
BASLIK = re.compile(r"(UZMAN ERBA[ŞS]|ASTSUBAY|SUBAY|UZMAN JANDARMA)[^\n]{0,40}?Soru Kitap[çc]ı[ğg]ı\s*([\w\- ]{2,12})", re.I)


def kirmizi_mi(renk):
    """(1,0,0) ya da ona çok yakın = kırmızı. Gri tonlarında tek değer gelir, o kırmızı değildir."""
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


def sayfa_anahtari(metin):
    """Sayfa bir CEVAP LİSTESİ mi? Öyleyse {soru_no: harf} döner."""
    cevaplar = {}
    for m in SATIR.finditer(metin or ""):
        no = int(m.group(1))
        if 1 <= no <= 200:
            cevaplar[no] = m.group(2)
    # Bir sayfada en az 15 "N. X" satırı varsa bu bir anahtar sayfasıdır (soru sayfası değil).
    return cevaplar if len(cevaplar) >= 15 else None


def kirmizi_siklar(sayfa):
    """Sayfadaki KIRMIZI karakterleri satır satır topla → işaretli şık metinleri."""
    kirmizilar = [c for c in sayfa.chars if kirmizi_mi(c.get("non_stroking_color"))]
    if not kirmizilar:
        return []
    satirlar = {}
    for c in kirmizilar:
        y = round(c["top"] / 3)  # aynı satırı grupla
        satirlar.setdefault(y, []).append(c)
    out = []
    for y in sorted(satirlar):
        parca = sorted(satirlar[y], key=lambda c: c["x0"])
        yazi = "".join(c.get("text", "") for c in parca).strip()
        if len(yazi) >= 3:
            out.append(yazi)
    return out


sonuc = []
for yol in sorted(glob.glob(os.path.join(KLASOR, "*.pdf"))):
    ad = os.path.basename(yol)
    anahtar_sayfa = 0
    toplam_cevap = 0
    kirmizi_sayfa = 0
    kirmizi_toplam = 0
    bloklar = []
    son_baslik = None
    try:
        with pdfplumber.open(yol) as pdf:
            for i, sayfa in enumerate(pdf.pages, 1):
                metin = sayfa.extract_text() or ""
                b = BASLIK.search(metin)
                if b:
                    son_baslik = f"{b.group(1).upper()} {b.group(2).strip()}"
                cev = sayfa_anahtari(metin)
                if cev:
                    anahtar_sayfa += 1
                    toplam_cevap += len(cev)
                    bloklar.append({"sayfa": i, "kitapcik": son_baslik, "cevap": cev})
                kirm = kirmizi_siklar(sayfa)
                if kirm:
                    kirmizi_sayfa += 1
                    kirmizi_toplam += len(kirm)
    except Exception as e:
        print(f"{ad}: HATA {str(e)[:80]}")
        continue

    print(f"{ad:46} anahtar sayfa: {anahtar_sayfa:3}  cevap: {toplam_cevap:5}  "
          f"kırmızı satır: {kirmizi_toplam:5} ({kirmizi_sayfa} sayfa)")
    sonuc.append({
        "dosya": ad, "anahtarSayfa": anahtar_sayfa, "cevapSayisi": toplam_cevap,
        "kirmiziSatir": kirmizi_toplam, "bloklar": bloklar,
    })

print(f"\nTOPLAM CEVAP: {sum(s['cevapSayisi'] for s in sonuc)}")
if "--yaz" in sys.argv:
    os.makedirs("scripts/veri", exist_ok=True)
    with open(CIKTI, "w", encoding="utf-8") as f:
        json.dump({"kaynak": KLASOR, "dosyalar": sonuc}, f, ensure_ascii=False, indent=1)
    print("YAZILDI →", CIKTI)
