/**
 * Bünyamin Ak'a kişiye özel teşekkür/düzeltme mesajı: uygulama içi duyuru + telefon bildirimi.
 *   node scratchpad/bunyamin-mesaj.mjs           → kuru prova
 *   node scratchpad/bunyamin-mesaj.mjs --gonder  → gönderir
 */
import fs from 'node:fs';

const KISI = '6bd2b513-47cf-4ba7-a46c-9fa1a39da39a'; // Bünyamin Ak

const BASLIK = 'Bildirdiğin hata düzeltildi';
const METIN = `Merhaba komutan!

Az önce bildirdiğin hatayı — alttaki menünün telefonun kendi tuşlarıyla çakışması — aynı gece düzelttik.

Sebebi şuydu: yeni tasarımda alt menü çubuğunu inceltmiştik, ama bu incelme yalnızca kaydırmalı gezinme kullanan telefonlar için doğru hesaplanıyordu. Senin gibi ÜÇ TUŞLU gezinme kullananlarda çubuk sistem tuşlarının altına giriyordu. Artık telefonun gezinme çubuğu ne kadar yer kaplıyorsa tamamı hesaba katılıyor.

DÜZELTMEYİ GÖRMEK İÇİN: uygulamayı tamamen kapatıp yeniden aç (arka plandan çıkarman gerekiyor). Güncelleme sessizce indi, açılışta devreye girecek.

Gözünden kaçmamış, bize çok yardımcı oldun. Böyle bir şey daha görürsen çekinme, yaz.

Kolay gelsin.`;

const P_BASLIK = 'Bildirdiğin hata düzeltildi ✅';
const P_METIN = 'Alt menünün telefon tuşlarıyla çakışması giderildi. Görmek için uygulamayı tamamen kapatıp yeniden aç.';

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

const k = await sql(`select coalesce(ad||' '||soyad, email) ad, email from profiles where id='${KISI}'`);
const tokenlar = (await sql(`select token from push_token where user_id='${KISI}' and token like 'ExponentPushToken%'`)).map((r) => r.token);
console.log('ALICI :', k[0]?.ad, '·', k[0]?.email);
console.log('cihaz :', tokenlar.length, 'adet bildirim adresi');
console.log('\n--- UYGULAMA İÇİ DUYURU ---\n' + BASLIK + '\n' + METIN);
console.log('\n--- TELEFON BİLDİRİMİ ---\n' + P_BASLIK + '\n' + P_METIN);

if (!process.argv.includes('--gonder')) { console.log('\n(KURU PROVA — gitmedi)'); process.exit(0); }

const d = await sql(`insert into duyurular (baslik, metin, hedef, hedef_user_id, aktif)
  values ('${esc(BASLIK)}', '${esc(METIN)}', 'herkes', '${KISI}', true) returning id`);
console.log('\n📢 duyuru yayınlandı (yalnız ona görünür) · id', d[0].id);

if (!tokenlar.length) { console.log('⚠️ bildirim adresi yok, push atılamadı'); process.exit(0); }
const msgs = tokenlar.map((to) => ({ to, sound: 'default', priority: 'high', title: P_BASLIK, body: P_METIN }));
const send = await fetch('https://exp.host/--/api/v2/push/send', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(msgs),
});
const sj = await send.json();
const ids = (sj.data || []).filter((x) => x.status === 'ok' && x.id).map((x) => x.id);
console.log('bilet:', JSON.stringify(sj.data));
if (!ids.length) process.exit(0);

await new Promise((r) => setTimeout(r, 15000));
const rc = await fetch('https://exp.host/--/api/v2/push/getReceipts', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }),
});
const rj = await rc.json();
const ok = Object.values(rj.data || {}).filter((v) => v.status === 'ok').length;
console.log(`📱 MAKBUZ: ${ok}/${ids.length} teslim`, ok ? '✅ telefona düştü' : JSON.stringify(rj.data));
