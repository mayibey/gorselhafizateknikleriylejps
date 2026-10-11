# 10 Eki 2026 JSPS — SİTE sürümü (telif güvenli): docs/jsps2026ekimanaliz/ {index.html, veri/<kod>.json, pdf/<kod>.pdf}
# Sınav sorusunun metni / şıkları / ekran görüntüsü HİÇ girmez. Yalnız: soru no, kendi cümlemizle "ölçülen konu",
# BİZE AİT sorular (uygulama + site provası), kamuya açık madde metni (kanun/yönetmelik — FSEK m.31) ve uygulamadaki yeri.
# Kullanım: python ekim10-site.py            (ekim10/<kod>/ altında kayit.json + konu.json olan her sınav)
import html as _html, io, json, os, re, shutil, subprocess, sys
import fitz
sys.stdout.reconfigure(encoding='utf-8')
S = 'D:/GorselHafizaTeknikleriyleJSPS/scratchpad/'
sys.path.insert(0, S)
from ekim10_sinavlar import SINAVLAR, RUTBE_AD
SITE = 'D:/GorselHafizaTeknikleriyleJSPS/docs/jsps2026ekimanaliz/'
MASA = r"C:\Users\GIGABYTE\OneDrive\Desktop\JSPS 10 Ekim 2026\Site (yayimlanacak)"
CHROME = r"C:/Program Files/Google/Chrome/Application/chrome.exe"
FONT = r"C:\Windows\Fonts\segoeui.ttf"
FONTB = r"C:\Windows\Fonts\segoeuib.ttf"
HARF = 'ABCDE'
T = 80


def e(t):
    return _html.escape(str(t or '')).replace('\n', '<br>')


def sikistir(yer):
    out, prem, karma = [], 0, 0
    for y in yer:
        if y.startswith('Premium Deneme'): prem += 1; continue
        if y.startswith('Branşa göre karma deneme'): karma += 1; continue
        if y.startswith('Uygulamada değil'): continue
        out.append(y)
    if karma: out.append(f'Branşa göre karma denemeler ({karma} deneme)')
    if prem: out.append(f'Premium denemeler ({prem} deneme)')
    return out[:4]


def veri_kur(kod):
    K = json.load(open(S + f'ekim10/{kod}/kayit.json', encoding='utf-8'))
    KONU = json.load(open(S + f'ekim10/{kod}/konu.json', encoding='utf-8'))
    M1 = SINAVLAR[kod]['musterek'][1]
    out = []
    for k in K:
        kn = KONU[str(k['no'])]
        sorular = [x for x in k['bizde'] if x.get('tur') != 'kart'][:1 if k['durum'] == 'b' else 2]
        madde = next((x['metin'] for x in k['bizde'] if x.get('tur') == 'kart'), None)
        kartyer = next((x['yer'] for x in k['bizde'] if x.get('tur') == 'kart'), [])
        if k.get('kaynak') == 'kart' or k.get('yukselt') == 'kart':
            sorular = sorular[:1]  # belirleyici olan kart metni; bir destek sorusu yeter
        out.append({
            'no': k['no'], 'tip': 'birebir' if k['durum'] == 'b' else 'kismi', 'bolum': 'musterek' if k['no'] <= M1 else 'brans',
            'konu': kn['konu'], 'kaynak': kn.get('kaynak', ''),
            'kartta': bool(madde and (k.get('kaynak') == 'kart' or k.get('yukselt') == 'kart')),
            'madde': madde if (k.get('kaynak') == 'kart' or k.get('yukselt') == 'kart') else None,
            'sorular': [{'soru': x['soru'], 'siklar': x['siklar'], 'dogru': x['dogru'], 'aciklama': x.get('aciklama') or '',
                         'site': x.get('tur') == 'prova'} for x in sorular],
            'yer': sikistir((kartyer if (k.get('kaynak') == 'kart' or k.get('yukselt') == 'kart') else []) + sum((x['yer'] for x in sorular), [])),
        })
    return out


