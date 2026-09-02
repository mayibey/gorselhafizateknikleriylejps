/**
 * "Kim iade talebi açmış?" — Google Play iptal/iade taraması (2 Eyl 2026, başkan sordu).
 * voidedpurchases = Google'ın İADE ETTİĞİ / geri çektiği siparişler (son 30 gün).
 * Ayrıca abonelik durumlarında "iptal sebebi" alanına bakar (kullanıcı mı, sistem mi, İADE mi).
 */
import fs from 'node:fs';
import crypto from 'node:crypto';

const PAKET = 'app.mevzujsps.android';
const SA_YOL = 'D:/mazzzza üstü/vızzz/mevzu-jsps-0857dbdd570f.json';
const env = Object.fromEntries(
  fs.readFileSync('D:/GorselHafizaTeknikleriyleJSPS/.env', 'utf8').split(/\r?\n/)
    .filter((s) => s.includes('=') && !s.trim().startsWith('#'))
    .map((s) => [s.slice(0, s.indexOf('=')).trim(), s.slice(s.indexOf('=') + 1).trim()]),
);

async function sql(query) {
  const r = await fetch('https://api.supabase.com/v1/projects/vwmjrvolkbiofpkzzwef/database/query', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  return JSON.parse(await r.text());
}

// —— Google servis hesabı jetonu ——
const sa = JSON.parse(fs.readFileSync(SA_YOL, 'utf8'));
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const simdi = Math.floor(Date.now() / 1000);
const iddia = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({
  iss: sa.client_email,
  scope: 'https://www.googleapis.com/auth/androidpublisher',
  aud: 'https://oauth2.googleapis.com/token',
  iat: simdi,
  exp: simdi + 3600,
})}`;
const imza = crypto.createSign('RSA-SHA256').update(iddia).end().sign(sa.private_key, 'base64url');
const tok = await (await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${iddia}.${imza}` }),
})).json();
const G = { Authorization: `Bearer ${tok.access_token}` };

// —— 1) İADE EDİLEN / GERİ ÇEKİLEN siparişler ——
const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PAKET}/purchases/voidedpurchases`
  + `?startTime=${(Date.now() - 29 * 86400000)}&endTime=${Date.now() - 60000}&type=1`;
const v = await (await fetch(url, { headers: G })).json();
const iadeler = v.voidedPurchases ?? [];
console.log(`GOOGLE İADE/GERİ ÇEKME (son 60 gün): ${iadeler.length}`);
if (v.error) console.log('  hata:', JSON.stringify(v.error).slice(0, 300));

// kim olduğunu bul: satın alma logunda token/sipariş eşleşmesi
const SEBEP = { 0: 'Diğer', 1: 'Ters ibraz (chargeback)', 2: 'Geliştirici iadesi', 3: 'Google iadesi' };
const TUR = { 0: 'Satın alma', 1: 'Abonelik' };
for (const i of iadeler) {
  const tarih = new Date(Number(i.voidedTimeMillis)).toISOString().slice(0, 16).replace('T', ' ');
  let kim = '?';
  const eslesme = await sql(
    `select (p.ad || '') || ' ' || (p.soyad || '') as ad_soyad, u.email, h.urun
       from uyelik_haklari h
       left join profiles p on p.id = h.user_id
       left join auth.users u on u.id = h.user_id
      where h.satin_alma_token = '${String(i.purchaseToken).replace(/'/g, "''")}'`,
  );
  if (Array.isArray(eslesme) && eslesme[0]) kim = `${eslesme[0].ad_soyad ?? '-'} · ${eslesme[0].email ?? '-'} · ${eslesme[0].urun ?? '-'}`;
  console.log(`  • ${tarih}  ${TUR[i.kind ?? 0] ?? ''} sebep: ${SEBEP[i.voidedReason] ?? i.voidedReason}  sipariş: ${i.orderId}`);
  console.log(`    → ${kim}`);
}

// —— 2) Son satın almalar (bağlam) ——
console.log('\nSON SATIN ALMALAR (14 gün):');
const son = await sql(`
  select l.created_at, l.urun, l.tip, l.platform, l.durum, (p.ad || '') || ' ' || (p.soyad || '') as ad_soyad, u.email
    from satin_alma_log l
    left join profiles p on p.id = l.user_id
    left join auth.users u on u.id = l.user_id
   where l.created_at > now() - interval '14 days'
   order by l.created_at desc`);
for (const s of son) {
  console.log(`  ${String(s.created_at).slice(0, 16)}  ${String(s.urun).padEnd(18)} ${String(s.platform ?? '-').padEnd(8)} ${String(s.durum ?? '-').padEnd(10)} ${s.ad_soyad ?? '-'} · ${s.email ?? '-'}`);
}
