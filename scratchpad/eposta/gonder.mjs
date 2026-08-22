/**
 * E-POSTA GÖNDERİCİ — Mevzu · JSPS
 *
 *   node scratchpad/eposta/gonder.mjs --onizleme     → HTML'i dosyaya yazar, kimseye gitmez
 *   node scratchpad/eposta/gonder.mjs --liste        → kime gideceğini SAYAR, kimseye gitmez
 *   node scratchpad/eposta/gonder.mjs --bana         → SADECE BAŞKANA gönderir (kontrollü deneme)
 *   node scratchpad/eposta/gonder.mjs --parti 100 --gercek   → gerçek gönderim (İKİ bayrak şart)
 *
 * GÜVENLİK: --gercek bayrağı olmadan hiçbir toplu gönderim yapılmaz. --bana dışındaki her şey
 * kuru provadır. Gönderilenler `scratchpad/eposta/gonderilenler.txt` dosyasına yazılır ki
 * ikinci partide aynı kişiye tekrar gitmesin.
 *
 * GEREKEN: .env içine iki satır —
 *   MAIL_KULLANICI=iletisim@mevzujsps.com
 *   MAIL_SIFRE=<Hostinger posta kutusu şifresi>
 */
import fs from 'node:fs';
import path from 'node:path';
import nodemailer from 'nodemailer';
import { html, duz, KONU } from './sablon.mjs';

const BASKAN_EPOSTA = 'mayibey@gmail.com';
const KLASOR = 'scratchpad/eposta';
const GONDERILENLER = path.join(KLASOR, 'gonderilenler.txt');

const env = Object.fromEntries(fs.readFileSync('.env', 'utf8').split(/\r?\n/)
  .filter((s) => s.includes('=') && !s.trim().startsWith('#'))
  .map((s) => [s.slice(0, s.indexOf('=')).trim(), s.slice(s.indexOf('=') + 1).trim()]));

const arg = (ad) => { const i = process.argv.indexOf(ad); return i > 0 ? process.argv[i + 1] : null; };
const va = (ad) => process.argv.includes(ad);
const bekle = (ms) => new Promise((r) => setTimeout(r, ms));

async function sql(query) {
  const r = await fetch('https://api.supabase.com/v1/projects/vwmjrvolkbiofpkzzwef/database/query', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`HTTP ${r.status} ${t.slice(0, 200)}`);
  return JSON.parse(t);
}

// ---- ÖNİZLEME ----
if (va('--onizleme')) {
  const p = path.join(KLASOR, 'onizleme.html');
  fs.writeFileSync(p, html('Baki'), 'utf8');
  fs.writeFileSync(path.join(KLASOR, 'onizleme.txt'), duz('Baki'), 'utf8');
  console.log('Konu :', KONU);
  console.log('HTML :', p);
  console.log('Düz  :', path.join(KLASOR, 'onizleme.txt'));
  process.exit(0);
}

// ---- ALICI LİSTESİ ----
// Apple'ın gizli adresleri (privaterelay) DIŞARIDA: alan adımız Apple'a kayıtlı olmadan
// oraya giden mail geri döner ve itibarımızı düşürür. Onlar ayrı iş.
const satirlar = await sql(`
  select email, ad from profiles
  where email is not null
    and email not ilike '%privaterelay.appleid.com'
    and silme_talep_tarihi is null
  order by created_at`);

const cikanlar = fs.existsSync(path.join(KLASOR, 'cikanlar.txt'))
  ? new Set(fs.readFileSync(path.join(KLASOR, 'cikanlar.txt'), 'utf8').split(/\r?\n/).map((s) => s.trim().toLowerCase()).filter(Boolean))
  : new Set();
const gonderilmis = fs.existsSync(GONDERILENLER)
  ? new Set(fs.readFileSync(GONDERILENLER, 'utf8').split(/\r?\n/).map((s) => s.trim().toLowerCase()).filter(Boolean))
  : new Set();

const hedefler = satirlar.filter((r) => {
  const e = r.email.trim().toLowerCase();
  return !cikanlar.has(e) && !gonderilmis.has(e);
});

if (va('--liste')) {
  const tum = await sql('select count(*) n from profiles where email is not null');
  console.log('Kayıtlı üye          :', tum[0].n);
  console.log('Apple gizli (elendi) :', Number(tum[0].n) - satirlar.length);
  console.log('Listeden çıkanlar    :', cikanlar.size);
  console.log('Daha önce gönderilen :', gonderilmis.size);
  console.log('SIRADA BEKLEYEN      :', hedefler.length);
  console.log('\nİlk 5 alıcı:', hedefler.slice(0, 5).map((r) => r.email).join(', '));
  process.exit(0);
}

// ---- SMTP ----
if (!env.MAIL_KULLANICI || !env.MAIL_SIFRE) {
  console.log('❌ SMTP bilgisi yok. .env dosyasına şu iki satır eklenmeli:');
  console.log('   MAIL_KULLANICI=iletisim@mevzujsps.com');
  console.log('   MAIL_SIFRE=<posta kutusu şifresi>');
  process.exit(1);
}
const posta = nodemailer.createTransport({
  host: 'smtp.hostinger.com', port: 465, secure: true,
  auth: { user: env.MAIL_KULLANICI, pass: env.MAIL_SIFRE },
});
await posta.verify();
console.log('✅ Posta sunucusuna bağlanıldı:', env.MAIL_KULLANICI);

async function yolla(eposta, ad) {
  return posta.sendMail({
    from: `"Mevzu · JSPS" <${env.MAIL_KULLANICI}>`,
    to: eposta,
    subject: KONU,
    text: duz(ad),
    html: html(ad),
    headers: {
      // Tek tıkla çıkış: Gmail/Outlook toplu gönderici kuralı + spam şikayetinin panzehiri
      'List-Unsubscribe': `<mailto:${env.MAIL_KULLANICI}?subject=CIK>`,
      'List-Id': `Mevzu JSPS Bilgilendirme <bilgi.mevzujsps.com>`,
    },
  });
}

// ---- SADECE BAŞKANA ----
if (va('--bana')) {
  const r = await yolla(BASKAN_EPOSTA, 'Baki');
  console.log('📧 DENEME GÖNDERİLDİ →', BASKAN_EPOSTA);
  console.log('   mesaj kimliği:', r.messageId);
  console.log('   sunucu yanıtı:', r.response);
  console.log('\n(Bu adres listeye YAZILMADI — gerçek gönderimde sana da gider.)');
  process.exit(0);
}

// ---- GERÇEK TOPLU GÖNDERİM ----
if (!va('--gercek')) {
  console.log('\n(KURU PROVA — kimseye gitmedi. Gerçek gönderim için: --parti <sayı> --gercek)');
  process.exit(0);
}
const parti = Number(arg('--parti') || 50);
const dilim = hedefler.slice(0, parti);
console.log(`\nGÖNDERİLİYOR: ${dilim.length} kişi (kalan ${hedefler.length - dilim.length})`);
let ok = 0; const hatalar = [];
for (const r of dilim) {
  try {
    await yolla(r.email, r.ad);
    fs.appendFileSync(GONDERILENLER, r.email.trim().toLowerCase() + '\n');
    ok++;
    if (ok % 10 === 0) console.log('  ', ok, '/', dilim.length);
  } catch (e) { hatalar.push(`${r.email}: ${e.message.slice(0, 80)}`); }
  await bekle(2500); // sunucuyu ve itibarı zorlama
}
console.log(`\n✅ ${ok} gönderildi · ❌ ${hatalar.length} hata`);
if (hatalar.length) console.log(hatalar.slice(0, 10).join('\n'));
