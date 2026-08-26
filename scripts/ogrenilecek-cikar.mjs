/**
 * ÖĞRENİLECEK BİLGİ ÇIKARICI — "ezberlenecek şey" listesi (26 Ağu 2026, başkan).
 *
 * FARKI: sinav-kritik-cikar.mjs sorunun NE TÜR bilgi ölçtüğünü sınıflar (süre mi makam mı).
 * Bu betik BİLGİNİN KENDİSİNİ çıkarır: "süreli hapis cezası 1 aydan az 20 yıldan fazla olamaz".
 *
 * NEDEN BÖYLE: çıkmış sınav verisinde CEVAP ANAHTARI YOK. Doğru değeri sorudan okuyamayız.
 * O yüzden bilgi RESMÎ MADDE METNİNDEN çıkarılır (tek doğru kaynak), sonra sınavın gerçekten
 * sorduğuyla EŞLEŞTİRİLİR. Böylece "mevzuatta var ama sorulmuyor" ile "sınavın tam da sorduğu"
 * ayrışır — hafıza çalışması ikincisine yapılır.
 *
 * KANIT SEVİYELERİ (raporda ayrı durur, karıştırılmaz):
 *   ⭐ KANITLI  — bilginin DEĞERİ çıkmış sınav şıklarında geçiyor VE konu terimleri örtüşüyor
 *   ○ İLGİLİ   — konu terimleri örtüşüyor ama değer şıklarda görünmüyor
 *   (mevzuatta olup sınavla hiç bağı olmayanlar listeye ALINMAZ — yüzeysellik değil, odak)
 *
 *   node scripts/ogrenilecek-cikar.mjs           → tüm kanunlar, özet
 *   node scripts/ogrenilecek-cikar.mjs 2803      → tek kanun, tam liste
 */
import fs from 'node:fs';
import { adaylar, korpus, siniflandir } from './sinav-madde-eslestir.mjs';
import { CEZALAR, eslesenler, MAKAMLAR, sureDegerleri } from './soru-tipleri.mjs';

// ---------- 1) Sınav sorularını kanunlara topla ----------
const sinav = new Map(); // kanun -> { sorular:[], sikDegerleri:Set }
for (const q of adaylar) {
  const r = siniflandir(q.kok, q.siklar);
  if (!r.kanun || (r.kaynak === 'benzerlik' && r.guven < 0.65)) continue;
  if (!sinav.has(r.kanun)) sinav.set(r.kanun, { sorular: [], sikDegerleri: new Set(), terimler: new Map() });
  const s = sinav.get(r.kanun);
  s.sorular.push(q);
  const sikMetni = (q.siklar || []).join(' | ');
  for (const d of sureDegerleri(sikMetni)) s.sikDegerleri.add(d);
  // ⛔ ÇIPLAK RAKAM KANIT DEĞİL: şıklarda geçen her "2" bir bilgiyi kanıtlamaz. Bu yüzden
  // TCK'da 130 bilginin 115'i "kanıtlı" görünüyordu — şişme. Yalnız SÜRE ifadeleri
  // ("on yıl") ve makam adları kanıt sayılır.
  for (const d of eslesenler(sikMetni, MAKAMLAR)) s.sikDegerleri.add(d.toLocaleLowerCase('tr'));
  // konu terimleri (kök + şıklar) → maddeyle örtüşme ölçmek için
  for (const w of `${q.kok} ${sikMetni}`.toLocaleLowerCase('tr').replace(/[^\p{L}\p{N}]+/gu, ' ').split(' ')) {
    if (w.length < 5) continue;
    const g = w.slice(0, 7);
    s.terimler.set(g, (s.terimler.get(g) || 0) + 1);
  }
}

// ---------- 2) Madde metnini cümlelere böl, bilgi çıkar ----------
const CUMLE = /[^.;]+[.;]/g;

function cumleTerimleri(c) {
  const out = new Set();
  for (const w of c.toLocaleLowerCase('tr').replace(/[^\p{L}\p{N}]+/gu, ' ').split(' ')) {
    if (w.length >= 5) out.add(w.slice(0, 7));
  }
  return out;
}

/** Bir cümleden ATOMİK bilgi çıkar: tür + değer(ler). Yoksa null. */
const KALIP = /(usul ve esaslar|yönetmelikle düzenlenir|yönetmelikte belirlenir|hükümleri uygulanır|yürürlükten kaldırılmıştır|saklıdır|bu Kanunun uygulanmasına)/i;
function bilgiCikar(cumle) {
  const c = cumle.trim();
  // ⛔ GÜRÜLTÜ: parça cümle ("Ancak Cumhurbaşkanı kararıyla;") ve kalıp hüküm
  // ("...yönetmelikle düzenlenir") ezberlenecek BİLGİ değildir; liste onlarla dolarsa iş görmez.
  if (c.length < 55 || c.length > 400) return null;
  if (KALIP.test(c)) return null;
  if (!/[a-zçğıöşüA-ZÇĞİÖŞÜ]{3,}\s+\S+\s+\S+/.test(c)) return null;

  const sure = sureDegerleri(c);
  const makam = eslesenler(c, MAKAMLAR);
  const ceza = eslesenler(c, CEZALAR);

  // CEZA aralığı: "iki yıldan altı yıla kadar hapis"
  const cezaAralik = c.match(/(\S+)\s*(?:yıldan|aydan|günden)\s+(\S+)\s*(?:yıla|aya|güne)\s*kadar\s*(hapis|adl[iî] para)/i);
  if (cezaAralik) return { tur: 'CEZA', deger: cezaAralik[0].trim(), anahtarlar: sure };

  // SÜRE: "… 15 gün içinde …" / "… en geç bir ay içinde …"
  if (sure.length && /(içinde|en geç|en fazla|en az|süresi|müddet|itibaren|geçmeyecek)/i.test(c)) {
    return { tur: 'SÜRE', deger: sure.join(' / '), anahtarlar: sure };
  }
  // MAKAM: "… vali tarafından … verilir/karar verilir"
  if (makam.length && /(tarafından|yetkili|karar ver|izin ver|onay|emriyle|kararıyla|verilir|yapılır)/i.test(c)) {
    return { tur: 'MAKAM', deger: makam.join(' / '), anahtarlar: makam };
  }
  if (ceza.length >= 1 && /cezalandırılır|ceza verilir|uygulanır/i.test(c)) {
    return { tur: 'CEZA', deger: ceza.join(' / '), anahtarlar: ceza };
  }
  // SAYI/EŞİK
  const sayi = [...c.matchAll(/\b(\d{1,4})\s*(kişi|adet|katı|yaş|metre|kilogram|litre|TL|lira)\b/gi)].map((m) => `${m[1]} ${m[2]}`);
  if (sayi.length) return { tur: 'SAYI', deger: sayi.join(' / '), anahtarlar: sayi.map((x) => x.split(' ')[0]) };
  return null;
}

