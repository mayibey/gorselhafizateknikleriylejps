import fs from 'node:fs';
// 5 magaza karesi HTML'i uret: ust baslik + cerceveli ekran gorseli, koyu marka zemini.
const KOK = 'D:/GorselHafizaTeknikleriyleJSPS/scratchpad';
const KARE = [
  { img: 'ss-1-menu.png', ust: 'Ezber yok, oyun var', alt: '14 oyunla mevzuat aklında kalır', ad: 'kare-1-menu' },
  { img: 'ss-g-cengel.png', ust: 'Çengel Bulmaca', alt: 'Maddeyi harf harf çöz, aklına kazı', ad: 'kare-2-cengel' },
  { img: 'ss-g-bosluk.png', ust: 'Boşluk Doldurma', alt: 'Eksik kelimeyi bul, kuralı pekiştir', ad: 'kare-3-bosluk' },
  { img: 'ss-3-dogru-yanlis.png', ust: 'Doğru mu Yanlış mı', alt: '60 saniyede karar ver, seriyi büyüt', ad: 'kare-4-dogruyanlis' },
  { img: 'ss-g-asmaca.png', ust: 'Adam Asmaca', alt: 'Oynaya oynaya kanun ezberle', ad: 'kare-5-asmaca' },
  { img: 'ss-g-milyoner.png', ust: 'Rütbe Merdiveni', alt: 'Er’den generale — bilgini rütbeye çevir', ad: 'kare-6-rutbe' },
];
const HTML = (k) => `<!doctype html><html><head><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1290px;height:2796px;overflow:hidden;
  background:
   radial-gradient(120% 60% at 50% -8%, rgba(243,194,74,.16), rgba(243,194,74,0) 60%),
   linear-gradient(180deg,#0C2440 0%,#0A1E38 42%,#071627 100%);
  font-family:Georgia,'Times New Roman',serif;display:flex;flex-direction:column;align-items:center}
.ust{padding:150px 90px 20px;text-align:center}
.baslik{font-size:96px;font-weight:700;color:#F3C24A;line-height:1.05;letter-spacing:.5px;
  text-shadow:0 3px 20px rgba(0,0,0,.45)}
.alt{margin-top:26px;font-size:50px;font-weight:400;color:#DDE7F0;line-height:1.25;
  font-family:'Segoe UI',Arial,sans-serif;opacity:.92}
.cizgi{width:120px;height:5px;border-radius:3px;margin:40px auto 0;
  background:linear-gradient(90deg,transparent,#C9A227,transparent)}
.shotWrap{flex:1;display:flex;align-items:center;justify-content:center;padding:36px 96px 120px;width:100%}
.shot{width:100%;border-radius:56px;border:2px solid rgba(255,255,255,.10);
  box-shadow:0 40px 110px rgba(0,0,0,.55), 0 0 0 1px rgba(0,0,0,.4)}
</style></head><body>
<div class="ust"><div class="baslik">${k.ust}</div><div class="alt">${k.alt}</div><div class="cizgi"></div></div>
<div class="shotWrap"><img class="shot" src="file:///${KOK}/${k.img}"></div>
</body></html>`;
for (const k of KARE) {
  fs.writeFileSync(`${KOK}/${k.ad}.html`, HTML(k));
  console.log('uretildi:', k.ad + '.html');
}
console.log(JSON.stringify(KARE.map((k) => k.ad)));
