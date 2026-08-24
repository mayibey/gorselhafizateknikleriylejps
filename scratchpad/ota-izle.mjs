/** ESKİ RUNTIME OTA İZLEYİCİSİ — hangi sürümde kaç telefon yeni paketle AÇILDI? */
import fs from 'node:fs';
const YENI = {
  '1.0.43': ['01a033ec-6341-72cd-9f97-30597a4cef54','01a033ec-6341-743d-ba18-f1c1ebd5260d'],
  '1.0.42': ['01a033f2-ebba-776a-abac-ea4457943171','01a033f2-ebba-7cfb-84ef-23d8631838c8'],
  '1.0.41': ['01a033f4-772c-7e02-9bbd-edb73627528f','01a033f4-772c-7a7f-b9f9-3e2f5dbf39b7'],
  '1.0.40': ['01a033f5-610d-708b-aa26-a7e02582e718','01a033f5-610d-74bf-9419-ff4b2ae8c40b'],
  '1.0.39': ['01a033f6-44b4-75fc-af7a-fa817e39012e','01a033f6-44b4-7d14-9f57-26cae3dbcbdf'],
  '1.0.38': ['01a033f7-2846-751d-b9b7-cf77214ebb28','01a033f7-2846-72cf-b77f-aaf37fa8abfb'],
  '1.0.37': ['01a033f8-0dff-765c-b269-5cbb6916bc69','01a033f8-0dff-7846-be80-5b28c3bcbfbb'],
  '1.0.36': ['01a033f8-f2f4-76eb-9151-5fec5d753afd','01a033f8-f2f4-719c-974b-874541279361'],
};
const env=Object.fromEntries(fs.readFileSync('.env','utf8').split(/\r?\n/).filter(s=>s.includes('=')&&!s.trim().startsWith('#')).map(s=>[s.slice(0,s.indexOf('=')).trim(),s.slice(s.indexOf('=')+1).trim()]));
async function sql(q){const r=await fetch('https://api.supabase.com/v1/projects/vwmjrvolkbiofpkzzwef/database/query',{method:'POST',headers:{Authorization:`Bearer ${env.SUPABASE_ACCESS_TOKEN}`,'Content-Type':'application/json'},body:JSON.stringify({query:q})});const t=await r.text();if(!r.ok)throw new Error(t.slice(0,300));return JSON.parse(t);}
const hepsi = Object.values(YENI).flat().map(x=>`'${x}'`).join(',');
const satir = await sql(`select app_surum, count(*) filter (where paket in (${hepsi})) yeni, count(*) toplam,
  count(*) filter (where guncelleme > now() - interval '2 hours') son2sa
 from istemci_surum group by 1 order by toplam desc`);
console.log(new Date().toLocaleTimeString('tr-TR'));
console.table(satir);
const ID='3f29c3f6-9919-4432-9a42-5e26c761838f';
const a = await sql(`select app_surum, platform, paket, guncelleme from istemci_surum where user_id='${ID}'`);
console.log('AHMET GEZER:', a.length ? a : 'hâlâ sürüm bildirmiyor (OTA henüz ulaşmadı ya da sürümü 1.0.36 altında)');