def olcum(kod, V):
    M0, M1 = SINAVLAR[kod]['musterek']
    f = lambda l, t: {'t': t, 'b': sum(x['tip'] == 'birebir' for x in l), 'k': sum(x['tip'] == 'kismi' for x in l)}
    mus = f([x for x in V if x['bolum'] == 'musterek'], M1 - M0 + 1)
    bra = f([x for x in V if x['bolum'] == 'brans'], 100 - M1)
    top = f(V, T)
    for d in (mus, bra, top): d['kar'] = d['b'] + d['k']; d['oran'] = d['kar'] / d['t'] * 100
    return mus, bra, top


yz = lambda x: f'{int(x * 10 + 0.5 + 1e-9) / 10:.1f}'.replace('.0', '').replace('.', ',')  # yarım yukarı (86,25 → 86,3)

CSS = """
@page{size:A4;margin:16mm 13mm 15mm 13mm}
*{box-sizing:border-box}
body{margin:0;font-family:"Segoe UI",Arial,sans-serif;color:#1B2A4A;background:#fff;font-size:9.6pt;line-height:1.45}
h1{font-family:Georgia,serif;font-size:27pt;line-height:1.16;margin:8mm 0 3mm;color:#0B1F3A}
h1 span{display:block;font-size:14pt;color:#B88917;margin-top:2mm}
.kapak{page-break-after:always}
.kust{font-size:7.6pt;letter-spacing:.28em;color:#B88917;font-weight:700}
.kalt{color:#6E6047;font-size:9.8pt;max-width:160mm}
.buyuk{display:flex;gap:6mm;margin:8mm 0 6mm;align-items:stretch}
.oran{flex:0 0 80mm;border:.5mm solid #C9A227;background:#FDFBF4;border-radius:3mm;padding:6mm;text-align:center}
.oran b{display:block;font-family:"Segoe UI",Arial,sans-serif;font-weight:800;font-size:50pt;line-height:.95;color:#2E7D32}
.oran span{display:block;font-size:8pt;letter-spacing:.22em;color:#6E6047;font-weight:700;margin-top:2mm}
.oran small{display:block;font-size:8.8pt;color:#6E6047;margin-top:3mm;line-height:1.5}
.oran small strong{color:#1E5720}
.yan{flex:1;display:flex;flex-direction:column;gap:4mm}
.ku{flex:1;border:.3mm solid #E7DCC7;border-radius:3mm;padding:5mm;background:#FFFCF5}
.ku b{display:block;font-family:"Segoe UI",Arial,sans-serif;font-weight:800;font-size:26pt;line-height:1;color:#0B1F3A}
.ku span{display:block;font-size:7.6pt;letter-spacing:.2em;color:#6E6047;font-weight:700;margin-top:1mm}
.ku small{display:block;font-size:8.4pt;color:#6E6047;margin-top:1.5mm}
table.ozet{width:100%;border-collapse:collapse;margin:2mm 0 6mm;font-size:9.2pt}
table.ozet th{text-align:left;font-size:7.6pt;letter-spacing:.14em;text-transform:uppercase;color:#6E6047;border-bottom:.3mm solid #E7DCC7;padding:2mm 3mm}
table.ozet td{padding:2.6mm 3mm;border-bottom:.2mm solid #EFE6D6}
table.ozet td.sy{text-align:right;font-variant-numeric:tabular-nums}
table.ozet td.yz{text-align:right;font-weight:700;color:#0B1F3A}
table.ozet tr.toplam td{background:#F3E7C1;font-weight:700;color:#8A5A12;border-bottom:none}
.notlar{border-top:.3mm solid #E7DCC7;padding-top:4mm;font-size:8.8pt;color:#6E6047}
.notlar p{margin:0 0 2.5mm}
.notlar b{color:#0B1F3A}
.bolumbar{background:#0B1F3A;color:#fff;font-family:Georgia,serif;font-size:13pt;padding:3mm 4mm;border-radius:2mm;margin:0 0 4mm;page-break-after:avoid}
.blok{border:.3mm solid #E7DCC7;border-radius:2.5mm;padding:4mm 4.5mm;margin:0 0 3.5mm;background:#FFFCF5;page-break-inside:avoid}
.ust{display:flex;align-items:center;gap:2.5mm;margin-bottom:2mm;flex-wrap:wrap}
.no{font-family:Georgia,serif;font-weight:700;font-size:11pt;color:#B88917}
.rozet{font-size:7.2pt;letter-spacing:.1em;font-weight:700;padding:.8mm 2.5mm;border-radius:6mm}
.r-bir{background:#EAF3EA;color:#1E5720}
.r-kis{background:#FBF1DC;color:#8A5A12}
.r-kart{background:#E8EEF7;color:#173B6B}
.kunye{margin-left:auto;font-size:8.2pt;color:#6E6047;background:#F7F3EA;border:.2mm solid #E7DCC7;padding:.6mm 2.2mm;border-radius:1.5mm}
.olcu{font-size:9.4pt;color:#0B1F3A;font-weight:700;margin:0 0 2.5mm;padding-left:2.5mm;border-left:.8mm solid #C9A227}
.olcu small{display:block;font-weight:500;font-size:7.6pt;letter-spacing:.12em;color:#6E6047;text-transform:uppercase}
.biz+.biz{margin-top:3mm;padding-top:3mm;border-top:.2mm dashed #E7DCC7}
.etk{font-size:7.4pt;letter-spacing:.12em;color:#6E6047;font-weight:700;margin-bottom:1mm}
.kok{font-weight:600;margin-bottom:2mm}
ul.sik{list-style:none;margin:0;padding:0}
ul.sik li{padding:1.3mm 2.5mm;border-radius:1.5mm;margin-bottom:.9mm;background:#F7F3EA}
ul.sik li.dg{background:#EAF3EA;color:#1E5720;font-weight:600}
.h{font-weight:700;color:#6E6047;margin-right:1.5mm}
.dg .h{color:#2E7D32}
.tik{float:right;color:#2E7D32;font-weight:700;font-size:8.4pt}
.acik{margin-top:2mm;padding-top:1.8mm;border-top:.2mm dashed #E7DCC7;font-size:8.6pt;color:#6E6047}
.acik b{color:#0B1F3A}
.madde{background:#fff;border-left:.8mm solid #173B6B;padding:2mm 3mm;border-radius:1mm;font-size:8.9pt;margin-bottom:2mm}
.yer{margin-top:2mm;font-size:8pt;color:#173B6B}
.yer b{color:#0B1F3A}
"""


