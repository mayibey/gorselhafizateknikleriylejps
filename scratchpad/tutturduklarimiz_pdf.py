# -*- coding: utf-8 -*-
"""
TUTTURDUĞUMUZ SORULAR — PDF üreteci (22 Eyl 2026).

Eski kitaplar iki sütunluydu: solda SINAVDAKİ HÂLİ, sağda BİZDEKİ HÂLİ.
Sınav sorularının metnini yayımlamak telif açısından sakıncalı olduğu için
sol sütun tamamen kaldırıldı. Bu kitapta YALNIZCA BİZE AİT sorular var;
sınav sorusundan geriye sadece "sınavda ölçülen konu" başlığı kalıyor.

    python scratchpad/tutturduklarimiz_pdf.py subay-bakim      -> tek sınav
    python scratchpad/tutturduklarimiz_pdf.py hepsi            -> 9 sınavın tamamı

Veri: docs/jsps2026iptalanaliz/veri/<sinav>.json  (soru, siklar, dogru, kaynak,
aciklama, konu, no, bolum, tip) — web sayfasıyla AYNI kaynak, ikisi ayrışamaz.
Oran ölçüsü AFİŞLE aynı: karşılık = birebir + çok benzer.
"""
import io, json, os, re, subprocess, sys, html as _html
import fitz

KOK = r"D:\GorselHafizaTeknikleriyleJSPS"
VERI = os.path.join(KOK, "docs", "jsps2026iptalanaliz", "veri")
CIK = r"C:\Users\GIGABYTE\OneDrive\Desktop\jsps 2026\tutturduklarimiz"
GECICI = os.path.join(KOK, "scratchpad")
CHROME = r"C:/Program Files/Google/Chrome/Application/chrome.exe"
FONT = r"C:\Windows\Fonts\segoeui.ttf"
FONTB = r"C:\Windows\Fonts\segoeuib.ttf"
HARF = "ABCDE"

# Rakamlar ilgili PDF raporunun kapağından okunmuştur (scratchpad/_analiz_veri.json).
OLCUM = {
 "subay-bakim": ("2026 Subay Bakım Sınavı", 92.5, 65, 9, 6, (40,35,87.5), ("Bakım Branş Mevzuatı",40,39,97.5), (80,74,92.5)),
 "subay-jandarma": ("2026 Subay Jandarma Sınavı", 85.0, 62, 6, 12, (40,35,87.5), ("Jandarma Branş Mevzuatı",40,33,82.5), (80,68,85.0)),
 "subay-havacilik": ("2026 Subay Havacılık Sınavı", 85.0, 61, 7, 12, (50,43,86.0), ("Havacılık Branş Mevzuatı",30,25,83.3), (80,68,85.0)),
 "subay-personel": ("2026 Subay Personel Sınavı", 85.0, 61, 7, 12, (40,35,87.5), ("Personel Branş Mevzuatı",40,33,82.5), (80,68,85.0)),
 "subay-maliye": ("2026 Subay Maliye Sınavı", 85.0, 60, 8, 12, (40,35,87.5), ("Maliye Branş Mevzuatı",40,33,82.5), (80,68,85.0)),
 "subay-mebs": ("2026 Subay MEBS Sınavı", 73.8, 56, 3, 21, (50,43,86.0), ("MEBS Branş Mevzuatı",30,16,53.3), (80,59,73.8)),
 "astsubay-mebs": ("2026 Astsubay MEBS Sınavı", 85.0, 62, 6, 12, (50,49,98.0), ("MEBS Branş Mevzuatı",30,19,63.3), (80,68,85.0)),
 "astsubay-jandarma": ("2026 Astsubay Jandarma Sınavı", 88.8, 59, 12, 9, (40,39,97.5), ("Jandarma Branş Mevzuatı",40,32,80.0), (80,71,88.8)),
 "uzman-erbas": ("2026 Uzman Erbaş Sınavı", 87.5, 57, 13, 10, (40,33,82.5), ("Jandarma/SG Branş Mevzuatı",40,37,92.5), (80,70,87.5)),
}

def e(t):
    t = _html.escape(str(t or ""))
    t = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", t)
    return t.replace("\n", "<br>")

