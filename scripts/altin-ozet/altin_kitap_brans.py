"""ALTIN ÖZET v2 — kart tasarımı, sözlük, cari başlık, yer imi.
giris.md + sozluk.md + ozet_A..D(_sade).md → HTML → Chrome PDF → PyMuPDF (cari başlık, sayfa no, yer imi)."""
import re, io, os, json, html as H, subprocess, fitz, sys, datetime
sys.stdout.reconfigure(encoding='utf-8')
BURA = os.path.dirname(os.path.abspath(__file__)).replace(chr(92), '/')
S = BURA + '/icerik/'
GECICI = BURA + '/_gecici/'
os.makedirs(GECICI, exist_ok=True)
CHROME = r'C:/Program Files/Google/Chrome/Application/chrome.exe'
FONT = r'C:/Windows/Fonts/segoeui.ttf'
FONTB = r'C:/Windows/Fonts/segoeuib.ttf'
# Başkan (23 Eyl 2026): "her branş için 2 kitap görünsün — müşterek zaten herkese aynı tek
# kitap, bir de herkese ayrıca branş kitabı." Yani birleşik kitap ARTIK ÜRETİLMİYOR:
#   python altin_kitap_brans.py musterek        → herkese aynı müşterek kitabı
#   python altin_kitap_brans.py havacilik       → yalnız branş kitabı
#   python altin_kitap_brans.py havacilik ikili → eski birleşik sürüm (gerekirse)
BRANS = (sys.argv[1] if len(sys.argv) > 1 else 'musterek').strip().lower()
BIRLESIK = len(sys.argv) > 2 and sys.argv[2] == 'ikili'
SADECE_MUSTEREK = BRANS == 'musterek'
YALNIZ_BRANS = not SADECE_MUSTEREK and not BIRLESIK
# Branş bölümü: (içerik dosyası, kapaktaki ad, bölüm başlığı, bölüm alt açıklaması)
BRANSLAR = {
  'mebs': ('ozet_D', 'MEBS', 'MEBS Branş Mevzuatı',
           'Elektronik Haberleşme · Yetkilendirme · Taşınır Mal · Harcama Belgeleri · Kriptolu Haberleşme · Telsiz · 2019/12 · 2024/7 · Güvenlik Rehberi'),
  'havacilik': ('ozet_E_havacilik', 'Havacilik', 'Havacılık Branş Mevzuatı',
                'Uçuş-Paraşüt-Dalış Tazminat Kanunu · Türk Sivil Havacılık Kanunu · Sağlık Yeteneği Yönetmeliği (uçucular)'),
  'jandarma': ('ozet_J_jandarma', 'Jandarma', 'Jandarma Branş Mevzuatı',
               'CMK · Kolluk yetkileri · Kaçakçılık · Uyuşturucu · Çocuk Koruma · Yabancılar · Trafik · Çevre-Orman-Av · Kültür Varlıkları · Silah mevzuatı · Uygulama yönetmelikleri · TCK (branş)'),
  'personel': ('ozet_P_personel', 'Personel', 'Personel Branş Mevzuatı',
               'Uzman Erbaş · Uzman Jandarma · Askeralma · 657 · 926 · 5510 · Kimlik Kartı · Şehitlik · Kıyafet · Orduevleri · Kantin · Atama Yön. · Astsubay Sicil · Subay Sicil'),
}
if not SADECE_MUSTEREK and BRANS not in BRANSLAR:
    print('bilinmeyen brans:', BRANS, '- tanimli:', ', '.join(BRANSLAR)); raise SystemExit(1)
MASA = 'C:/Users/GIGABYTE/OneDrive/Desktop/'
if SADECE_MUSTEREK: OUT = MASA + 'JSPS 2026 - ALTIN OZET (MUSTEREK).pdf'
elif YALNIZ_BRANS: OUT = MASA + 'JSPS 2026 - ALTIN OZET (' + BRANSLAR[BRANS][1] + ').pdf'
else: OUT = MASA + 'JSPS 2026 - ALTIN OZET (Musterek + ' + BRANSLAR[BRANS][1] + ').pdf'

