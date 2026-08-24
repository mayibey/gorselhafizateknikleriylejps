/** 1.0.43 OTA izleyicisi — yeni paketi alan cihaz sayısı + açılış hızı. */
import fs from 'node:fs';
const YENI = '01a033ec-6341-72cd-9f97-30597a4cef54';
const env=Object.fromEntries(fs.readFileSync('.env','utf8').split(/\r?\n/).filter(s=>s.includes('=')&&!s.trim().startsWith('#')).map(s=>[s.slice(0,s.indexOf('=')).trim(),s.slice(s.indexOf('=')+1).trim()]));
async function sql(q){const r=await fetch('https://api.supabase.com/v1/projects/vwmjrvolkbiofpkzzwef/database/query',{method:'POST',headers:{Authorization:`Bearer ${env.SUPABASE_ACCESS_TOKEN}`,'Content-Type':'application/json'},body:JSON.stringify({query:q})});const t=await r.text();if(!r.ok)throw new Error(t.slice(0,300));return JSON.parse(t);}
const q=(s)=>sql(s).then(r=>r[0].n);
const yeni = await q(`select count(*) n from istemci_surum where app_surum='1.0.43' and paket='${YENI}'`);
const son30 = await q("select count(*) n from istemci_surum where app_surum='1.0.43' and guncelleme > now() - interval '30 minutes'");
const son60 = await q("select count(*) n from istemci_surum where app_surum='1.0.43' and guncelleme > now() - interval '60 minutes'");
console.log(new Date().toLocaleTimeString('tr-TR'), '| yeni paketi alan:', yeni, '| son 30dk açılış:', son30, '| son 60dk:', son60);
