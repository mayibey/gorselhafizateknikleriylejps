/**
 * TALİM TESTLERİNDE DURUM ETİKETİ — 1 Eyl 2026 (başkan istedi).
 * Mevzuat'ta kanunun altındaki "Test 1 · 20 soru" satırı testin DURUMUNU da söyler:
 *   çözdüyse → "17/20 doğru" · yarım bıraktıysa → "devam ediyor" · hiç girmediyse → "çözülmedi"
 * Veri ZATEN var: bitmiş sınav sonucu DB'de (sinav_sonuc), yarım sınav AsyncStorage'da
 * (jsps.sinav.ilerleme.<law>.<test>) — yeni kayıt/tablo YOK, sadece okunup gösteriliyor.
 */
import fs from 'node:fs';

const KOK = 'D:/GorselHafizaTeknikleriyleJSPS/';
const yaz = (p, s) => fs.writeFileSync(KOK + p, s, 'utf8');
const oku = (p) => fs.readFileSync(KOK + p, 'utf8');
let sayac = 0;
const degistir = (metin, eski, yeni, ad) => {
  if (!metin.includes(eski)) { console.log('  ✗ ÇAPA YOK:', ad); process.exit(1); }
  sayac++;
  console.log('  ✓', ad);
  return metin.replace(eski, yeni);
};

// ——— 1) Yarım sınavların toplu listesi (anahtar okuma; değer ayrıştırılmaz → ucuz) ———
let il = oku('src/lib/sinav-ilerleme.ts');
if (!il.includes('sinavIlerlemeAnahtarlari')) {
  il += `
/**
 * Yarım kalan TÜM sınavlar: "<lawId>.<test>" kümesi. Mevzuat listesi her satır için tek tek
 * okumasın diye toplu (anahtar yeter; değer ayrıştırmak 50 soruluk JSON'ları boşuna açardı).
 * Kayıt YALNIZ en az bir soru cevaplanınca yazılır → anahtarın varlığı "başlanmış" demektir.
 */
export async function sinavIlerlemeAnahtarlari(): Promise<Set<string>> {
  try {
    const hepsi = await AsyncStorage.getAllKeys();
    return new Set(hepsi.filter((k) => k.startsWith(ONEK)).map((k) => k.slice(ONEK.length)));
  } catch {
    return new Set();
  }
}
`;
  yaz('src/lib/sinav-ilerleme.ts', il);
  console.log('  ✓ sinav-ilerleme.ts: sinavIlerlemeAnahtarlari eklendi');
  sayac++;
} else console.log('  · sinav-ilerleme.ts zaten yamalı');

// ——— 2) Mevzuat ekranı ———
let m = oku('src/app/(tabs)/mevzuat.tsx');

m = degistir(m,
  "import { getAllCards, getBolumKartIds, getLaws, getPerformans, getStudyCards } from '@/db/database';\nimport type { LawWithCount, PerformansSatir } from '@/db/schema';",
  "import { getAllCards, getBolumKartIds, getLaws, getPerformans, getSinavSonuclari, getStudyCards } from '@/db/database';\nimport type { LawWithCount, PerformansSatir, SinavSonuc } from '@/db/schema';",
  'import: sonuç okuma');

m = degistir(m,
  "import { sinavVarMi, testSayisi, testSoruSayisi } from '@/lib/sinav';",
  "import { sinavVarMi, testSayisi, testSoruSayisi } from '@/lib/sinav';\nimport { sinavIlerlemeAnahtarlari } from '@/lib/sinav-ilerleme';",
  'import: yarım sınav');

m = degistir(m,
  "  const [kitaplar, setKitaplar] = useState<BransKitap[] | null>(null);",
  `  const [kitaplar, setKitaplar] = useState<BransKitap[] | null>(null);
  // Talim testlerinin durumu: law_id → (test → bitmiş sonuç) ve "law.test" → yarım kalmış.
  const [testSonuc, setTestSonuc] = useState<Map<number, Map<number, SinavSonuc>>>(new Map());
  const [testYarim, setTestYarim] = useState<Set<string>>(new Set());`,
  'state: test durumu');

m = degistir(m,
  `    // Favoriler (AsyncStorage) — focus'ta tazelenir.`,
  `    // Talim testi durumu (çözüldü / yarım / hiç): satırlarda etiket olarak görünür.
    // Sonuçlar id artan geldiği için son yazan (en güncel) deneme kalır.
    void getSinavSonuclari()
      .then((sonuclar) => {
        const sm = new Map<number, Map<number, SinavSonuc>>();
        for (const s of sonuclar) {
          let mp = sm.get(s.law_id);
          if (!mp) {
            mp = new Map();
            sm.set(s.law_id, mp);
          }
          mp.set(s.test, s);
        }
        setTestSonuc(sm);
      })
      .catch(() => setTestSonuc(new Map()));
    void sinavIlerlemeAnahtarlari()
      .then(setTestYarim)
      .catch(() => setTestYarim(new Set()));
    // Favoriler (AsyncStorage) — focus'ta tazelenir.`,
  'yukle: durum verisi');