CSS = """
@page { size:A4; margin:16mm 13mm 15mm 13mm; }
*{box-sizing:border-box}
body{margin:0;font-family:"Segoe UI",Arial,sans-serif;color:#1B2A4A;background:#fff;font-size:9.6pt;line-height:1.45}
h1{font-family:Georgia,serif;font-size:28pt;line-height:1.16;margin:9mm 0 3mm;color:#0B1F3A}
h1 span{display:block;font-size:14pt;color:#6E6047;margin-top:2mm;font-style:italic}

/* kapak */
.kapak{page-break-after:always}
.kust{font-size:7.6pt;letter-spacing:.28em;color:#B88917;font-weight:700}
.kalt{color:#6E6047;font-size:9.6pt;max-width:150mm}
.buyuk{display:flex;gap:6mm;margin:8mm 0 6mm;align-items:stretch}
.oran{flex:0 0 78mm;border:.5mm solid #C9A227;background:#FDFBF4;border-radius:3mm;padding:6mm;text-align:center}
.oran b{display:block;font-family:Georgia,serif;font-size:54pt;line-height:.95;color:#2E7D32}
.oran span{display:block;font-size:8pt;letter-spacing:.22em;color:#6E6047;font-weight:700;margin-top:1mm}
.oran small{display:block;font-size:8.6pt;color:#6E6047;margin-top:3mm;line-height:1.5}
/* kirilim satirindaki <b>'ler dev baslik stilini KAPMASIN (.oran b 54pt) */
.oran small b{display:inline;font-size:9.4pt;line-height:inherit;color:#1E5720;font-weight:700}
.yan{flex:1;display:flex;flex-direction:column;gap:4mm}
.ku{flex:1;border:.3mm solid #E7DCC7;border-radius:3mm;padding:5mm;background:#FFFCF5}
.ku b{display:block;font-family:Georgia,serif;font-size:27pt;line-height:1;color:#0B1F3A}
.ku span{display:block;font-size:7.6pt;letter-spacing:.2em;color:#6E6047;font-weight:700}
.ku small{display:block;font-size:8.4pt;color:#6E6047;margin-top:1.5mm}
table.ozet{width:100%;border-collapse:collapse;margin:2mm 0 6mm;font-size:9.2pt}
table.ozet th{text-align:left;font-size:7.6pt;letter-spacing:.14em;text-transform:uppercase;color:#6E6047;
  border-bottom:.3mm solid #E7DCC7;padding:2mm 3mm}
table.ozet td{padding:2.6mm 3mm;border-bottom:.2mm solid #EFE6D6}
table.ozet td.sy{text-align:right;font-variant-numeric:tabular-nums}
table.ozet td.yz{text-align:right;font-weight:700;color:#0B1F3A}
table.ozet tr.toplam td{background:#F3E7C1;font-weight:700;color:#8A5A12;border-bottom:none}
.notlar{border-top:.3mm solid #E7DCC7;padding-top:4mm;font-size:8.8pt;color:#6E6047}
.notlar p{margin:0 0 2.5mm}
.notlar b{color:#0B1F3A}

/* sorular */
.bolumbar{background:#0B1F3A;color:#fff;font-family:Georgia,serif;font-size:13pt;padding:3mm 4mm;
  border-radius:2mm;margin:0 0 4mm;page-break-after:avoid}
.blok{border:.3mm solid #E7DCC7;border-radius:2.5mm;padding:4mm 4.5mm;margin:0 0 3.5mm;
  background:#FFFCF5;page-break-inside:avoid}
.ust{display:flex;align-items:baseline;gap:3mm;margin-bottom:2.5mm}
.no{font-family:Georgia,serif;font-weight:700;font-size:11pt;color:#B88917}
.rozet{font-size:7.2pt;letter-spacing:.1em;font-weight:700;padding:.8mm 2.5mm;border-radius:6mm}
.r-mus{background:#F3E7C1;color:#8A5A12}
.r-bra{background:#E8EEF7;color:#173B6B}
.r-bir{background:#EAF3EA;color:#1E5720}
.r-ben{background:#FBF1DC;color:#8A5A12}
.kunye{margin-left:auto;font-size:8.2pt;color:#6E6047;background:#F7F3EA;border:.2mm solid #E7DCC7;
  padding:.6mm 2.2mm;border-radius:1.5mm}
.kok{font-weight:600;margin-bottom:2.5mm}
ul.sik{list-style:none;margin:0;padding:0}
ul.sik li{padding:1.4mm 2.5mm;border-radius:1.5mm;margin-bottom:1mm;background:#F7F3EA}
ul.sik li.dg{background:#EAF3EA;color:#1E5720;font-weight:600}
.h{font-weight:700;color:#6E6047;margin-right:1.5mm}
.dg .h{color:#2E7D32}
.tik{float:right;color:#2E7D32;font-weight:700;font-size:8.4pt}
.acik{margin-top:2.5mm;padding-top:2mm;border-top:.2mm dashed #E7DCC7;font-size:8.8pt;color:#6E6047}
.acik b{color:#0B1F3A}
.konu{margin-top:1.5mm;font-size:8.4pt;color:#6E6047;font-style:italic}
"""

