# Açık sekmelerin adresini ve açılış zamanını (performance.timeOrigin) okur; hiçbir sekmeyi değiştirmez/kapatmaz.
import sys, io, time, json
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.connect_over_cdp('http://127.0.0.1:9222')
    for ci, ctx in enumerate(b.contexts):
        for pg in ctx.pages:
            u = pg.url
            if not ('cbddo' in u or 'chrome-error' in u or u == 'about:blank'):
                continue
            try:
                cdp = ctx.new_cdp_session(pg)
                info = cdp.send('Target.getTargetInfo')
                tid = info['targetInfo']['targetId'] + ' ' + info['targetInfo']['url'][:60]
                cdp.detach()
            except Exception as e:
                tid = '?' + str(e)[:60]
            try:
                t0 = pg.evaluate('performance.timeOrigin')
                acilis = time.strftime('%H:%M:%S', time.localtime(t0 / 1000))
            except Exception as e:
                acilis = 'okunamadı: ' + str(e)[:80]
            print(ci, tid, '| pw-url:', u, '| açılış:', acilis)
