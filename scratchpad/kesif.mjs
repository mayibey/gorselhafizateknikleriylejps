import fs from 'node:fs';

const env = fs.readFileSync('.env', 'utf8');
const TOKEN = env.match(/SUPABASE_ACCESS_TOKEN\s*=\s*["']?([^"'\r\n]+)/)?.[1];
const REF = 'vwmjrvolkbiofpkzzwef';
if (!TOKEN) { console.error('TOKEN yok'); process.exit(1); }

async function sql(query) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  const t = await r.text();
  if (!r.ok) { console.error('HTTP', r.status, t); return null; }
  return JSON.parse(t);
}

console.log('=== duyurular kolonlari ===');
console.log(await sql(`select column_name, data_type, is_nullable from information_schema.columns where table_name='duyurular' order by ordinal_position`));

console.log('\n=== Ahmet (aa266175) push_token ===');
console.log(await sql(`select user_id, left(token,22) as token_bas, platform, app_version from push_token where user_id='aa266175-df22-49f5-9c08-f3db19cc77e5'`));

console.log('\n=== Baskan (mayibey@gmail.com) id + push_token ===');
console.log(await sql(`select u.id, u.email, left(pt.token,22) as token_bas, pt.platform, pt.app_version from auth.users u left join push_token pt on pt.user_id=u.id where u.email='mayibey@gmail.com'`));
