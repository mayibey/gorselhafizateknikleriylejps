/**
 * APPLE İADE TARAMASI — "kim iade talebi açmış?" (2 Eyl 2026).
 * Her iOS satın almasını App Store Server API'ye sorar: revocationDate varsa İADE EDİLMİŞ.
 * Ayrıca Apple bildirim geçmişine bakar (REFUND / CONSUMPTION_REQUEST = iade TALEBİ).
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
function jwt() {
  const h = Buffer.from(JSON.stringify({ alg: 'ES256', kid: KEYID, typ: 'JWT' })).toString('base64url');
  const n = Math.floor(Date.now() / 1000);
  const p = Buffer.from(JSON.stringify({ iss: ISS, iat: n, exp: n + 3000, aud: 'appstoreconnect-v1', bid: BUNDLE })).toString('base64url');
  const sig = crypto.sign('SHA256', Buffer.from(`${h}.${p}`), { key, dsaEncoding: 'ieee-p1363' }).toString('base64url');
  return `${h}.${p}.${sig}`;
}
const coz = (jws) => JSON.parse(Buffer.from(String(jws).split('.')[1], 'base64url').toString('utf8'));

// —— 1) Apple bildirim geçmişi: iade TALEBİ (CONSUMPTION_REQUEST) / iade (REFUND) ——
console.log('=== APPLE BİLDİRİM GEÇMİŞİ (son 30 gün) ===');
const r = await fetch('https://api.storekit.itunes.apple.com/inApps/v1/notifications/history', {
  method: 'POST',
  headers: { Authorization: `Bearer ${jwt()}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ startDate: Date.now() - 29 * 86400000, endDate: Date.now() - 60000 }),
});
const g = await r.json();
if (!r.ok) {
  console.log(`  sorgulanamadı (HTTP ${r.status}): ${JSON.stringify(g).slice(0, 200)}`);
} else {
  const kayitlar = g.notificationHistory ?? [];
  console.log(`  kayıt: ${kayitlar.length}`);
  for (const k of kayitlar) {
    let tip = k.signedPayload ? coz(k.signedPayload) : null;
    const ad = `${tip?.notificationType ?? '?'}${tip?.subtype ? '/' + tip.subtype : ''}`;
    if (!/REFUND|CONSUMPTION|REVOKE/i.test(ad)) continue;
    const islem = tip?.data?.signedTransactionInfo ? coz(tip.data.signedTransactionInfo) : null;
    console.log(`  • ${new Date(tip.signedDate).toISOString().slice(0, 16)}  ${ad}  ürün: ${islem?.productId ?? '-'}  txId: ${islem?.originalTransactionId ?? '-'}`);
  }
}

// —— 2) Her iOS hakkı: iade edilmiş mi? ——
console.log('\n=== iOS SATIN ALMALAR — İADE DURUMU ===');
const satirlar = await sql(`
  select h.user_id, h.urun, h.tip, h.satin_alma_token,
         (coalesce(p.ad,'') || ' ' || coalesce(p.soyad,'')) as kim, u.email
    from uyelik_haklari h
    left join profiles p on p.id = h.user_id
    left join auth.users u on u.id = h.user_id
   where h.platform = 'ios'
   order by u.email`);
console.log(`iOS kayıt: ${satirlar.length}`);
let iade = 0;
for (const s of satirlar) {
  let txId = s.satin_alma_token;
  try {
    const v = JSON.parse(s.satin_alma_token);
    txId = v.transactionId ?? v.originalTransactionId ?? txId;
  } catch { /* düz metin */ }
  const rr = await fetch(`https://api.storekit.itunes.apple.com/inApps/v1/transactions/${txId}`, {
    headers: { Authorization: `Bearer ${jwt()}` },
  });
  if (!rr.ok) {
    const g2 = await rr.text();
    console.log(`  ? ${String(s.kim).trim() || '-'} · ${s.email} · ${s.urun}  → HTTP ${rr.status} ${g2.slice(0, 90)}`);
    continue;
  }
  const bilgi = coz((await rr.json()).signedTransactionInfo);
  if (bilgi.revocationDate) {
    iade++;
    console.log(`  ⛔ İADE: ${String(s.kim).trim() || '-'} · ${s.email} · ${s.urun}`
      + `  tarih: ${new Date(bilgi.revocationDate).toISOString().slice(0, 16)}  sebep: ${bilgi.revocationReason}`);
  }
}
console.log(`\niade edilmiş iOS satın alma: ${iade}`);
