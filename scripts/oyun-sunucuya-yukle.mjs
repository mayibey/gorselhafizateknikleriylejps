/**
 * OYUN SAYFASINI SUNUCUYA YAYINLA — OTA gerekmeden oyun güncellemesi.
 *
 * Üretilmiş oyun sayfasını (assets/oyun/oyun-merkezi.html) özel kovaya SÜRÜM DAMGALI adla yükler
 * ve `uygulama_ayar.oyun_surum` işaretçisini o damgaya çevirir. Uygulama açılışta işaretçiyi
 * okur, sayfayı indirip cihazda önbellekler (bkz. src/lib/oyun-kaynak.ts).
 *
 * NEDEN DAMGALI AD: aynı adın üzerine yazsaydık kullanıcının önbelleğindeki eski dosya
 * "güncel" sanılırdı. Ad değişince önbellek kendiliğinden ıskalar ve yeni sürüm iner.
 * Eski dosyalar KOVADA DURUR → geri almak tek satır (işaretçiyi eski damgaya çevir).
 *
 * Kullanım:
 *   node scripts/oyun-sunucuya-yukle.mjs            → yükle + işaretçiyi güncelle
 *   node scripts/oyun-sunucuya-yukle.mjs --liste    → kovadaki sürümleri ve güncel işaretçiyi göster
 *   node scripts/oyun-sunucuya-yukle.mjs --geri <damga>  → işaretçiyi eski sürüme çevir (geri al)
 *   node scripts/oyun-sunucuya-yukle.mjs --kapat    → işaretçiyi boşalt (herkes gömülü sürüme döner)
 */
import fs from 'node:fs';

const KOK = 'D:/GorselHafizaTeknikleriyleJSPS';
const KAYNAK = `${KOK}/assets/oyun/oyun-merkezi.html`;
const KOVA = 'icerik';
const ASGARI_HANE = 200_000;
const IMZA = 'OYUNLAR';

const env = Object.fromEntries(
  fs.readFileSync(`${KOK}/.env`, 'utf8').split(/\r?\n/)
    .filter((s) => s.includes('=') && !s.trim().startsWith('#'))
    .map((s) => [s.slice(0, s.indexOf('=')).trim(), s.slice(s.indexOf('=') + 1).trim()]),
);
const URL_ = env.EXPO_PUBLIC_SUPABASE_URL;
const ANAHTAR = env.SUPABASE_SERVICE_KEY;
const H = { apikey: ANAHTAR, Authorization: `Bearer ${ANAHTAR}` };

async function ayarYaz(deger) {
  const r = await fetch(`${URL_}/rest/v1/uygulama_ayar`, {
    method: 'POST',
    headers: { ...H, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify({ anahtar: 'oyun_surum', deger }),
  });
  return { durum: r.status, govde: await r.text() };
}
async function ayarOku() {
  const r = await fetch(`${URL_}/rest/v1/uygulama_ayar?anahtar=eq.oyun_surum&select=deger`, { headers: H });
  const d = await r.json();
  return Array.isArray(d) && d[0] ? d[0].deger : null;
}

const komut = process.argv[2];

if (komut === '--liste') {
  const r = await fetch(`${URL_}/storage/v1/object/list/${KOVA}`, {
    method: 'POST', headers: { ...H, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prefix: 'oyun', limit: 100, sortBy: { column: 'name', order: 'desc' } }),
  });
  const d = await r.json();
  console.log('güncel işaretçi:', (await ayarOku()) ?? '(boş → gömülü sürüm kullanılıyor)');
  console.log('kovadaki sürümler:');
  for (const x of d) console.log(`  ${x.name}  ${(x.metadata?.size / 1024).toFixed(0)} KB  ${x.created_at?.slice(0, 16)}`);
  process.exit(0);
}

if (komut === '--kapat') {
  console.log(JSON.stringify(await ayarYaz('')).slice(0, 200));
  console.log('İŞARETÇİ BOŞALTILDI — bütün cihazlar gömülü sürüme döner.');
  process.exit(0);
}

if (komut === '--geri') {
  const damga = process.argv[3];
  if (!damga) { console.log('kullanım: --geri <damga>'); process.exit(1); }
  console.log(JSON.stringify(await ayarYaz(damga)).slice(0, 200));
  console.log('İŞARETÇİ GERİ ALINDI →', damga);
  process.exit(0);
}

// --- YAYINLA
const html = fs.readFileSync(KAYNAK, 'utf8');
if (html.length < ASGARI_HANE || !html.includes(IMZA)) {
  console.log(`YÜKLENMEDİ — dosya sağlam görünmüyor (${html.length} hane, imza ${html.includes(IMZA)})`);
  process.exit(1);
}
const d = new Date(Date.now() + 3 * 3600000); // TR saati
const damga = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}-${String(d.getUTCHours()).padStart(2, '0')}${String(d.getUTCMinutes()).padStart(2, '0')}`;
const ad = `oyun/oyun-merkezi-${damga}.html`;

const y = await fetch(`${URL_}/storage/v1/object/${KOVA}/${ad}`, {
  method: 'POST',
  headers: { ...H, 'Content-Type': 'text/html; charset=utf-8', 'x-upsert': 'true' },
  body: html,
});
console.log('yükleme:', y.status, (await y.text()).slice(0, 160));
if (!y.ok) process.exit(1);

// Yüklendiğini SUNUCUDAN doğrula (yerel dosyaya güvenme), sonra işaretçiyi çevir.
const kontrol = await fetch(`${URL_}/storage/v1/object/list/${KOVA}`, {
  method: 'POST', headers: { ...H, 'Content-Type': 'application/json' },
  body: JSON.stringify({ prefix: 'oyun', search: `oyun-merkezi-${damga}.html`, limit: 5 }),
});
const liste = await kontrol.json();
const boyut = liste?.[0]?.metadata?.size ?? 0;
if (boyut < ASGARI_HANE) {
  console.log(`İŞARETÇİ ÇEVRİLMEDİ — sunucudaki dosya küçük görünüyor (${boyut} bayt).`);
  process.exit(1);
}
console.log(JSON.stringify(await ayarYaz(damga)).slice(0, 200));
console.log(`YAYINLANDI → ${ad}  (${(boyut / 1024).toFixed(0)} KB)`);
console.log(`Geri almak: node scripts/oyun-sunucuya-yukle.mjs --geri <önceki damga>`);
