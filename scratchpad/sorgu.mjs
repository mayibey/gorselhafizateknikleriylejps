import fs from 'node:fs';
const env = fs.readFileSync('.env','utf8');
const TOKEN = env.match(/SUPABASE_ACCESS_TOKEN\s*=\s*["']?([^"'\r\n]+)/)?.[1];
const REF='vwmjrvolkbiofpkzzwef';
export async function sql(query){
  const r=await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`,{method:'POST',headers:{Authorization:`Bearer ${TOKEN}`,'Content-Type':'application/json'},body:JSON.stringify({query})});
  const t=await r.text(); if(!r.ok) throw new Error(`HTTP ${r.status} ${t.slice(0,300)}`); return JSON.parse(t);
}
if(process.argv[2]) console.log(JSON.stringify(await sql(process.argv.slice(2).join(' ')),null,1));
