# Kilit kelime → cevap listesini tek HTML sayfaya gömer (gemini_calisma/kodlama_secme/*.json → sifreler.html)
# Liste iki kez konur: (1) HAZIR BASILI HTML (betiksiz dışa aktarma/yazdırma da tam çıkar), (2) JSON veri (süzgeç/arama için).
import json, glob, os, re, sys, html
sys.stdout.reconfigure(encoding='utf-8')
K = 'D:/GorselHafizaTeknikleriyleJSPS/gemini_calisma'
BURA = os.path.dirname(os.path.abspath(__file__))
kap = json.load(open(f'{K}/girdi/kapsam.json', encoding='utf-8'))['mevzuatlar']
ONCELIK = {'müşterek': 0, 'jandarma': 1, 'mebs': 2, 'havacilik': 3, 'personel': 4}
GRUP = {'müşterek': 'Müşterek', 'jandarma': 'Jandarma', 'mebs': 'MEBS', 'havacilik': 'Havacılık', 'personel': 'Personel'}
# Sol sütun konu etiketi (başkan, 5 Eki 2026: "sol taraf açıklayıcı değil"): madde başlığı, Harekât Masası madde bloklarından;
# orada olmayan maddeler konu_ek.json'dan. Başlığı olmayan madde kalırsa uyarı basılır (sayfa yine üretilir).
KONU_EK = json.load(open(f'{BURA}/konu_ek.json', encoding='utf-8'))
def konular(lid):
    yol = f'D:/GorselHafizaTeknikleriyleJSPS/scripts/harekat-masasi/madde_bloklari/kanun_{lid}.json'
    b = {str(x['madde']): (x.get('baslik') or '').strip() for x in json.load(open(yol, encoding='utf-8'))} if os.path.exists(yol) else {}
    b.update({m: v for m, v in KONU_EK.get(str(lid), {}).items() if not m.startswith('_')})
    return b
kanunlar = []
for f in glob.glob(f'{K}/kodlama_secme/kanun_*.json'):
    d = json.load(open(f, encoding='utf-8'))
    lid = int(re.search(r'kanun_(\d+)', f).group(1))
    meta = kap[str(lid)]
    ad = re.sub(r'\s*\((müşterek|jandarma branş) kapsam[ıi]\)', '', meta['ad'])
    grup = 'müşterek' if meta.get('grup') == 'müşterek' else (meta.get('branslar') or ['?'])[0]
    konu = konular(lid)
    satirlar = [{'m': k['madde'], 'b': konu.get(str(k['madde']), ''), 'g': k['tetikleyici'], 'c': k['cevap'], 'n': k.get('not', ''), 'k': k['kanit'],
                 'x': [[str(x.get('madde')), x.get('fark', '')] for x in k.get('karistirilan', [])]} for k in d['kodlar']]
    bos = sorted({s['m'] for s in satirlar if not s['b']})
    if bos: print(f'UYARI k{lid}: konu başlığı olmayan madde: {bos}')
    kanunlar.append({'id': lid, 'ad': ad, 'grup': grup, 'satirlar': satirlar})
kanunlar.sort(key=lambda x: (ONCELIK.get(x['grup'], 9), x['id']))

# --- Hazır basılı liste (sablon.html içindeki satir()/ciz() ile birebir aynı yapı) ---
esc = lambda s: html.escape(s or '', quote=True)
tr_kk = lambda s: (s or '').replace('İ', 'i').replace('I', 'ı').lower()
mEt = lambda m: ('m.' + m) if re.match(r'^\d', m or '') else (m or '')
def isaretle(kanit, kel):
    i = tr_kk(kanit).find(tr_kk(kel))
    if i < 0: return esc(kanit)
    return esc(kanit[:i]) + '<b>' + esc(kanit[i:i + len(kel)]) + '</b>' + esc(kanit[i + len(kel):])
def satir(s):
    kar = ('<ul>' + ''.join(f'<li>{mEt(m)}: {esc(f)}</li>' for m, f in s['x']) + '</ul>') if s['x'] else ''
    notu = f"<small>{esc(s['n'])}</small>" if s['n'] else ''
    konu = (mEt(s['m']) + ' · ' + s['b']) if s['b'] else mEt(s['m'])
    return (f'<div class="satir" tabindex="0" role="button" aria-expanded="false">'
            f'<div class="kel"><small class="konu">{esc(konu)}</small><mark>{esc(s["g"])}</mark></div>'
            f'<div class="cev">{esc(s["c"])}{notu}</div>'
            f'<div class="detay"><div class="kanit">“{isaretle(s["k"], s["g"])}”</div>{kar}</div></div>')
liste = ''.join(
    f'<section class="kanun"><h2>{esc(k["ad"])}</h2><div class="alt">{GRUP.get(k["grup"], esc(k["grup"]))} · {len(k["satirlar"])} kelime</div>'
    f'<div class="tablo">{"".join(satir(s) for s in k["satirlar"])}</div></section>' for k in kanunlar)
liste += '<p class="not">Ezber modunda cevaplar bulanık görünür; önce kendin hatırla, sonra satıra dokunup aç. Liste kanun kanun eklenir; önce müşterek mevzuat.</p>'

veri = json.dumps(kanunlar, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
sablon = open(f'{BURA}/sablon.html', encoding='utf-8').read()
assert '<!--LISTE-->' in sablon and '/*VERI*/[]' in sablon
cikti = sablon.replace('<!--LISTE-->', liste).replace('/*VERI*/[]', veri)
open(f'{BURA}/sifreler.html', 'w', encoding='utf-8').write(cikti)
print(len(kanunlar), 'mevzuat ·', sum(len(k['satirlar']) for k in kanunlar), 'satır ·', round(len(cikti.encode('utf-8')) / 1024), 'KB')
