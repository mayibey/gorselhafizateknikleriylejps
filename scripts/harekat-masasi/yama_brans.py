# Tüm branşlar: sayfa branşı window.BRANS'tan öğrenir (kur2.py veri'den gömer); segment "Branş (Ad)"; K.g doğrulanır
import os
KOK = os.path.dirname(os.path.abspath(__file__))
p = os.path.join(KOK, 'masa4.js'); s = open(p, encoding='utf-8').read()


def r(a, b, n=1):
    global s
    assert s.count(a) == n, (a[:70], s.count(a))
    s = s.replace(a, b)


s = "const BRANS=window.BRANS||{slug:'mebs',ad:'MEBS'}; // hangi branşın sayfası (kur2.py gömer)\n" + s
r("""<button data-g="mebs" aria-pressed="${K.g==='mebs'}">Branş (MEBS)</button>""",
  """<button data-g="${BRANS.slug}" aria-pressed="${K.g===BRANS.slug}">Branş (${esc(BRANS.ad)})</button>""", 2)
r("try{ if(window.MERKEZ_KAYIT) birlestir(window.MERKEZ_KAYIT); }catch(e){}",
  "try{ if(window.MERKEZ_KAYIT) birlestir(window.MERKEZ_KAYIT); }catch(e){}\nif(K.g!=='mus'&&K.g!==BRANS.slug)K.g='mus'; // başka branşın kaydı / eski 'mebs' değeri")
open(p, 'w', encoding='utf-8').write(s)

p = os.path.join(KOK, 'kur2.py'); s = open(p, encoding='utf-8').read()
a = """C = sys.argv[1]"""
b = """C = sys.argv[1]
SLUG = sys.argv[2] if len(sys.argv) > 2 else None   # branş: veri2-<slug>.json → masa-app-<slug>.html (yoksa eski tek dosya)"""
assert a in s; s = s.replace(a, b, 1)
a = """veri = open(os.path.join(C, 'veri2.json'), encoding='utf-8').read().replace('</', '<\\\\/')
sayfa = ISKELET.replace('__VERI__', veri)
open(os.path.join(C, 'harekat-masasi.html'), 'w', encoding='utf-8').write(sayfa)
doc = '<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover"><style>html,body{margin:0}[hidden]{display:none!important}</style></head><body>' + sayfa + '</body></html>'
open(os.path.join(C, 'masa-app.html'), 'w', encoding='utf-8').write(doc)
print('ok', len(sayfa))"""
b = """import json as _json
veri_ad = f'veri2-{SLUG}.json' if SLUG else 'veri2.json'
veri = open(os.path.join(C, veri_ad), encoding='utf-8').read().replace('</', '<\\\\/')
brans = _json.loads(open(os.path.join(C, veri_ad), encoding='utf-8').read()).get('brans') or {'slug': 'mebs', 'ad': 'MEBS'}
sayfa = ISKELET.replace('__VERI__', veri).replace('<script>\\n', '<script>window.BRANS=' + _json.dumps(brans, ensure_ascii=False) + ';\\n', 1)
doc = '<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover"><style>html,body{margin:0}[hidden]{display:none!important}</style></head><body>' + sayfa + '</body></html>'
if not SLUG or SLUG == 'mebs':   # başkanın artifact'ı + eski tek dosya (MEBS)
    open(os.path.join(C, 'harekat-masasi.html'), 'w', encoding='utf-8').write(sayfa)
    open(os.path.join(C, 'masa-app.html'), 'w', encoding='utf-8').write(doc)
if SLUG:
    open(os.path.join(C, f'masa-app-{SLUG}.html'), 'w', encoding='utf-8').write(doc)
print('ok', brans['slug'], len(sayfa))"""
assert a in s, 'kur2 kuyruk'; s = s.replace(a, b, 1)
open(p, 'w', encoding='utf-8').write(s)
print('ok')
