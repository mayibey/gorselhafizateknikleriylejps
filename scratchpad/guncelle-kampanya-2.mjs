/**
 * KAMPANYA 2. DALGA — 1. dalgada ATLANANLAR (başkan yakaladı: "Ahmet Gezer bu duyuruyu görmüyor").
 * 1. dalga hedefi `istemci_surum` (sürüm kaydı) idi; oysa 1158 üyenin yalnız 356'sının kaydı var.
 * Kaydı HİÇ olmayan 802 kişi = sürüm bildirmeyen eski kurulumlar → tam da hedef kitle, atlanmış.
 * Aynı metin, aynı kişiye-özel yöntem.
 *   node scratchpad/guncelle-kampanya-2.mjs            → kuru prova
 *   node scratchpad/guncelle-kampanya-2.mjs --gonder   → gönder
 */
import fs from 'node:fs';
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
async function sql(query) {
  const r = await fetch('https://api.supabase.com/v1/projects/vwmjrvolkbiofpkzzwef/database/query', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`HTTP ${r.status} ${t.slice(0, 400)}`);
  return JSON.parse(t);
}
const esc = (s) => s.replace(/'/g, "''");

// Bu duyuruyu HENÜZ ALMAMIŞ ve güncel OLDUĞU BİLİNMEYEN herkes.
const kisiler = await sql(`select p.id from profiles p
  where not exists (select 1 from duyurular d where d.hedef_user_id = p.id and d.baslik = '${esc(D_BASLIK)}')
    and not exists (select 1 from istemci_surum i where i.user_id = p.id and i.app_surum = '1.0.46')
    and p.silme_talep_tarihi is null`);
console.log('2. DALGA hedefi:', kisiler.length, 'kişi (1. dalgada atlananlar)');
if (!process.argv.includes('--gonder')) { console.log('(KURU PROVA)'); process.exit(0); }
for (let i = 0; i < kisiler.length; i += 200) {
  const dilim = kisiler.slice(i, i + 200);
  const degerler = dilim.map((k) => `('${esc(D_BASLIK)}', '${esc(D_METIN)}', 'herkes', true, '${k.id}')`).join(',');
  await sql(`insert into duyurular (baslik, metin, hedef, aktif, hedef_user_id) values ${degerler}`);
  console.log(`  ${Math.min(i + 200, kisiler.length)}/${kisiler.length}`);
}
const toplam = await sql(`select count(*) n from duyurular where baslik='${esc(D_BASLIK)}'`);
console.log('✅ Bu duyuruyu alan TOPLAM kişi:', toplam[0].n);
