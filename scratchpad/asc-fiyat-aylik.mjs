/**
 * Apple — "Tam Erişim Aylık" (musterek_aylik) Türkiye fiyatını 489 TL → 389 TL yapar.
 * Kuru prova: node scratchpad/asc-fiyat-aylik.mjs
 * Uygula   : node scratchpad/asc-fiyat-aylik.mjs --yaz
 */
import { api } from './asc.mjs';

const SUB = '6802571887';                 // Tam Erişim Aylık
const NOKTA = 'eyJzIjoiNjgwMjU3MTg4NyIsInQiOiJUVVIiLCJwIjoiMTAyNzAifQ'; // TUR · 389,00 TL

async function mevcut() {
  const r = await api(`subscriptions/${SUB}/prices?filter[territory]=TUR&include=subscriptionPricePoint&limit=5`);
  const pp = (r.body?.included || []).find((x) => x.type === 'subscriptionPricePoints');
  return pp ? pp.attributes : null;
}

const once = await mevcut();
console.log('ŞU ANKİ TÜRKİYE FİYATI :', once?.customerPrice, 'TL · bize kalan:', once?.proceeds);
console.log('YENİ FİYAT             : 389.00 TL · bize kalan: 261.76');

if (process.argv[2] !== '--yaz') { console.log('\n(kuru prova — uygulamak için --yaz)'); process.exit(0); }

const r = await api('subscriptionPrices', { method: 'POST', body: JSON.stringify({ data: {
  type: 'subscriptionPrices',
  attributes: { startDate: null, preserveCurrentPrice: false },
  relationships: {
    subscription: { data: { type: 'subscriptions', id: SUB } },
    subscriptionPricePoint: { data: { type: 'subscriptionPricePoints', id: NOKTA } },
  },
} }) });
console.log('\nYAZMA:', r.status, r.status === 201 ? 'OK' : JSON.stringify(r.body).slice(0, 500));

const sonra = await mevcut();
console.log('DOĞRULAMA — yeni Türkiye fiyatı:', sonra?.customerPrice, 'TL');
