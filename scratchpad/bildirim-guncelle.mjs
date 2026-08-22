/**
 * "GÜNCELLE" KAMPANYASI — iki kanal birden:
 *   1) Push → TÜM Android adresleri (ölüler dahil; ölü olanlar zaten düşmez)
 *   2) Uygulama içi duyuru → HERKES (izin gerekmez, uygulamayı açan görür)
 *
 *   node scratchpad/bildirim-guncelle.mjs            → kuru prova
 *   node scratchpad/bildirim-guncelle.mjs --gonder   → gönder
 *
 * Ölü (DeviceNotRegistered) adresler bu sefer TABLODAN SİLİNİYOR → bir dahaki sefere
 * rakam şişmesin. Bilet→token eşlemesi tutuluyor.
 */
import fs from 'node:fs';

const BASLIK = 'Uygulamayı güncelle 🚀';
const METIN = 'Mevzu baştan yenilendi: tasarım komple değişti, Oyun Merkezi\'ne 14 oyun eklendi. Eski sürümde bunların hiçbiri görünmüyor — mağazadan güncelle, farkı gör.';

const D_BASLIK = 'Mevzu baştan yenilendi — güncellemeyi unutma 🚀';
const D_METIN = `Merhaba komutan!

Uygulamayı baştan aşağı yeniledik:

• Tasarım komple değişti — Karargâh, Patika ve kart akışı yeni.
• Oyun Merkezi açıldı: 14 oyun. Çengel Bulmaca, Adam Asmaca, Rütbe Merdiveni, Boşluk Doldurma, Ceza Terazisi ve canlı 1v1 Er Meydanı.
• Sesli anlatım artık her kartta kendiliğinden başlıyor, çalışırken ekran kapanmıyor.

ÖNEMLİ: Bunların görünmesi için uygulamanın GÜNCEL sürümde olması gerekiyor. Telefonunda eski sürüm varsa mağazadan (Play Store / App Store) güncelle — yoksa yenilikler karşına çıkmaz.

Kolay gelsin, sınavda görüşürüz.`;

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
  if (!r.ok) throw new Error(`HTTP ${r.status} ${t.slice(0, 300)}`);
  return JSON.parse(t);
}
const esc = (s) => s.replace(/'/g, "''");

const satirlar = await sql(`
  select distinct token from push_token
  where (platform = 'android' or platform is null)
    and token like 'ExponentPushToken%'`);
const tokenlar = satirlar.map((r) => r.token);
const uye = (await sql('select count(*) n from profiles'))[0].n;

console.log('=== 1) PUSH (Android) ===');
console.log('Başlık:', BASLIK);
console.log('Metin :', METIN);
console.log('Hedef :', tokenlar.length, 'adres');
console.log('\n=== 2) UYGULAMA İÇİ DUYURU (herkes) ===');
console.log('Başlık:', D_BASLIK);
console.log(D_METIN);
console.log('\nGörecek kitle: uygulamayı açan herkes (' + uye + ' üye)');

if (!process.argv.includes('--gonder')) { console.log('\n(KURU PROVA — hiçbir şey gitmedi)'); process.exit(0); }

// ---- 1) PUSH ----
console.log('\nPUSH GÖNDERİLİYOR —', new Date().toLocaleString('tr-TR'));
const biletToken = new Map();
for (let i = 0; i < tokenlar.length; i += 100) {
  const dilim = tokenlar.slice(i, i + 100);
  const parti = dilim.map((to) => ({ to, sound: 'default', priority: 'high', title: BASLIK, body: METIN }));
  const r = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(parti),
  });
  const j = await r.json();
  (j.data || []).forEach((b, k) => { if (b.status === 'ok' && b.id) biletToken.set(b.id, dilim[k]); });
  console.log(`  parti ${i / 100 + 1}: ${(j.data || []).filter((x) => x.status === 'ok').length}/${dilim.length} kabul`);
  await bekle(1200);
}

// ---- MAKBUZ + ÖLÜ ADRES TEMİZLİĞİ ----
await bekle(20000);
const idler = [...biletToken.keys()];
let teslim = 0; const olu = []; const hatalar = {};
for (let i = 0; i < idler.length; i += 300) {
  const r = await fetch('https://exp.host/--/api/v2/push/getReceipts', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: idler.slice(i, i + 300) }),
  });
  const j = await r.json();
  for (const [id, v] of Object.entries(j.data || {})) {
    if (v.status === 'ok') { teslim++; continue; }
    const hata = v.details?.error || 'bilinmeyen';
    hatalar[hata] = (hatalar[hata] || 0) + 1;
    if (hata === 'DeviceNotRegistered' && biletToken.get(id)) olu.push(biletToken.get(id));
  }
  await bekle(1000);
}
console.log(`\n✅ TESLİM: ${teslim} cihaz`);
if (Object.keys(hatalar).length) console.log('❌ ULAŞMAYAN:', JSON.stringify(hatalar));

// SİLME YOK (başkan "emin misin" dedi) — sadece raporla, adresler tabloda kalsın.
if (olu.length) {
  fs.writeFileSync('scratchpad/olu-adresler.txt', olu.join('\n'), 'utf8');
  console.log(`ℹ️  ${olu.length} adres "DeviceNotRegistered" döndü — SİLİNMEDİ, tabloda duruyor.`);
  console.log('    Liste: scratchpad/olu-adresler.txt');
}

// ---- 2) DUYURU ----
const d = await sql(`insert into duyurular (baslik, metin, hedef, aktif)
  values ('${esc(D_BASLIK)}', '${esc(D_METIN)}', 'herkes', true) returning id`);
console.log('\n📢 DUYURU YAYINLANDI — id:', d[0].id, '(uygulamayı açan herkes görecek)');

const kalan = await sql(`select count(*) n from push_token where platform='android' or platform is null`);
console.log('Kalan geçerli Android adresi:', kalan[0].n);
