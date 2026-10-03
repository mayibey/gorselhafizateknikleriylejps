# mevzuat.gov.tr metin iframe'ini kendi sekmesinde açar, blok listesini önbelleğe yazar.
# Kullanım: python getir.py <kanun_id> [<kanun_id> ...]   (önbellekte varsa atlar; -f ile zorla)
# Kullanıcının sekmelerine dokunmaz; yalnız kendi açtığı sekmeyi kapatır.
import sys, io, json, time, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
from playwright.sync_api import sync_playwright
BURA = os.path.dirname(os.path.abspath(__file__))
KAY = json.load(open(os.path.join(BURA, 'kaynaklar.json'), encoding='utf-8'))
ON = os.path.join(BURA, 'onbellek'); os.makedirs(ON, exist_ok=True)

JS = r'''() => {
  const body = document.body;
  // 1) dipnot göstergelerini işaretle
  body.querySelectorAll('a[name^="_ftnref"], a[href^="#_ftn"]').forEach(e => { e.textContent = '⟦FN⟧'; });
  body.querySelectorAll('span.MsoFootnoteReference').forEach(e => { if (!e.closest('a')) e.textContent = '⟦FN⟧'; });
  // 2) dipnot gövdeleri (sayfa sonu listesi)
  const govde = [];
  body.querySelectorAll('div[id^="ftn"], div[style*="footnote-list"], p.MsoFootnoteText').forEach(e => { govde.push(e.innerText.slice(0, 300)); e.remove(); });
  // 3) üst simge (sup / vertical-align: super)
  body.querySelectorAll('sup, span, font').forEach(e => {
    if (e.closest('[data-isaretli]')) return;
    let sup = e.tagName === 'SUP';
    if (!sup) { const va = getComputedStyle(e).verticalAlign; sup = (va === 'super'); }
    if (sup) {
      const t = e.textContent;
      if (t.trim() && t.indexOf('⟦') < 0) { e.textContent = '⟦SUP:' + t.trim() + '⟧'; e.setAttribute('data-isaretli', '1'); }
    }
  });
  // 4) blokları belge sırasıyla, özyinelemeli çıkar (yerleşim tablolarının içine iner)
  const out = [];
  const BLOK = new Set(['P','H1','H2','H3','H4','H5','H6','LI','TABLE','DIV','UL','OL','BLOCKQUOTE','CENTER','SECTION','ARTICLE','TBODY','THEAD','TR','TD','FORM','PRE']);
  function satirlar(t) { return Array.from(t.rows || []).filter(tr => tr.closest('table') === t); }
  function kapsayiciMi(t) {
    const rows = satirlar(t);
    if (!rows.length) return false;
    if (rows.every(r => r.cells.length === 1)) return true;
    if (rows.length <= 3 && t.innerText.length > 5000) return true;
    return false;
  }
  function blokEkle(el) {
    const txt = el.innerText;
    let toplam = 0, kalin = 0;
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = w.nextNode())) {
      const s = n.nodeValue.replace(/⟦[^⟧]*⟧/g, '').trim();
      if (!s) continue;
      toplam += s.length;
      const fw = getComputedStyle(n.parentElement).fontWeight;
      if (fw === 'bold' || parseInt(fw) >= 600) kalin += s.length;
    }
    const st = getComputedStyle(el);
    out.push({tag: el.tagName, cls: el.className || '', text: txt, bold: toplam > 0 && kalin === toplam, kalin_oran: toplam ? kalin / toplam : 0, align: st.textAlign});
  }
  function yuru(node) {
    for (const ch of Array.from(node.children)) {
      const tag = ch.tagName;
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') continue;
      if (tag === 'TABLE') {
        if (kapsayiciMi(ch)) {
          for (const tr of satirlar(ch)) for (const td of Array.from(tr.cells)) yuru(td);
        } else {
          const rows = satirlar(ch);
          const txt = rows.map(tr => Array.from(tr.cells).map(td => td.innerText.trim().replace(/\s+/g, ' ')).filter(x => x).join(' | ')).filter(x => x).join('\n');
          out.push({tag, cls: ch.className || '', text: txt, bold: false, align: ''});
        }
        continue;
      }
      if (tag === 'P' || /^H[1-6]$/.test(tag) || tag === 'LI') { blokEkle(ch); continue; }
      // kapsayıcı: içinde blok öğe varsa in, yoksa metin bloğu olarak al
      const icBlok = Array.from(ch.children).some(c => BLOK.has(c.tagName));
      if (icBlok) yuru(ch);
      else if (ch.innerText && ch.innerText.trim()) blokEkle(ch);
    }
  }
  yuru(body);
  return {bloklar: out, dipnot_govde_sayisi: govde.length, baslik: document.title};
}'''

def iframe_url(k):
    return f"https://www.mevzuat.gov.tr/anasayfa/MevzuatFihristDetayIframe?MevzuatTur={k['tur']}&MevzuatNo={k['no']}&MevzuatTertip={k['tertip']}"

def main():
    arg = [a for a in sys.argv[1:] if a != '-f']
    zorla = '-f' in sys.argv
    with sync_playwright() as p:
        b = p.chromium.connect_over_cdp('http://127.0.0.1:9222')
        ctx = b.contexts[0]
        pg = ctx.new_page()
        try:
            for kid in arg:
                hedef = os.path.join(ON, f'{kid}.json')
                if os.path.exists(hedef) and not zorla:
                    print(kid, 'önbellekte, atlandı'); continue
                k = KAY[kid]
                url = iframe_url(k)
                r = pg.goto(url, wait_until='load', timeout=120000)
                time.sleep(2)
                d = pg.evaluate(JS)
                uzun = sum(len(x['text']) for x in d['bloklar'])
                print(kid, 'durum', r.status if r else None, 'blok', len(d['bloklar']), 'karakter', uzun, 'dipnot-gövde', d['dipnot_govde_sayisi'])
                d['kaynak'] = f"https://www.mevzuat.gov.tr/mevzuat?MevzuatNo={k['no']}&MevzuatTur={k['tur']}&MevzuatTertip={k['tertip']}"
                d['iframe'] = url
                d['alinma'] = time.strftime('%Y-%m-%d %H:%M:%S')
                json.dump(d, open(hedef, 'w', encoding='utf-8'), ensure_ascii=False)
                sys.stdout.flush()
                time.sleep(1.5)
        finally:
            pg.close()

main()
