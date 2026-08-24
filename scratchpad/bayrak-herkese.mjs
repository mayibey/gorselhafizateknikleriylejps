/** karma-deneme bayrağını HERKESE açar (uygulama_ayar.ozellik_herkes). */
import fs from 'node:fs';
const env=Object.fromEntries(fs.readFileSync('.env','utf8').split(/\r?\n/).filter(s=>s.includes('=')&&!s.trim().startsWith('#')).map(s=>[s.slice(0,s.indexOf('=')).trim(),s.slice(s.indexOf('=')+1).trim()]));
async function sql(q){const r=await fetch('https://api.supabase.com/v1/projects/vwmjrvolkbiofpkzzwef/database/query',{method:'POST',headers:{Authorization:`Bearer ${env.SUPABASE_ACCESS_TOKEN}`,'Content-Type':'application/json'},body:JSON.stringify({query:q})});const t=await r.text();if(!r.ok)throw new Error('HTTP '+r.status+' '+t.slice(0,300));return JSON.parse(t);}
const cur=await sql("select deger from uygulama_ayar where anahtar='ozellik_herkes'");
const liste=cur[0]?.deger ? JSON.parse(cur[0].deger) : [];
console.log('ÖNCE :', JSON.stringify(liste));
if(!liste.includes('karma-deneme')) liste.push('karma-deneme');
await sql(`insert into uygulama_ayar (anahtar, deger) values ('ozellik_herkes','${JSON.stringify(liste).replace(/'/g,"''")}')
  on conflict (anahtar) do update set deger=excluded.deger`);
const son=await sql("select deger from uygulama_ayar where anahtar='ozellik_herkes'");
console.log('SONRA:', son[0]?.deger);