def ici(t):
    t = H.escape(t)
    t = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', t)
    t = re.sub(r'(?<!\*)\*(?!\*)(.+?)\*(?!\*)', r'<i>\1</i>', t)
    t = re.sub(r'`(.+?)`', r'<code>\1</code>', t)
    # madde referansı vurgusu: (m.21/2) (m.3/1-a) (Ek m.14)
    t = re.sub(r'\((m\.[^)]{1,24}|Ek m\.[^)]{1,20}|Geçici m\.[^)]{1,20})\)', r'<span class="mad">\1</span>', t)
    return t

def nokta_html(l):
    """- ★ çıkmış **Başlık** — hüküm (m.x) · **Ne demek:** ... · *Örnek:* ... · *Tuzak:* ..."""
    ham = re.sub(r'^\s*[-*•]\s+', '', l)
    cikmis = bool(re.match(r'^★\s*(çıkmış|20\d\d)', ham))
    etiket = ''
    m = re.match(r'^★\s*(çıkmış[^\s*]*|20\d\d)\s*(\([^)]*\))?\s*', ham)
    if m:
        yil = re.match(r'^(20\d\d)$', m.group(1))
        etiket = ('★ ' + yil.group(1) + ' SINAVI') if yil else '★ ÇIKMIŞ'
        ham = ham[m.end():]
    # segmentlere ayır
    parca = re.split(r'\s+·\s+', ham)
    bas, govde, yani, ornek, tuzak = '', [], [], [], []
    for i, p in enumerate(parca):
        p = p.strip()
        if re.match(r'^\*?\*?Tuzak:?\*?\*?', p, re.I): tuzak.append(re.sub(r'^\*?\*?Tuzak:?\*?\*?\s*', '', p, flags=re.I))
        elif re.match(r'^\*?\*?Ne demek:?\*?\*?', p, re.I): yani.append(re.sub(r'^\*?\*?Ne demek:?\*?\*?\s*', '', p, flags=re.I))
        elif re.match(r'^\*?\*?Örnek:?\*?\*?', p, re.I): ornek.append(re.sub(r'^\*?\*?Örnek:?\*?\*?\s*', '', p, flags=re.I))
        elif i == 0:
            mm = re.match(r'^\*\*(.+?)\*\*\s*(?:—|–|-)\s*(.*)$', p, re.S)
            if mm: bas, kalan = mm.group(1), mm.group(2)
            else: kalan = p
            if kalan.strip(): govde.append(kalan)
        else: govde.append(p)
    h = f'<div class="nokta{" cikmis" if cikmis else ""}">'
    if bas or etiket:
        h += '<div class="nb">'
        if etiket: h += f'<span class="rozet">{etiket}</span>'
        if bas: h += f'<span class="nbas">{ici(bas)}</span>'
        h += '</div>'
    if govde: h += f'<div class="ng">{ici(" · ".join(govde))}</div>'
    for y in yani: h += f'<div class="ny"><span class="et">NE DEMEK</span>{ici(y)}</div>'
    for o in ornek: h += f'<div class="no"><span class="et">ÖRNEK</span>{ici(o)}</div>'
    for t in tuzak: h += f'<div class="nt"><span class="et">TUZAK</span>{ici(t)}</div>'
    return h + '</div>'

