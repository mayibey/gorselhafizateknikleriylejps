# Bir mevzuat sayfasında verilen ifadeyi içeren paragrafın dipnot (title) metinlerini gösterir. Yalnız okur.
# Kullanım: python dipnot_bak.py <kanun_id> "<ifade>"
import sys, io, json, time, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
from playwright.sync_api import sync_playwright
BURA = os.path.dirname(os.path.abspath(__file__))
KAY = json.load(open(os.path.join(BURA, 'kaynaklar.json'), encoding='utf-8'))
kid, ifade = sys.argv[1], sys.argv[2]
k = KAY[kid]
url = f"https://www.mevzuat.gov.tr/anasayfa/MevzuatFihristDetayIframe?MevzuatTur={k['tur']}&MevzuatNo={k['no']}&MevzuatTertip={k['tertip']}"
JS = r'''(ifade) => {
  const ps = Array.from(document.querySelectorAll('p'));
  const out = [];
  for (const p of ps) {
    if (p.innerText.replace(/\s+/g, ' ').indexOf(ifade) >= 0) {
      const fns = Array.from(p.querySelectorAll('a[title]')).map(a => a.innerText.trim() + ' => ' + a.getAttribute('title'));
      out.push({metin: p.innerText.replace(/\s+/g, ' ').slice(0, 600), dipnotlar: fns});
    }
  }
  return out;
}'''
with sync_playwright() as p:
    b = p.chromium.connect_over_cdp('http://127.0.0.1:9222')
    pg = b.contexts[0].new_page()
    try:
        pg.goto(url, wait_until='load', timeout=120000)
        time.sleep(1.5)
        for x in pg.evaluate(JS, ifade):
            print('METİN:', x['metin'])
            for f in x['dipnotlar']:
                print('   DİPNOT:', f[:600])
    finally:
        pg.close()
