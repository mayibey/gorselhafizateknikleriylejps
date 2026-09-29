# Premium kilidi (başkan, 30 Eyl): üye olmayan içeride gezer; Röntgen çek / Check-up / Devam et / Altın Özet basınca ödeme ekranı.
# Uygulama window.MERKEZ_PREMIUM (true/false) gömer; tarayıcıda (artifact) tanımsız → premium sayılır.
import os
KOK = os.path.dirname(os.path.abspath(__file__))
p = os.path.join(KOK, 'masa4.js'); s = open(p, encoding='utf-8').read()


def r(a, b):
    global s
    assert s.count(a) == 1, (a[:70], s.count(a))
    s = s.replace(a, b)


r("const RN=()=>window.ReactNativeWebView;",
  """const RN=()=>window.ReactNativeWebView;
const PREMIUM=window.MERKEZ_PREMIUM!==false;
function kilit(){ if(PREMIUM)return false; if(RN())RN().postMessage(JSON.stringify({tip:'paywall'})); else toast('Bu bölüm Tam Erişim üyelerine özel.'); return true; }""")
r("function rontgenBaslat(){", "function rontgenBaslat(){ if(kilit())return;")
r("function checkupBolum(id,sadeceKalan){", "function checkupBolum(id,sadeceKalan){ if(kilit())return;")
r("function ozet(id,geriHedef,sekme,hedefM){", "function ozet(id,geriHedef,sekme,hedefM){ if(kilit())return;")
r("function aktifDevam(){const a=K.aktif;if(!a||!a.ids)return false;",
  "function aktifDevam(){if(kilit())return false;const a=K.aktif;if(!a||!a.ids)return false;")
open(p, 'w', encoding='utf-8').write(s)

# kur2: ücretsiz sürüm — soru metni/şık/açıklama ve özet notları SOYULUR (yalnız sayılar kalır)
p = os.path.join(KOK, 'kur2.py'); s = open(p, encoding='utf-8').read()
a = "if SLUG:\n    open(os.path.join(C, f'masa-app-{SLUG}.html'), 'w', encoding='utf-8').write(doc)\n"
b = """if SLUG:
    open(os.path.join(C, f'masa-app-{SLUG}.html'), 'w', encoding='utf-8').write(doc)
# ÜCRETSİZ SÜRÜM (üye olmayan): içerik yok, yalnız iskelet + sayılar → kilit sayfanın içinde (Röntgen çek / Check-up / Özet)
_v = _json.loads(open(os.path.join(C, veri_ad), encoding='utf-8').read())
for _k in _v['kanun']:
    _k['q'] = [{'i': q['i'], 'k': '', 's': [], 'd': 0, 'a': '', 'y': q.get('y', ''), 'z': ''} for q in _k['q']]
    _k['md'] = ''; _k['n'] = []; _k['tz'] = []; _k['sayi'] = []; _k['makam'] = []
_v['ek'] = {}
_uc = _json.dumps(_v, ensure_ascii=False).replace('</', '<\\\\/')
_doc_uc = doc.replace(veri, _uc, 1)
assert len(_doc_uc) < len(doc) // 3, 'ücretsiz sürüm soyulmadı'
open(os.path.join(C, f'masa-app-{SLUG or "mebs"}-ucretsiz.html'), 'w', encoding='utf-8').write(_doc_uc)
"""
assert a in s; s = s.replace(a, b, 1); open(p, 'w', encoding='utf-8').write(s)
print('ok')
