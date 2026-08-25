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
 * Google: Play Developer API (service account). Apple: App Store Server API — IAP anahtarı
 * gerekir (Supabase Edge secret'ında; yerelde yoksa iOS satırları "anahtar yok" diye atlanır).
 */
import fs from 'node:fs';
import crypto from 'node:crypto';

const PROJE = 'vwmjrvolkbiofpkzzwef';
const PAKET = 'app.mevzujsps.android';
const SA_YOL = 'D:/mazzzza üstü/vızzz/mevzu-jsps-0857dbdd570f.json';
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
      sonuc = { durum: 'ATLANDI', not: 'Apple IAP anahtarı yerelde yok' };
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
