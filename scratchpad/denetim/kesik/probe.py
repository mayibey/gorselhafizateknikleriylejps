# mevzuat.gov.tr iframe yapısını yoklar (yalnız okur, kendi sekmesini açar/kapatır).
import sys, io, json, time
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
from playwright.sync_api import sync_playwright
url = sys.argv[1]
out = sys.argv[2]
with sync_playwright() as p:
    b = p.chromium.connect_over_cdp('http://127.0.0.1:9222')
    ctx = b.contexts[0]
    pg = ctx.new_page()
    try:
        r = pg.goto(url, wait_until='domcontentloaded', timeout=60000)
        print('status', r.status if r else None)
        time.sleep(4)
        print('frames:', [f.url[:150] for f in pg.frames])
        best = None
        for f in pg.frames:
            try:
                h = f.content()
            except Exception as e:
                print('err', e); continue
            print('frame', f.url[:100], len(h))
            if best is None or len(h) > len(best[1]):
                best = (f.url, h)
        open(out, 'w', encoding='utf-8').write(best[1])
        print('saved', best[0], len(best[1]))
    finally:
        pg.close()
