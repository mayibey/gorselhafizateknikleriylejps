/**
 * Neden "HTTP 400"? — ömür boyu (tek seferlik) Android satın almaları doğrulanamıyor.
 * Bu kör nokta önemli: iade alınmış bir ömür boyu satın alma bize GEÇERLİ görünür.
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
const imza = crypto.createSign('RSA-SHA256').update(iddia).end().sign(sa.private_key, 'base64url');
const tok = (await (await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${iddia}.${imza}` }),
})).json()).access_token;
const G = { Authorization: `Bearer ${tok}` };

// Play'deki gerçek ürün kimlikleri
const urunler = await (await fetch(`https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PAKET}/inappproducts`, { headers: G })).json();
console.log('PLAY TEK SEFERLİK ÜRÜNLER:', (urunler.inappproduct ?? []).map((p) => p.sku).join(', ') || JSON.stringify(urunler).slice(0, 200));

const satirlar = await sql(`
  select h.urun, h.tip, h.satin_alma_token, u.email
    from uyelik_haklari h left join auth.users u on u.id = h.user_id
   where h.platform = 'android' and h.tip <> 'abonelik'
   order by h.baslangic desc`);
console.log(`\nAndroid tek seferlik hak: ${satirlar.length}`);

for (const s of satirlar) {
  const t = String(s.satin_alma_token);
  // 1) v3 tek seferlik uç
  const r1 = await fetch(`https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PAKET}/purchases/products/${s.urun}/tokens/${encodeURIComponent(t)}`, { headers: G });
  const g1 = await r1.json();
  // 2) ürün kimliği yanlışsa: purchasesv2 (ürün belirtmeden)
  let ek = '';
  if (!r1.ok) {
    const r2 = await fetch(`https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PAKET}/purchases/productsv2/tokens/${encodeURIComponent(t)}`, { headers: G });
    const g2 = await r2.json();
    ek = r2.ok
      ? `  → productsv2: ${(g2.productLineItem ?? []).map((x) => x.productId).join(',')} durum=${g2.purchaseStateContext?.purchaseState ?? '?'}`
      : `  → productsv2 HTTP ${r2.status} ${JSON.stringify(g2.error?.message ?? '').slice(0, 90)}`;
  }
  const ozet = r1.ok
    ? `purchaseState=${g1.purchaseState}${g1.purchaseState === 1 ? '  ⛔ İADE/İPTAL' : ''}`
    : `HTTP ${r1.status} ${String(g1.error?.message ?? '').slice(0, 80)}`;
  console.log(`  ${String(s.email).padEnd(38)} ${String(s.urun).padEnd(18)} tokenUzunluk=${t.length}  ${ozet}${ek}`);
}
