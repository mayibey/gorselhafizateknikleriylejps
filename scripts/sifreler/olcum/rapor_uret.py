# havuz_sonuc.json (arsiv_olc.py çıktısı) → "Şifre Açıkları" rapor sayfası (HTML)
#   python scripts/sifreler/olcum/rapor_uret.py <arsiv_dir>   → <arsiv_dir>/sifre_acik.html
import json, re, sys, os, glob, collections, html
sys.stdout.reconfigure(encoding='utf-8')
KOK = 'D:/GorselHafizaTeknikleriyleJSPS'
A = sys.argv[1]
H = json.load(open(f'{A}/havuz_sonuc.json', encoding='utf-8'))
ADLAR = {}; SAY = {}
for f in glob.glob(f'{KOK}/gemini_calisma/kodlama_secme/kanun_*.json'):
    d = json.load(open(f, encoding='utf-8')); ADLAR[d['id']] = re.sub(r'\s*\((müşterek|jandarma branş) kapsam[ıi]\)', '', d['ad']); SAY[d['id']] = len(d['kodlar'])
def norm(s): return re.sub(r'\s+', ' ', (s or '').replace('İ', 'i').lower()).strip()

# gerçek sınav sorularında kitapçıklar arası tekrarı tekille
gor = {}; T = []
for q in H:
    if q['grup'] == 'arşiv': T.append(dict(q, tekrar=1)); continue
    k = norm(q['kok'])[:140]
    if k in gor: gor[k]['tekrar'] += 1; continue
    gor[k] = dict(q, tekrar=1); T.append(gor[k])
H = T

def grup_ozet(Q):
    c = collections.Counter(q['sev'] for q in Q); return len(Q), c[2], c[1], c[0]
GER = [q for q in H if q['grup'] != 'arşiv']; ARS = [q for q in H if q['grup'] == 'arşiv']
toplam = grup_ozet(H); g = grup_ozet(GER); a = grup_ozet(ARS)

kanunlar = []
for lid in sorted(ADLAR):
    Q = [q for q in H if q['lid'] == lid]; QG = [q for q in Q if q['grup'] != 'arşiv']
    n, l2, l1, l0 = grup_ozet(Q); ng, _, _, l0g = grup_ozet(QG)
    md = collections.Counter(q['madde'] for q in Q if q['sev'] == 0)
    eks = []
    for m, qs in sorted(collections.defaultdict(list, {m: [q for q in Q if q['sev'] == 0 and q['madde'] == m] for m in md}).items(), key=lambda x: (x[0] == '?', -len(x[1]))):
        eks.append({'m': m, 's': [{'id': q['id'], 'k': q['kaynak'], 'g': q['grup'], 'kok': q['kok'], 'c': (q['sec'].get(q['d']) if q['d'] else None), 't': q.get('tekrar', 1)} for q in qs]})
    oncelik = 3 * l0g + (l0 - l0g)
    kanunlar.append({'id': lid, 'ad': ADLAR[lid], 'sifre': SAY[lid], 'n': n, 'l2': l2, 'l1': l1, 'l0': l0, 'ng': ng, 'l0g': l0g, 'oncelik': oncelik, 'eks': eks})
