# "Sınavda ne soruldu" kutusu daha belirgin: altın çerçeve + büyük etiket + büyük/kalın metin
p = 'D:/Mevzu/JSPS/uygulama/scratchpad/ekim10-site-sablon.html'
s = open(p, encoding='utf-8').read()
def R(a, b):
    global s
    assert s.count(a) == 1, a[:90]
    s = s.replace(a, b)
R(""".sol{background:#0B1F3A;color:#fff;border-radius:12px;padding:14px;align-self:start}
.sol small{display:block;font:700 .64rem Inter,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:var(--gold);margin-bottom:6px}
.sol p{font-size:.95rem;line-height:1.5;margin:0}
.sol .knu{margin-top:10px;font-size:.78rem;color:#A9BAD2}""",
""".sol{background:#0B1F3A;color:#fff;border-radius:12px;padding:16px 18px 16px 16px;align-self:start;border:2px solid var(--gold);box-shadow:0 6px 18px rgba(201,162,39,.22)}
.sol small{display:inline-block;font:800 .74rem Inter,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:var(--navy);background:var(--gold);padding:4px 10px;border-radius:6px;margin-bottom:10px}
.sol p{font-size:1.12rem;line-height:1.45;font-weight:600;margin:0}
.sol .knu{margin-top:12px;padding-top:10px;border-top:1px solid rgba(255,255,255,.14);font-size:.8rem;color:#C9D6E8}""")
open(p, 'w', encoding='utf-8').write(s)
print('tamam')