def md2html(md):
    out = []; i = 0; sat = md.split('\n'); liste = None
    def kapat():
        nonlocal liste
        if liste: out.append(f'</{liste}>'); liste = None
    while i < len(sat):
        l = sat[i].rstrip()
        if l.startswith('|') and i + 1 < len(sat) and re.match(r'^\|?\s*:?-{2,}', sat[i + 1]):
            kapat(); bas = [c.strip() for c in l.strip('|').split('|')]; i += 2; rows = []
            while i < len(sat) and sat[i].strip().startswith('|'):
                rows.append([c.strip() for c in sat[i].strip().strip('|').split('|')]); i += 1
            out.append('<table><thead><tr>' + ''.join(f'<th>{ici(c)}</th>' for c in bas) + '</tr></thead><tbody>' +
                       ''.join('<tr>' + ''.join(f'<td>{ici(c)}</td>' for c in r) + '</tr>' for r in rows) + '</tbody></table>')
            continue
        m = re.match(r'^(#{1,4})\s+(.*)', l)
        if m:
            kapat(); n = len(m.group(1)); t = m.group(2).strip()
            if n == 2:
                ad, _, kap = t.partition('—')
                out.append(f'<div class="kanun"><div class="kanun-ad">{ici(ad.strip())}</div>' +
                           (f'<div class="kanun-kap">{ici(kap.strip())}</div>' if kap.strip() else '') + '</div>')
            else:
                out.append(f'<h{n}>{ici(t)}</h{n}>')
        elif re.match(r'^\s*[-*•]\s+', l):
            govde = re.sub(r'^\s*[-*•]\s+', '', l)
            if re.search(r'\bTuzak:|\bNe demek:|^\*\*|★', govde):
                kapat(); out.append(nokta_html(l))
            else:
                if liste != 'ul': kapat(); out.append('<ul>'); liste = 'ul'
                out.append(f'<li>{ici(govde)}</li>')
        elif re.match(r'^\s*\d+[.)]\s+', l):
            if liste != 'ol': kapat(); out.append('<ol>'); liste = 'ol'
            out.append(f'<li>{ici(re.sub(r"^\s*\d+[.)]\s+", "", l))}</li>')
        elif l.strip().startswith('>'):
            kapat(); out.append(f'<div class="not">{ici(l.strip().lstrip(">").strip())}</div>')
        elif l.strip() == '' or l.strip() == '---':
            kapat()
        else:
            kapat(); out.append(f'<p>{ici(l)}</p>')
        i += 1
    kapat(); return '\n'.join(out)

def dosya(ad):
    aday = ([S + ad + '_m.md'] if SADECE_MUSTEREK else []) + [S + ad + '_sade.md', S + ad + '.md']
    for c in aday:
        if os.path.exists(c): return c, ('_sade' in c or '_m' in c)
    return None, False

MUSTEREK_BOLUMLER = [
            ('giris', 'Sınavı Yapan Kurumun Soru Mantığı', 'Bu yıl soruları ATA-AÖF yazıyor. Kurumun üslubu ve eski JSPS kitapçıklarının kalıpları.'),
            ('sozluk', 'Mevzuat Dilinin Sözlüğü', 'Kitapta geçen hukuk terimlerinin günlük Türkçe karşılığı. Anlamadığınız satırda buraya dönün.'),
            ('ozet_A', 'Müşterek Mevzuat I — Yedi Kanun', 'Türk Ceza Kanunu · Jandarma Teşkilat Kanunu · KVKK · Tebligat · İl İdaresi · Kabahatler · Terörle Mücadele'),
            ('ozet_B', 'Müşterek Mevzuat II — Yedi Kanun', 'Olağanüstü Hal · Atatürk Aleyhine Suçlar · Ailenin Korunması · Türk Bayrağı · Disiplin · Sözleşmeli Sb/Asb · Elektronik İmza'),
            ('ozet_C', 'Müşterek Mevzuat III — Yönetmelikler ve Ateşli Silahlar', 'Resmî Yazışma · Sözleşmeli Yön. · Jandarma Teşkilat Yön. · Veri Silme · Bilgi Edinme · Av Tüfekleri · 6284 Uygulama · Personel · Hizmet Esasları · İzin · 6136'),
            ]
# Branş kitabı TEK BAŞINA basılır (başkanın ikili düzeni): müşterek bölümleri girmez.
# Sözlük her iki kitapta da lazım — branş kitabını tek başına okuyan da terimlere takılıyor.
if YALNIZ_BRANS:
    dos_b, _ad_b, bas_b, alt_b = BRANSLAR[BRANS]
    bolumler = [('sozluk', 'Mevzuat Dilinin Sözlüğü',
                 'Kitapta geçen hukuk terimlerinin günlük Türkçe karşılığı. Anlamadığınız satırda buraya dönün.'),
                (dos_b, bas_b, alt_b)]
else:
    bolumler = list(MUSTEREK_BOLUMLER)
    if not SADECE_MUSTEREK:
        dos_b, _ad_b, bas_b, alt_b = BRANSLAR[BRANS]
        bolumler.append((dos_b, bas_b, alt_b))
