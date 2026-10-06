# mevzujsps.com/tahmin sayfasını üretir: artifact şablonu (sayfa-sablon.html) + veri + ad kapısı + Supabase kaydı.
# Kayıt tablosu: public.tahmin_deneme_kayit (yalnız INSERT; okuma servis anahtarıyla). SQL: supabase/sql/tahmin-deneme-kayit.sql
# Çalıştır: python -X utf8 scripts/premium-deneme/tahmin/site-uret.py
import io, json, os, re

KOK = os.path.dirname(os.path.abspath(__file__))
env = dict(l.split('=', 1) for l in io.open(os.path.join(KOK, '../../../.env'), encoding='utf-8').read().splitlines() if '=' in l and not l.startswith('#'))
SB_URL, SB_ANON = env['EXPO_PUBLIC_SUPABASE_URL'].strip(), env['EXPO_PUBLIC_SUPABASE_ANON_KEY'].strip()


def oku(d):
    j = json.load(open(os.path.join(KOK, f'{d}.json'), encoding='utf-8'))
    return [{'k': q['soru'], 's': q['siklar'], 'd': q['dogru'], 'a': q['aciklama'], 't': q['tip']} for q in j['sorular']]


veri = {'jan': oku('TAHMIN-SB-JAN-63'), 'mebs': oku('TAHMIN-SB-MEBS-7')}
t = io.open(os.path.join(KOK, 'sayfa-sablon.html'), encoding='utf-8').read()


def degistir(eski, yeni):
    global t
    assert t.count(eski) == 1, eski[:60]
    t = t.replace(eski, yeni)


degistir('__VERI__', json.dumps(veri, ensure_ascii=False).replace('</', '<\\/'))

# Belge başı (artifact sarmalayıcısı burada yok)
t = ('<!doctype html>\n<html lang="tr">\n<head>\n<meta charset="utf-8">\n'
     '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
     '<meta name="robots" content="noindex,nofollow">\n'
     '<meta property="og:title" content="10 Ekim Tahmin Denemeleri · Jandarma ve MEBS">\n'
     '<meta property="og:description" content="Yenilenen JSPS subay sınavı için 80\'er soruluk tahmin denemesi. Çöz, puanını gör.">\n'
     '<meta name="theme-color" content="#0B1F3A">\n') + t
degistir('<style>', '<style>\nhtml,body{margin:0}\n[hidden]{display:none!important}\n')
degistir('</style>', '''.kapi{display:grid;gap:10px;margin:18px 0 6px;padding:16px;background:var(--kagit);border:1px solid var(--altin);border-radius:10px}
.kapi label{font-weight:700;color:var(--lacivert)}
.kapi input{font:inherit;font-size:16px;padding:10px 12px;border:1px solid var(--kenar);border-radius:8px;background:var(--zemin);color:var(--metin);width:100%}
.kapi .satir{display:flex;flex-wrap:wrap;gap:10px}
.kapi small{color:var(--soluk)}
</style>
</head>
<body>''')
degistir('<section class="not" aria-label="Nasıl hazırlandı">', '''<form class="kapi" id="kapi" hidden>
    <label for="ad">Başlamadan önce adını yazar mısın?</label>
    <input id="ad" maxlength="60" autocomplete="given-name" placeholder="Örn. Mete">
    <div class="satir"><button class="btn" type="submit">Başla</button><button class="btn ikincil" type="button" id="adsiz">Adsız devam et</button></div>
    <small>Adın yalnızca denemeyi kimlerin çözdüğünü görmek için kaydedilir.</small>
  </form>

  <section class="not" aria-label="Nasıl hazırlandı">''')
degistir('const VERI =', f'''const SB_URL = {json.dumps(SB_URL)}, SB_ANON = {json.dumps(SB_ANON)};
let ziyaretci = null, ad = null;
try {{ ziyaretci = localStorage.getItem('tahmin-ziyaretci'); ad = localStorage.getItem('tahmin-ad'); }} catch (e) {{}}
if (!ziyaretci) {{ ziyaretci = 'z' + Math.random().toString(36).slice(2) + Date.now().toString(36); try {{ localStorage.setItem('tahmin-ziyaretci', ziyaretci); }} catch (e) {{}} }}
function kayit(olay, ek) {{
  const govde = Object.assign({{ziyaretci, ad: ad || null, olay}}, ek || {{}});
  fetch(SB_URL + '/rest/v1/tahmin_deneme_kayit', {{method: 'POST', keepalive: true,
    headers: {{apikey: SB_ANON, Authorization: 'Bearer ' + SB_ANON, 'Content-Type': 'application/json', Prefer: 'return=minimal'}},
    body: JSON.stringify(govde)}}).catch(() => {{}});
}}
const VERI =''')
# Bitir → sonucu kaydet
degistir("  bitti[aktif] = true; kaydet(); ciz();", """  bitti[aktif] = true; kaydet(); ciz();
  { const d = VERI[aktif]; let dg = 0, yn = 0, bos = 0;
    d.forEach((s, i) => { const c = cevap[aktif][i]; if (c == null) bos++; else if (c === s.d) dg++; else yn++; });
    kayit('bitir', {deneme: aktif, dogru: dg, yanlis: yn, bos}); }""")
# Açılış: ad kapısı (ad yoksa sor), oturum başına bir açılış kaydı
degistir('\nciz();\n</script>', '''
ciz();
function acilisKaydi() {
  let yazildi = false; try { yazildi = sessionStorage.getItem('tahmin-acilis') === '1'; } catch (e) {}
  if (!yazildi) { kayit('acilis'); try { sessionStorage.setItem('tahmin-acilis', '1'); } catch (e) {} }
}
const kapi = document.getElementById('kapi');
let adSoruldu = false; try { adSoruldu = localStorage.getItem('tahmin-ad-soruldu') === '1'; } catch (e) {}
if (adSoruldu) acilisKaydi(); else kapi.hidden = false;
function kapiKapat(girilen) {
  ad = (girilen || '').trim().slice(0, 60) || null;
  try { if (ad) localStorage.setItem('tahmin-ad', ad); localStorage.setItem('tahmin-ad-soruldu', '1'); } catch (e) {}
  kapi.hidden = true; acilisKaydi();
}
kapi.addEventListener('submit', e => { e.preventDefault(); kapiKapat(document.getElementById('ad').value); });
document.getElementById('adsiz').addEventListener('click', () => kapiKapat(''));
</script>
</body>
</html>''')
os.makedirs(os.path.join(KOK, '../../../docs/tahmin'), exist_ok=True)
hedef = os.path.join(KOK, '../../../docs/tahmin/index.html')
io.open(hedef, 'w', encoding='utf-8').write(t)
print('yazıldı', os.path.normpath(hedef), len(t.encode('utf-8')), 'bayt')
