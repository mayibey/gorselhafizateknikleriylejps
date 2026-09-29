# 29 Eyl 2026 (başkan: "arka plan tasarımını uygulamanınkiyle aynı yap"): uygulamanın GECE zemini —
# src/components/ui/screen.tsx: 5 duraklı petrol degrade + oyun-yukleme.webp dağ görseli + tepe/alt karartma perdeleri;
# kartlar index.tsx gecePanel (rgba(3,47,69,.88) + cyan kenar rgba(67,203,218,.5)); altın #F3C24A.
import base64, os, sys
KOK = os.path.dirname(os.path.abspath(__file__))
hedef = sys.argv[1] if len(sys.argv) > 1 else os.path.join(KOK, 'sablon.html')
s = open(hedef, encoding='utf-8').read()


def r(a, b, hepsi=False):
    global s
    assert a in s, a[:70]
    s = s.replace(a, b) if hepsi else s.replace(a, b, 1)


gorsel = base64.b64encode(open(os.path.join(KOK, '..', '..', 'assets', 'images', 'oyun-yukleme.webp'), 'rb').read()).decode()
r("--zemin:#06131F; --zemin2:#081A29; --panel:#0C2233; --panel2:#10293D; --cizgi:#1C3A52; --cizgi2:#274B66;",
  "--zemin:#043C54; --zemin2:rgba(3,40,60,.92); --panel:rgba(3,47,69,.88); --panel2:rgba(6,64,90,.92); --cizgi:rgba(67,203,218,.32); --cizgi2:rgba(67,203,218,.55);")
r("--metin:#ECE6D8; --soluk:#93A7B6; --soluk2:#6F8697;", "--metin:#F2EEE4; --soluk:#A9C6CF; --soluk2:#7FA3AE;")
r("--altin:#D9B24A; --altin2:#F0CF6E; --altinZemin:rgba(217,178,74,.12);", "--altin:#F3C24A; --altin2:#F8D57A; --altinZemin:rgba(243,194,74,.14);")
r("--sinyal:#4CC3D9; --sinyalZemin:rgba(76,195,217,.12);", "--sinyal:#43CBDA; --sinyalZemin:rgba(67,203,218,.14);")
# body: eski lacivert ışıma + ızgara yerine sabit gece zemini katmanı
r("""body{color:var(--metin);font-family:var(--govde);font-size:15px;line-height:1.6;
  background:
    radial-gradient(1200px 600px at 85% -10%, rgba(217,178,74,.10), transparent 60%),
    radial-gradient(900px 500px at -10% 110%, rgba(76,195,217,.08), transparent 60%),
    linear-gradient(var(--zemin),var(--zemin));
  background-attachment:fixed;min-height:100vh}
body::before{content:"";position:fixed;inset:0;pointer-events:none;opacity:.35;
  background-image:linear-gradient(rgba(147,167,182,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(147,167,182,.06) 1px,transparent 1px);
  background-size:44px 44px;mask-image:radial-gradient(ellipse at 50% 0%,#000 30%,transparent 80%)}""",
  """body{color:var(--metin);font-family:var(--govde);font-size:15px;line-height:1.6;min-height:100vh;
  background:linear-gradient(#064B62,#075D72 25%,#087087 50%,#064E66 75%,#043C54)}
#gece{position:fixed;inset:0;z-index:-1;pointer-events:none;
  background:
    linear-gradient(rgba(3,26,38,.78),rgba(3,26,38,.38) 19%,rgba(3,26,38,0) 38%),
    linear-gradient(rgba(4,30,45,0) 55%,rgba(4,30,45,.55) 80%,rgba(4,40,58,.92)),
    url(data:image/webp;base64,""" + gorsel + """) center/cover no-repeat,
    linear-gradient(#064B62,#043C54)}
.kap{z-index:0}""")
r('<canvas id="konfeti"></canvas>', '<div id="gece" aria-hidden="true"></div>\n<canvas id="konfeti"></canvas>')
# koyu lacivert yarı saydam iç yüzeyler → petrol
s = s.replace('rgba(6,19,31,.5)', 'rgba(2,34,50,.55)').replace('rgba(6,19,31,.45)', 'rgba(2,34,50,.5)').replace('rgba(6,19,31,.55)', 'rgba(2,34,50,.6)').replace('rgba(6,19,31,.35)', 'rgba(2,34,50,.4)')
s = s.replace('rgba(28,58,82,.8)', 'rgba(67,203,218,.28)')
s = s.replace('stroke="#1C3A52"', 'stroke="rgba(67,203,218,.25)"')
open(hedef, 'w', encoding='utf-8').write(s)
print('ok', len(s))
