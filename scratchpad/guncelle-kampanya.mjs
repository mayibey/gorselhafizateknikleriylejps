/**
 * "MAĞAZADAN GÜNCELLE" KAMPANYASI (24 Ağu 2026, başkan onayı).
 *   1) Uygulama içi duyuru — KİŞİYE ÖZEL satır (hedef_user_id): yalnız sürümü 1.0.46
 *      OLMAYAN kişilere. Güncel olan kimse görmez (RLS: hedef_user_id = auth.uid()).
 *   2) Push — güncel olduğu BİLİNMEYEN adresler.
 * LİNK YOK: duyuruya tek mağaza linki konursa iOS kullanıcısı yine Play'e düşer (24 Ağu hatası).
 *   node scratchpad/guncelle-kampanya.mjs            → kuru prova
 *   node scratchpad/guncelle-kampanya.mjs --gonder   → gönder
 */
import fs from 'node:fs';

const GUNCEL = '1.0.46';
const P_BASLIK = '🚀 Yeni sürüm yayında';
const P_METIN = 'Denemeler, sonuç sıralaması ve daha fazlası. Mağazadan güncellemen yeterli.';
const D_BASLIK = 'Yeni sürümü kaçırma';
const D_METIN = `Merhaba komutan! 🚀

Uygulamanın yeni sürümü mağazada yayında ama sen eski sürümdesin. Güncellemeden aşağıdakileri göremezsin:

📝 13 deneme sınavı — müşterek, branş ve 100 soruluk karma denemeler
📊 Deneme sonuçların, yanlış yaptığın maddeler ve puan sıralaması
🚩 Sorularda hata bildirme
🎮 Oyunlar ve içerik güncellemeleri

App Store veya Google Play'i aç, "Mevzu" arat, Güncelle'ye bas.`;

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
  if (!r.ok) throw new Error(`HTTP ${r.status} ${t.slice(0, 400)}`);
  return JSON.parse(t);
}
const esc = (s) => s.replace(/'/g, "''");

const kisiler = await sql(`select user_id from istemci_surum where app_surum <> '${GUNCEL}'`);
const tokenlar = (await sql(`select distinct token from push_token p
  where p.token like 'ExponentPushToken%'
    and not exists (select 1 from istemci_surum i where i.user_id = p.user_id and i.app_surum = '${GUNCEL}')`))
  .map((r) => r.token);

console.log('=== 1) KİŞİYE ÖZEL DUYURU ===');
console.log(D_BASLIK); console.log(D_METIN);
console.log('→ hedef:', kisiler.length, 'kişi (sürümü ' + GUNCEL + ' olmayan). Güncel olanlar GÖRMEZ.');
console.log('\n=== 2) PUSH ===');
console.log(P_BASLIK, '|', P_METIN);
console.log('→ hedef:', tokenlar.length, 'adres (güncel olduğu bilinmeyen)');

if (!process.argv.includes('--gonder')) { console.log('\n(KURU PROVA — hiçbir şey gitmedi)'); process.exit(0); }

// ---- 1) DUYURU (tek insert, çoklu satır) ----
for (let i = 0; i < kisiler.length; i += 200) {
  const dilim = kisiler.slice(i, i + 200);
  const degerler = dilim.map((k) => `('${esc(D_BASLIK)}', '${esc(D_METIN)}', 'herkes', true, '${k.user_id}')`).join(',');
  await sql(`insert into duyurular (baslik, metin, hedef, aktif, hedef_user_id) values ${degerler}`);
  console.log(`  duyuru ${Math.min(i + 200, kisiler.length)}/${kisiler.length}`);
}
console.log('📢 DUYURU YAZILDI —', kisiler.length, 'kişiye özel satır');

// ---- 2) PUSH ----
const biletToken = new Map();
for (let i = 0; i < tokenlar.length; i += 100) {
  const dilim = tokenlar.slice(i, i + 100);
  const parti = dilim.map((to) => ({ to, sound: 'default', priority: 'high', title: P_BASLIK, body: P_METIN }));
  const r = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(parti),
  });
  const j = await r.json();
  (j.data || []).forEach((b, k) => { if (b.status === 'ok' && b.id) biletToken.set(b.id, dilim[k]); });
  console.log(`  push partisi ${i / 100 + 1}: ${(j.data || []).filter((x) => x.status === 'ok').length}/${dilim.length} kabul`);
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
    if (v.status === 'ok') { teslim++; continue; }
    const h = v.details?.error || 'bilinmeyen';
    hatalar[h] = (hatalar[h] || 0) + 1;
  }
  await bekle(1000);
}
console.log(`\n✅ TESLİM: ${teslim} cihaz`);
if (Object.keys(hatalar).length) console.log('❌ ULAŞMAYAN:', JSON.stringify(hatalar));
