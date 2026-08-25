/**
 * ÜYELİK DENETÇİSİ — "kim iade almış / iptal etmiş?" (26 Ağu 2026, başkan sordu).
 *
 * SORUN: satın alma yalnız ALINDIĞI AN doğrulanıyor. Apple/Google bize iade bildirimi
 * göndermiyor (App Store Server Notifications / Google RTDN kurulu değil) → ömür boyu alıp
 * parasını geri alan biri bizde SONSUZA KADAR premium kalıyor.
 *
 * BU BETİK: `uyelik_haklari`'ndaki her satırı, saklı `satin_alma_token` ile mağazaya
 * yeniden sorar ve durumunu raporlar.
 *
 *   node scripts/uyelik-denetle.mjs          → RAPOR (hiçbir şey değiştirmez)
 *   node scripts/uyelik-denetle.mjs --sil    → yalnız MAĞAZA "iptal/iade" DERSE hakkı siler
 *
 * ⛔ GÜVENLİK KURALI: ağ/kimlik hatası ASLA silme sebebi değildir. Yalnız mağazanın NET
 *    "iptal edildi" cevabı (Google purchaseState=1 / Apple revocationDate) silmeye yol açar.
 *    Şüpheli her durum "bilinmiyor" olarak raporlanır, dokunulmaz.
 *
 * Google: Play Developer API (service account JSON).
 * Apple: App Store Server API — masaüstündeki SubscriptionKey_JPFAY6DKU3.p8 (In-App Purchase
 * anahtarı; ASC anahtarı DEĞİL). İkisi de yerelde çalışır, Edge secret'ına gerek yok.
 */
import fs from 'node:fs';
import crypto from 'node:crypto';

const PROJE = 'vwmjrvolkbiofpkzzwef';
const PAKET = 'app.mevzujsps.android';
const SA_YOL = 'D:/mazzzza üstü/vızzz/mevzu-jsps-0857dbdd570f.json';
const BUNDLE_IOS = 'app.mevzujsps.ios';
const APPLE_KEYID = 'JPFAY6DKU3';
const APPLE_ISS = '6ad2e590-a37b-41d0-bcd6-0462ff64781f';
const APPLE_KEY_YOL = 'C:/Users/GIGABYTE/OneDrive/Desktop/SubscriptionKey_JPFAY6DKU3.p8';
const SIL = process.argv.includes('--sil');

const env = Object.fromEntries(
  fs.readFileSync('.env', 'utf8').split(/\r?\n/)
    .filter((s) => s.includes('=') && !s.trim().startsWith('#'))
    .map((s) => [s.slice(0, s.indexOf('=')).trim(), s.slice(s.indexOf('=') + 1).trim()]),
);

async function sql(query) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${PROJE}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  const t = await r.text();
  if (!r.ok) throw new Error(t.slice(0, 300));
  return JSON.parse(t);
}

