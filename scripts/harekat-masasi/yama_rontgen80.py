# Röntgen sınav düzeninde (başkan, 30 Eyl): 80 soru — ilk 40 müşterek, son 40 branş. Kanun payı ağırlıkla (AGIRLIK) orantılı,
# en büyük kalan yöntemi; kanunun soru sayısıyla sınırlı. Soru ekranında "Müşterek / Branş" etiketi.
import os
KOK = os.path.dirname(os.path.abspath(__file__))
p = os.path.join(KOK, 'masa4.js'); s = open(p, encoding='utf-8').read()


def r(a, b, n=1):
    global s
    assert s.count(a) == n, (a[:70], s.count(a))
    s = s.replace(a, b)


r("""function rontgenBaslat(){ if(kilit('rontgen'))return;
  const sorular=[];const haric=new Set(Object.keys(K.tani));
  for(const k of KANUN){const n=w(k.id)>=4?2:1;let s=maddeyeGoreSec(k,n,haric);if(s.length<n)s=s.concat(maddeyeGoreSec({q:k.q.filter(q=>!s.includes(q))},n-s.length));sorular.push(...s);}
  basla(karistir(sorular),'Röntgen',{tani:true,tur:'rontgen'});
}""",
  """const RONTGEN_BLOK=40; // sınav düzeni: 40 müşterek + 40 branş
function rontgenDagilim(grup){
  const ks=KANUN.filter(k=>k.g===grup&&k.q.length);if(!ks.length)return [];
  const top=ks.reduce((a,k)=>a+w(k.id),0);
  const pay=ks.map(k=>{const ham=RONTGEN_BLOK*w(k.id)/top;return {k,n:Math.min(Math.floor(ham),k.q.length),kalan:ham-Math.floor(ham)};});
  let kalan=RONTGEN_BLOK-pay.reduce((a,p)=>a+p.n,0);
  pay.sort((a,b)=>b.kalan-a.kalan||w(b.k.id)-w(a.k.id));
  for(let tur=0;kalan>0&&tur<6;tur++){for(const p of pay){if(kalan<=0)break;if(p.n<p.k.q.length){p.n++;kalan--;}}}
  return pay.filter(p=>p.n>0).map(p=>[p.k,p.n]);
}
const rontgenToplam=()=>rontgenDagilim('mus').reduce((a,[,n])=>a+n,0)+rontgenDagilim(BRANS.slug).reduce((a,[,n])=>a+n,0);
function rontgenBaslat(){ if(kilit('rontgen'))return;
  const haric=new Set(Object.keys(K.tani));
  const sec=(k,n)=>{let s=maddeyeGoreSec(k,n,haric);if(s.length<n)s=s.concat(maddeyeGoreSec({q:k.q.filter(q=>!s.includes(q))},n-s.length));return s;};
  const blok=g=>karistir(rontgenDagilim(g).flatMap(([k,n])=>sec(k,n)));
  const mus=blok('mus');
  basla([...mus,...blok(BRANS.slug)],'Röntgen',{tani:true,tur:'rontgen',bolum:mus.length});
}""")
r("  const g=kalanGun(); const rSoru=KANUN.reduce((a,k)=>a+(w(k.id)>=4?2:1),0);", "  const g=kalanGun(); const rSoru=rontgenToplam();")
r("  const rSoru=KANUN.reduce((a,k)=>a+(w(k.id)>=4?2:1),0);\n  const yarim=", "  const rSoru=rontgenToplam();\n  const yarim=")
r("""<p>Sınav kapsamındaki her kanundan bir soru sorar, sınavda çok soru çıkan kanunlardan iki. Cevapları sonunda görürsün; hangi kanunda ne kadar hazır olduğun kanun kanun ortaya çıkar. <b>Sorular her röntgende değişir</b>, istediğin kadar tekrar çekebilirsin.</p>""",
  """<p><b>Sınav düzeninde:</b> ilk 40 soru müşterek, son 40 soru branş mevzuatından; sınavda çok soru çıkan kanunlardan daha fazla gelir. Cevapları sonunda görürsün; hangi kanunda ne kadar hazır olduğun kanun kanun ortaya çıkar. <b>Sorular her röntgende değişir</b>, istediğin kadar tekrar çekebilirsin.</p>""")
r("Henüz röntgen çekmedin. İlk röntgen yaklaşık 12 dakika sürer.", "Henüz röntgen çekmedin. İlk röntgen yaklaşık 25 dakika sürer.")
r("""<span class="say">${S.i+1} / ${S.sorular.length}</span></div>""",
  """<span class="say">${S.i+1} / ${S.sorular.length}</span>${S.meta.bolum?`<span class="blokEtiket">${S.i<S.meta.bolum?'Müşterek':'Branş'}</span>`:''}</div>""")
open(p, 'w', encoding='utf-8').write(s)
p = os.path.join(KOK, 'stil4.css'); s = open(p, encoding='utf-8').read()
s += "\n.blokEtiket{margin-left:8px;font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;color:#F8D57A;border:1px solid rgba(243,194,74,.55);border-radius:999px;padding:2px 8px;white-space:nowrap}\n"
open(p, 'w', encoding='utf-8').write(s)
print('ok')
