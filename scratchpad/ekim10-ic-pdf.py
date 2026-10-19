# 10 Eki 2026 JSPS — İÇ değerlendirme PDF'i (A4 yatay): Sınavdaki hâli | Bizdeki hâli | Uygulamada nerede.
# Sınav metnini İÇERİR → yalnız iç kullanım, sitede YAYIMLANMAZ (sitedeki telif güvenli sürüm: ekim10-site.py).
# Kullanım: python ekim10-ic-pdf.py <kod> | hepsi      Veri: scratchpad/ekim10/<kod>/kayit.json
# Tasarım (CSS) karsilastirma-pdf.py ile ortak; oradan okunur.
import html, io, json, os, re, subprocess, sys
import fitz
sys.stdout.reconfigure(encoding='utf-8')
S = 'D:/Mevzu/JSPS/uygulama/scratchpad/'
sys.path.insert(0, S)
from ekim10_sinavlar import SINAVLAR
CHROME = r"C:/Program Files/Google/Chrome/Application/chrome.exe"
FONT = r"C:\Windows\Fonts\segoeui.ttf"
FONTB = r"C:\Windows\Fonts\segoeuib.ttf"
CIKDIR = r"C:\Users\GIGABYTE\OneDrive\Desktop\JSPS 10 Ekim 2026\Ic degerlendirme"
CSS = re.search(r"CSS = '''(.*?)'''", open(S + 'karsilastirma-pdf.py', encoding='utf-8').read(), re.S).group(1)
e = lambda t: html.escape(t or '').replace('\n', '<br>')
H = 'ABCDE'


def sikistir(yer):
    """Uzun yer listesini toplar: premium denemeler ve branş karma denemeleri tek satır."""
    out, prem, karma = [], [], []
    for y in yer:
        m = re.match(r'Premium Deneme \d+ · (.+?) — Premium Deneme (\d+) · (\d+)\. soru', y)
        if m:
            prem.append(f'{m.group(1)} {m.group(2)} ({m.group(3)}.)'); continue
        m = re.match(r'Branşa göre karma deneme · ([\w-]+) · Karma Deneme (\d+)', y)
        if m:
            karma.append(f'{m.group(1)} {m.group(2)}'); continue
        out.append(y)
    if karma: out.append(f'Branşa göre karma denemeler ({len(karma)}): ' + ', '.join(karma))
    if prem: out.append(f'Premium denemeler ({len(prem)}): ' + ', '.join(prem))
    return out


def sik(l, d, et):
    return '<ul class="sik">' + ''.join(
        f'<li class="{"dg" if i == d else ""}"><span class="h">{H[i]})</span> {e(s)}' + (f'<span class="tik">✓ {et}</span>' if i == d else '') + '</li>'
        for i, s in enumerate(l)) + '</ul>'