def sayim(md):
    """Bir bölümün gerçek sayıları: kaç mevzuat, kaç altın nokta, kaçı çıkmışta sorulmuş.
    Sayım HTML'den değil METİNDEN yapılır: HTML'de 'nasıl soruluyor' ve 'tuzaklar'
    satırları da nokta kartına dönüşüyor, onları altın nokta saymak kapağı şişiriyordu."""
    mevzuat = len(re.findall(r'^##\s+.*Sınav kapsamı', md, re.M))
    nokta = cikmis = 0; icinde = False
    for l in md.split('\n'):
        if l.startswith('###'): icinde = l.strip().startswith('### Altın noktalar'); continue
        if l.startswith('##'): icinde = False; continue
        if icinde and re.match(r'^\s*[-*•]\s+', l):
            nokta += 1
            if '★' in l[:60]: cikmis += 1
    return mevzuat, nokta, cikmis

govde = ''; ic = []; sade_sayisi = 0
sy_mevzuat = sy_nokta = sy_cikmis = 0; sy_brans_mevzuat = 0
for dos, baslik, alt in bolumler:
    p, sade = dosya(dos)
    if not p: print('EKSİK:', dos); continue
    if sade: sade_sayisi += 1
    md = io.open(p, encoding='utf-8').read()
    md = re.sub(r'^#\s+.*$', '', md, count=1, flags=re.M)  # dosya içi H1'i at
    if SADECE_MUSTEREK:
        # Müşterek kitapta "MEBS" etiketi görünmesin: 2024 kitapçığı zaten Subay MEBS kitapçığıydı
        # ama buradaki atıflar MÜŞTEREK sorulara ait → kaynağı "2024 sınavı" diye adlandır.
        for a, b in [('MEBS 2024', '2024 sınavı'), ('MEBS-2024', '2024 sınavı'), ('MEBS kitapçığı', '2024 kitapçığı'),
                     ('MEBS kitapçığında', '2024 kitapçığında'), ("MEBS'in", '2024 sınavının'), ("MEBS'te", '2024 sınavında'),
                     ('MEBS sorusu', '2024 sorusu'), ('MEBS', '2024 sınavı')]:
            md = md.replace(a, b)
        md = md.replace('2024 sınavı 2024', '2024').replace('2024 sınavı sınavı', '2024 sınavı')
    _m, _n, _c = sayim(md)
    sy_mevzuat += _m; sy_nokta += _n; sy_cikmis += _c
    if not SADECE_MUSTEREK and dos == BRANSLAR[BRANS][0]: sy_brans_mevzuat = _m
    ic.append((baslik, re.findall(r'^##\s+(.+)$', md, re.M)))
    govde += (f'<section><div class="bkapak"><div class="bet">BÖLÜM</div><h1>{H.escape(baslik)}</h1>'
              f'<div class="balt">{H.escape(alt)}</div></div>{md2html(md)}</section>')

ic_html = ''.join(f'<div class="icb">{H.escape(b)}</div>' + ''.join(
    f'<div class="ics">{H.escape(re.sub(r"\s*—\s*Sınav kapsamı.*$", "", x))}</div>' for x in alt) for b, alt in ic)
bugun = datetime.date.today().strftime('%d.%m.%Y')

# --- KAPAK RAKAMLARI: elle yazılmaz, basılan kitabın kendisinden SAYILIR -----------------
# (Eski sürümde sabit yazılıydı; kitap büyüyünce kapak yalan söylüyordu.)
def bin_ayrac(n): return f'{n:,}'.replace(',', '.')
altin_nokta = sy_nokta
cikmis_nokta = sy_cikmis
mevzuat_sayisi = sy_mevzuat
brans_sayisi = sy_brans_mevzuat
musterek_sayisi = mevzuat_sayisi - brans_sayisi
try:
    # Referans profili = kitabın giriş bölümündeki istatistiklerin kaynağı. Kapak ile giriş
    # aynı rakamı göstersin diye ham soru dosyası değil BU okunur.
    _ref = json.load(io.open(BURA + '/../cikmis-referans.json', encoding='utf-8'))
    incelenen_soru = _ref['toplamAyristirilan']; incelenen_kitapcik = len(_ref['kitapciklar'])
except Exception:
    incelenen_soru = incelenen_kitapcik = 0
if SADECE_MUSTEREK:
    kapak_alt = f'Müşterek Mevzuat — {musterek_sayisi} Kanun ve Yönetmelik'
    kapak_ust = ' · MÜŞTEREK'
