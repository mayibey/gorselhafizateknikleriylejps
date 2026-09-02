/**
 * KÖR NOKTA: platform='android' yazılmış ama aslında iOS olan satın almalar (bilinen hata:
 * "iOS satış platform=android"). Bunlar ne Google'a ne Apple'a soruluyordu → iade alsalar
 * bizde sonsuza kadar premium kalırlardı. Apple'a soralım.
 */
import fs from 'node:fs';
import crypto from 'node:crypto';

const BUNDLE = 'app.mevzujsps.ios';
const KEYID = 'JPFAY6DKU3';
const ISS = '6ad2e590-a37b-41d0-bcd6-0462ff64781f';
const KEY_YOL = 'C:/Users/GIGABYTE/OneDrive/Desktop/SubscriptionKey_JPFAY6DKU3.p8';
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
const key = fs.readFileSync(KEY_YOL, 'utf8');
const jwt = () => {
  const h = Buffer.from(JSON.stringify({ alg: 'ES256', kid: KEYID, typ: 'JWT' })).toString('base64url');
  const n = Math.floor(Date.now() / 1000);
  const p = Buffer.from(JSON.stringify({ iss: ISS, iat: n, exp: n + 3000, aud: 'appstoreconnect-v1', bid: BUNDLE })).toString('base64url');
  return `${h}.${p}.${crypto.sign('SHA256', Buffer.from(`${h}.${p}`), { key, dsaEncoding: 'ieee-p1363' }).toString('base64url')}`;
};
const coz = (jws) => JSON.parse(Buffer.from(String(jws).split('.')[1], 'base64url').toString('utf8'));

const satirlar = await sql(`
  select h.urun, h.tip, h.platform, h.satin_alma_token, h.baslangic, u.email
    from uyelik_haklari h left join auth.users u on u.id = h.user_id
   where length(h.satin_alma_token) between 8 and 30
     and h.satin_alma_token ~ '^[0-9]+$'
   order by h.baslangic desc`);
console.log(`Apple işlem kimliği gibi görünen kayıt: ${satirlar.length}\n`);

let iade = 0;
for (const s of satirlar) {
  const r = await fetch(`https://api.storekit.itunes.apple.com/inApps/v1/transactions/${s.satin_alma_token}`, { headers: { Authorization: `Bearer ${jwt()}` } });
  if (!r.ok) {
    console.log(`  ? ${String(s.email).padEnd(38)} ${s.platform}  HTTP ${r.status}`);
    continue;
  }
  const b = coz((await r.json()).signedTransactionInfo);
  const durum = b.revocationDate
    ? `⛔ İADE EDİLMİŞ  ${new Date(b.revocationDate).toISOString().slice(0, 16)}  sebep=${b.revocationReason}`
    : 'geçerli';
  if (b.revocationDate) iade++;
  console.log(`  ${String(s.email).padEnd(38)} kayıt=${s.platform} ürün=${b.productId} alış=${new Date(b.purchaseDate).toISOString().slice(0, 10)}  ${durum}`);
}
console.log(`\nİADE EDİLMİŞ: ${iade}`);