sira = sorted(kanunlar, key=lambda k: -k['oncelik'])
print('ÖNCELİK (gerçek sınav eksiği ×3 + arşiv eksiği):')
for k in sira[:12]: print(f"  k{k['id']:2d} {k['ad'][:45]:45s} eksik {k['l0']:3d} (gerçek {k['l0g']:2d}) · şifre {k['sifre']}")
VERI = json.dumps({'toplam': toplam, 'gercek': g, 'arsiv': a, 'kanunlar': kanunlar}, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')

SAYFA = r'''<title>Şifre Açıkları</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Condensed:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap">
<style>
:root{--bg:#F1F3F6;--sur:#FFFFFF;--sur2:#E8ECF1;--ink:#1B2430;--mut:#5C6878;--line:#D5DBE3;--acc:#1F6F8B;--acc2:#D9EDF3;--iyi:#2E7D4F;--uyar:#B7791F;--kotu:#B23A3A;--kotu2:#F6E3E3;--mono:'IBM Plex Mono',ui-monospace,Menlo,monospace;--govde:'IBM Plex Sans',system-ui,Segoe UI,sans-serif;--baslik:'IBM Plex Sans Condensed','IBM Plex Sans',system-ui,sans-serif}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){color-scheme:dark;--bg:#0F141B;--sur:#161D27;--sur2:#1F2835;--ink:#E6EAF0;--mut:#93A0B0;--line:#2B3644;--acc:#5FB3CF;--acc2:#12303B;--iyi:#5BBF86;--uyar:#D9A441;--kotu:#E07070;--kotu2:#3A1F1F}}
:root[data-theme="dark"]{color-scheme:dark;--bg:#0F141B;--sur:#161D27;--sur2:#1F2835;--ink:#E6EAF0;--mut:#93A0B0;--line:#2B3644;--acc:#5FB3CF;--acc2:#12303B;--iyi:#5BBF86;--uyar:#D9A441;--kotu:#E07070;--kotu2:#3A1F1F}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--govde);font-size:15px;line-height:1.5}
.sayfa{max-width:1080px;margin:0 auto;padding-block:28px 64px;padding-inline:16px}
h1{font-family:var(--baslik);font-weight:700;font-size:clamp(28px,4vw,40px);line-height:1.1;margin:0 0 6px;text-wrap:balance}
h2{font-family:var(--baslik);font-weight:600;font-size:22px;margin:36px 0 12px;text-wrap:balance}
h3{font-family:var(--baslik);font-weight:600;font-size:18px;margin:0}
.alt{color:var(--mut);margin:0 0 22px;max-width:70ch}
.etk{font-size:11.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--mut);font-weight:600}
.ozet{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:0 0 8px}
.kutu{background:var(--sur);border:1px solid var(--line);border-radius:6px;padding:12px 14px}
.kutu b{display:block;font-family:var(--baslik);font-size:30px;font-weight:700;line-height:1.1;font-variant-numeric:tabular-nums}
.kutu .k{color:var(--kotu)}.kutu .i{color:var(--iyi)}
.not{font-size:13.5px;color:var(--mut);max-width:80ch;margin:10px 0 0}
table{border-collapse:collapse;width:100%;font-size:14px}th,td{padding:7px 8px;border-bottom:1px solid var(--line);text-align:left;vertical-align:middle}
th{font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--mut);font-weight:600}
td.n,th.n{text-align:right;font-variant-numeric:tabular-nums}
.bar{height:10px;background:var(--sur2);border-radius:2px;overflow:hidden;min-width:90px}.bar i{display:block;height:100%;background:var(--kotu)}
.tab{overflow-x:auto;background:var(--sur);border:1px solid var(--line);border-radius:6px}
.tab tbody tr{cursor:pointer}.tab tbody tr:hover{background:var(--acc2)}
.filtre{display:flex;flex-wrap:wrap;gap:8px;align-items:center;position:sticky;top:env(safe-area-inset-top,0px);background:var(--bg);padding-block:10px;z-index:2;border-bottom:1px solid var(--line)}
.filtre input,.filtre select{font:inherit;font-size:14px;padding:7px 9px;border:1px solid var(--line);border-radius:5px;background:var(--sur);color:var(--ink)}
.filtre input{flex:1 1 220px;min-width:0}
.seg{display:inline-flex;border:1px solid var(--line);border-radius:5px;overflow:hidden}.seg button{font:inherit;font-size:13.5px;padding:7px 11px;background:var(--sur);color:var(--ink);border:0;cursor:pointer}.seg button[aria-pressed="true"]{background:var(--acc);color:#fff}
.seg button:focus-visible,.filtre input:focus-visible,.filtre select:focus-visible,summary:focus-visible{outline:2px solid var(--acc);outline-offset:1px}
details.kanun{background:var(--sur);border:1px solid var(--line);border-radius:6px;margin:12px 0}
details.kanun>summary{list-style:none;cursor:pointer;display:flex;flex-wrap:wrap;gap:6px 14px;align-items:baseline;padding:12px 14px}
details.kanun>summary::-webkit-details-marker{display:none}
.say{font-family:var(--mono);font-size:13px;color:var(--mut);font-variant-numeric:tabular-nums}
.rozet{display:inline-block;font-size:12px;font-weight:600;padding:2px 8px;border-radius:999px;background:var(--kotu2);color:var(--kotu)}
.madde{padding:4px 14px 12px;border-top:1px solid var(--line)}
.madde h4{margin:10px 0 6px;font-family:var(--mono);font-weight:500;font-size:13px;color:var(--acc)}
.soru{display:grid;grid-template-columns:auto 1fr;gap:4px 10px;padding:7px 0;border-top:1px dashed var(--line);font-size:14px}
.soru:first-of-type{border-top:0}
.kim{font-family:var(--mono);font-size:11.5px;color:var(--mut);white-space:nowrap;padding-top:2px}
.kim.g{color:var(--uyar);font-weight:500}
.cev{display:inline-block;margin-top:3px;font-size:13px;color:var(--iyi);font-weight:500}
.cev::before{content:"→ ";color:var(--mut)}
.bos{color:var(--mut);padding:14px}
mark{background:var(--acc2);color:inherit;padding:0 1px}
@media (prefers-reduced-motion:no-preference){details.kanun>summary{transition:background .15s}}
@media (max-width:520px){.soru{grid-template-columns:1fr}.kim{padding-top:0}}
</style>
<div class="sayfa">
<p class="etk">Kilit kelime şifreleri · müşterek 25 mevzuat · 4 Ekim 2026</p>
<h1>Şifre Açıkları</h1>
<p class="alt">1.031 şifre, elimizdeki bütün müşterek sorulara uygulandı. Aşağıda şifresi olmayan sorular kanun ve madde sırasıyla duruyor; her satır bir eksik bilgi adayıdır.</p>
<div class="ozet" id="ozet"></div>
<p class="not">Ölçüm otomatiktir: "aynen" = kilit kelime soruda ya da şıkta birebir geçiyor; "ilgili şifre var" = aynı kanundan kelime kökleri soruyu tutan bir şifre var; "şifre yok" = hiçbiri. 2026 sınavındaki 109 soruda elle denetimle karşılaştırıldı: otomatik ölçüm, aslında çözülen soruların yaklaşık %15'ini "şifre yok" sayıyor; yani gerçek açık burada görünenden biraz küçük. Gerçek sınav sorularında cevap anahtarı yalnız 2026 setinde var.</p>
<h2>Kanun kanun</h2>
<div class="tab"><table id="tablo"><thead><tr><th>Kanun</th><th class="n">Şifre</th><th class="n">Soru</th><th class="n">Aynen</th><th class="n">İlgili var</th><th class="n">Şifre yok</th><th>Açık payı</th><th class="n">Gerçek sınavda açık</th></tr></thead><tbody></tbody></table></div>
<p class="not">Satıra basınca o kanunun eksik listesi açılır. "Gerçek sınavda açık" sütunu 2026 + 9 çıkmış kitapçıktaki tekrarsız sorulardan şifresi olmayanlardır; öncelik sırası bunlara göredir.</p>
<h2 id="eksikler">Eksik listesi</h2>
<div class="filtre">
<div class="seg" role="group" aria-label="kaynak"><button id="f-hepsi" aria-pressed="true">Hepsi</button><button id="f-gercek" aria-pressed="false">Yalnız gerçek sınav</button><button id="f-arsiv" aria-pressed="false">Yalnız arşiv</button></div>
<select id="f-kanun"><option value="">Bütün kanunlar</option></select>
<input id="f-ara" type="search" placeholder="Soru metninde ara (örn. zamanaşımı)">
<span class="say" id="f-say"></span>
</div>
<div id="liste"></div>
</div>
<script>
const V=/*VERI*/[];
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function kutu(etiket,deger,sinif){return `<div class="kutu"><span class="etk">${etiket}</span><b class="${sinif||''}">${deger}</b></div>`}
const [tn,tl2,tl1,tl0]=V.toplam,[gn,,,gl0]=V.gercek,[an,,,al0]=V.arsiv;
$('#ozet').innerHTML=kutu('Soru (tekrarsız)',tn.toLocaleString('tr'))+kutu('Kelime aynen',tl2.toLocaleString('tr'),'i')+kutu('İlgili şifre var',tl1.toLocaleString('tr'))+kutu('Şifre yok',`${tl0.toLocaleString('tr')} <span class="say">%${Math.round(100*tl0/tn)}</span>`,'k')+kutu('Gerçek sınav: yok / soru',`${gl0} / ${gn}`,'k')+kutu('Arşiv: yok / soru',`${al0} / ${an}`,'k');
const K=V.kanunlar.slice().sort((a,b)=>b.oncelik-a.oncelik);
$('#tablo tbody').innerHTML=K.map(k=>`<tr data-id="${k.id}"><td><span class="say">k${k.id}</span> ${esc(k.ad)}</td><td class="n">${k.sifre}</td><td class="n">${k.n}</td><td class="n">${k.l2}</td><td class="n">${k.l1}</td><td class="n"><b>${k.l0}</b></td><td><div class="bar" title="%${Math.round(100*k.l0/Math.max(1,k.n))}"><i style="width:${Math.round(100*k.l0/Math.max(1,k.n))}%"></i></div></td><td class="n">${k.l0g} / ${k.ng}</td></tr>`).join('');
const sel=$('#f-kanun');K.forEach(k=>{const o=document.createElement('option');o.value=k.id;o.textContent=`k${k.id} · ${k.ad}`;sel.appendChild(o)});
let kaynak='hepsi';
function vurgula(t,q){if(!q)return esc(t);const r=new RegExp('('+q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','gi');return esc(t).replace(r,'<mark>$1</mark>')}
function ciz(){
 const q=$('#f-ara').value.trim().toLocaleLowerCase('tr'),kid=sel.value;let toplam=0,out='';
 for(const k of K){ if(kid&&String(k.id)!==kid)continue; let parcalar='',ks=0;
  for(const m of k.eks){ const sl=m.s.filter(s=>(kaynak==='hepsi'||(kaynak==='gercek'?s.g!=='arşiv':s.g==='arşiv'))&&(!q||(s.kok+' '+(s.c||'')).toLocaleLowerCase('tr').includes(q))); if(!sl.length)continue; ks+=sl.length;
   parcalar+=`<div class="madde"><h4>m.${esc(m.m)} · ${sl.length} soru</h4>`+sl.map(s=>`<div class="soru"><span class="kim ${s.g!=='arşiv'?'g':''}">${s.g!=='arşiv'?'SINAV':'arşiv'} ${esc(s.id)}${s.t>1?' ×'+s.t:''}</span><div>${vurgula(s.kok,q)}${s.c?`<br><span class="cev">${vurgula(s.c,q)}</span>`:''}</div></div>`).join('')+'</div>'}
  if(!ks)continue; toplam+=ks;
  out+=`<details class="kanun" id="k${k.id}" ${kid?'open':''}><summary><h3>k${k.id} · ${esc(k.ad)}</h3><span class="rozet">${ks} eksik</span><span class="say">${k.sifre} şifre · ${k.n} soru · gerçek sınavda ${k.l0g}/${k.ng} açık</span></summary>${parcalar}</details>`}
 $('#liste').innerHTML=out||'<p class="bos">Bu süzgeçte eksik yok.</p>';$('#f-say').textContent=toplam+' soru';}
for(const [id,v] of [['f-hepsi','hepsi'],['f-gercek','gercek'],['f-arsiv','arsiv']])$('#'+id).addEventListener('click',()=>{kaynak=v;document.querySelectorAll('.seg button').forEach(b=>b.setAttribute('aria-pressed',b.id===id));ciz()});
sel.addEventListener('change',ciz);$('#f-ara').addEventListener('input',ciz);
$('#tablo tbody').addEventListener('click',e=>{const tr=e.target.closest('tr');if(!tr)return;sel.value=tr.dataset.id;ciz();document.getElementById('eksikler').scrollIntoView({behavior:'smooth'})});
try{const h=location.hash.replace('#','');if(/^k\d+$/.test(h)){sel.value=h.slice(1)}}catch(e){}
ciz();
</script>'''
open(f'{A}/sifre_acik.html', 'w', encoding='utf-8').write(SAYFA.replace('/*VERI*/[]', VERI))
print('yazıldı', f'{A}/sifre_acik.html', len(VERI)//1024, 'KB veri')
