/**
 * EMİR KAPSAM REGISTRY ÜRETİCİ — `scripts/_emir-madde-kapsam.json` → `src/assets/emir-madde-kapsam.ts`
 *
 * Ek-1 (docs/jsps konuları.pdf) her branş için yalnız kanunu değil SINAVA GİREBİLECEK MADDELERİ de
 * yazıyor. Aday, kendi branşının emrinde olmayan bir maddeye çalışmasın diye hem Talim (kitap içi
 * test) hem branş denemeleri bu tabloyla süzülür.
 *
 * İki şey üretilir:
 *   EMIR_MADDE_KAPSAM  — branş → law_id → izinli madde numaraları
 *   EMIR_SORU_SAYILARI — branş → law_id → süzme SONRASI soru adedi (Talim, banka yüklemeden
 *                        test sayısını bilsin diye; KART_SORU_SAYILARI'nın branşa duyarlı hâli)
 *
 * Çalıştır: npm run emir:kapsam   (soru bankası değişince YENİLE)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const kok = join(dirname(fileURLToPath(import.meta.url)), '..');
const kapsam = JSON.parse(readFileSync(join(kok, 'scripts/_emir-madde-kapsam.json'), 'utf8')).kapsam;

// Banka: law_id → soruların kaynak künyeleri (sıra KORUNUR; Talim dilimleri bu sıraya dayanır).
const bankaTs = readFileSync(join(kok, 'src/assets/kart-sorulari.ts'), 'utf8');
const banka = new Map();
{
  let law = null;
  for (const satir of bankaTs.split(/\r?\n/)) {
    const b = satir.match(/^  (\d+): \[/);
    if (b) { law = Number(b[1]); banka.set(law, []); continue; }
    if (!law || !satir.includes('"soru"')) continue;
    try {
      const o = JSON.parse(satir.trim().replace(/,$/, ''));
      if (o?.id) banka.get(law).push(String(o.kaynak ?? ''));
    } catch { /* atla */ }
  }
}

const sayilar = {};
for (const [slug, kanunlar] of Object.entries(kapsam)) {
  sayilar[slug] = {};
  for (const [lawId, izin] of Object.entries(kanunlar)) {
    const kaynaklar = banka.get(Number(lawId)) ?? [];
    const kalan = kaynaklar.filter((k) => {
      const m = /m\.\s*(\d{1,3})/.exec(k);
      return !m || izin.includes(Number(m[1]));   // madde bilgisi yoksa eleme (güvenli taraf)
    }).length;
    sayilar[slug][lawId] = kalan;
  }
}

const govde = `// OTOMATİK ÜRETİLDİ — elle düzenleme. \`npm run emir:kapsam\` ile yenile.
// Kaynak: docs/jsps konuları.pdf (Ek-1 JSPS Mevzuat Listesi) → scripts/_emir-madde-kapsam.json
//
// Emir, bir kanunun YALNIZ BAZI MADDELERİNİ sınav kapsamına alabiliyor (örn. MEBS'te Merkezî
// Yönetim Harcama Belgeleri Yönetmeliği: 5, 43, 46, 48, 63, 66, 67). Aday sınavda çıkmayacak
// maddeye çalışmasın diye Talim ve branş denemeleri bu tabloyla süzülür.
// Tabloda OLMAYAN kanunda süzme YAPILMAZ ("Tamamı" ya da eşleştirilemeyen satırlar).

/** branş slug → law_id → sınava girebilecek madde numaraları. */
export const EMIR_MADDE_KAPSAM: Record<string, Record<number, number[]>> = ${JSON.stringify(kapsam, null, 2)};

/** branş slug → law_id → emir süzgecinden SONRA kalan soru adedi (banka yüklemeden test sayısı için). */
export const EMIR_SORU_SAYILARI: Record<string, Record<number, number>> = ${JSON.stringify(sayilar, null, 2)};
`;
writeFileSync(join(kok, 'src/assets/emir-madde-kapsam.ts'), govde, 'utf8');

const kalem = Object.values(kapsam).reduce((a, v) => a + Object.keys(v).length, 0);
console.log(`${Object.keys(kapsam).length} branş · ${kalem} kalemde madde süzgeci → src/assets/emir-madde-kapsam.ts`);
for (const [slug, v] of Object.entries(sayilar)) {
  const satir = Object.entries(v).map(([l, n]) => `law ${l}:${n}`).join(' · ');
  console.log(`  ${slug.padEnd(11)} ${satir}`);
}
