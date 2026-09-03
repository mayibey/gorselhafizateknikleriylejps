/**
 * SINAV GERİ SAYIM BİLDİRİMİ — herkese. (3 Eyl 2026 — 15 gün turu)
 * Duyuru: uygulamayı açan herkes görür. Push: kayıtlı tüm cihazlara.
 */
import fs from 'node:fs';

const BASLIK = 'SINAVA 15 GÜN KALDI';
const DUYURU = `Günde 3 saat ayır komutan, JSPS'yi bitir. 15 gün yeter.

Haydi, aç uygulamayı.`;
const PUSH = 'Günde 3 saat ayır, JSPS\'yi bitir. 15 gün yeter.';

const env = Object.fromEntries(
  fs.readFileSync('D:/GorselHafizaTeknikleriyleJSPS/.env', 'utf8').split(/\r?\n/)
    .filter((s) => s.includes('=') && !s.trim().startsWith('#'))
    .map((s) => [s.slice(0, s.indexOf('=')).trim(), s.slice(s.indexOf('=') + 1).trim()]),
);
const sql = async (q) => {
  const r = await fetch('https://api.supabase.com/v1/projects/vwmjrvolkbiofpkzzwef/database/query', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: q }),
  });
  const t = await r.text();
  if (!r.ok) throw new Error(t.slice(0, 300));
  return JSON.parse(t);
};
const esc = (s) => s.replace(/'/g, "''");

// 1) HERKESE duyuru (hedef_user_id NULL → kişiye özel değil)
const d = await sql(`insert into duyurular (baslik, metin, hedef, aktif)
  values ('${esc(BASLIK)}', '${esc(DUYURU)}', 'herkes', true) returning id`);
console.log('duyuru:', d[0].id);

// 2) TÜM cihazlara bildirim — Expo 100'lük yığınlar hâlinde ister
const tok = (await sql('select token from push_token')).map((x) => x.token).filter(Boolean);
console.log('token sayısı:', tok.length);
let ok = 0, hata = 0;
for (let i = 0; i < tok.length; i += 100) {
  const yigin = tok.slice(i, i + 100).map((to) => ({
    to, title: BASLIK, body: PUSH, sound: 'default', priority: 'high',
  }));
  const r = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'accept-encoding': 'gzip, deflate' },
    body: JSON.stringify(yigin),
  });
  const j = await r.json().catch(() => null);
  const sonuc = j?.data ?? [];
  const iyi = sonuc.filter((x) => x.status === 'ok').length;
  ok += iyi;
  hata += sonuc.length - iyi;
  const kotu = sonuc.filter((x) => x.status !== 'ok').slice(0, 2);
  console.log(`  yığın ${Math.floor(i / 100) + 1}: ${iyi}/${yigin.length} ok` + (kotu.length ? ` · örnek hata: ${JSON.stringify(kotu[0]?.details ?? kotu[0]?.message ?? kotu[0]).slice(0, 90)}` : ''));
  await new Promise((s) => setTimeout(s, 600));
}
console.log(`\n✅ BİLDİRİM: ${ok} başarılı · ${hata} başarısız (toplam ${tok.length})`);
console.log('duyuru herkese açık — uygulamayı açan herkes görecek');
