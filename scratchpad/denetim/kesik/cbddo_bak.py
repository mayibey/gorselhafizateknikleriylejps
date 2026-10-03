# cbddo.gov.tr'de Bilgi ve İletişim Güvenliği Rehberi sayfasını kendi sekmesinde açar, bağlantıları listeler. Yalnız okur.
import sys, io, time
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
from playwright.sync_api import sync_playwright
urls = sys.argv[1:] or ['https://www.cbddo.gov.tr/bgrehber']
with sync_playwright() as p:
    b = p.chromium.connect_over_cdp('http://127.0.0.1:9222')
    pg = b.contexts[0].new_page()
    try:
        for u in urls:
            try:
                r = pg.goto(u, wait_until='domcontentloaded', timeout=45000)
                time.sleep(3)
                print('###', u, '->', pg.url, 'durum', r.status if r else None, 'başlık', pg.title())
                links = pg.eval_on_selector_all('a[href]', 'els => els.map(e => [e.innerText.trim().replace(/\\s+/g, " ").slice(0, 90), e.href])')
                for t, h in links:
                    if any(k in (t + h).lower() for k in ('rehber', 'pdf', 'bilgi', 'bgrehber', 'sharedfolder')):
                        print('   ', t, '|', h)
            except Exception as e:
                print('###', u, 'HATA', str(e)[:300])
    finally:
        pg.close()
