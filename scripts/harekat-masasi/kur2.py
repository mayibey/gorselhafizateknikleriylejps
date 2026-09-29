# Harekât Masası v2 kurucu: sablon.html'in CSS'i + yeni iskelet + masa2.js + veri2.json
#   python kur2.py <calisma_klasoru>   → harekat-masasi.html (artifact) + masa-app.html (uygulama)
import os, re, sys
KOK = os.path.dirname(os.path.abspath(__file__))
C = sys.argv[1]
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
.kpSec{justify-content:center;margin:12px 0 16px}.kpSec>span{color:var(--soluk);font-size:13px}
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
ISKELET = f"""<title>Harekât Masası</title>
<meta name="description" content="JSPS sınavı için eksik taraması: Röntgen veya Check-up, eksik haritası, Nokta Atışı kartları.">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,800;1,700&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap">
<script src="https://cdnjs.cloudflare.com/ajax/libs/marked/12.0.2/marked.min.js"></script>
{stil}
{EK_CSS}
{gece}
<div class="kap">
  <header class="ust"><div class="marka"><canvas id="radar" width="104" height="104" aria-hidden="true"></canvas><div><h1>Harekât <i>Masası</i></h1><small>Eksiğini bul · nokta atışıyla kapat</small></div></div></header>
  <main id="ekran"></main>
  <div class="sifirla"><button id="sifirlaBtn">İlerlemeyi sıfırla</button></div>
</div>
<div class="toast" id="toast" role="status"></div>
<script type="application/json" id="veri">__VERI__</script>
<script>
{open(os.path.join(KOK, 'masa2.js'), encoding='utf-8').read()}
</script>
"""
open(os.path.join(KOK, 'sablon2.html'), 'w', encoding='utf-8').write(ISKELET)
veri = open(os.path.join(C, 'veri2.json'), encoding='utf-8').read().replace('</', '<\\/')
sayfa = ISKELET.replace('__VERI__', veri)
open(os.path.join(C, 'harekat-masasi.html'), 'w', encoding='utf-8').write(sayfa)
doc = '<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>html,body{margin:0}[hidden]{display:none!important}</style></head><body>' + sayfa + '</body></html>'
open(os.path.join(C, 'masa-app.html'), 'w', encoding='utf-8').write(doc)
print('ok', len(sayfa))
