/**
 * Bir kullanıcıya PREMIUM (ömür boyu) + EKRAN GÖRÜNTÜSÜ muafiyeti verir.
 *   node scratchpad/yetki-ver.mjs <eposta>          → mevcut hâli gösterir
 *   node scratchpad/yetki-ver.mjs <eposta> --yaz    → yetkileri verir
 */
import fs from 'node:fs';

const EPOSTA = process.argv[2];
if (!EPOSTA) { console.log('kullanım: node scratchpad/yetki-ver.mjs <eposta> [--yaz]'); process.exit(1); }
const BAYRAK = 'ekran-goruntusu-serbest';

const env = Object.fromEntries(fs.readFileSync('.env', 'utf8').split(/\r?\n/)
  .filter((s) => s.includes('=') && !s.trim().startsWith('#'))
  .map((s) => [s.slice(0, s.indexOf('=')).trim(), s.slice(s.indexOf('=') + 1).trim()]));

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
const esc = (s) => s.replace(/'/g, "''");

const k = await sql(`select id::text, ad, soyad, email from profiles where email ilike '${esc(EPOSTA)}'`);
if (!k.length) { console.log('❌ Böyle bir kullanıcı YOK:', EPOSTA); process.exit(1); }
if (k.length > 1) { console.log('❌ Birden fazla eşleşme, elle bak:', k.map((x) => x.email).join(', ')); process.exit(1); }
const { id: UID, ad, soyad, email } = k[0];
console.log(`KULLANICI: ${[ad, soyad].filter(Boolean).join(' ') || '(ad yok)'} · ${email}`);
console.log(`user_id  : ${UID}`);

const hak = await sql(`select urun, tip, platform, bitis from uyelik_haklari where user_id='${UID}'`);
console.log(`premium  : ${hak.length ? hak.map((h) => `${h.urun} (${h.platform})`).join(', ') : 'YOK'}`);
const harita = JSON.parse((await sql("select deger from uygulama_ayar where anahtar='ozellik_kisi'"))[0]?.deger || '{}');
console.log(`ekran gör: ${(harita[UID] || []).includes(BAYRAK) ? 'VAR' : 'YOK'}`);

if (!process.argv.includes('--yaz')) { console.log('\n(kuru prova — vermek için --yaz)'); process.exit(0); }

// 1) PREMIUM — ömür boyu, manuel (satın alma değil, tokensiz)
if (!hak.length) {
  await sql(`insert into uyelik_haklari (user_id, urun, tip, baslangic, bitis, platform)
             values ('${UID}', 'musterek_omurboyu', 'omurboyu', now(), null, 'manuel')`);
  console.log('\n✅ premium verildi (musterek_omurboyu · ömür boyu · manuel)');
} else {
  console.log('\nℹ️ premium zaten vardı, dokunulmadı');
}

// 2) EKRAN GÖRÜNTÜSÜ MUAFİYETİ
harita[UID] = [...new Set([...(harita[UID] || []), BAYRAK])];
await sql(`update uygulama_ayar set deger='${esc(JSON.stringify(harita))}' where anahtar='ozellik_kisi'`);
console.log('✅ ekran görüntüsü muafiyeti verildi');

// DOĞRULAMA
const h2 = await sql(`select urun, tip, platform, bitis from uyelik_haklari where user_id='${UID}' and (bitis is null or bitis > now())`);
const m2 = JSON.parse((await sql("select deger from uygulama_ayar where anahtar='ozellik_kisi'"))[0].deger);
console.log('\nDOĞRULAMA:');
console.log(`  premium  : ${h2.length ? `${h2[0].urun} · ${h2[0].tip} · bitiş ${h2[0].bitis ?? 'yok (ömür boyu)'} ✅` : '❌ YOK'}`);
console.log(`  ekran gör: ${(m2[UID] || []).includes(BAYRAK) ? '✅' : '❌'}`);
console.log(`  muafiyeti olan toplam kişi: ${Object.values(m2).filter((l) => l.includes(BAYRAK)).length}`);
