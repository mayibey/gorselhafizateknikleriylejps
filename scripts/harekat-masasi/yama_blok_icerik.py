# 2. AŞAMA (başkan, 3 Eki: "aşama 2'ye geç ivedi"): madde bloklarına yazılı içerik.
# Veri: kanun.bl = {madde: {b: başlık, oz: öz, so: [sınavda nasıl soruluyor], ak: [akılda tut], kr: [{m, n: neden}]}}
#   kaynak: scripts/harekat-masasi/madde_bloklari/kanun_<id>.json (veri_uret.py ekler, branş kapsamına göre süzer)
# Blok sırası: başlık → ÖZ → (yanlış yaptığın sorular, kapalı) → AKILDA TUT → Sınavda nasıl soruluyor → kartlar → ezber → karıştırılanlar (nedenli)
# Bana özel artık kartı olmayan maddeleri de gösterir (eskiden yalnız kartı olan maddeler; yanlış yapılan madde düşüyordu).
import os
KOK = os.path.dirname(os.path.abspath(__file__))
p = os.path.join(KOK, 'masa4.js'); s = open(p, encoding='utf-8').read()
c = os.path.join(KOK, 'stil4.css'); css = open(c, encoding='utf-8').read()
if 'const BL=k.bl' in s:
    print('zaten uygulanmış'); raise SystemExit


def r(a, b):
    global s
    assert s.count(a) == 1, (a[:90], s.count(a))
    s = s.replace(a, b)


# simge: ampul
r(""" tik:'<svg""", """ ampul:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0012 3z"/></svg>',
 tik:'<svg""")

# madde başlığı: önce bloğun başlığı
r("function maddeBaslik(k,m,sorular){const n=k.n.find(n=>n.m.includes(m));if(n)return n.b;",
  "function maddeBaslik(k,m,sorular){if(k.bl&&k.bl[m]&&k.bl[m].b)return k.bl[m].b;const n=k.n.find(n=>n.m.includes(m));if(n)return n.b;")

# analiz ekranı "Öğren" düğmesi: bloğu olan maddede de
r("${k.n.some(n=>n.m.includes(m))||k.g==='mus'?", "${k.n.some(n=>n.m.includes(m))||(k.bl&&k.bl[m])||k.g==='mus'?")

# madde listesi: kart + blok
r("  const maddeNolari=[...new Set(k.n.map(mOf).filter(Boolean))].sort(",
  "  const BL=k.bl||{};\n  const maddeNolari=[...new Set([...k.n.map(mOf),...Object.keys(BL)].filter(Boolean))].sort(")

# blok: içerik alanları
r("  const blok=(m,acik,bana)=>{const ns=k.n.filter(n=>mOf(n)===m);const qm=qMadde[m];const ip=ipucu(m);const ts=tabloSatir(m);const kr=karis(m);",
  "  const blok=(m,acik,bana)=>{const ns=k.n.filter(n=>mOf(n)===m);const qm=qMadde[m];const b2=BL[m]||null;const ip=(b2&&b2.so&&b2.so.length)?b2.so:ipucu(m);const ts=tabloSatir(m);\n"
  "    const krB=((b2&&b2.kr)||[]).filter(x=>x&&x.m&&x.m!==m);const kr=karis(m).filter(x=>!krB.some(y=>y.m===x)).slice(0,Math.max(0,4-krB.length));")

r("<span class=\"acilirOk\">${IK.sag}</span></summary>\n      ${bana&&qm&&qm.y.length?`<details class=\"mSorular\">",
  "<span class=\"acilirOk\">${IK.sag}</span></summary>\n      ${b2&&b2.oz?`<p class=\"mOz\">${vurgula(b2.oz)}</p>`:''}\n      ${bana&&qm&&qm.y.length?`<details class=\"mSorular\">")

r("      ${ip.length?`<div class=\"mIpucu\">",
  "      ${b2&&b2.ak&&b2.ak.length?`<div class=\"mAkil\"><small>${IK.ampul} Akılda tut</small>${b2.ak.map(x=>`<p>${vurgula(x)}</p>`).join('')}</div>`:''}\n      ${ip.length?`<div class=\"mIpucu\">")

r("      ${kr.length?`<div class=\"mKaris\"><small>Karıştırılan maddeler</small><div>${kr.map(x=>`<button class=\"mGit\" data-git=\"${esc(x)}\">m.${esc(x)} · ${esc(maddeBaslik(k,x))}</button>`).join('')}</div></div>`:''}",
  "      ${krB.length||kr.length?`<div class=\"mKaris\"><small>Karıştırılan maddeler</small>${krB.map(x=>maddeNolari.includes(x.m)?`<button class=\"mGit mGitN\" data-git=\"${esc(x.m)}\"><b>m.${esc(x.m)} · ${esc(maddeBaslik(k,x.m))}</b><small>${esc(x.n)}</small></button>`:`<div class=\"mGitN pasif\"><b>m.${esc(x.m)}</b><small>${esc(x.n)}</small></div>`).join('')}${kr.length?`<div>${kr.map(x=>`<button class=\"mGit\" data-git=\"${esc(x)}\">m.${esc(x)} · ${esc(maddeBaslik(k,x))}</button>`).join('')}</div>`:''}</div>`:''}")

# Bana özel: yanlış yapılan her madde (kartı olmasa da)
r("const banaM=Object.keys(qMadde).filter(m=>qMadde[m].y.length&&maddeNolari.includes(m)).sort(",
  "const banaM=Object.keys(qMadde).filter(m=>qMadde[m].y.length).sort(")

css += """
/* 2. aşama: madde bloğu yazılı içerik */
.mOz{margin:2px 0 10px;font-size:15px;line-height:1.55;color:#F2EEE4}
.mAkil{padding:10px 12px;border-radius:12px;background:rgba(243,194,74,.10);border:1px solid rgba(243,194,74,.55);margin-bottom:8px}
.mAkil small{display:flex;align-items:center;gap:6px;font-size:10.5px;letter-spacing:1.2px;text-transform:uppercase;color:#F8D57A;font-weight:800}.mAkil small svg{width:14px;height:14px}
.mAkil p{margin:5px 0 0;font-size:14px;line-height:1.5;color:#FFF6DC;font-weight:600}
.mKaris .mGitN{display:block;width:100%;margin:0 0 6px;padding:8px 12px;border-radius:12px;text-align:left}
.mKaris .mGitN b{display:block;font-size:13px;color:#F8D57A}
.mKaris .mGitN small{display:block;margin-top:2px;font-size:12.5px;line-height:1.4;color:#E6EEF1;font-weight:500;letter-spacing:0;text-transform:none}
.mKaris .mGitN.pasif{border:1px dashed rgba(243,194,74,.4);background:rgba(243,194,74,.04)}
"""
open(p, 'w', encoding='utf-8').write(s)
open(c, 'w', encoding='utf-8').write(css)
print('uygulandı')
