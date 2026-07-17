// BRANŞ KİTAP BAŞLIKLARINI TAM RESMÎ ADA ÇEVİR (sunucu brans_kitaplari.baslik).
// Sorun: bazı kitap başlıkları kısa takma ad ("Tayın Bedeli Kanunu") veya numara öneksiz.
// Kaynak: seed-brans-diger.ts + seed.ts curated tam adları (numara→ad). Dosya adındaki kanun
// numarasıyla eşleştirir; sadece harf/noktalama farkı olanları ATLAR (gürültü yok); kapsam
// parantezlerini ("(Personel kapsamı: ...)") ve "— Mali Hükümler" eklerini temizler; ALL-CAPS
// seed adlarını Türkçe-güvenli title-case'e çevirir.
//   node scripts/brans-baslik-tam-ad.mjs            → kuru prova (önizleme)
//   node scripts/brans-baslik-tam-ad.mjs --apply    → canlıya uygula
// NOT: brans-kitap-yukle.mjs ile kitaplar YENİDEN yüklenirse (meta baslik'ten kısa gelir) bu
// script TEKRAR çalıştırılmalı. [[icerik-serving-filigran]]
import fs from 'fs';
const APPLY = process.argv.includes('--apply');
const src = fs.readFileSync('src/db/seed-brans-diger.ts','utf8') + '\n' + fs.readFileSync('src/db/seed.ts','utf8');
const kucuk={'İ':'i','I':'ı','Ş':'ş','Ğ':'ğ','Ü':'ü','Ö':'ö','Ç':'ç'}, buyuk={'i':'İ','ı':'I','ş':'Ş','ğ':'Ğ','ü':'Ü','ö':'Ö','ç':'Ç'};
const trLower = s => s.replace(/[İIŞĞÜÖÇ]/g,c=>kucuk[c]||c).toLowerCase();
const kk = new Set(['ve','ile','ya','veya','da','de','hakkında','dair','göre','ait','olan']);
const tc = s => s.split(/\s+/).map((w,i)=>{const lw=trLower(w);if(i>0&&kk.has(lw))return lw;if(/^[\d(]/.test(w))return w;const b=buyuk[trLower(w[0])]||w[0].toLocaleUpperCase('tr');return b+trLower(w.slice(1));}).join(' ');

const map = new Map();
for (const rx of [/ad:\s*"([^"]*)"/g, /ad:\s*'([^']*)'/g]) {
  let m;
  while ((m = rx.exec(src))) {
    let ad = m[1].trim();
    const nm = ad.match(/^(\d{2,4})\s*[Ss]ayılı/);
    if (!nm) continue;
    const no = nm[1];
    ad = ad.replace(/\s*[—-]\s*Mali Hükümler\s*$/i, '').replace(/(\s*\([^)]*\))+\s*$/, '').trim();
    let gov = ad.replace(/^\d{2,4}\s*[Ss]ayılı\s*/, '');
    const harf = gov.replace(/[^A-Za-zğüşıöçİĞÜŞÖÇ]/g,'');
    const caps = harf.replace(/[a-zğüşıöç]/g,'').length / (harf.length || 1);
    if (caps > 0.6) gov = tc(gov);
    ad = `${no} sayılı ${gov}`;
    if (!map.has(no) || ad.length > map.get(no).length) map.set(no, ad);
  }
}

const env = Object.fromEntries(fs.readFileSync('.env','utf8').split('\n').filter(l=>l.includes('=')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(), l.slice(i+1).trim()];}));
const H = { apikey: env.SUPABASE_SERVICE_KEY, Authorization:`Bearer ${env.SUPABASE_SERVICE_KEY}`, 'Content-Type':'application/json' };
const r = await fetch(`${env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/brans_kitaplari?select=id,baslik,dosya_yolu`, { headers: H });
const kitaplar = await r.json();
const norm = s => trLower(s).replace(/[^a-zğüşıöç0-9]/g,'');
const degis = [];
for (const k of kitaplar) {
  const no = (k.dosya_yolu.split('/').pop().match(/^(\d{2,4})_/) || [])[1];
  if (!no || !map.has(no)) continue;
  const yeni = map.get(no), eski = k.baslik;
  if (norm(yeni) === norm(eski)) continue;
  degis.push({ id: k.id, eski, yeni });
}
console.log(`kitap: ${kitaplar.length} | DEĞİŞİKLİK: ${degis.length}`);
for (const d of degis) console.log(`[${d.id}] ${d.eski}  →  ${d.yeni}`);
if (APPLY) {
  let ok=0, hata=0;
  for (const d of degis) {
    const res = await fetch(`${env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/brans_kitaplari?id=eq.${d.id}`, {
      method:'PATCH', headers:{...H, Prefer:'return=minimal'}, body: JSON.stringify({ baslik: d.yeni }) });
    if (res.ok) ok++; else { hata++; console.log(`HATA [${d.id}]: ${res.status} ${await res.text()}`); }
  }
  console.log(`\nGüncellendi: ${ok} | Hata: ${hata}`);
}