m = degistir(m,
  `                onPress={kanunaGit}
                talimAc={talimBurada}`,
  `                onPress={kanunaGit}
                talimAc={talimBurada}
                testSonuclari={testSonuc.get(law.id)}
                testYarim={testYarim}`,
  'çağrı: proplar');

m = degistir(m,
  `  onPress,
  talimAc,
}: {
  law: LawWithCount;
  calisilan: number;
  toplam: number;
  sonGun: number | null;
  favori: boolean;
  onFavori: (lawId: number) => void;
  onPress: (law: LawWithCount) => void;
  talimAc?: boolean;
}) {`,
  `  onPress,
  talimAc,
  testSonuclari,
  testYarim,
}: {
  law: LawWithCount;
  calisilan: number;
  toplam: number;
  sonGun: number | null;
  favori: boolean;
  onFavori: (lawId: number) => void;
  onPress: (law: LawWithCount) => void;
  talimAc?: boolean;
  /** Bu kanunun bitmiş testleri: test → son sonuç (yoksa hiç bitirilmemiş). */
  testSonuclari?: Map<number, SinavSonuc>;
  /** Yarım kalmış sınavlar ("lawId.test") — tüm kanunlar için ortak küme. */
  testYarim?: Set<string>;
}) {`,
  'KanunSatir: prop tipleri');

// ——— satır gövdesi ———
const ESKI_SATIR = `              <AppText variant="etiket" bold color={talimAc ? 'altinParlak' : 'solukMetin'}>
                {testSoruSayisi(law.id, indeks)} soru
              </AppText>
              <MaterialCommunityIcons
                name="chevron-right"`;
const YENI_SATIR = `              <View style={st.denemeDurum}>
                <AppText variant="etiket" bold color={talimAc ? 'altinParlak' : 'solukMetin'}>
                  {testSoruSayisi(law.id, indeks)} soru
                </AppText>
                <AppText variant="etiket" bold color={testDurum(indeks).renk}>
                  {testDurum(indeks).metin}
                </AppText>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"`;
m = degistir(m, ESKI_SATIR, YENI_SATIR, 'satır: durum etiketi');

// durum hesabı — KanunSatir içinde, satiraBas'tan hemen önce
m = degistir(m,
  `  function satiraBas() {`,
  [
    '  /**',
    '   * Testin durumu (başkan, 1 Eyl 2026): çözdüyse kaç doğru, yarım bıraktıysa "devam ediyor",',
    '   * hiç girmediyse "çözülmedi". Yarım kayıt bitmiş sonuçtan ÖNCE gelir: kullanıcı testi',
    '   * yeniden çözmeye başlamışsa ekranda eski skor değil "devam ediyor" görünmeli.',
    '   */',
    '  function testDurum(indeks: number): { metin: string; renk: PaletteColor } {',
    '    if (testYarim?.has(`${law.id}.${indeks}`)) {',
    "      return { metin: 'devam ediyor', renk: talimAc ? 'altinParlak' : 'amber' };",
    '    }',
    '    const s = testSonuclari?.get(indeks);',
    '    if (s && s.toplam > 0) {',
    "      return { metin: `${s.dogru}/${s.toplam} doğru`, renk: talimAc ? 'yesilParlak' : 'yesil' };",
    '    }',
    "    return { metin: 'çözülmedi', renk: talimAc ? 'kartMetinIkincil' : 'solukMetin' };",
    '  }',
    '',
    '  function satiraBas() {',
  ].join('\n'),
  'KanunSatir: testDurum');

// stil
m = degistir(m,
  `  denemeSatir: {
    flexDirection: 'row',`,
  `  // Soru sayısı + durum etiketi tek grup (satırın sağında, chevron'dan önce).
  denemeDurum: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  denemeSatir: {
    flexDirection: 'row',`,
  'stil: denemeDurum');

// PaletteColor tipi lazım
if (!/import \{[^}]*PaletteColor/.test(m)) {
  m = degistir(m,
    "import { Palette, Radius, Spacing } from '@/constants/theme';",
    "import { Palette, type PaletteColor, Radius, Spacing } from '@/constants/theme';",
    'import: PaletteColor');
}

yaz('src/app/(tabs)/mevzuat.tsx', m);
console.log(`\nuygulanan yama: ${sayac}`);
