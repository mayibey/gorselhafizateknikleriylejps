/**
 * KAMPANYA — "aylık üyelik başladı", SATIN ALMAMIŞ Android kullanıcılarına.
 * Tıklayınca uygulamanın ödeme ekranı açılır (data.rota = '/paywall').
 *
 *   node scratchpad/kampanya-aylik.mjs            → kuru prova
 *   node scratchpad/kampanya-aylik.mjs --gonder   → gönderir
 *
 * Premium olanlar HARİÇ (aktif üyelik hakkı olan kimseye gitmez).
 */
import fs from 'node:fs';

const BASLIK = 'Aylık üyelik başladı 📚';
const METIN = 'JSPS\'ye 28 gün kaldı. Artık aylık üyelik de var: 389 TL ile tüm mevzuat, görsel kartlar, sesli anlatım ve 14 oyun bir ay boyunca açık. Dokun, bak.';
const ROTA = '/paywall';

const env = Object.fromEntries(fs.readFileSync('.env', 'utf8').split(/\r?\n/)
  .filter((s) => s.includes('=') && !s.trim().startsWith('#'))
  .map((s) => [s.slice(0, s.indexOf('=')).trim(), s.slice(s.indexOf('=') + 1).trim()]));
const bekle = (ms) => new Promise((r) => setTimeout(r, ms));

async function sql(query) {
  const r = await fetch('https://api.supabase.com/v1/projects/vwmjrvolkbiofpkzzwef/database/query', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`HTTP ${r.status} ${t.slice(0, 300)}`);
  return JSON.parse(t);
}

// SATIN ALMAMIŞ + Android + geçerli adres
const satirlar = await sql(`
  select distinct t.token
  from push_token t
  where (t.platform = 'android' or t.platform is null)
    and t.token like 'ExponentPushToken%'
    and not exists (
      select 1 from uyelik_haklari u
      where u.user_id = t.user_id and (u.bitis is null or u.bitis > now()))`);
const tokenlar = satirlar.map((r) => r.token);

const [say] = await sql(`select
  (select count(distinct user_id) from uyelik_haklari where bitis is null or bitis > now()) premium,
  (select count(*) from profiles) uye`);

console.log('=== KAMPANYA BİLDİRİMİ ===');
console.log('Başlık :', BASLIK);
console.log('Metin  :', METIN);
console.log('Tıkla  →', ROTA, '(ödeme ekranı)');
console.log('\nHedef  :', tokenlar.length, 'Android cihaz (satın almamış)');
console.log('Hariç  :', say.premium, 'premium üye ·', say.uye, 'toplam üye');

if (!process.argv.includes('--gonder')) { console.log('\n(KURU PROVA — kimseye gitmedi)'); process.exit(0); }

console.log('\nGÖNDERİLİYOR —', new Date().toLocaleString('tr-TR'));
const biletToken = new Map();
for (let i = 0; i < tokenlar.length; i += 100) {
  const dilim = tokenlar.slice(i, i + 100);
  const parti = dilim.map((to) => ({
    to, sound: 'default', priority: 'high', title: BASLIK, body: METIN, data: { rota: ROTA },
  }));
  const r = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(parti),
  });
  const j = await r.json();
  (j.data || []).forEach((b, k) => { if (b.status === 'ok' && b.id) biletToken.set(b.id, dilim[k]); });
  console.log(`  parti ${i / 100 + 1}: ${(j.data || []).filter((x) => x.status === 'ok').length}/${dilim.length} kabul`);
  await bekle(1200);
}

await bekle(20000);
const idler = [...biletToken.keys()];
let teslim = 0; const hatalar = {};
for (let i = 0; i < idler.length; i += 300) {
  const r = await fetch('https://exp.host/--/api/v2/push/getReceipts', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: idler.slice(i, i + 300) }),
  });
  const j = await r.json();
  for (const v of Object.values(j.data || {})) {
    if (v.status === 'ok') teslim++;
    else { const h = v.details?.error || 'bilinmeyen'; hatalar[h] = (hatalar[h] || 0) + 1; }
  }
  await bekle(1000);
}
console.log(`\n✅ TESLİM: ${teslim} cihaz`);
if (Object.keys(hatalar).length) console.log('❌ ULAŞMAYAN:', JSON.stringify(hatalar));