elif YALNIZ_BRANS:
    kapak_alt = f'{BRANSLAR[BRANS][2]} — {brans_sayisi} Kanun ve Yönetmelik'
    kapak_ust = ' · ' + BRANSLAR[BRANS][2].replace(' Branş Mevzuatı', '').upper() + ' BRANŞI'
else:
    kapak_alt = f'Müşterek Mevzuat ({musterek_sayisi}) &nbsp;+&nbsp; {BRANSLAR[BRANS][2]} ({brans_sayisi})'
    kapak_ust = ''
print(f'kapak sayımı: {altin_nokta} altın nokta · {cikmis_nokta} çıkmış · '
      f'{mevzuat_sayisi} mevzuat ({musterek_sayisi}+{brans_sayisi}) · '
      f'{incelenen_kitapcik} kitapçık/{incelenen_soru} soru incelendi')
HTML = f'''<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>JSPS 2026 Altın Özet</title><style>
@page {{ size: A4; margin: 17mm 13mm 16mm; }}
body {{ font-family: "Segoe UI", Arial, sans-serif; font-size: 10.2pt; color: #1B2A4A; line-height: 1.45; }}
b {{ color: #0B1F3A; }}
.kapak {{ height: 214mm; display: flex; flex-direction: column; justify-content: space-between; background: #0B1F3A; color: #F7F3EA; border-radius: 3mm; page-break-after: always; padding: 22mm 18mm; }}
.kapak .ust {{ color: #C9A227; letter-spacing: .3em; font-size: 10.5pt; font-weight: 700; }}
.kapak h1 {{ font-family: Georgia, "Times New Roman", serif; font-size: 46pt; margin: 4mm 0 2mm; color: #fff; letter-spacing: .02em; }}
.kapak h2 {{ font-size: 14pt; font-weight: 400; color: #F3E7C1; margin: 0; }}
.kapak .cizgi {{ height: 1.2mm; width: 60mm; background: #C9A227; margin: 6mm 0; }}
.kapak .kutular {{ display: flex; gap: 4mm; margin-top: 8mm; }}
.kapak .kt {{ flex: 1; border: 1px solid #2A4468; border-radius: 2mm; padding: 4mm; }}
.kapak .kt .s {{ font-size: 21pt; font-weight: 800; color: #C9A227; font-family: Georgia, serif; }}
.kapak .kt .a {{ font-size: 8.5pt; color: #D7CDB8; line-height: 1.35; }}
.kapak .alt {{ font-size: 9pt; color: #C4BAA6; line-height: 1.7; border-top: 1px solid #2A4468; padding-top: 5mm; }}
.ic {{ page-break-after: always; }} .ic h1 {{ font-family: Georgia, serif; font-size: 25pt; color: #0B1F3A; margin: 0 0 6mm; }}
.icb {{ font-weight: 800; color: #B88917; margin: 5mm 0 1.5mm; letter-spacing: .08em; font-size: 10pt; text-transform: uppercase; }}
.ics {{ padding: .6mm 0 .6mm 5mm; border-left: 2.5px solid #E7DCC7; font-size: 9.6pt; }}
.bkapak {{ page-break-before: always; background: linear-gradient(180deg,#F3E7C1 0%,#FBF5E4 100%); border-left: 6mm solid #C9A227; padding: 9mm 9mm; margin: 0 0 7mm; border-radius: 0 2mm 2mm 0; }}
.bet {{ color: #B88917; letter-spacing: .3em; font-size: 8.5pt; font-weight: 800; }}
.bkapak h1 {{ font-family: Georgia, serif; margin: 2mm 0 2mm; font-size: 24pt; color: #0B1F3A; line-height: 1.15; }}
.balt {{ font-size: 9.5pt; color: #6E6047; }}
.kanun {{ background: #0B1F3A; color: #fff; border-radius: 2mm; padding: 3mm 4.5mm; margin: 9mm 0 3mm; page-break-after: avoid; page-break-inside: avoid; }}
.kanun-ad {{ font-family: Georgia, serif; font-size: 15pt; font-weight: 700; line-height: 1.2; }}
.kanun-kap {{ font-size: 8.8pt; color: #F3E7C1; margin-top: 1mm; }}
h3 {{ font-size: 11.5pt; color: #B88917; border-bottom: 2px solid #C9A227; margin: 6mm 0 2.5mm; padding-bottom: 1mm; page-break-after: avoid; font-weight: 800; }}
h4 {{ font-size: 10.4pt; color: #173B6B; margin: 4mm 0 1.5mm; page-break-after: avoid; }}
ul, ol {{ margin: 1.5mm 0 2.5mm; padding-left: 5.5mm; }} li {{ margin: .9mm 0; }}
.nokta {{ border: 1px solid #E7DCC7; border-left: 2.2mm solid #D8CCB4; border-radius: 1.8mm; padding: 2.2mm 3mm; margin: 0 0 2.2mm; background: #FFFCF5; page-break-inside: avoid; }}
.nokta.cikmis {{ border-left-color: #C00000; background: #FFFBF3; }}
.nb {{ margin-bottom: .8mm; }}
.nbas {{ font-weight: 800; color: #0B1F3A; font-size: 10.6pt; }}
.rozet {{ display: inline-block; font-size: 7.2pt; font-weight: 800; border-radius: 1.5mm; padding: .2mm 1.6mm; color: #fff; background: #C00000; margin-right: 1.8mm; vertical-align: 1px; letter-spacing: .04em; }}
.ng {{ font-size: 10pt; }}
.mad {{ color: #B88917; font-weight: 700; font-size: 9.2pt; white-space: nowrap; }}
.ny, .no, .nt {{ font-size: 9.4pt; margin-top: 1.2mm; padding: 1.2mm 2mm; border-radius: 1.2mm; }}
.ny {{ background: #EEF3F8; color: #173B6B; }}
.no {{ background: #F1F6EE; color: #2E5024; }}
.nt {{ background: #FDECEC; color: #8E1212; }}
.et {{ display: inline-block; font-size: 6.8pt; font-weight: 800; letter-spacing: .1em; margin-right: 1.8mm; padding: .2mm 1.4mm; border-radius: 1mm; color: #fff; vertical-align: 1px; }}
.ny .et {{ background: #173B6B; }} .no .et {{ background: #2E7D32; }} .nt .et {{ background: #C00000; }}
table {{ border-collapse: collapse; width: 100%; margin: 2.5mm 0 4mm; font-size: 9.3pt; }}
th {{ background: #0B1F3A; color: #fff; text-align: left; padding: 1.8mm 2.2mm; font-size: 9pt; letter-spacing: .03em; }}
td {{ border-bottom: 1px solid #E7DCC7; padding: 1.5mm 2.2mm; vertical-align: top; }}
tr {{ page-break-inside: avoid; }} tbody tr:nth-child(even) td {{ background: #FBF7EE; }}
.not {{ background: #F3E7C1; border-left: 2.2mm solid #C9A227; padding: 2.2mm 3mm; margin: 2.5mm 0; font-size: 9.6pt; border-radius: 0 1.5mm 1.5mm 0; }}
p {{ margin: 1.4mm 0; }} code {{ background: #EFE6D6; padding: 0 1mm; border-radius: 1mm; }}
</style></head><body>
<div class="kapak">
 <div><div class="ust">JANDARMA VE SAHİL GÜVENLİK PERSONELİ SINAVI · 2026{kapak_ust}</div>
  <h1>ALTIN ÖZET</h1><div class="cizgi"></div>
  <h2>{kapak_alt}</h2>
  <div class="kutular">
   <div class="kt"><div class="s">{bin_ayrac(altin_nokta)}</div><div class="a">altın nokta<br>hüküm + tuzağı</div></div>
   <div class="kt"><div class="s">{bin_ayrac(cikmis_nokta)}</div><div class="a">çıkmış sınavda<br>fiilen sorulmuş</div></div>
   <div class="kt"><div class="s">{mevzuat_sayisi}</div><div class="a">mevzuat<br>emir kapsamıyla sınırlı</div></div>
   <div class="kt"><div class="s">{bin_ayrac(incelenen_soru)}</div><div class="a">incelenen<br>çıkmış soru</div></div>
  </div></div>
 <div class="alt"><b style="color:#F3E7C1">Bu yılın emriyle (Ek-1, 21 Mayıs 2026) sınırlı</b> resmî madde metinleri ·
 {incelenen_kitapcik} çıkmış kitapçıktan {bin_ayrac(incelenen_soru)} soru (iptal edilen 19 Eylül 2026 sınavı dâhil) ·
 sınavı yapan ATA-AÖF'ün kendi sınavlarından çıkarılan soru üslubu.<br>Mevzu JSPS · {bugun}</div>
</div>
<div class="ic"><h1>İçindekiler</h1>{ic_html}</div>
{govde}
</body></html>'''
hp = GECICI + ('_kitap_m.html' if SADECE_MUSTEREK else '_kitap2.html'); io.open(hp, 'w', encoding='utf-8').write(HTML)
print('sade sürüm kullanılan bölüm:', sade_sayisi, '/', len(bolumler))
subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--no-pdf-header-footer', f'--print-to-pdf={GECICI}' + ('_kitap_m.pdf' if SADECE_MUSTEREK else '_kitap2.pdf'), 'file:///' + hp], capture_output=True, timeout=600)
d = fitz.open(GECICI + ('_kitap_m.pdf' if SADECE_MUSTEREK else '_kitap2.pdf'))
toc = []; cari = ''
for i, pg in enumerate(d):
    if i < 2: continue
    sayfa_kanun = None
    # aynı satırdaki span'ları birleştir (uzun başlıklar birden çok span'a bölünüyor)
    satirlar = []
    for b in pg.get_text('dict')['blocks']:
        for l in b.get('lines', []):
            t = ''.join(sp['text'] for sp in l['spans']).strip()
            if not t: continue
            sp0 = l['spans'][0]
            satirlar.append((round(sp0['size'], 1), sp0.get('font', ''), t, round(l['bbox'][1])))
    j = 0
    while j < len(satirlar):
        boy, fnt, t, y = satirlar[j]
        if 'Georgia' not in fnt: j += 1; continue
        # sarmalanmış başlığı topla (aynı punto, ardışık satır)
        tam = t; k = j + 1
        while k < len(satirlar) and satirlar[k][0] == boy and 'Georgia' in satirlar[k][1] and satirlar[k][3] - satirlar[k - 1][3] < boy * 2:
            tam += ' ' + satirlar[k][2]; k += 1
        if boy >= 22: toc.append([1, tam[:90], i + 1])                       # bölüm kapağı
        elif 14 <= boy < 18:                                                  # kanun adı
            if sayfa_kanun is None: sayfa_kanun = tam
            toc.append([2, tam[:95], i + 1])
        j = k if k > j else j + 1
    if sayfa_kanun: cari = sayfa_kanun
    ust = (cari or 'JSPS 2026 · ALTIN ÖZET')[:78]
    pg.draw_line(fitz.Point(38, 30), fitz.Point(pg.rect.width - 38, 30), color=(0.91, 0.86, 0.78), width=0.7)
    pg.insert_text(fitz.Point(38, 26), ust, fontsize=7.6, fontname='sg', fontfile=FONT, color=(0.55, 0.49, 0.36))
    pg.insert_text(fitz.Point(pg.rect.width - 60, 26), 'ALTIN ÖZET', fontsize=7.6, fontname='sg', fontfile=FONT, color=(0.55, 0.49, 0.36))
    pg.draw_rect(fitz.Rect(pg.rect.width - 62, pg.rect.height - 34, pg.rect.width - 34, pg.rect.height - 18), color=None, fill=(0.043, 0.122, 0.227), radius=0.25)
    pg.insert_text(fitz.Point(pg.rect.width - 56, pg.rect.height - 23), f'{i + 1}', fontsize=8.5, fontname='sgb', fontfile=FONTB, color=(1, 1, 1))
    pg.insert_text(fitz.Point(38, pg.rect.height - 23), 'Mevzu JSPS · mevzujsps.com', fontsize=7.4, fontname='sg', fontfile=FONT, color=(0.55, 0.49, 0.36))
try: d.set_toc(toc)
except Exception as e: print('toc hata:', e)
d.save(OUT, garbage=3, deflate=True)
print('SAYFA:', len(d), '| yer imi:', len(toc), '→', OUT)
for n in (4, 12, 40, 100):
    if n < len(d): d[n].get_pixmap(dpi=58).save(GECICI + ('_m_' if SADECE_MUSTEREK else '_v2_') + f'{n}.png')
