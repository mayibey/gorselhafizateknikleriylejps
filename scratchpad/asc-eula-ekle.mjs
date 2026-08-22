/**
 * 3.1.2 REDDİ DÜZELTMESİ — mağaza açıklamasına Kullanım Şartları (EULA) linki ekler.
 * Apple: "auto-renewable subscription sunuyorsun ama ürün sayfasında ÇALIŞAN bir
 * Kullanım Şartları (EULA) linki yok." Çözüm: açıklamaya abonelik bilgisi + iki link.
 * Kullanım: node scratchpad/asc-eula-ekle.mjs           (kuru prova, yazmaz)
 *          node scratchpad/asc-eula-ekle.mjs --yaz      (App Store Connect'e yazar)
 */
import { api } from './asc.mjs';

const LOC = 'c3c76536-4aa2-4235-aaee-5be17d9b82f8'; // 1.0.45 · tr

const EK = `

ABONELİK ve SATIN ALMA
Tam erişim; aylık veya yıllık otomatik yenilenen abonelikle ya da tek seferlik ömür boyu satın almayla açılır. Güncel fiyatlar bu sayfadaki "Uygulama İçi Satın Alımlar" bölümünde ve uygulama içinde gösterilir. Abonelik, dönem bitiminden en az 24 saat önce iptal edilmezse aynı süreyle otomatik yenilenir ve ücret Apple hesabınızdan tahsil edilir. Aboneliğinizi Ayarlar > Apple Hesabı > Abonelikler bölümünden yönetebilir veya iptal edebilirsiniz.

Kullanım Şartları (EULA): https://mevzujsps.com/sartlar.html
Gizlilik Politikası: https://mevzujsps.com/`;

const r = await api(`appStoreVersionLocalizations/${LOC}`);
if (r.status !== 200) { console.log('OKUMA HATASI', r.status); process.exit(1); }
const eski = r.body.data.attributes.description;

if (eski.includes('sartlar.html')) { console.log('ZATEN VAR — link açıklamada mevcut, dokunulmadı.'); process.exit(0); }

const yeni = eski.replace(/\s+$/, '') + EK;
console.log('eski uzunluk:', eski.length, '→ yeni:', yeni.length, '/ 4000');
console.log('--- EKLENECEK ---');
console.log(EK.trim());

if (process.argv[2] !== '--yaz') { console.log('\n(kuru prova — yazmak için --yaz)'); process.exit(0); }

const y = await api(`appStoreVersionLocalizations/${LOC}`, {
  method: 'PATCH',
  body: JSON.stringify({ data: { type: 'appStoreVersionLocalizations', id: LOC, attributes: { description: yeni } } }),
});
console.log('\nYAZMA:', y.status, y.status === 200 ? 'OK' : JSON.stringify(y.body).slice(0, 400));

const t = await api(`appStoreVersionLocalizations/${LOC}`);
console.log('DOĞRULAMA — link açıklamada mı:', t.body?.data?.attributes?.description?.includes('https://mevzujsps.com/sartlar.html'));