def pdf(kod, V):
    cfg = SINAVLAR[kod]; M0, M1 = cfg['musterek']
    mus, bra, top = olcum(kod, V)
    kart = sum(x['kartta'] for x in V)
    satir = ''.join(f'<tr{" class=toplam" if s else ""}><td>{a}</td><td class="sy">{d["t"]}</td><td class="sy">{d["b"]}</td><td class="sy">{d["k"]}</td><td class="yz">%{yz(d["oran"])}</td></tr>'
                    for a, d, s in ((f'Müşterek Mevzuat ({M0}–{M1})', mus, False), (f'{cfg["brans"]} ({M1 + 1}–100)', bra, False), ('Toplam', top, True)))
    kapak = f'''<div class="kapak">
 <div class="kust">MEVZU JSPS · mevzujsps.com</div>
 <h1>{e(cfg["baslik"])}<span>10 Ekim 2026 · Tutturduğumuz Sorular</span></h1>
 <div class="kalt">Sınavın 80 mevzuat sorusu, uygulamamızdaki soru bankası, madde kartları ve sitemizdeki sınav provalarıyla tek tek karşılaştırıldı. Bu kitapta karşılığı bizde çıkan soruların tamamı var.</div>
 <div class="buyuk">
  <div class="oran"><b>%{yz(top["oran"])}</b><span>KARŞILIK ORANI</span>
   <small>80 mevzuat sorusunun <strong>{top["kar"]}</strong> tanesinin karşılığı bizde vardı<br><strong>{top["b"]}</strong> birebir · <strong>{top["k"]}</strong> kısmi · {T - top["kar"]} soruda karşılık yok</small></div>
  <div class="yan">
   <div class="ku"><b>{mus["kar"]}<span style="display:inline;font-size:12pt;letter-spacing:0"> / {mus["t"]}</span></b><span>MÜŞTEREK</span><small>%{yz(mus["oran"])}</small></div>
   <div class="ku"><b>{bra["kar"]}<span style="display:inline;font-size:12pt;letter-spacing:0"> / {bra["t"]}</span></b><span>BRANŞ</span><small>%{yz(bra["oran"])}</small></div>
  </div>
 </div>
 <table class="ozet"><tr><th>Bölüm</th><th style="text-align:right">Soru</th><th style="text-align:right">Birebir</th><th style="text-align:right">Kısmi</th><th style="text-align:right">Oran</th></tr>{satir}</table>
 <div class="notlar">
  <p><b>Bu kitapta ne var?</b> Sorular <b>bize aittir</b> (Mevzu JSPS soru bankası ve sitemizdeki sınav provaları). Sınav sorularının metni ve şıkları <b>yayımlanmaz</b>; her başlıkta yalnızca sınavda hangi bilginin ölçüldüğü kendi cümlemizle yazılıdır.</p>
  <p><b>Birebir</b>: bizdeki soru (ya da madde kartı) sınavdaki doğru cevabı tek başına buldurur. <b>Kısmi</b>: bilgi bizde var ama iki kaynağı birleştirmek gerekir ya da şıkları ikiye indirir.{f" <b>{kart}</b> soruda cevap uygulamadaki madde kartının metninde; o sorularda madde metni de verildi." if kart else ""}</p>
  <p>İlk 20 soru (genel kültür / genel yetenek) uygulamanın kapsamı dışında olduğu için değerlendirmeye alınmadı.</p>
 </div>
</div>'''
    par, son = [], None
    for x in V:
        b = 'Müşterek Mevzuat' if x['bolum'] == 'musterek' else cfg['brans']
        if b != son: par.append(f'<div class="bolumbar">{e(b)}</div>'); son = b
        rz = '<span class="rozet r-bir">BİREBİR</span>' if x['tip'] == 'birebir' else '<span class="rozet r-kis">KISMİ</span>'
        if x['kartta']: rz += '<span class="rozet r-kart">MADDE KARTI</span>'
        ic = ''
        if x['madde']:
            ic += f'<div class="biz"><div class="etk">UYGULAMADAKİ MADDE KARTI</div><div class="madde">{e(x["madde"])}</div></div>'
        for s in x['sorular']:
            sik = ''.join(f'<li class="{"dg" if i == s["dogru"] else ""}"><span class="h">{HARF[i]})</span>{e(t)}' + ('<span class="tik">✓ doğru</span>' if i == s['dogru'] else '') + '</li>'
                          for i, t in enumerate(s['siklar']))
            ic += (f'<div class="biz"><div class="etk">{"SİTEMİZDEKİ SINAV PROVASINDAN" if s["site"] else "UYGULAMADAKİ SORUMUZ"}</div><div class="kok">{e(s["soru"])}</div><ul class="sik">{sik}</ul>'
                   + (f'<div class="acik"><b>Dayanak.</b> {e(s["aciklama"])}</div>' if s['aciklama'] else '') + '</div>')
        yer = f'<div class="yer"><b>Uygulamada:</b> {" · ".join(e(y) for y in x["yer"])}</div>' if x['yer'] else ''
        par.append(f'''<div class="blok"><div class="ust"><span class="no">{x["no"]}</span>{rz}{f'<span class="kunye">{e(x["kaynak"])}</span>' if x["kaynak"] else ""}</div>
 <div class="olcu"><small>Sınavda ölçülen konu</small>{e(x["konu"])}</div>{ic}{yer}</div>''')
    hp = S + f'_site_{kod}.html'
    io.open(hp, 'w', encoding='utf-8').write('<!doctype html><html lang=tr><head><meta charset=utf-8><style>' + CSS + '</style></head><body>' + kapak + ''.join(par) + '</body></html>')
    ara = S + f'_site_{kod}_ham.pdf'
    subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--no-pdf-header-footer', f'--print-to-pdf={ara}', 'file:///' + hp], capture_output=True, timeout=600)
    d = fitz.open(ara)
    ust = f'{cfg["baslik"]} · 10 Ekim 2026 · tutturduğumuz sorular'
    for i, pg in enumerate(d):
        if i == 0: continue
        W, Hh = pg.rect.width, pg.rect.height
        pg.draw_line(fitz.Point(34, 28), fitz.Point(W - 34, 28), color=(0.91, 0.86, 0.78), width=0.7)
        pg.insert_text(fitz.Point(34, 24), ust, fontsize=7.4, fontname='sg', fontfile=FONT, color=(0.55, 0.49, 0.36))
        pg.draw_rect(fitz.Rect(W - 58, Hh - 32, W - 32, Hh - 17), color=None, fill=(0.043, 0.122, 0.227), radius=0.25)
        pg.insert_text(fitz.Point(W - 52, Hh - 21), f'{i + 1}', fontsize=8.5, fontname='sgb', fontfile=FONTB, color=(1, 1, 1))
        pg.insert_text(fitz.Point(34, Hh - 21), 'Mevzu JSPS · mevzujsps.com', fontsize=7.2, fontname='sg', fontfile=FONT, color=(0.55, 0.49, 0.36))
    os.makedirs(SITE + 'pdf', exist_ok=True); os.makedirs(MASA, exist_ok=True)
    out = SITE + f'pdf/{kod}.pdf'
    d.save(out, garbage=3, deflate=True)
    shutil.copy(out, os.path.join(MASA, f'{cfg["dosya"]} - Tutturdugumuz Sorular.pdf'))
    for n in (0, 1):
        if n < len(d): d[n].get_pixmap(dpi=60).save(S + f'_site_on_{kod}_{n}.png')
    print(f'{kod:16} {len(V)} soru · {len(d)} sayfa · %{yz(top["oran"])}')
    n = len(d); d.close()
    return mus, bra, top


