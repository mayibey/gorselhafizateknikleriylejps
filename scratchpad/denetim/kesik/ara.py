# mevzuat.gov.tr'de ad ile arar; sonuç satırlarını (ad + MevzuatNo/Tur/Tertip) yazdırır. Yalnız okur.
import sys, io, json, time, re
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
from playwright.sync_api import sync_playwright
sorgular = sys.argv[1:]
JS = r'''els => els.map(e => { const tr = e.closest('tr'); return [(tr ? tr.innerText : e.innerText).trim().replace(/\s+/g, " ").slice(0, 220), e.getAttribute("href")]; })'''
with sync_playwright() as p:
    b = p.chromium.connect_over_cdp('http://127.0.0.1:9222')
    ctx = b.contexts[0]
    pg = ctx.new_page()
    try:
        for q in sorgular:
            pg.goto('https://www.mevzuat.gov.tr/', wait_until='domcontentloaded', timeout=60000)
            time.sleep(2)
            pg.fill('#aramaButonu', q)
            pg.press('#aramaButonu', 'Enter')
            time.sleep(6)
            links = pg.eval_on_selector_all('a[href*="MevzuatNo="]', JS)
            print('### ', q)
            seen = set()
            for t, h in links:
                if h in seen: continue
                seen.add(h)
                print('   ', t, '|', h)
            sys.stdout.flush()
    finally:
        pg.close()
