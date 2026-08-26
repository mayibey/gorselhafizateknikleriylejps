# -*- coding: utf-8 -*-
"""PDF'lerde RENKLİ (kırmızı vb.) yazılmış metin var mı? Cevap anahtarı işaretlemesi olabilir."""
import sys, io, os, glob
sys.stdout.reconfigure(encoding='utf-8')
import pdfplumber

KLASOR = r"C:\Users\GIGABYTE\OneDrive\Desktop\sınav çıkmış soruları"
for yol in sorted(glob.glob(os.path.join(KLASOR, "*.pdf"))):
    ad = os.path.basename(yol)
    try:
        with pdfplumber.open(yol) as pdf:
            sayfa_say = len(pdf.pages)
            renkler = {}
            ornek = {}
            # ilk 12 sayfayı tara (örneklem)
            for s in pdf.pages[:12]:
                for ch in s.chars:
                    c = ch.get("non_stroking_color")
                    if c is None: continue
                    key = tuple(round(float(x),2) for x in c) if isinstance(c,(list,tuple)) else (round(float(c),2),)
                    renkler[key] = renkler.get(key,0)+1
                    if key not in ornek: ornek[key] = ""
                    if len(ornek[key]) < 40: ornek[key] += ch.get("text","")
            print(f"\n=== {ad} ({sayfa_say} sayfa) ===")
            for k,v in sorted(renkler.items(), key=lambda x:-x[1])[:6]:
                print(f"   renk {k} -> {v} karakter | örnek: {ornek[k][:38]!r}")
    except Exception as e:
        print(f"\n=== {ad} === HATA: {str(e)[:90]}")
