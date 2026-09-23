"""ALTIN ÖZET kitabı: giris.md + ozet_A..D.md → HTML → Chrome PDF → PyMuPDF (sayfa no, yer imi)."""
import re, io, os, html as H, subprocess, fitz, sys
sys.stdout.reconfigure(encoding='utf-8')
S = 'C:/Users/GIGABYTE/AppData/Local/Temp/claude/D--GorselHafizaTeknikleriyleJSPS/7dde7236-e3e5-4bef-9ec6-05f83f966efa/scratchpad/altin/'
CHROME = r'C:/Program Files/Google/Chrome/Application/chrome.exe'
FONT = r'C:/Windows/Fonts/segoeui.ttf'
OUT = 'C:/Users/GIGABYTE/OneDrive/Desktop/JSPS 2026 - ALTIN OZET (Musterek + MEBS).pdf'

def satir_ici(t):
    t = H.escape(t)
    t = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', t)
    t = re.sub(r'(?<!\*)\*(?!\*)(.+?)\*(?!\*)', r'<i>\1</i>', t)
    t = re.sub(r'`(.+?)`', r'<code>\1</code>', t)
    t = t.replace('★ çıkmış', '<span class="cip cikmis">★ ÇIKMIŞ</span>').replace('★ 2024', '<span class="cip cikmis">★ 2024 SINAVI</span>').replace('★çıkmış', '<span class="cip cikmis">★ ÇIKMIŞ</span>')
    t = re.sub(r'(<i>Tuzak:?</i>|<b>Tuzak:?</b>|Tuzak:)', '<span class="tuzak">Tuzak:</span>', t)
    return t

def md2html(md):
    out = []; i = 0; sat = md.split('\n'); liste = None
    def kapat():
        nonlocal liste
        if liste: out.append(f'</{liste}>'); liste = None
    while i < len(sat):
        l = sat[i].rstrip()
        if l.startswith('|') and i + 1 < len(sat) and re.match(r'^\|?\s*:?-{2,}', sat[i + 1]):
            kapat(); bas = [c.strip() for c in l.strip('|').split('|')]; i += 2
            rows = []
            while i < len(sat) and sat[i].strip().startswith('|'):
                rows.append([c.strip() for c in sat[i].strip().strip('|').split('|')]); i += 1
            out.append('<table><thead><tr>' + ''.join(f'<th>{satir_ici(c)}</th>' for c in bas) + '</tr></thead><tbody>' +
                       ''.join('<tr>' + ''.join(f'<td>{satir_ici(c)}</td>' for c in r) + '</tr>' for r in rows) + '</tbody></table>')
            continue
        m = re.match(r'^(#{1,4})\s+(.*)', l)
        if m:
            kapat(); n = len(m.group(1)); t = m.group(2).strip()
            kimlik = re.sub(r'[^a-z0-9]+', '-', t.lower())[:60]
            out.append(f'<h{n} id="{kimlik}">{satir_ici(t)}</h{n}>')
        elif re.match(r'^\s*[-*•]\s+', l):
            if liste != 'ul': kapat(); out.append('<ul>'); liste = 'ul'
            out.append(f'<li>{satir_ici(re.sub(r"^\s*[-*•]\s+", "", l))}</li>')
        elif re.match(r'^\s*\d+[.)]\s+', l):
            if liste != 'ol': kapat(); out.append('<ol>'); liste = 'ol'
            out.append(f'<li>{satir_ici(re.sub(r"^\s*\d+[.)]\s+", "", l))}</li>')
        elif l.strip() == '' or l.strip() == '---':
            kapat()
            if l.strip() == '---': out.append('<hr>')
        else:
            kapat(); out.append(f'<p>{satir_ici(l)}</p>')
        i += 1
    kapat(); return '\n'.join(out)

bolumler = [('giris', 'Sınavı Yapan Kurumun Soru Mantığı'), ('ozet_A', 'Müşterek Mevzuat I — Kanunlar (1-7)'), ('ozet_B', 'Müşterek Mevzuat II — Kanunlar (8-14)'),
            ('ozet_C', 'Müşterek Mevzuat III — Yönetmelikler ve 6136'), ('ozet_D', 'MEBS Branş Mevzuatı')]
govde = ''; icindekiler = []
for dosya, baslik in bolumler:
    p = S + dosya + '.md'
    if not os.path.exists(p): print('EKSİK:', p); continue
    md = io.open(p, encoding='utf-8').read()
    basliklar = re.findall(r'^##\s+(.+)$', md, re.M)
    icindekiler.append((baslik, basliklar))
    govde += f'<section class="bolum"><div class="bolum-kapak"><div class="bolum-etiket">BÖLÜM</div><h1>{H.escape(baslik)}</h1></div>{md2html(md)}</section>'

