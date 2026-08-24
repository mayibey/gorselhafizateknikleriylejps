# -*- coding: utf-8 -*-
"""Fabrikadaki uretilen_gorseller ile uygulamadaki webp tarihlerini karsilastirir.
Fabrikadaki DAHA YENI ise: o kart uygulamaya aktarilmamis (bayat) demektir."""
import os, sys, re, io
sys.stdout.reconfigure(encoding='utf-8')
SRC = r"D:\JSPS Fabrika\kaynaklar\astsubay\KANUN_MASTER_DOSYALARI\MUSTEREK"
APP = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "kartlar")

# klasor onegi -> slug (icerik-yerlestir.py MAP ile ayni)
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "scripts"))
src_txt = io.open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "scripts", "icerik-yerlestir.py"), encoding="utf-8").read()
MAP = {}
for m in re.finditer(r'"([^"]+)":\s*\((\d+),\s*"([a-z0-9_]+)"', src_txt):
    MAP[m.group(1)] = m.group(3)

toplam_yeni = 0
rapor = []
for klasor in os.listdir(SRC):
    onek = klasor.replace(" TAMAM", "").strip()
    slug = MAP.get(onek)
    if not slug: continue
    g = os.path.join(SRC, klasor, "uretilen_gorseller")
    a = os.path.join(APP, slug)
    if not os.path.isdir(g) or not os.path.isdir(a): continue
    app_en_yeni = max([os.path.getmtime(os.path.join(a, f)) for f in os.listdir(a)] or [0])
    yeniler = []
    for f in os.listdir(g):
        if not f.lower().endswith((".png", ".webp", ".jpg")): continue
        t = os.path.getmtime(os.path.join(g, f))
        if t > app_en_yeni + 3600:  # 1 saat tolerans
            yeniler.append((f, t))
    if yeniler:
        toplam_yeni += len(yeniler)
        rapor.append((slug, len(yeniler), sorted(yeniler, key=lambda x: -x[1])[:4]))

import datetime
print("FABRIKADA DAHA YENI OLAN (uygulamaya aktarilmamis) GORSELLER")
print("=" * 62)
for slug, n, ornek in sorted(rapor, key=lambda x: -x[1]):
    print(f"{slug:16} {n:3} gorsel  ornek: " + ", ".join(f"{f} ({datetime.datetime.fromtimestamp(t):%d.%m})" for f, t in ornek))
print("=" * 62)
print("TOPLAM:", toplam_yeni, "gorsel /", len(rapor), "kanun")