def sayfa(OL):
    tpl = open(S + 'ekim10-site-sablon.html', encoding='utf-8').read()
    rut = {}
    for kod, cfg in SINAVLAR.items():
        if kod in OL: rut.setdefault(cfg['rutbe'], {'ad': RUTBE_AD[cfg['rutbe']], 'branslar': []})['branslar'].append([kod, cfg['kisa']])
    ol = {kod: {'ad': SINAVLAR[kod]['ad'], 'oran': yz(t['oran']), 'kar': t['kar'], 'bir': t['b'], 'kis': t['k'], 'yok': T - t['kar']} for kod, (m, b, t) in OL.items()}
    io.open(SITE + 'index.html', 'w', encoding='utf-8').write(
        tpl.replace('__RUTBELER__', json.dumps(rut, ensure_ascii=False)).replace('__OLCUM__', json.dumps(ol, ensure_ascii=False)))


if __name__ == '__main__':
    os.makedirs(SITE + 'veri', exist_ok=True)
    OL = {}
    for kod in SINAVLAR:
        if not (os.path.exists(S + f'ekim10/{kod}/kayit.json') and os.path.exists(S + f'ekim10/{kod}/konu.json')):
            print('atlandı (veri yok):', kod); continue
        V = veri_kur(kod)
        json.dump(V, open(SITE + f'veri/{kod}.json', 'w', encoding='utf-8'), ensure_ascii=False)
        OL[kod] = pdf(kod, V)
    sayfa(OL)
    print('sayfa:', SITE + 'index.html', list(OL))
