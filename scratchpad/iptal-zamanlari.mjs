/**
 * DÜN GECE kim iptal etti / iade istedi? Abonelik durumlarının ZAMANINA bakar
 * (iptal anı, iade beklemede mi, kullanıcı mı iptal etti).
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
const sql = async (query) => {
  const r = await fetch('https://api.supabase.com/v1/projects/vwmjrvolkbiofpkzzwef/database/query', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  return JSON.parse(await r.text());
};
const sa = JSON.parse(fs.readFileSync(SA_YOL, 'utf8'));
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const n = Math.floor(Date.now() / 1000);
const iddia = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({
  iss: sa.client_email, scope: 'https://www.googleapis.com/auth/androidpublisher',
  aud: 'https://oauth2.googleapis.com/token', iat: n, exp: n + 3600,
})}`;
const gTok = (await (await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion: `${iddia}.${crypto.createSign('RSA-SHA256').update(iddia).end().sign(sa.private_key, 'base64url')}`,
  }),
})).json()).access_token;

const satirlar = await sql(`
  select h.satin_alma_token, h.urun, h.baslangic, u.email,
         trim(coalesce(p.ad,'') || ' ' || coalesce(p.soyad,'')) as kim
    from uyelik_haklari h
    left join profiles p on p.id = h.user_id
    left join auth.users u on u.id = h.user_id
   where h.platform = 'android' and h.tip = 'abonelik'
   order by h.baslangic desc`);
console.log(`Android abonelik: ${satirlar.length}\n`);

for (const s of satirlar) {
  const r = await fetch(
    `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PAKET}/purchases/subscriptionsv2/tokens/${encodeURIComponent(s.satin_alma_token)}`,
    { headers: { Authorization: `Bearer ${gTok}` } },
  );
  if (!r.ok) { console.log(`  ? ${s.email}  HTTP ${r.status}`); continue; }
  const j = await r.json();
  const durum = j.subscriptionState ?? '?';
  if (durum === 'SUBSCRIPTION_STATE_ACTIVE') continue; // sağlıklı olanları yazma
  const c = j.canceledStateContext ?? {};
  const sebep = c.userInitiatedCancellation ? 'KULLANICI İPTAL'
    : c.systemInitiatedCancellation ? 'SİSTEM (ödeme alınamadı)'
    : c.developerInitiatedCancellation ? 'GELİŞTİRİCİ'
    : c.replacementCancellation ? 'PLAN DEĞİŞTİ' : '-';
  const iptalAn = c.userInitiatedCancellation?.cancelTime ?? null;
  console.log(`  ${String(s.kim || '-').padEnd(20)} ${String(s.email).padEnd(34)} ${s.urun}`);
  console.log(`     durum: ${durum.replace('SUBSCRIPTION_STATE_', '')} · ${sebep}`
    + (iptalAn ? ` · iptal anı: ${String(iptalAn).slice(0, 16).replace('T', ' ')}` : '')
    + ` · alış: ${String(s.baslangic).slice(0, 16)}`);
  const anket = c.userInitiatedCancellation?.cancelSurveyResult;
  if (anket) console.log(`     iptal sebebi (anket): ${JSON.stringify(anket)}`);
  if (j.pausedStateContext) console.log('     duraklatılmış');
}