// ---- Google Play erişim belirteci ----
const b64u = (x) => Buffer.from(x).toString('base64url');
let playToken = null;
async function playErisim() {
  if (playToken) return playToken;
  const sa = JSON.parse(fs.readFileSync(SA_YOL, 'utf8'));
  const now = Math.floor(Date.now() / 1000);
  const h = b64u(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const p = b64u(JSON.stringify({
    iss: sa.client_email, scope: 'https://www.googleapis.com/auth/androidpublisher',
    aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3500,
  }));
  const sig = crypto.sign('RSA-SHA256', Buffer.from(`${h}.${p}`), sa.private_key).toString('base64url');
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${h}.${p}.${sig}` }),
  });
  const j = await r.json();
  if (!j.access_token) throw new Error('Play token alınamadı: ' + JSON.stringify(j).slice(0, 200));
  playToken = j.access_token;
  return playToken;
}

/** Google: tek seferlik ürün → purchaseState 0=alındı 1=iptal 2=beklemede */
async function googleUrun(urun, token) {
  const tok = await playErisim();
  const u = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PAKET}/purchases/products/${urun}/tokens/${encodeURIComponent(token)}`;
  const r = await fetch(u, { headers: { Authorization: `Bearer ${tok}` } });
  if (r.status === 410) return { durum: 'IPTAL', not: 'Google: satın alma iade/iptal (410)' };
  if (!r.ok) return { durum: 'BILINMIYOR', not: `HTTP ${r.status}` };
  const j = await r.json();
  if (j.purchaseState === 1) return { durum: 'IPTAL', not: 'purchaseState=1 (iptal/iade)' };
  if (j.purchaseState === 2) return { durum: 'BEKLEMEDE', not: 'purchaseState=2' };
  return { durum: 'GECERLI', not: 'purchaseState=0' };
}

/** Google: abonelik → subscriptionState + bitiş */
async function googleAbonelik(token) {
  const tok = await playErisim();
  const u = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PAKET}/purchases/subscriptionsv2/tokens/${encodeURIComponent(token)}`;
  const r = await fetch(u, { headers: { Authorization: `Bearer ${tok}` } });
  if (!r.ok) return { durum: 'BILINMIYOR', not: `HTTP ${r.status}` };
  const j = await r.json();
  const s = j.subscriptionState || '?';
  const bitis = j.lineItems?.[j.lineItems.length - 1]?.expiryTime ?? null;
  if (s === 'SUBSCRIPTION_STATE_ACTIVE' || s === 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD') {
    return { durum: 'GECERLI', not: s, bitis };
  }
  if (s === 'SUBSCRIPTION_STATE_CANCELED') return { durum: 'IPTAL_EDILDI_SURE_VAR', not: s, bitis };
  if (s === 'SUBSCRIPTION_STATE_EXPIRED') return { durum: 'SURE_DOLDU', not: s, bitis };
  return { durum: 'BILINMIYOR', not: s, bitis };
}

/** Apple: App Store Server API ile işlemi sorgula → iade edilmiş mi? */
let appleKey = null;
function appleJwt() {
  if (appleKey === null) appleKey = fs.readFileSync(APPLE_KEY_YOL, 'utf8');
  const h = b64u(JSON.stringify({ alg: 'ES256', kid: APPLE_KEYID, typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const p = b64u(JSON.stringify({ iss: APPLE_ISS, iat: now, exp: now + 1500, aud: 'appstoreconnect-v1', bid: BUNDLE_IOS }));
  const sig = crypto.sign('SHA256', Buffer.from(`${h}.${p}`), { key: appleKey, dsaEncoding: 'ieee-p1363' }).toString('base64url');
  return `${h}.${p}.${sig}`;
}
function jwsGovde(t) {
  const p = String(t).split('.');
  if (p.length < 2) return null;
  try { return JSON.parse(Buffer.from(p[1], 'base64url').toString('utf8')); } catch { return null; }
}
async function appleDurum(token, tip) {
  const ham = String(token || '');
  // Saklanan iOS belirteci ZATEN işlem numarası; JWS geldiyse gövdesinden çıkar.
  const g = /^\d+$/.test(ham) ? null : jwsGovde(ham);
  const txId = /^\d+$/.test(ham) ? ham : String(g?.transactionId ?? g?.originalTransactionId ?? '');
  if (!txId) return { durum: 'BILINMIYOR', not: 'işlem numarası okunamadı' };
  const r = await fetch(`https://api.storekit.itunes.apple.com/inApps/v1/transactions/${txId}`, {
    headers: { Authorization: `Bearer ${appleJwt()}` },
  });
  if (r.status === 404) return { durum: 'BILINMIYOR', not: 'Apple: işlem bulunamadı (404)' };
  if (!r.ok) return { durum: 'BILINMIYOR', not: `HTTP ${r.status}` };
  const j = await r.json();
  const bilgi = jwsGovde(j.signedTransactionInfo || '');
  if (!bilgi) return { durum: 'BILINMIYOR', not: 'gövde çözülemedi' };
  if (bilgi.revocationDate) {
    return { durum: 'IPTAL', not: `Apple iade: ${new Date(bilgi.revocationDate).toISOString().slice(0, 10)}` };
  }
  if (tip === 'abonelik') {
    const bitis = bilgi.expiresDate ? new Date(bilgi.expiresDate) : null;
    if (bitis && bitis.getTime() < Date.now()) return { durum: 'SURE_DOLDU', not: 'expiresDate geçmiş', bitis: bitis.toISOString() };
    return { durum: 'GECERLI', not: 'aktif', bitis: bitis ? bitis.toISOString() : null };
  }
  return { durum: 'GECERLI', not: bilgi.type || 'Non-Consumable' };
}

// ---- ÇALIŞTIR ----
const satirlar = await sql(`select h.user_id, h.urun, h.tip, h.platform, h.bitis, h.satin_alma_token,
   p.ad, p.soyad, p.email
 from uyelik_haklari h left join profiles p on p.id = h.user_id
 where h.satin_alma_token is not null order by h.baslangic desc`);

console.log(`Denetlenecek kayıt: ${satirlar.length}${SIL ? '  ⚠️ SİLME AÇIK' : '  (yalnız rapor)'}\n`);

const sayac = {};
const bulgular = [];
for (const s of satirlar) {
  const kim = [s.ad, s.soyad].filter(Boolean).join(' ') || s.email || s.user_id.slice(0, 8);
  let sonuc;
  try {
    if (s.platform === 'android') {
      sonuc = s.tip === 'abonelik' ? await googleAbonelik(s.satin_alma_token) : await googleUrun(s.urun, s.satin_alma_token);
    } else if (s.platform === 'ios') {
      sonuc = await appleDurum(s.satin_alma_token, s.tip);
    } else {
      sonuc = { durum: 'ATLANDI', not: `platform=${s.platform}` };
    }
  } catch (e) {
    sonuc = { durum: 'BILINMIYOR', not: String(e).slice(0, 80) };
  }
  sayac[sonuc.durum] = (sayac[sonuc.durum] || 0) + 1;
  if (sonuc.durum !== 'GECERLI' && sonuc.durum !== 'ATLANDI') {
    bulgular.push({ kim, urun: s.urun, tip: s.tip, platform: s.platform, ...sonuc, user_id: s.user_id });
  }
}

console.log('=== ÖZET ===');
console.table(sayac);
if (bulgular.length) {
  console.log('\n=== DİKKAT EDİLECEK KAYITLAR ===');
  for (const b of bulgular) console.log(` ${b.durum.padEnd(22)} ${b.kim.padEnd(22)} ${b.urun.padEnd(18)} ${b.not}`);
} else {
  console.log('\n✅ İade/iptal edilmiş satın alma YOK.');
}

const silinecek = bulgular.filter((b) => b.durum === 'IPTAL');
if (silinecek.length && SIL) {
  for (const b of silinecek) {
    await sql(`delete from uyelik_haklari where user_id='${b.user_id}' and urun='${b.urun}'`);
    console.log('SİLİNDİ →', b.kim, b.urun);
  }
} else if (silinecek.length) {
  console.log(`\n${silinecek.length} kayıt iade/iptal görünüyor. Silmek için: --sil`);
}