def kitap(kod):
    cfg = SINAVLAR[kod]; M0, M1 = cfg['musterek']
    K = json.load(open(S + f'ekim10/{kod}/kayit.json', encoding='utf-8'))
    if os.path.exists(S + f'ekim10/{kod}/konu.json'):
        KN = json.load(open(S + f'ekim10/{kod}/konu.json', encoding='utf-8'))
        for k in K: k['konu'] = KN.get(str(k['no']), {}).get('konu') or k.get('konu', '')
    EK = cfg.get('eksik', []); T = 80 - len(EK)
    B = sum(k['durum'] == 'b' for k in K); KI = sum(k['durum'] == 'k' for k in K); Y = T - B - KI; BK = B + KI
    MK = sum(k.get('kaynak') == 'kart' for k in K); PV = sum(k.get('kaynak') == 'prova' for k in K); AO = sum(k.get('kaynak') == 'altin' for k in K); HV = BK - MK - PV - AO
    yz = lambda n: f'{n / T * 100:.1f}'.replace('.0', '').replace('.', ',')

    def bol(a, b):
        l = [k for k in K if a <= k['no'] <= b]; bb = sum(k['durum'] == 'b' for k in l)
        t = b - a + 1 - sum(a <= n <= b for n in EK)
        return {'t': t, 'b': bb, 'k': len(l) - bb, 'y': t - len(l)}

    def cub(d):
        return (f'<div class="cub"><i class="cy" style="width:{d["b"]/d["t"]*100:.1f}%"></i>'
                f'<i class="ca" style="width:{d["k"]/d["t"]*100:.1f}%"></i><i class="cg" style="width:{d["y"]/d["t"]*100:.1f}%"></i></div>')

    def satir(ad, d, top=False):
        return (f'<tr{" class=toplam" if top else ""}><td class="ad">{ad}</td><td class="sy">{d["t"]}</td><td class="sy y">{d["b"]}</td>'
                f'<td class="sy a">{d["k"]}</td><td class="sy yz">%{d["b"]/d["t"]*100:.0f}</td><td class="sy yz">%{(d["b"]+d["k"])/d["t"]*100:.0f}</td><td class="cubh">{cub(d)}</td></tr>')

    kapak = f'''<div class="kapak">
 <div class="kust">MEVZU JSPS · İÇ DEĞERLENDİRME · YAYIMLANMAZ</div>
 <h1>{cfg['baslik']} · 10 Ekim<br><span>Sınavdaki Hâli / Bizdeki Hâli / Uygulamada Nerede</span></h1>
 <div class="buyuk">
  <div class="oran"><b>%{yz(BK)}</b><span>BİREBİR + KISMİ</span><small>{T} mevzuat sorusunun {BK} tanesi{f' ({len(EK)} sorunun görüntüsü yok)' if EK else ''} · soru havuzu {HV} + madde kartı {MK} + site denemesi {PV} + Altın Özet {AO} · yalnız birebir %{yz(B)}</small></div>
  <div class="yan"><div class="ku y"><b>{B}</b><span>BİREBİR</span></div>
  <div class="ku a"><b>{KI}</b><span>KISMİ</span></div></div>
 </div>
 <table class="ozet"><tr><th>Bölüm</th><th>Soru</th><th>Birebir</th><th>Kısmi</th><th>Birebir %</th><th>+Kısmi %</th><th></th></tr>
 {satir(f"Müşterek ({M0}–{M1})", bol(M0, M1))}{satir(f"{cfg['brans']} ({M1 + 1}–100)", bol(M1 + 1, 100))}{satir("Toplam", {"t": T, "b": B, "k": KI, "y": Y}, True)}</table>
 <div class="notlar"><p><b>Ölçü:</b> birebir = bizdeki tek soru / kart doğru şıkkı tek başına buldurur · kısmi = iki kaynak birleşir ya da şıklar ikiye iner. İlk 20 soru (genel kültür) ve karşılığı olmayan {Y} soru dışarıda.</p></div>
</div>'''

    par, son = [], None
    for k in K:
        b = f'Müşterek Mevzuat ({M0}–{M1})' if k['no'] <= M1 else f"{cfg['brans']} ({M1 + 1}–100)"
        if b != son:
            par.append(f'<div class="bolumbar">{b}</div>'); son = b
        k = dict(k, bizde=k['bizde'][:2 if k['durum'] == 'b' else 3])  # en belirleyici kaynaklar; fazlası sayfa şişirir
        cok = len(k['bizde']) > 1
        biz = ''.join(
            (f'<div class="biz"><div class="kok"><b>{e(x["baslik"])}</b></div><div class="acik">{e(x["metin"])}</div></div>' if x.get('tur') in ('kart', 'altin') else
             f'<div class="biz">{f"<div class=sira>{i+1}. soru</div>" if cok else ""}<div class="kok">{e(x["soru"])}</div>{sik(x["siklar"], x["dogru"], "doğru")}'
             f'<div class="meta"><span class="sid">{e(x["id"])}</span></div></div>')
            for i, x in enumerate(k['bizde']))
        ner = ''.join(
            f'<div class="yerg">{f"<div class=sira>{i+1}. soru · {e(x["id"])}</div>" if cok else ""}<ul>' + ''.join(f'<li>{e(y)}</li>' for y in sikistir(x['yer'])) + '</ul></div>'
            for i, x in enumerate(k['bizde']))
        rozet = f'<span class="rozet {"yesil" if k["durum"] == "b" else "amber"}">{"BİREBİR" if k["durum"] == "b" else "KISMİ"}</span>'
        if k.get('kaynak') == 'kart' or k.get('yukselt') == 'kart': rozet += '<span class="rozet lac">MADDE KARTI</span>'
        if k.get('kaynak') == 'altin' or k.get('yukselt') == 'altin': rozet += '<span class="rozet lac" style="background:#C9A227;color:#0B1F3A">ALTIN ÖZET</span>'
        if k.get('kaynak') == 'prova' or k.get('yukselt') == 'prova': rozet += '<span class="rozet lac" style="background:#8A5A12">SİTE DENEMESİ</span>'
        par.append(f'''<div class="blok">
 <div class="ust"><span class="no">Soru {k["no"]}</span>{rozet}<span class="konu">{e(k["konu"])}</span></div>
 <div class="uclu">
  <div class="sut sol"><div class="baslik">SINAVDAKİ HÂLİ</div><div class="kok">{e(k["tam"]["kok"])}</div>{sik(k["tam"]["siklar"], k["tam"]["dogru"], "sınavın cevabı")}</div>
  <div class="sut sag"><div class="baslik">BİZDEKİ HÂLİ{f" · {len(k['bizde'])} KAYNAK" if cok else ""}</div>{biz}</div>
  <div class="sut ner"><div class="baslik">UYGULAMADA NEREDE</div>{ner}</div>
 </div>
 {f'<div class="gerekce"><b>Neden kısmi:</b> {e(k["not"])}</div>' if k.get("not") and k["durum"] == "k" else ""}
</div>''')

    hp = S + f'_ic_{kod}.html'
    io.open(hp, 'w', encoding='utf-8').write(f'<!doctype html><html lang=tr><head><meta charset=utf-8><style>{CSS}</style></head><body>{kapak}{"".join(par)}</body></html>')
    ara = S + f'_ic_{kod}_ham.pdf'
    subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--no-pdf-header-footer', f'--print-to-pdf={ara}', 'file:///' + hp],
                   capture_output=True, timeout=600)
    d = fitz.open(ara)
    for i, pg in enumerate(d):
        if i == 0: continue
        W, Hh = pg.rect.width, pg.rect.height
        pg.draw_line(fitz.Point(31, 26), fitz.Point(W - 31, 26), color=(0.91, 0.86, 0.78), width=0.7)
        pg.insert_text(fitz.Point(31, 22), f"{cfg['baslik']} · 10 Ekim · iç değerlendirme (yayımlanmaz)", fontsize=7.2, fontname='sg', fontfile=FONT, color=(0.55, 0.49, 0.36))
        pg.draw_rect(fitz.Rect(W - 56, Hh - 30, W - 30, Hh - 15), color=None, fill=(0.043, 0.122, 0.227), radius=0.25)
        pg.insert_text(fitz.Point(W - 50 if i + 1 < 10 else W - 52, Hh - 19), f'{i + 1}', fontsize=8.5, fontname='sgb', fontfile=FONTB, color=(1, 1, 1))
    out = os.path.join(CIKDIR, cfg['dosya'] + ' - Sinavdaki ve Bizdeki Hali.pdf')
    d.save(out, garbage=3, deflate=True)
    print(f'{kod:16} {len(K)} kayıt · {len(d)} sayfa -> {out}')
    d[0].get_pixmap(dpi=55).save(S + f'_ic_on_{kod}_0.png')
    if len(d) > 1: d[1].get_pixmap(dpi=55).save(S + f'_ic_on_{kod}_1.png')
    d.close()


if __name__ == '__main__':
    os.makedirs(CIKDIR, exist_ok=True)
    h = sys.argv[1] if len(sys.argv) > 1 else 'hepsi'
    for kod in (SINAVLAR if h == 'hepsi' else [h]):
        if os.path.exists(S + f'ekim10/{kod}/kayit.json'): kitap(kod)
