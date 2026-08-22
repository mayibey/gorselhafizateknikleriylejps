/**
 * PLAY — aylık aboneliğin (musterek_aylik) Türkiye fiyatını 389 TL yapar.
 *   node scratchpad/play-fiyat-aylik.mjs          → şu anki fiyatı gösterir (yazmaz)
 *   node scratchpad/play-fiyat-aylik.mjs --yaz    → 389 TL olarak kaydeder
 * Mevcut aboneler eski fiyatta kalır (Google fiyat değişiminde onları korur).
 */
import fs from 'node:fs';
import crypto from 'node:crypto';

const SA = 'D:/mazzzza üstü/vızzz/mevzu-jsps-0857dbdd570f.json';
const PAKET = 'app.mevzujsps.android';
const URUN = 'musterek_aylik';
const YENI_TL = 389;

const sa = JSON.parse(fs.readFileSync(SA, 'utf8'));
const b64u = (x) => Buffer.from(x).toString('base64url');
const now = Math.floor(Date.now() / 1000);
const h = b64u(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
const p = b64u(JSON.stringify({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/androidpublisher', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3500 }));
const sig = crypto.sign('RSA-SHA256', Buffer.from(`${h}.${p}`), sa.private_key).toString('base64url');
const tok = await (await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${h}.${p}.${sig}` }),
})).json();
if (!tok.access_token) { console.log('token alınamadı:', JSON.stringify(tok).slice(0, 200)); process.exit(1); }
const H = { Authorization: `Bearer ${tok.access_token}`, 'Content-Type': 'application/json' };
const KOK = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PAKET}`;

const r = await fetch(`${KOK}/subscriptions/${URUN}`, { headers: H });
const abone = await r.json();
if (r.status !== 200) { console.log('OKUMA HATASI', r.status, JSON.stringify(abone).slice(0, 500)); process.exit(1); }

console.log('ÜRÜN:', abone.productId, '| durum:', abone.basePlans?.[0]?.state);
for (const bp of (abone.basePlans || [])) {
  const tr = (bp.regionalConfigs || []).find((x) => x.regionCode === 'TR');
  const birim = tr?.price ? Number(tr.price.units) + Number(tr.price.nanos || 0) / 1e9 : null;
  console.log(`  temel plan "${bp.basePlanId}" · Türkiye fiyatı: ${birim ?? '(yok)'} ${tr?.price?.currencyCode || ''} · toplam ${bp.regionalConfigs?.length || 0} bölge`);
}

if (!process.argv.includes('--yaz')) { console.log('\n(kuru prova — yazmak için --yaz)'); process.exit(0); }

// Türkiye bölgesel fiyatını değiştir
let degisti = false;
for (const bp of (abone.basePlans || [])) {
  for (const rc of (bp.regionalConfigs || [])) {
    if (rc.regionCode !== 'TR') continue;
    rc.price = { currencyCode: 'TRY', units: String(YENI_TL), nanos: 0 };
    degisti = true;
  }
}
if (!degisti) { console.log('❌ Türkiye bölge ayarı bulunamadı, dokunmadım.'); process.exit(1); }

// Google'in "regions version"i para birimi tablosunu belirler. Yanlis surumde
// "Expected BGN but got EUR" gibi hata verir -> dogru surumu deneyerek bul.
const SURUMLER = ['2025/03', '2025/02', '2022/02'];
let y = null, yj = null;
for (const sv of SURUMLER) {
  y = await fetch(`${KOK}/subscriptions/${URUN}?updateMask=basePlans&regionsVersion.version=${encodeURIComponent(sv)}`,
    { method: 'PATCH', headers: H, body: JSON.stringify(abone) });
  yj = await y.json();
  if (y.status === 200) { console.log('bolge surumu:', sv, '-> OK'); break; }
  console.log('  ' + sv + ' olmadi:', (yj.error?.message || '').slice(0, 90));
}
if (!y || y.status !== 200) { console.log('❌ YAZMA HATASI', y?.status, JSON.stringify(yj).slice(0, 500)); process.exit(1); }

const k = await (await fetch(`${KOK}/subscriptions/${URUN}`, { headers: H })).json();
for (const bp of (k.basePlans || [])) {
  const tr = (bp.regionalConfigs || []).find((x) => x.regionCode === 'TR');
  const birim = tr?.price ? Number(tr.price.units) + Number(tr.price.nanos || 0) / 1e9 : null;
  console.log(`✅ DOĞRULAMA — "${bp.basePlanId}" Türkiye fiyatı: ${birim} ${tr?.price?.currencyCode}`);
}
