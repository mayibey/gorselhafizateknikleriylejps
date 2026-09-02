/**
 * SİPARİŞ NO → KİM haritası. Google/Apple iade e-postası "GPA.xxxx" ya da işlem kimliği verir;
 * bizde yalnız satın alma jetonu saklı. Bu betik her jetonu mağazaya sorup sipariş numarasını
 * çıkarır ve kime ait olduğunu yazar → iade bildirimi gelince kimin olduğu saniyede bulunur.
 * Çıktı: scratchpad/siparis-haritasi.json
 */
import fs from 'node:fs';
import crypto from 'node:crypto';

const PAKET = 'app.mevzujsps.android';
const SA_YOL = 'D:/mazzzza üstü/vızzz/mevzu-jsps-0857dbdd570f.json';
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

const key = fs.readFileSync(KEY_YOL, 'utf8');
const aJwt = () => {
  const h = Buffer.from(JSON.stringify({ alg: 'ES256', kid: KEYID, typ: 'JWT' })).toString('base64url');
  const t = Math.floor(Date.now() / 1000);
  const p = Buffer.from(JSON.stringify({ iss: ISS, iat: t, exp: t + 3000, aud: 'appstoreconnect-v1', bid: BUNDLE })).toString('base64url');
  return `${h}.${p}.${crypto.sign('SHA256', Buffer.from(`${h}.${p}`), { key, dsaEncoding: 'ieee-p1363' }).toString('base64url')}`;
};
const coz = (jws) => JSON.parse(Buffer.from(String(jws).split('.')[1], 'base64url').toString('utf8'));

const satirlar = await sql(`
  select h.user_id, h.urun, h.tip, h.platform, h.satin_alma_token, h.baslangic,
         trim(coalesce(p.ad,'') || ' ' || coalesce(p.soyad,'')) as kim, u.email
    from uyelik_haklari h
    left join profiles p on p.id = h.user_id
    left join auth.users u on u.id = h.user_id
   order by h.baslangic desc`);

const harita = [];
for (const s of satirlar) {
  const t = String(s.satin_alma_token);
  const kayit = { kim: s.kim || null, email: s.email, urun: s.urun, tarih: String(s.baslangic).slice(0, 10) };
  if (/^[0-9]+$/.test(t) && t.length < 30) {
    // Apple işlem kimliği
    const r = await fetch(`https://api.storekit.itunes.apple.com/inApps/v1/transactions/${t}`, { headers: { Authorization: `Bearer ${aJwt()}` } });
    if (r.ok) {
      const b = coz((await r.json()).signedTransactionInfo);
      harita.push({ ...kayit, magaza: 'apple', siparis: b.transactionId, ozgun: b.originalTransactionId, iade: b.revocationDate ? new Date(b.revocationDate).toISOString() : null });
      continue;
    }
    harita.push({ ...kayit, magaza: 'apple', siparis: t, hata: `HTTP ${r.status}` });
    continue;
  }
  const uc = s.tip === 'abonelik'
    ? `subscriptionsv2/tokens/${encodeURIComponent(t)}`
    : `products/${s.urun}/tokens/${encodeURIComponent(t)}`;
  const r = await fetch(`https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PAKET}/purchases/${uc}`, { headers: { Authorization: `Bearer ${gTok}` } });
  if (!r.ok) { harita.push({ ...kayit, magaza: 'google', hata: `HTTP ${r.status}` }); continue; }
  const j = await r.json();
  harita.push({
    ...kayit,
    magaza: 'google',
    siparis: j.orderId ?? j.latestOrderId ?? null,
    durum: j.purchaseState ?? j.subscriptionState ?? null,
  });
}
fs.writeFileSync('D:/GorselHafizaTeknikleriyleJSPS/scratchpad/siparis-haritasi.json', JSON.stringify(harita, null, 1), 'utf8');
const iadeli = harita.filter((h) => h.iade);
console.log(`kayıt: ${harita.length} · sipariş no bulunan: ${harita.filter((h) => h.siparis).length} · iade işaretli: ${iadeli.length}`);
console.log('dosya: scratchpad/siparis-haritasi.json  (sipariş numarasıyla arayınca kim olduğu çıkar)');
