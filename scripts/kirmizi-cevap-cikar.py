# -*- coding: utf-8 -*-
"""
KIRMIZI İŞARETLİ CEVAP ÇIKARICI (26 Ağu 2026, başkan: "kitapçıkta kırmızı ile işaretlenen").

Bazı çıkmış sınav PDF'lerinde DOĞRU ŞIK kırmızı yazılmış. pdftotext rengi attığı için bu bilgi
tamamen görünmezdi. pdfplumber karakter karakter renk verir → kırmızı şıkkı yakalarız.

YÖNTEM (sütun farkındalıklı):
  • Sayfa 2 sütunlu; x ortasına göre sütunlara ayrılır (yoksa sağ sütunun sorusu sol sütunun
    cevabıyla eşleşir → sessiz ve tehlikeli hata).
  • Her sütunda satırlar yukarıdan aşağı gezilir. "12." ile başlayan satır = SORU NUMARASI çapası.
  • Kırmızı ve "X)" ile başlayan satır = O SORUNUN DOĞRU ŞIKKI.
  • Aynı soruya birden fazla kırmızı şık düşerse o soru ŞÜPHELİ sayılır ve ATILIR (uydurma yok).

  python scripts/kirmizi-cevap-cikar.py           → rapor
  python scripts/kirmizi-cevap-cikar.py --yaz     → scripts/veri/kirmizi-cevaplar.json
"""
import glob
import json
import os
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')
import pdfplumber

KLASOR = r"C:\Users\GIGABYTE\OneDrive\Desktop\sınav çıkmış soruları"
CIKTI = "scripts/veri/kirmizi-cevaplar.json"

SORU_NO = re.compile(r"^\s*(\d{1,3})\s*[\.\)]")
SIK = re.compile(r"^\s*([A-E])\s*[\)\.]")


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


def sayfa_cevaplari(sayfa):
    """{soru_no: harf} — sütun farkındalıklı."""
    chars = sayfa.chars
    if not chars:
        return {}, 0
    xs = [c["x0"] for c in chars]
    orta = (min(xs) + max(xs)) / 2

    # satır grupla: (sütun, y) → karakterler
    satirlar = {}
    for c in chars:
        sutun = 0 if c["x0"] < orta else 1
        y = round(c["top"] / 3)
        satirlar.setdefault((sutun, y), []).append(c)

    cevaplar = {}
    supheli = set()
    for sutun in (0, 1):
        aktif = None
        anahtarlar = sorted([k for k in satirlar if k[0] == sutun], key=lambda k: k[1])
        for k in anahtarlar:
            parca = sorted(satirlar[k], key=lambda c: c["x0"])
            yazi = "".join(c.get("text", "") for c in parca)
            m = SORU_NO.match(yazi)
            if m and len(yazi.strip()) > 4:      # "12. Aşağıdakilerden…" → yeni soru
                aktif = int(m.group(1))
                continue
            if aktif is None:
                continue
            ms = SIK.match(yazi)
            if not ms:
                continue
            # şık satırının BAŞINDAKİ harf kırmızı mı? (tüm satır kırmızı olmayabilir)
            bas = parca[:3]
            if any(kirmizi_mi(c.get("non_stroking_color")) for c in bas):
                harf = ms.group(1)
                if aktif in cevaplar and cevaplar[aktif] != harf:
                    supheli.add(aktif)
                cevaplar[aktif] = harf
    for s in supheli:
        cevaplar.pop(s, None)
    return cevaplar, len(supheli)


sonuc = []
for yol in sorted(glob.glob(os.path.join(KLASOR, "*.pdf"))):
    ad = os.path.basename(yol)
    toplam, supheli_top, sayfalar = 0, 0, []
    try:
        with pdfplumber.open(yol) as pdf:
            for i, sayfa in enumerate(pdf.pages, 1):
                cev, sup = sayfa_cevaplari(sayfa)
                supheli_top += sup
                if cev:
                    toplam += len(cev)
                    sayfalar.append({"sayfa": i, "cevap": cev})
    except Exception as e:
        print(f"{ad}: HATA {str(e)[:70]}")
        continue
    if toplam:
        print(f"{ad:46} kırmızı cevap: {toplam:5}  (atılan şüpheli: {supheli_top})")
    sonuc.append({"dosya": ad, "cevapSayisi": toplam, "supheli": supheli_top, "sayfalar": sayfalar})

print(f"\nTOPLAM KIRMIZI CEVAP: {sum(s['cevapSayisi'] for s in sonuc)}")
if "--yaz" in sys.argv:
    with open(CIKTI, "w", encoding="utf-8") as f:
        json.dump({"kaynak": KLASOR, "dosyalar": sonuc}, f, ensure_ascii=False, indent=1)
    print("YAZILDI →", CIKTI)