// ---------- 3) Kanun kanun: bilgi × sınav eşleşmesi ----------
const sonuc = [];
for (const [kanun, s] of sinav) {
  const maddeler = korpus.filter((k) => k.tur === 'madde' && k.kanun === kanun);
  if (!maddeler.length) continue;

  const bilgiler = [];
  for (const m of maddeler) {
    for (const cumle of String(m.metin).match(CUMLE) || []) {
      const b = bilgiCikar(cumle);
      if (!b) continue;
      const ct = cumleTerimleri(cumle);
      // konu örtüşmesi: cümlenin terimlerinin kaçı sınav sorularında geçiyor?
      let ortak = 0;
      for (const t of ct) if (s.terimler.has(t)) ortak++;
      const ortusme = ct.size ? ortak / ct.size : 0;
      // değer kanıtı: bilginin değeri sınav ŞIKLARINDA çeldirici olarak geçiyor mu?
      const degerKaniti = b.anahtarlar.some((a) => s.sikDegerleri.has(String(a).toLocaleLowerCase('tr')));
      if (ortusme < 0.28 && !degerKaniti) continue; // sınavla bağı yok → listeye alma
      bilgiler.push({
        madde: m.maddeNo,
        tur: b.tur,
        bilgi: cumle.trim().replace(/\s+/g, ' '),
        deger: b.deger,
        kanit: degerKaniti ? 'KANITLI' : 'İLGİLİ',
        ortusme: +ortusme.toFixed(2),
      });
    }
  }
  bilgiler.sort((a, b) => (a.kanit === b.kanit ? b.ortusme - a.ortusme : a.kanit === 'KANITLI' ? -1 : 1));
  sonuc.push({
    kanun,
    sinavSorusu: s.sorular.length,
    bilgiSayisi: bilgiler.length,
    kanitli: bilgiler.filter((b) => b.kanit === 'KANITLI').length,
    turDagilimi: bilgiler.reduce((a, b) => ({ ...a, [b.tur]: (a[b.tur] || 0) + 1 }), {}),
    bilgiler: bilgiler.slice(0, 60),
  });
}
sonuc.sort((a, b) => b.sinavSorusu - a.sinavSorusu);

fs.writeFileSync('scripts/veri/ogrenilecek.json', JSON.stringify({
  uretim: 'ogrenilecek-cikar.mjs',
  aciklama: 'Resmî madde metninden çıkarılan atomik bilgiler, çıkmış sınavla eşleştirilmiş',
  kanunlar: sonuc,
}, null, 1), 'utf8');

const sec = process.argv[2];
if (!sec) {
  console.log('kanun'.padEnd(46) + 'SINAV  BİLGİ  ⭐KANITLI  TÜRLER');
  console.log('─'.repeat(104));
  for (const k of sonuc.slice(0, 25)) {
    console.log(
      (k.kanun.length > 44 ? k.kanun.slice(0, 43) + '…' : k.kanun).padEnd(46) +
      String(k.sinavSorusu).padStart(5) + String(k.bilgiSayisi).padStart(7) + String(k.kanitli).padStart(10) + '   ' +
      Object.entries(k.turDagilimi).map(([a, b]) => `${a} ${b}`).join(' · '),
    );
  }
  const tk = sonuc.reduce((a, k) => a + k.kanitli, 0);
  const tb = sonuc.reduce((a, k) => a + k.bilgiSayisi, 0);
  console.log(`\nTOPLAM: ${tb} öğrenilecek bilgi · ${tk} tanesi KANITLI (değeri sınav şıklarında geçiyor)`);
  console.log('→ scripts/veri/ogrenilecek.json · tek kanun: node scripts/ogrenilecek-cikar.mjs 2803');
} else {
  const k = sonuc.find((x) => x.kanun.includes(sec));
  if (!k) { console.log('bulunamadı:', sec); process.exit(1); }
  console.log(`\n${k.kanun}\n${'═'.repeat(86)}`);
  console.log(`çıkmış sınav sorusu: ${k.sinavSorusu} · çıkarılan bilgi: ${k.bilgiSayisi} (${k.kanitli} kanıtlı)\n`);
  for (const b of k.bilgiler.slice(0, 30)) {
    const im = b.kanit === 'KANITLI' ? '⭐' : '○';
    console.log(`${im} [${b.tur}] m.${b.madde}`);
    console.log(`   ${b.bilgi.slice(0, 235)}`);
  }
}
