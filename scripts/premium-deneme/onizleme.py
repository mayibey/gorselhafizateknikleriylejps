# Denemeyi kontrol için PDF'e basar: sorular + sonda cevap anahtarı ve kaynaklı açıklamalar.
# python scripts/premium-deneme/onizleme.py <deneme_id> <cikti.pdf>
import json,sys,html,subprocess,os,tempfile
did,out=sys.argv[1],sys.argv[2]
d=json.load(open(f'scripts/premium-deneme/cikti/{did}.json',encoding='utf-8'))
e=html.escape
css="""body{font-family:'Segoe UI',Arial;font-size:10.5pt;color:#1B2A4A;margin:0}
h1{font-family:Georgia,serif;color:#0B1F3A;font-size:20pt;margin:0 0 4px}.alt{color:#6E6047;margin-bottom:14px}
.q{break-inside:avoid;margin:0 0 11px;padding:8px 10px;border:1px solid #E7DCC7;border-radius:6px;background:#FFFCF5}
.no{font-weight:700;color:#C00000}.k{white-space:pre-line;margin-bottom:4px}.s{margin:1px 0 1px 12px}
.blok{background:#0B1F3A;color:#fff;padding:5px 10px;border-radius:4px;margin:14px 0 8px;font-weight:700}
.cv{break-inside:avoid;margin:0 0 6px;font-size:9pt}.cv b{color:#0B1F3A}@page{size:A4;margin:14mm}"""
h=[f"<html><head><meta charset='utf-8'><style>{css}</style></head><body><h1>{e(d['baslik'])}</h1><div class='alt'>{d['soruSayisi']} soru · ATA-AÖF tarzı · her sorunun cevabı resmî madde metniyle doğrulanmıştır</div>"]
for i,s in enumerate(d['sorular'],1):
    if i==1: h.append("<div class='blok'>MÜŞTEREK MEVZUAT (1–40)</div>")
    if i==41: h.append("<div class='blok'>BRANŞ MEVZUATI (41–80)</div>")
    h.append(f"<div class='q'><div class='k'><span class='no'>{i}.</span> {e(s['soru'])}</div>"+''.join(f"<div class='s'>{'ABCDE'[j]}) {e(x)}</div>" for j,x in enumerate(s['siklar']))+"</div>")
h.append("<div style='break-before:page'></div><h1>Cevap Anahtarı ve Kaynaklar</h1>")
for i,s in enumerate(d['sorular'],1):
    h.append(f"<div class='cv'><b>{i}. {'ABCDE'[s['dogru']]}</b> — {e(s['aciklama'])}</div>")
h.append("</body></html>")
t=tempfile.NamedTemporaryFile('w',suffix='.html',delete=False,encoding='utf-8'); t.write(''.join(h)); t.close()
subprocess.run([r'C:/Program Files/Google/Chrome/Application/chrome.exe','--headless=new','--disable-gpu','--no-pdf-header-footer',f'--print-to-pdf={out}','file:///'+os.path.abspath(t.name).replace(os.sep,'/')],capture_output=True,timeout=300)
print('PDF:',out,os.path.getsize(out))
