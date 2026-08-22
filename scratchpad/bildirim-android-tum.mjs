/**
 * TÜM ANDROID KULLANICILARINA BİLDİRİM — "Mevzu yenilendi, oyunlar eklendi".
 *
 *   node scratchpad/bildirim-android-tum.mjs              → KURU PROVA (kimseye gitmez)
 *   node scratchpad/bildirim-android-tum.mjs --gonder     → hemen gönderir
 *   node scratchpad/bildirim-android-tum.mjs --gonder --saat 09:35  → o saate kadar bekler, sonra gönderir
 *
 * 100'lük partiler + makbuz (receipt) denetimi. Bilet "ok" demek YETMEZ; teslimi makbuz söyler.
 */
import fs from 'node:fs';

const BASLIK = 'Mevzu yenilendi 🎮';
const METIN = 'Oyun Merkezi açıldı: 14 oyunla mevzuatı oynayarak öğren. Çengel Bulmaca, Adam Asmaca, Rütbe Merdiveni ve canlı 1v1 Er Meydanı seni bekliyor.';

const env = Object.fromEntries(fs.readFileSync('.env', 'utf8').split(/\r?\n/)
  .filter((s) => s.includes('=') && !s.trim().startsWith('#'))
  .map((s) => [s.slice(0, s.indexOf('=')).trim(), s.slice(s.indexOf('=') + 1).trim()]));
const REF = 'vwmjrvolkbiofpkzzwef';
const bekle = (ms) => new Promise((r) => setTimeout(r, ms));

async function sql(query) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`HTTP ${r.status} ${t.slice(0, 200)}`);
  return JSON.parse(t);
}

// Android + platformu boş kalan ESKİ kayıtlar (onlar da Android; iOS kolonu 20 Tem'de eklendi)
const satirlar = await sql(`
  select token from push_token
  where (platform = 'android' or platform is null)
    and token like 'ExponentPushToken%'`);
const tokenlar = [...new Set(satirlar.map((r) => r.token))];

console.log('=== BİLDİRİM ===');
console.log('Başlık:', BASLIK);
console.log('Metin :', METIN);
console.log('Hedef :', tokenlar.length, 'Android cihaz');

const gonder = process.argv.includes('--gonder');
if (!gonder) { console.log('\n(KURU PROVA — kimseye gitmedi. Göndermek için --gonder)'); process.exit(0); }

// İstenen saate kadar bekle
const si = process.argv.indexOf('--saat');
if (si > 0 && process.argv[si + 1]) {
  const [s, d] = process.argv[si + 1].split(':').map(Number);
  const simdi = new Date();
  const hedef = new Date(simdi);
  hedef.setHours(s, d, 0, 0);
  if (hedef <= simdi) hedef.setDate(hedef.getDate() + 1);
  const ms = hedef - simdi;
  console.log(`\nBEKLİYOR → ${hedef.toLocaleString('tr-TR')} (${Math.round(ms / 60000)} dk)`);
  await bekle(ms);
}

console.log('\nGÖNDERİLİYOR —', new Date().toLocaleString('tr-TR'));
const biletler = [];
for (let i = 0; i < tokenlar.length; i += 100) {
  const parti = tokenlar.slice(i, i + 100).map((to) => ({ to, sound: 'default', priority: 'high', title: BASLIK, body: METIN }));
  const r = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(parti),
  });
  const j = await r.json();
  biletler.push(...(j.data || []));
  console.log(`  parti ${i / 100 + 1}: ${(j.data || []).filter((x) => x.status === 'ok').length}/${parti.length} kabul`);
  await bekle(1200);
}

const idler = biletler.filter((x) => x.status === 'ok' && x.id).map((x) => x.id);
console.log(`\nBİLET: ${idler.length} kabul · ${biletler.length - idler.length} reddedildi`);

// MAKBUZ — asıl teslim kanıtı (bilet "ok" olsa bile burada patlayabilir)
await bekle(20000);
let teslim = 0; const hatalar = {};
for (let i = 0; i < idler.length; i += 300) {
  const r = await fetch('https://exp.host/--/api/v2/push/getReceipts', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: idler.slice(i, i + 300) }),
  });
  const j = await r.json();
  for (const v of Object.values(j.data || {})) {
    if (v.status === 'ok') teslim++;
    else hatalar[v.details?.error || v.message || 'bilinmeyen'] = (hatalar[v.details?.error || v.message || 'bilinmeyen'] || 0) + 1;
  }
  await bekle(1000);
}
console.log(`\n✅ TESLİM: ${teslim} cihaz`);
if (Object.keys(hatalar).length) console.log('❌ ULAŞMAYAN:', JSON.stringify(hatalar));
console.log('(DeviceNotRegistered = uygulamayı silmiş cihazlar, normal.)');
