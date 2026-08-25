/** App Store Server API anahtarı çalışıyor mu? — bir iOS satın almasını sorgular. */
import fs from 'node:fs';
import crypto from 'node:crypto';

const KEYID = 'JPFAY6DKU3';
const KEYPATH = 'C:/Users/GIGABYTE/OneDrive/Desktop/SubscriptionKey_JPFAY6DKU3.p8';
const BUNDLE = 'app.mevzujsps.ios';
// Aday issuer'lar: ASC ekip issuer'ı ve (varsa) In-App Purchase issuer'ı
const ADAY_ISS = process.argv[2] ? [process.argv[2]] : ['6ad2e590-a37b-41d0-bcd6-0462ff64781f'];

const env = Object.fromEntries(
  fs.readFileSync('.env', 'utf8').split(/\r?\n/)
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

const b64u = (x) => Buffer.from(x).toString('base64url');
const key = fs.readFileSync(KEYPATH, 'utf8');
function jwt(iss) {
  const h = b64u(JSON.stringify({ alg: 'ES256', kid: KEYID, typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const p = b64u(JSON.stringify({
    iss, iat: now, exp: now + 1500, aud: 'appstoreconnect-v1', bid: BUNDLE,
  }));
  const sig = crypto.sign('SHA256', Buffer.from(`${h}.${p}`), { key, dsaEncoding: 'ieee-p1363' }).toString('base64url');
  return `${h}.${p}.${sig}`;
}

// JWS gövdesinden transactionId çıkar
function jwsPayload(token) {
  const p = token.split('.');
  if (p.length < 2) return null;
  try { return JSON.parse(Buffer.from(p[1], 'base64url').toString('utf8')); } catch { return null; }
}

const [satir] = await sql(`select satin_alma_token, urun from uyelik_haklari
 where platform='ios' and satin_alma_token is not null limit 1`);
if (!satir) { console.log('iOS kaydı yok'); process.exit(0); }
// Saklanan iOS belirteci ZATEN işlem numarası (sayısal). JWS ise gövdesinden çıkar.
const ham = String(satir.satin_alma_token || '');
const govde = /^\d+$/.test(ham) ? null : jwsPayload(ham);
const txId = /^\d+$/.test(ham) ? ham : String(govde?.transactionId ?? govde?.originalTransactionId ?? '');
console.log('örnek işlem:', satir.urun, '| transactionId:', txId || '(okunamadı)');
if (!txId) process.exit(1);

for (const iss of ADAY_ISS) {
  const r = await fetch(`https://api.storekit.itunes.apple.com/inApps/v1/transactions/${txId}`, {
    headers: { Authorization: `Bearer ${jwt(iss)}` },
  });
  console.log(`issuer ${iss} → HTTP ${r.status}`);
  if (r.ok) {
    const j = await r.json();
    const inner = jwsPayload(j.signedTransactionInfo || '');
    console.log('✅ ANAHTAR ÇALIŞIYOR');
    console.log('  ürün:', inner?.productId, '| iade tarihi:', inner?.revocationDate ?? 'YOK', '| tip:', inner?.type);
    process.exit(0);
  }
  console.log('  cevap:', (await r.text()).slice(0, 200));
}
