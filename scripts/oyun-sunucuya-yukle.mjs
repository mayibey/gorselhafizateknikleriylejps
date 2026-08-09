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
// ⚠️ ÜRETİLMİŞ dosya yüklenir, kaynak html DEĞİL. 8 Ağu'da kaynağı yükledim ve oyunlar
// "Oyunlar hazırlanıyor" yazısında sonsuza kadar takıldı: köprü kodunu (hazır mesajı, kayıt
// taşıma) ve TEST_MODU=false ayarını ÜRETİCİ ekliyor; kaynak dosyada ikisi de yok. Üstelik
// test modu açık kaldığı için premium kilitleri de devre dışı kalırdı.
const URETILMIS = `${KOK}/src/assets/oyun-merkezi-html.ts`;
const KOVA = 'icerik';
const ASGARI_HANE = 200_000;
// Yalnız "oyun sayfası mı" değil, "ÜRETİLMİŞ oyun sayfası mı" diye bakılır. Bu üç imza
// yalnızca üreticiden geçmiş dosyada bulunur → kaynak dosya yanlışlıkla yüklenemez.
const IMZALAR = ['OYUNLAR', 'mevzuKopru', "tip:'hazir'", 'let TEST_MODU = false'];
const eksikImza = (m) => IMZALAR.filter((x) => !m.includes(x));

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
async function kisiAyarYaz(deger) {
  const r = await fetch(`${URL_}/rest/v1/uygulama_ayar`, {
    method: 'POST',
    headers: { ...H, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify({ anahtar: 'oyun_surum_kisi', deger }),
  });
  return { durum: r.status, govde: await r.text() };
}
async function kisiAyarOku() {
  const r = await fetch(`${URL_}/rest/v1/uygulama_ayar?anahtar=eq.oyun_surum_kisi&select=deger`, { headers: H });
  const d = await r.json();
  return Array.isArray(d) && d[0] ? d[0].deger : null;
}
// Başkanın hesabı (mayibey@gmail.com) — kişiye özel kanal bu id'ye bağlanır.
const BASKAN_ID = '98be2c62-4309-4960-9ef3-0a2e032d2f4a';

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

if (komut === '--kisi') {
  const damga = process.argv[3];
  if (!damga) { console.log('kullanım: --kisi <damga>  (o damgayı YALNIZ başkanın cihazına verir)'); process.exit(1); }
  console.log(JSON.stringify(await kisiAyarYaz(JSON.stringify({ [BASKAN_ID]: damga }))).slice(0, 200));
  console.log('KİŞİYE ÖZEL SÜRÜM →', damga, '(yalnız başkan; genel işaretçi değişmedi:', (await ayarOku()) ?? '(boş)', ')');
  process.exit(0);
}

if (komut === '--kisi-kapat') {
  console.log(JSON.stringify(await kisiAyarYaz('')).slice(0, 200));
  console.log('KİŞİYE ÖZEL KANAL BOŞALTILDI — başkan da genel sürüme döner.');
  process.exit(0);
}

if (komut === '--onayla') {
  const ham = (await kisiAyarOku() || '').trim();
  let damga = null;
  try { damga = Object.values(JSON.parse(ham))[0] || null; } catch {}
  if (!damga) { console.log('ONAYLANACAK ÖZEL SÜRÜM YOK (oyun_surum_kisi boş).'); process.exit(1); }
  console.log(JSON.stringify(await ayarYaz(damga)).slice(0, 200));
  console.log(JSON.stringify(await kisiAyarYaz('')).slice(0, 200));
  console.log('ONAYLANDI → genel işaretçi:', damga, '· özel kanal boşaltıldı.');
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
// Üretilmiş .ts dosyasından html metnini çıkar (export const OYUN_MERKEZI_HTML = "...";)
const ts = fs.readFileSync(URETILMIS, 'utf8');
let html;
try {
  html = JSON.parse(ts.slice(ts.indexOf('= "') + 2, ts.lastIndexOf('";') + 1));
} catch {
  console.log('YÜKLENMEDİ — üretilmiş dosya okunamadı. Önce: npm run oyun:uret');
  process.exit(1);
}
const eksik = eksikImza(html);
if (html.length < ASGARI_HANE || eksik.length) {
  console.log(`YÜKLENMEDİ — üretilmiş dosya değil ya da bozuk (${html.length} hane).`);
  if (eksik.length) {
    console.log('  eksik imza:', eksik.join(' · '));
    console.log('  Çözüm: npm run oyun:uret');
  }
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
if (komut === '--taslak') {
  // Dosya kovaya yüklendi ama GENEL işaretçi DEĞİŞMEDİ — yalnız başkanın kanalına verildi.
  console.log(JSON.stringify(await kisiAyarYaz(JSON.stringify({ [BASKAN_ID]: damga }))).slice(0, 200));
  console.log(`TASLAK YAYINLANDI (yalnız başkan) → ${ad}  (${(boyut / 1024).toFixed(0)} KB)`);
  console.log('Beğenilirse herkese: node scripts/oyun-sunucuya-yukle.mjs --onayla');
} else {
  console.log(JSON.stringify(await ayarYaz(damga)).slice(0, 200));
  console.log(`YAYINLANDI → ${ad}  (${(boyut / 1024).toFixed(0)} KB)`);
  console.log(`Geri almak: node scripts/oyun-sunucuya-yukle.mjs --geri <önceki damga>`);
}
