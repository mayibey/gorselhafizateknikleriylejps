/**
 * BRANŞ KONULARI ARTIK MÜŞTEREK GİBİ: her konunun altında "Çalış" + "Talim Yap" — 2 Eyl 2026.
 *
 * KUSUR: 23 Ağu'da Tatbikat'tan kanun listesi kaldırılınca (61c5140) branşlı kullanıcının
 * konu testlerine ulaştığı TEK kapı kapandı. Branş içeriği PDF kitap olduğu için müşterekteki
 * "kanunu bitir → deneme sınavına gir" yolu da yok. Sonuç: 167 konu / 9.587 soru görünmez oldu
 * (kullanıcı bildirdi: "Subay Sicil Yönetmeliği'ne test koymuştun, şimdi yok").
 *
 * ÇÖZÜM (başkan kararı): branş kitabı da müşterek kanun kartı gibi görünsün — başlığın altında
 * "Çalış" (PDF'i aç) ve "Talim Yap · N" (o konunun testleri). Test satırları müşterekteki ile
 * aynı: "20 soru · 17/20 doğru / devam ediyor / çözülmedi".
 * Hangi soru havuzunun açılacağı sunucudaki brans_kitaplari.law_id bağından gelir; bağ yoksa
 * yalnız "Çalış" görünür (yanlış konunun sorusunu göstermektense düğme hiç çıkmasın).
 */
import fs from 'node:fs';

const KOK = 'D:/GorselHafizaTeknikleriyleJSPS/';
let n = 0;
const degistir = (p, eski, yeni, ad) => {
  const s = fs.readFileSync(KOK + p, 'utf8');
  if (!s.includes(eski)) { console.log('  ✗ ÇAPA YOK:', ad); process.exit(1); }
  fs.writeFileSync(KOK + p, s.replace(eski, yeni), 'utf8');
  console.log('  ✓', ad);
  n++;
};

// ——— 1) Veri katmanı: kitap → kanun bağı ———
degistir('src/lib/brans-kitap.ts',
  "export type BransKitap = { id: number; baslik: string; dosyaYolu: string; sira: number };",
  `export type BransKitap = {
  id: number;
  baslik: string;
  dosyaYolu: string;
  sira: number;
  /** Bu kitabın soru havuzu olan kanun kimliği (yoksa null → "Talim Yap" düğmesi çıkmaz). */
  lawId: number | null;
};`,
  'brans-kitap: tip');

degistir('src/lib/brans-kitap.ts',
  "      .select('id, baslik, dosya_yolu, sira')",
  "      .select('id, baslik, dosya_yolu, sira, law_id')",
  'brans-kitap: sorgu');

degistir('src/lib/brans-kitap.ts',
  `    return (data as { id: number; baslik: string; dosya_yolu: string; sira: number }[]).map((r) => ({
      id: r.id,
      baslik: r.baslik,
      dosyaYolu: r.dosya_yolu,
      sira: r.sira,
    }));`,
  `    return (data as { id: number; baslik: string; dosya_yolu: string; sira: number; law_id: number | null }[]).map((r) => ({
      id: r.id,
      baslik: r.baslik,
      dosyaYolu: r.dosya_yolu,
      sira: r.sira,
      lawId: r.law_id ?? null,
    }));`,
  'brans-kitap: eşleme');

// ——— 2) Test durumu tek yerden (müşterek satırı da branş kartı da aynı etiketi kullansın) ———
degistir('src/app/(tabs)/mevzuat.tsx',
  `/** Lacivert kare monogram: ad'dan kanun no (altın), yoksa kitap ikonu. */`,
  `/**
 * Bir testin durum etiketi: çözdüyse kaç doğru, yarım bıraktıysa "devam ediyor", hiç
 * girmediyse "çözülmedi". Yarım kayıt bitmiş sonuçtan ÖNCE gelir (yeniden başlamışsa
 * ekranda eski skor değil "devam ediyor" görünmeli). Müşterek satırı ve branş kitabı
 * AYNI fonksiyonu kullanır → iki yerde ayrı kural olmaz.
 */
function testDurumEtiketi(
  lawId: number,
  indeks: number,
  sonuclar: Map<number, SinavSonuc> | undefined,
  yarim: Set<string> | undefined,
  gece: boolean,
): { metin: string; renk: PaletteColor } {
  if (yarim?.has(\`\${lawId}.\${indeks}\`)) {
    return { metin: 'devam ediyor', renk: gece ? 'altinParlak' : 'amber' };
  }
  const s = sonuclar?.get(indeks);
  if (s && s.toplam > 0) {
    return { metin: \`\${s.dogru}/\${s.toplam} doğru\`, renk: gece ? 'yesilParlak' : 'yesil' };
  }
  return { metin: 'çözülmedi', renk: gece ? 'kartMetinIkincil' : 'solukMetin' };
}

/** Lacivert kare monogram: ad'dan kanun no (altın), yoksa kitap ikonu. */`,
  'ortak durum etiketi');

// KanunSatir kendi kopyasını bırakıp ortak fonksiyonu çağırsın
degistir('src/app/(tabs)/mevzuat.tsx',
  `  function testDurum(indeks: number): { metin: string; renk: PaletteColor } {
    if (testYarim?.has(\`\${law.id}.\${indeks}\`)) {
      return { metin: 'devam ediyor', renk: talimAc ? 'altinParlak' : 'amber' };
    }
    const s = testSonuclari?.get(indeks);
    if (s && s.toplam > 0) {
      return { metin: \`\${s.dogru}/\${s.toplam} doğru\`, renk: talimAc ? 'yesilParlak' : 'yesil' };
    }
    return { metin: 'çözülmedi', renk: talimAc ? 'kartMetinIkincil' : 'solukMetin' };
  }`,
  `  const testDurum = (indeks: number) =>
    testDurumEtiketi(law.id, indeks, testSonuclari, testYarim, !!talimAc);`,
  'KanunSatir: ortak fonksiyona bağlandı');

console.log(`\nuygulanan yama: ${n}`);
