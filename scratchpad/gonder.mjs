import fs from 'node:fs';

const env = fs.readFileSync('.env', 'utf8');
const TOKEN = env.match(/SUPABASE_ACCESS_TOKEN\s*=\s*["']?([^"'\r\n]+)/)?.[1];
const REF = 'vwmjrvolkbiofpkzzwef';
const AHMET = 'aa266175-df22-49f5-9c08-f3db19cc77e5';
const BASKAN = '98be2c62-4309-4960-9ef3-0a2e032d2f4a';

async function sql(query) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`HTTP ${r.status} ${t}`);
  return JSON.parse(t);
}
const esc = (s) => s.replace(/'/g, "''");

const baslik = 'Geri bildirimlerin için teşekkürler';
const metin = `Merhaba komutan!

Gönderdiğin geri bildirimler bizim için çok değerli — hepsini tek tek inceledik:

✅ Ses kesilmesi: Uzun anlatımlarda ses ortadan kesiliyordu. Artık ses, çalınmadan önce cihaza indirilip oradan oynatılıyor; kesinti sorunu bitti.

✅ 2911 kapsam meselesi: Haklıydın — sınavda sorumlu olunmayan bazı maddeler (ceza hükümleri dahil) çalışma akışına karışmıştı. Kapsam dışı maddeleri temizledik.

🔧 Alkolmetre kartı: Bildirdiğin hatayı doğruladık. Kartı şimdilik kaldırdık, güncel mevzuata göre yeniden hazırlanıyor; hazır olunca ayrıca haber vereceğiz.

Gözünden kaçmayan bu detaylar uygulamayı herkes için daha doğru hale getiriyor. Eline sağlık, bu tür bildirimlerini bekliyoruz.`;

// 1) Ahmet'e kişiye özel uygulama-içi duyuru (link yok → paywall'a gitmez)
console.log('=== 1) Ahmet duyuru satırı ekleniyor ===');
const ins = await sql(
  `insert into duyurular (baslik, metin, hedef, hedef_user_id, aktif)
   values ('${esc(baslik)}', '${esc(metin)}', 'herkes', '${AHMET}', true)
   returning id, baslik, created_at`,
);
console.log(ins);

// 2) Push token'ları TAM çek
const tokRows = await sql(
  `select user_id, token from push_token
   where user_id in ('${AHMET}','${BASKAN}') and token like 'ExponentPushToken%'`,
);
const ahmetTok = tokRows.find((r) => r.user_id === AHMET)?.token;
const baskanTok = tokRows.find((r) => r.user_id === BASKAN)?.token;
console.log('\nAhmet token:', ahmetTok ? 'VAR' : 'YOK', '| Baskan token:', baskanTok ? 'VAR' : 'YOK');

// 3) Push gönder (Ahmet teşekkür + Başkan test)
const mesajlar = [];
if (ahmetTok)
  mesajlar.push({
    to: ahmetTok, sound: 'default', priority: 'high',
    title: 'Geri bildirimlerin için teşekkürler',
    body: 'Bildirdiğin sorunları inceledik ve düzelttik — detaylar uygulamada.',
  });
if (baskanTok)
  mesajlar.push({
    to: baskanTok, sound: 'default', priority: 'high',
    title: 'Test', body: 'Test bildirimi — geldi mi?',
  });

console.log('\n=== 3) Push gönderiliyor (' + mesajlar.length + ' mesaj) ===');
const pr = await fetch('https://exp.host/--/api/v2/push/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  body: JSON.stringify(mesajlar),
});
console.log('Expo yanit:', JSON.stringify(await pr.json(), null, 2));
