import fs from 'node:fs';

const KOK = 'D:/GorselHafizaTeknikleriyleJSPS';
const env = Object.fromEntries(
  fs.readFileSync(`${KOK}/.env`, 'utf8').split(/\r?\n/)
    .filter((s) => s.includes('=') && !s.trim().startsWith('#'))
    .map((s) => [s.slice(0, s.indexOf('=')).trim(), s.slice(s.indexOf('=') + 1).trim()]),
);
const URL_ = env.EXPO_PUBLIC_SUPABASE_URL;
const K = env.SUPABASE_SERVICE_KEY;
const H = { apikey: K, Authorization: `Bearer ${K}` };
const KOVA = 'icerik';
const BASKAN = '98be2c62-4309-4960-9ef3-0a2e032d2f4a';
const KEMAL = '90501c0f-34a9-4573-a92a-5df8f259239e';
const IMZALAR = ['OYUNLAR', 'mevzuKopru', "tip:'hazir'", 'let TEST_MODU = false'];

let html = fs.readFileSync(`${KOK}/scratchpad/canli-oyun.html`, 'utf8');

// Zaten düzeltilmişse iki kez ekleme
const IM = 'CENGEL-VURGU-HARF-FIX-17AGU';
if (html.includes(IM)) { console.log('Zaten düzeltilmiş, çıkılıyor.'); process.exit(0); }

const kural = `
<style>/* ${IM}: gece temasında SEÇİLİ (vurgulu) kelimenin hücre zemini açık altın
  (--altinYuzey), harf rengi ise açık (#F2F7FA) kalıyordu → açık-üstüne-açık, harf
  görünmüyordu ("2. soruya geçince 1. kelimenin harfi gidiyor"). İmleçte zaten koyu harf
  vardı; vurgu atlanmıştı. Doğru/yanlış hücreler hariç (kendi renkleri var). */
#tel #cengel td.ac.vurgu:not(.dogru):not(.yanlis) .hf,
#cengel td.ac.vurgu:not(.dogru):not(.yanlis) .hf{ color:#241B00 !important; text-shadow:none !important; }
</style>`;

// Son </style> etiketinden HEMEN ÖNCE değil — SON </head>'den önce yeni style bloğu ekle
// (en geç tanımlanan kural olsun ki cascade'de kesin kazansın).
const yer = html.lastIndexOf('</head>');
if (yer < 0) { console.log('HATA: </head> bulunamadı.'); process.exit(1); }
html = html.slice(0, yer) + kural + '\n' + html.slice(yer);

// İmza + boyut kontrolü (bozuk/yanlış dosya yüklenmesin)
const eksik = IMZALAR.filter((x) => !html.includes(x));
if (eksik.length || html.length < 200000) {
  console.log('YÜKLENMEDİ — imza eksik veya küçük:', eksik.join(' · '), html.length);
  process.exit(1);
}

// Damga (TR saati)
const d = new Date(Date.now() + 3 * 3600000);
const damga = `${d.getUTCFullYear()}${String(d.getUTCMonth()+1).padStart(2,'0')}${String(d.getUTCDate()).padStart(2,'0')}-${String(d.getUTCHours()).padStart(2,'0')}${String(d.getUTCMinutes()).padStart(2,'0')}`;
const ad = `oyun/oyun-merkezi-${damga}.html`;

// Yükle
const y = await fetch(`${URL_}/storage/v1/object/${KOVA}/${ad}`, {
  method: 'POST', headers: { ...H, 'Content-Type': 'text/html; charset=utf-8', 'x-upsert': 'true' }, body: html,
});
console.log('yükleme:', y.status, (await y.text()).slice(0, 120));
if (!y.ok) process.exit(1);

// Sunucudan boyut doğrula
const kontrol = await fetch(`${URL_}/storage/v1/object/list/${KOVA}`, {
  method: 'POST', headers: { ...H, 'Content-Type': 'application/json' },
  body: JSON.stringify({ prefix: 'oyun', search: `oyun-merkezi-${damga}.html`, limit: 5 }),
});
const boyut = (await kontrol.json())?.[0]?.metadata?.size ?? 0;
if (boyut < 200000) { console.log('İŞARETÇİ ÇEVRİLMEDİ — sunucu dosyası küçük:', boyut); process.exit(1); }

// Kişisel işaretçi: başkan + Kemalettin → yeni damga
const kisi = JSON.stringify({ [BASKAN]: damga, [KEMAL]: damga });
const r = await fetch(`${URL_}/rest/v1/uygulama_ayar`, {
  method: 'POST',
  headers: { ...H, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=representation' },
  body: JSON.stringify({ anahtar: 'oyun_surum_kisi', deger: kisi }),
});
console.log('işaretçi:', r.status, (await r.text()).slice(0, 120));
console.log(`\nTASLAK YAYINLANDI (başkan + Kemalettin) → ${ad}  (${(boyut/1024).toFixed(0)} KB)  damga: ${damga}`);