def kitap(anahtar):
    ad, oran, bir, ben, yok, mus, bra, top = OLCUM[anahtar]
    veri = json.load(io.open(os.path.join(VERI, anahtar + ".json"), encoding="utf-8"))
    veri.sort(key=lambda x: x["no"])

    satir = []
    for isim, s, d, y, son in ((("Müşterek Mevzuat",) + mus + (False,)),
                               ((bra[0], bra[1], bra[2], bra[3], False)),
                               (("Toplam", top[0], top[1], top[2], True))):
        satir.append(f'<tr{" class=toplam" if son else ""}><td>{e(isim)}</td>'
                     f'<td class="sy">{s}</td><td class="sy">{d}</td><td class="yz">%{str(y).replace(".",",")}</td></tr>')

    kapak = f'''<div class="kapak">
 <div class="kust">MEVZU JSPS</div>
 <h1>{e(ad)}<span>Tutturduğumuz Sorular</span></h1>
 <div class="kalt">19 Eylül 2026'da yapılan ve sonradan iptal edilen sınavın 80 mevzuat sorusu,
   soru bankamızla tek tek karşılaştırıldı. Bu kitapta, karşılığı bankamızda çıkan soruların
   <b>tamamı</b> yer alıyor — birebir eşleşenler ve çok benzer olanlar, rozetleriyle ayrılmış.</div>
 <div class="buyuk">
  <div class="oran"><b>%{str(oran).replace(".",",")}</b><span>KARŞILIK ORANI</span>
    <small>80 mevzuat sorusunun {top[1]} tanesinin karşılığı bankamızda vardı<br>
    <b>{bir}</b> birebir · <b>{ben}</b> çok benzer · {yok} soruda karşılık yok</small></div>
  <div class="yan">
   <div class="ku"><b>{mus[1]}</b><span>MÜŞTEREK</span><small>{mus[0]} sorudan · %{str(mus[2]).replace(".",",")}</small></div>
   <div class="ku"><b>{bra[2]}</b><span>BRANŞ</span><small>{bra[1]} sorudan · %{str(bra[3]).replace(".",",")}</small></div>
  </div>
 </div>
 <table class="ozet"><tr><th>Bölüm</th><th style="text-align:right">Soru</th>
   <th style="text-align:right">Karşılık</th><th style="text-align:right">Oran</th></tr>{"".join(satir)}</table>
 <div class="notlar">
  <p><b>Bu kitapta ne var?</b> Aşağıdaki soruların <b>tamamı bize aittir</b>; Mevzu JSPS soru
    bankasından alınmıştır. Sınav sorularının metni bu kitapta <b>yayımlanmamaktadır</b>;
    her sorunun altında yalnızca sınavda hangi konunun ölçüldüğü belirtilir.</p>
  <p><b>Birebir ve çok benzer.</b> <b>Birebir</b>: cevap aynı bilgiye çıkıyor — bizim soruyu
    çalışmış bir aday sınavdaki doğru şıkkı işaretleyebiliyordu. <b>Çok benzer</b>: aynı madde,
    farklı ayrıntı. Her sorunun rozeti hangisi olduğunu gösterir.</p>
  <p><b>Kapsam.</b> Sınavın ilk 20 sorusu genel kültür / genel yetenek / Anayasa. Uygulamamızda
    bu konular hiç yok, bu yüzden değerlendirmeye alınmadı. Ölçüm, sınavın
    <b>21–100 arası 80 mevzuat sorusu</b> üzerinden yapıldı.</p>
  <p><b>Nasıl okunur.</b> Yeşil satır doğru cevaptır. Sağ üstteki künye sorunun dayandığı
    mevzuat maddesini gösterir.</p>
 </div>
</div>'''

    parca, son_bolum = [], None
    for s in veri:
        b = "Müşterek Mevzuat" if s["bolum"] == "musterek" else bra[0]
        if b != son_bolum:
            parca.append(f'<div class="bolumbar">{e(b)}</div>')
            son_bolum = b
        d = s.get("dogru")
        sik = "".join(
            f'<li class="{"dg" if i == d else ""}"><span class="h">{HARF[i]})</span>{e(x)}'
            + ('<span class="tik">✓ doğru</span>' if i == d else "") + "</li>"
            for i, x in enumerate(s.get("siklar", [])))
        rz = "r-mus" if s["bolum"] == "musterek" else "r-bra"
        et = "MÜŞTEREK" if s["bolum"] == "musterek" else "BRANŞ"
        rz2, et2 = ("r-bir", "BİREBİR") if s.get("tip") == "birebir" else ("r-ben", "ÇOK BENZER")
        parca.append(f'''<div class="blok">
 <div class="ust"><span class="no">{s["no"]}</span><span class="rozet {rz}">{et}</span><span class="rozet {rz2}">{et2}</span>
   {f'<span class="kunye">{e(s.get("kaynak",""))}</span>' if s.get("kaynak") else ''}</div>
 <div class="kok">{e(s.get("soru",""))}</div>
 <ul class="sik">{sik}</ul>
 {f'<div class="acik"><b>Dayanak.</b> {e(s.get("aciklama",""))}</div>' if s.get("aciklama") else ''}
 {f'<div class="konu">Sınavda ölçülen konu: {e(s.get("konu",""))}</div>' if s.get("konu") else ''}
</div>''')

    HTML = ("<!doctype html><html lang=tr><head><meta charset=utf-8><style>"
            + CSS + "</style></head><body>" + kapak + "".join(parca) + "</body></html>")
    hp = os.path.join(GECICI, f"_tut_{anahtar}.html")
    io.open(hp, "w", encoding="utf-8").write(HTML)
    ara = os.path.join(GECICI, f"_tut_{anahtar}_ham.pdf")
    subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--no-pdf-header-footer",
                    f"--print-to-pdf={ara}", "file:///" + hp.replace("\\", "/")],
                   capture_output=True, timeout=600)
    os.makedirs(CIK, exist_ok=True)
    cikti = os.path.join(CIK, f"{ad} - Tutturdugumuz Sorular.pdf")
    d = fitz.open(ara)
    ustyazi = f"{ad} · tutturduğumuz sorular"
    for i, pg in enumerate(d):
        if i == 0:
            continue
        pg.draw_line(fitz.Point(34, 28), fitz.Point(pg.rect.width - 34, 28),
                     color=(0.91, 0.86, 0.78), width=0.7)
        pg.insert_text(fitz.Point(34, 24), ustyazi, fontsize=7.4, fontname="sg",
                       fontfile=FONT, color=(0.55, 0.49, 0.36))
        pg.draw_rect(fitz.Rect(pg.rect.width - 58, pg.rect.height - 32,
                               pg.rect.width - 32, pg.rect.height - 17),
                     color=None, fill=(0.043, 0.122, 0.227), radius=0.25)
        pg.insert_text(fitz.Point(pg.rect.width - 52, pg.rect.height - 21), f"{i + 1}",
                       fontsize=8.5, fontname="sgb", fontfile=FONTB, color=(1, 1, 1))
        pg.insert_text(fitz.Point(34, pg.rect.height - 21), "Mevzu JSPS · mevzujsps.com",
                       fontsize=7.2, fontname="sg", fontfile=FONT, color=(0.55, 0.49, 0.36))
    d.save(cikti, garbage=3, deflate=True)
    print(f"{anahtar:20} {len(veri):3} soru · {len(d):3} sayfa -> {os.path.basename(cikti)}")
    for n in (0, 1, 2):
        if n < len(d):
            d[n].get_pixmap(dpi=72).save(os.path.join(GECICI, f"_tut_on_{anahtar}_{n}.png"))
    d.close()
    return cikti

if __name__ == "__main__":
    hedef = sys.argv[1] if len(sys.argv) > 1 else "subay-bakim"
    for a in (OLCUM if hedef == "hepsi" else [hedef]):
        kitap(a)
