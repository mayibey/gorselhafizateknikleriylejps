# mevzuat.gov.tr arama mekanizmasını yoklar (yalnız okur).
import sys, io, json, time
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
from playwright.sync_api import sync_playwright
q = sys.argv[1]
with sync_playwright() as p:
    b = p.chromium.connect_over_cdp('http://127.0.0.1:9222')
    ctx = b.contexts[0]
    pg = ctx.new_page()
    reqs = []
    pg.on('request', lambda r: reqs.append((r.method, r.url, r.post_data)) if 'mevzuat.gov.tr' in r.url and r.resource_type in ('xhr','fetch','document') else None)
    try:
        pg.goto('https://www.mevzuat.gov.tr/', wait_until='domcontentloaded', timeout=60000)
        time.sleep(3)
        ins = pg.eval_on_selector_all('input', 'els => els.map(e => ({id:e.id, name:e.name, type:e.type, ph:e.placeholder}))')
        print(json.dumps(ins, ensure_ascii=False)[:2000])
        btns = pg.eval_on_selector_all('button', 'els => els.map(e => ({id:e.id, t:e.innerText.slice(0,40), cls:e.className}))')
        print(json.dumps(btns, ensure_ascii=False)[:2000])
    finally:
        pg.close()