ic_html = ''.join(f'<div class="ic-bolum">{H.escape(b)}</div>' + ''.join(f'<div class="ic-satir">{H.escape(re.sub(r" — Sınav kapsamı.*$", "", x))}</div>' for x in alt) for b, alt in icindekiler)
HTML = f'''<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>JSPS 2026 Altın Özet</title><style>
@page {{ size: A4; margin: 16mm 14mm 18mm; }}
body {{ font-family: "Segoe UI", Arial, sans-serif; font-size: 9.8pt; color: #1B2A4A; line-height: 1.42; }}
.kapak {{ height: 250mm; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; background: #0B1F3A; color: #F7F3EA; border-radius: 4mm; page-break-after: always; padding: 20mm; }}
.kapak .ust {{ color: #C9A227; letter-spacing: .25em; font-size: 11pt; font-weight: 700; }}
.kapak h1 {{ font-size: 34pt; margin: 8mm 0 3mm; color: #fff; }} .kapak h2 {{ font-size: 15pt; font-weight: 500; color: #F3E7C1; margin: 0 0 12mm; }}
.kapak .alt {{ font-size: 9.5pt; color: #E7DCC7; line-height: 1.7; }}
.ic {{ page-break-after: always; }} .ic h1 {{ color: #0B1F3A; }} .ic-bolum {{ font-weight: 800; color: #B88917; margin: 4mm 0 1mm; letter-spacing: .06em; }} .ic-satir {{ padding-left: 5mm; border-left: 2px solid #E7DCC7; margin: .5mm 0; }}
.bolum-kapak {{ page-break-before: always; background: #F3E7C1; border-left: 5mm solid #C9A227; padding: 6mm 8mm; margin: 0 0 6mm; }} .bolum-etiket {{ color: #B88917; letter-spacing: .25em; font-size: 9pt; font-weight: 700; }}
.bolum-kapak h1 {{ margin: 1mm 0 0; font-size: 20pt; color: #0B1F3A; }}
h2 {{ font-size: 14.5pt; color: #fff; background: #0B1F3A; padding: 2.2mm 4mm; border-radius: 2mm; margin: 8mm 0 3mm; page-break-after: avoid; }}
h3 {{ font-size: 11pt; color: #B88917; border-bottom: 1.5px solid #C9A227; margin: 5mm 0 2mm; padding-bottom: .8mm; page-break-after: avoid; }}
h4 {{ font-size: 10pt; color: #173B6B; margin: 3mm 0 1mm; }}
ul, ol {{ margin: 1mm 0 2mm; padding-left: 5.5mm; }} li {{ margin: .7mm 0; }} li b {{ color: #0B1F3A; }}
table {{ border-collapse: collapse; width: 100%; margin: 2mm 0 3mm; font-size: 9.2pt; page-break-inside: auto; }} th {{ background: #0B1F3A; color: #fff; text-align: left; padding: 1.5mm 2mm; }} td {{ border-bottom: 1px solid #E7DCC7; padding: 1.3mm 2mm; vertical-align: top; }} tr {{ page-break-inside: avoid; }} tbody tr:nth-child(even) td {{ background: #FBF7EE; }}
.cip {{ display: inline-block; font-size: 7.5pt; font-weight: 800; border-radius: 2mm; padding: 0 1.6mm; color: #fff; background: #C00000; vertical-align: middle; }}
.tuzak {{ color: #C00000; font-weight: 700; }}
p {{ margin: 1.2mm 0; }} hr {{ border: 0; border-top: 1px solid #E7DCC7; margin: 3mm 0; }} code {{ background: #EFE6D6; padding: 0 1mm; border-radius: 1mm; }}
</style></head><body>
<div class="kapak"><div class="ust">JSPS 2026 · SINAVA 2 GÜN</div><h1>ALTIN ÖZET</h1><h2>Müşterek Mevzuat (25) + MEBS Branş Mevzuatı (9)</h2>
<div class="alt">Sınavı yapan kurumun soru mantığı · 26 çıkmış JSPS kitapçığı (2.336 soru) · 19 Ekim 2024 MEBS kitapçığı (100 soru, kaynaklı)<br>Bu yılın emri (Ek-1, 21 Mayıs 2026) madde kapsamıyla sınırlı · Resmî madde metinlerine sadık<br><br>Mevzu JSPS · {__import__('datetime').date.today().strftime('%d.%m.%Y')}</div></div>
<div class="ic"><h1>İçindekiler</h1>{ic_html}</div>
{govde}
</body></html>'''
hp = S + '_kitap.html'; io.open(hp, 'w', encoding='utf-8').write(HTML)
subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--no-pdf-header-footer', f'--print-to-pdf={S}_kitap.pdf', 'file:///' + hp], capture_output=True, timeout=300)
d = fitz.open(S + '_kitap.pdf')
toc = []
for i, pg in enumerate(d):
    if i >= 2:
        pg.insert_text(fitz.Point(pg.rect.width - 60, pg.rect.height - 22), f'{i + 1}', fontsize=8, fontname='sg', fontfile=FONT, color=(0.43, 0.38, 0.28))
        pg.insert_text(fitz.Point(40, pg.rect.height - 22), 'JSPS 2026 · ALTIN ÖZET · Mevzu JSPS', fontsize=7.5, fontname='sg', fontfile=FONT, color=(0.43, 0.38, 0.28))
    for b in pg.get_text('dict')['blocks']:
        for l in b.get('lines', []):
            for sp in l['spans']:
                if sp['size'] >= 19 and sp['flags'] & 16 and i >= 2: toc.append([1, sp['text'].strip(), i + 1])
                elif 14 <= sp['size'] < 16 and i >= 2 and sp['text'].strip() and not sp['text'].strip().isdigit():
                    if toc and toc[-1][0] == 2 and toc[-1][2] == i + 1 and toc[-1][1].endswith(('—', '-')): toc[-1][1] += ' ' + sp['text'].strip()
                    else: toc.append([2, sp['text'].strip()[:90], i + 1])
try: d.set_toc(toc)
except Exception as e: print('toc hata', e)
d.save(OUT, garbage=3, deflate=True)
print('SAYFA:', len(d), '→', OUT)
d[3].get_pixmap(dpi=60).save(S + '_onizleme_4.png'); d[len(d) // 2].get_pixmap(dpi=60).save(S + '_onizleme_orta.png')
