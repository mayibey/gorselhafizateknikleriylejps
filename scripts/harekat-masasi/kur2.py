# Harekât Merkezi v2 kurucu: sablon.html'in CSS'i + yeni iskelet + masa2.js + veri2.json
#   python kur2.py <calisma_klasoru>   → harekat-masasi.html (artifact) + masa-app.html (uygulama)
import os, re, sys
KOK = os.path.dirname(os.path.abspath(__file__))
C = sys.argv[1]
SLUG = sys.argv[2] if len(sys.argv) > 2 else None   # branş: veri2-<slug>.json → masa-app-<slug>.html (yoksa eski tek dosya)
eski = open(os.path.join(KOK, 'sablon.html'), encoding='utf-8').read()
stil = re.search(r'<style>.*?</style>', eski, re.S).group(0)
gece = re.search(r'<div id="gece"[^>]*></div>', eski).group(0)
EK_CSS = """
<style>
/* ---- v2: teşhis → eksikler → nokta atışı ---- */
.ozet{display:grid;grid-template-columns:1.4fr 1fr;gap:12px;margin-bottom:14px}
.ozet>div{background:var(--panel);border:1px solid var(--cizgi);border-radius:var(--r);padding:16px 18px;display:flex;flex-direction:column;gap:2px}
.lbl{font-size:11px;letter-spacing:1.6px;text-transform:uppercase;color:var(--soluk);font-weight:700}
.buyuk{font-family:var(--baslik);font-size:40px;line-height:1.05;color:var(--altin2)}.buyuk small{font-size:16px;color:var(--soluk);font-family:var(--mono)}
.kanit{font-size:12px;color:var(--soluk);font-family:var(--mono)}
.anaBtn{width:100%;text-align:left;padding:18px 20px;border-radius:var(--r);border:1px solid var(--altin);background:linear-gradient(180deg,rgba(243,194,74,.22),rgba(243,194,74,.08));display:flex;flex-direction:column;gap:4px;margin-bottom:22px;transition:.18s}
.anaBtn:hover{transform:translateY(-1px);box-shadow:0 10px 30px rgba(0,0,0,.35)}
.anaBtn b{font-size:19px;font-family:var(--baslik);color:#fff}.anaBtn small{color:var(--soluk);font-size:13px;line-height:1.4}
.ekler{display:grid;gap:8px}
.ek{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 12px 10px 14px;border-radius:12px;border:1px solid var(--cizgi);border-left:4px solid var(--r);background:var(--panel);text-align:left}
.ekUst{display:flex;flex-direction:column;gap:1px;min-width:0;flex:1}
.ekUst .hd{font-size:10.5px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;color:var(--r)}
.ekUst b{font-size:14.5px;line-height:1.3}.ekUst small{color:var(--soluk);font-size:12px;font-family:var(--mono)}
.ekAlt{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
.btn.kucuk{padding:7px 12px;font-size:12.5px;border-radius:9px}
.ek .ok{color:var(--soluk2);font-size:20px}
button.ek:hover{border-color:var(--vurgu)}
.ek.yapildi{opacity:.75}
.iyiler{margin-top:12px}.iyiler summary{cursor:pointer;color:var(--soluk);font-weight:700;padding:8px 0}
.altLinkler{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:22px;color:var(--soluk2)}
.altLinkler button{color:var(--soluk);font-weight:600;font-size:13px;text-decoration:underline;text-underline-offset:3px}
.girisBas{text-align:center;padding:18px 0 8px}.girisBas b{display:block;font-family:var(--baslik);font-size:44px;color:var(--altin2);line-height:1.1}
.girisBas p{max-width:52ch;margin:10px auto 0;color:var(--metin);text-shadow:0 1px 4px rgba(0,20,30,.9)}

/* giriş: hero + seçim kartları (başkanın beğendiği taslak); arka plan bizim gece zemini */
.hero{text-align:center;padding:8px 0 6px}
.gunRozet{display:inline-flex;align-items:center;gap:8px;padding:8px 18px;border-radius:999px;border:1.5px solid var(--altin);color:var(--altin2);font-family:var(--mono);font-weight:700;font-size:13px;letter-spacing:1.5px;background:rgba(3,40,60,.55)}
.gunRozet svg{width:16px;height:16px}
.heroBas{font-family:var(--baslik);font-weight:800;font-size:clamp(30px,8.5vw,44px);line-height:1.05;margin:14px 0 8px;color:#fff;letter-spacing:.5px;text-shadow:0 2px 10px rgba(0,20,30,.7)}
.heroBas em{display:block;font-style:normal;color:var(--altin2);font-size:.72em;margin-top:6px}
.heroAlt{margin:0 auto;max-width:34ch;color:#E6EEF1;font-size:16px;line-height:1.45;text-shadow:0 1px 6px rgba(0,20,30,.9)}
.kpSatir{display:flex;align-items:center;justify-content:center;gap:10px;margin:16px 0 14px;flex-wrap:wrap}.kpSatir>span{color:#E6EEF1;font-size:15px;text-shadow:0 1px 4px rgba(0,20,30,.9)}
.kpSec{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin:0}
.kpSec .anahtar{font-size:15px;padding:10px 22px;border-radius:999px;border:1.5px solid rgba(67,203,218,.45);background:rgba(3,47,69,.7);color:#E6EEF1;font-weight:600}
.kpSec .anahtar[aria-pressed="true"]{border-color:var(--altin);background:rgba(243,194,74,.14);color:var(--altin2);font-weight:800}
#ekran>.kpSec{margin-bottom:14px}
.secKart{border:1.5px solid var(--altin);border-radius:22px;padding:18px 16px 16px;background:linear-gradient(180deg,rgba(3,40,60,.92),rgba(2,30,46,.94));margin-bottom:16px;display:flex;flex-direction:column;gap:12px}
.secUst{display:flex;align-items:center;gap:12px}
.secIkon{width:60px;height:60px;border-radius:14px;border:1.5px solid rgba(243,194,74,.55);background:rgba(3,47,69,.6);display:grid;place-items:center;color:var(--altin2);flex:none}
.secIkon svg{width:38px;height:38px}
.secBaslik{flex:1;min-width:0;display:flex;flex-direction:column;gap:5px;align-items:flex-start}.secBaslik h3{font-family:var(--baslik);font-size:clamp(23px,6.6vw,32px);margin:0;color:#fff;line-height:1.05;white-space:nowrap}
.secMeta{display:flex;align-items:center;gap:10px;color:#DCEBEF;font-size:13.5px;white-space:nowrap}.secMeta span{display:inline-flex;align-items:center;gap:6px}.secMeta svg{width:16px;height:16px;color:var(--altin2)}.secMeta i{width:1px;height:16px;background:rgba(220,235,239,.35)}
.secRozet{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:999px;background:var(--altin);color:#1b1406;font-weight:800;font-size:11.5px;letter-spacing:.6px;white-space:nowrap;align-self:flex-start}.secRozet svg{width:13px;height:13px}
.secAc{margin:0;font-size:15.5px;line-height:1.5;color:#F2EEE4;padding-bottom:12px;border-bottom:1px solid rgba(67,203,218,.25)}
.secListe{list-style:none;margin:0;padding:0;display:grid;gap:8px}.secListe li{display:flex;align-items:center;gap:12px;font-size:15.5px;color:#F2EEE4}
.secListe svg{width:22px;height:22px;padding:4px;border-radius:50%;background:var(--altin);color:#1b1406;flex:none}
.secBtn{width:100%;padding:15px 18px;border-radius:14px;background:linear-gradient(180deg,#F8D57A,#F3C24A);color:#1b1406;font-weight:900;font-size:18px;letter-spacing:.6px;display:flex;align-items:center;justify-content:center;gap:10px;box-shadow:0 6px 20px rgba(243,194,74,.25)}
.secBtn svg{width:22px;height:22px}.secBtn:hover{filter:brightness(1.06)}
.altNav{display:flex;align-items:center;justify-content:center;gap:14px;margin-top:6px;flex-wrap:wrap}
.altNav button{display:inline-flex;align-items:center;gap:8px;color:#E6EEF1;font-weight:600;font-size:15px;padding:6px 4px;text-shadow:0 1px 4px rgba(0,20,30,.9)}.altNav svg{width:20px;height:20px;color:#E6EEF1}.altNav i{width:1px;height:18px;background:rgba(220,235,239,.35)}

/* GİRİŞ TEK EKRAN (başkan: "tek bakışta sığsın"): üst logo gizli, ölçüler sıkı, viewport'a göre küçülür */
body.giriste .ust,body.giriste .sifirla{display:none}
body.giriste .kap{padding-block:10px 12px;min-height:100vh;min-height:100dvh;display:flex;flex-direction:column;justify-content:space-between;max-width:560px}
body.giriste .hero{padding:0}
body.giriste .gunRozet{padding:5px 14px;font-size:11.5px}
body.giriste .heroBas{font-size:clamp(22px,6.4vw,30px);margin:8px 0 4px}
body.giriste .heroBas em{font-size:.7em;margin-top:2px}
body.giriste .heroAlt{font-size:13.5px;line-height:1.35;max-width:40ch}
body.giriste .kpSatir{margin:8px 0 8px;gap:8px}body.giriste .kpSatir>span{font-size:13px}
body.giriste .kpSec .anahtar{font-size:13px;padding:7px 16px}
body.giriste .secKart{padding:12px 14px 12px;gap:8px;margin-bottom:10px;border-radius:18px}
body.giriste .secIkon{width:46px;height:46px;border-radius:12px}body.giriste .secIkon svg{width:30px;height:30px}
body.giriste .secBaslik{gap:3px}body.giriste .secBaslik h3{font-size:clamp(20px,5.6vw,26px)}
body.giriste .secRozet{font-size:10px;padding:3px 8px}
body.giriste .secMeta{font-size:12.5px;gap:8px}
body.giriste .secAc{font-size:13.5px;line-height:1.4;padding-bottom:8px}
body.giriste .secListe{display:flex;flex-wrap:wrap;gap:6px 12px}body.giriste .secListe li{font-size:12.5px;gap:6px}
body.giriste .secListe svg{width:17px;height:17px;padding:3px}
body.giriste .secBtn{padding:11px 16px;font-size:15.5px;border-radius:12px}body.giriste .secBtn svg{width:18px;height:18px}
body.giriste .altNav{margin-top:2px;gap:10px}body.giriste .altNav button{font-size:13px;padding:4px 2px}body.giriste .altNav svg{width:17px;height:17px}
@media (max-height:740px){body.giriste .heroAlt{display:none}body.giriste .secAc{display:none}body.giriste .secKart{gap:7px}}
@media (max-height:620px){body.giriste .secListe{display:none}body.giriste .heroBas{font-size:20px;margin:6px 0 2px}body.giriste .secKart{padding:10px 12px}}
.kayitSatir{display:flex;justify-content:space-between;align-items:center;gap:8px;width:100%;padding:9px 12px;border-radius:10px;border:1px dashed rgba(243,194,74,.5);color:#F2EEE4;font-size:13px;text-align:left}.kayitSatir b{color:var(--altin2);white-space:nowrap}.kayitSatir svg{width:16px;height:16px;vertical-align:-3px;margin-right:6px}
body.giriste .kayitSatir{padding:7px 10px;font-size:12.5px}
.tipKutu{padding:12px 14px;margin-bottom:12px;font-size:14px;line-height:1.5;border-color:rgba(243,194,74,.45)}
.alt3.sabit{position:static;background:none;border:0;backdrop-filter:none;padding:14px 0 0}
.sinav .alt3{position:fixed}
@media (max-width:400px){.secMeta{font-size:12.5px}.marka small{letter-spacing:1.4px;font-size:10px}}
.tarama2{display:grid;grid-template-columns:1fr 1fr;gap:14px}@media (max-width:720px){.tarama2{grid-template-columns:1fr}}
.tur{display:flex;flex-direction:column;gap:6px;padding:18px 20px}.tur h3{font-family:var(--baslik);font-size:22px;margin:4px 0 2px;color:var(--altin2)}.tur p{margin:0;font-size:14px;line-height:1.55}.tur .btn{margin-top:auto;align-self:flex-start}
.kucukNot{color:var(--soluk)!important;font-size:12.5px!important;margin:0 0 10px}
.kart.nokta{padding:22px 24px;min-height:220px;display:flex;flex-direction:column;gap:10px}
.kartKanun{font-family:var(--mono);font-size:12px;color:var(--altin2)}
.kart.nokta .kok{font-size:21px;font-family:var(--baslik);margin:4px 0 0;white-space:normal}
.ipucu2{color:var(--soluk);font-size:13px;margin:0}
.arka{border-top:1px dashed var(--cizgi2);padding-top:12px;margin-top:4px;display:grid;gap:8px}
.hukum{font-size:16.5px;line-height:1.55;margin:0;color:#fff}
.nd{margin:0;font-size:14px;line-height:1.5;color:var(--metin)}
.toast{pointer-events:none}
body.sinavda .toast{bottom:calc(96px + env(safe-area-inset-bottom,0px))}
.kural{background:var(--altinZemin);border:1px solid rgba(243,194,74,.35);border-radius:12px;padding:12px 14px;margin-bottom:12px}.kural b{display:block;margin-bottom:4px}.kural p{margin:0;font-size:13.5px;color:var(--metin)}
.not li.kacan{border-color:rgba(232,90,79,.5)}
.not .nd{margin-top:6px}
@media (max-width:480px){.ozet{grid-template-columns:1fr}.buyuk{font-size:34px}}
</style>
"""
# gerçek Mevzu logosu (şeffaf), 200px'e küçültülmüş
import base64, io
from PIL import Image
_im = Image.open('C:/Users/GIGABYTE/OneDrive/Desktop/ARŞİV/4 Reklam ve Tanıtım/MEVZU_LOGO_SEFFAF.png').convert('RGBA')
_im.thumbnail((240, 240)); _b = io.BytesIO(); _im.save(_b, 'PNG', optimize=True)
LOGO = 'data:image/png;base64,' + base64.b64encode(_b.getvalue()).decode()
ISKELET = f"""<title>Harekât Merkezi</title>
<meta name="description" content="JSPS sınavı için eksik taraması: Röntgen veya Check-up, eksik haritası, Nokta Atışı kartları.">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,800;1,700&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap">
<script src="https://cdnjs.cloudflare.com/ajax/libs/marked/12.0.2/marked.min.js"></script>
{stil}
{EK_CSS}
<style>
{open(os.path.join(KOK, 'stil4.css'), encoding='utf-8').read()}
</style>
{gece}
<div class="kap">
    <main id="ekran"></main>
  <div class="sifirla"><button id="sifirlaBtn">İlerlemeyi sıfırla</button></div>
</div>
<div class="toast" id="toast" role="status"></div>
<script type="application/json" id="veri">__VERI__</script>
<script>
{open(os.path.join(KOK, 'masa4.js'), encoding='utf-8').read().replace('__LOGO__', LOGO)}
</script>
"""
open(os.path.join(KOK, 'sablon2.html'), 'w', encoding='utf-8').write(ISKELET)
import json as _json
veri_ad = f'veri2-{SLUG}.json' if SLUG else 'veri2.json'
veri = open(os.path.join(C, veri_ad), encoding='utf-8').read().replace('</', '<\\/')
brans = _json.loads(open(os.path.join(C, veri_ad), encoding='utf-8').read()).get('brans') or {'slug': 'mebs', 'ad': 'MEBS'}
sayfa = ISKELET.replace('__VERI__', veri).replace('<script>\n', '<script>window.BRANS=' + _json.dumps(brans, ensure_ascii=False) + ';\n', 1)
doc = '<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover"><style>html,body{margin:0}[hidden]{display:none!important}</style></head><body>' + sayfa + '</body></html>'
if not SLUG or SLUG == 'mebs':   # başkanın artifact'ı + eski tek dosya (MEBS)
    open(os.path.join(C, 'harekat-masasi.html'), 'w', encoding='utf-8').write(sayfa)
    open(os.path.join(C, 'masa-app.html'), 'w', encoding='utf-8').write(doc)
if SLUG:
    open(os.path.join(C, f'masa-app-{SLUG}.html'), 'w', encoding='utf-8').write(doc)
print('ok', brans['slug'], len(sayfa))
